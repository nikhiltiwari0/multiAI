
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define types
interface User {
  id: string;
  username: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id?: string | null;
  timestamp: string;
  is_ai: boolean;
  type?: MessageType;
  userId?: string;
  mentioned_users?: string[];
}

type MessageType = 'user' | 'ai';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
  messages: Message[];
  users: User[];
  updatedAt?: string;
}

interface ChatContextProps {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
  users: User[];
  currentUser: User | null;
  sendChatMessage: (message: string) => Promise<void>;
  createNewChat: (title: string) => Promise<void>;
  isLoading: boolean;
  isSendingMessage: boolean;
  showUsersSidebar: boolean;
  toggleUsersSidebar: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showUsersSidebar, setShowUsersSidebar] = useState(false);
  const queryClient = useQueryClient();

  // Current user representation for the chat
  const currentUser: User | null = user && profile ? {
    id: user.id,
    username: profile.username,
    avatar: profile.avatar_url
  } : null;

  // Query to fetch all chats the user participates in
  const { isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      // Skip if no user
      if (!user) return [];

      try {
        // Get all chats the user participates in
        const { data: participations, error: participationsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (participationsError) throw participationsError;
        if (!participations.length) return [];

        const chatIds = participations.map(p => p.chat_id);

        // Get the actual chats
        const { data: fetchedChats, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('created_at', { ascending: false });

        if (chatsError) throw chatsError;

        // For each chat, get messages and participants
        const enhancedChats = await Promise.all(
          fetchedChats.map(async (chat) => {
            // Get messages
            const { data: messages, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            // Get participants (users)
            const { data: participants, error: participantsError } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id);

            if (participantsError) throw participantsError;

            // Get user profiles for participants
            const participantIds = participants.map(p => p.user_id);
            const { data: userProfiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .in('id', participantIds);

            if (profilesError) throw profilesError;

            const chatUsers = userProfiles.map(profile => ({
              id: profile.id,
              username: profile.username,
              avatar: profile.avatar_url
            }));

            return {
              ...chat,
              messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                timestamp: msg.created_at,
                is_ai: msg.is_ai,
                type: msg.is_ai ? 'ai' : 'user',
                mentioned_users: msg.mentioned_users
              })),
              users: chatUsers
            } as Chat;
          })
        );

        setChats(enhancedChats);
        
        // Set current chat if none is selected
        if (enhancedChats.length > 0 && !currentChat) {
          setCurrentChat(enhancedChats[0]);
        }

        return enhancedChats;
      } catch (error: any) {
        console.error('Error fetching chats:', error);
        toast({
          title: "Error loading chats",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
    onSettled: () => setIsLoading(false),
  });

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!user || !currentChat) return;

    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${currentChat.id}`
      }, (payload) => {
        // Update the current chat with the new message
        const newMessage = {
          id: payload.new.id,
          content: payload.new.content,
          sender_id: payload.new.sender_id, 
          timestamp: payload.new.created_at,
          is_ai: payload.new.is_ai,
          type: payload.new.is_ai ? 'ai' : 'user',
          mentioned_users: payload.new.mentioned_users
        };

        // Only update if the message is for the current chat
        if (payload.new.chat_id === currentChat.id) {
          setCurrentChat(prevChat => {
            if (!prevChat) return null;
            return {
              ...prevChat,
              messages: [...prevChat.messages, newMessage]
            };
          });

          // Also update the chat in the list
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === currentChat.id 
                ? { 
                    ...chat, 
                    messages: [...chat.messages, newMessage],
                    updatedAt: new Date().toISOString()
                  } 
                : chat
            )
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentChat]);

  // Function to send a message
  const sendChatMessage = async (message: string) => {
    if (!currentChat || !user || !currentUser) return;
    
    setIsSendingMessage(true);
    try {
      // Extract mentioned users from the message
      const mentionRegex = /@([A-Za-z0-9_]+)/g;
      const mentions = [];
      let match;
      
      while ((match = mentionRegex.exec(message)) !== null) {
        mentions.push(match[1]);
      }
      
      // Check if the AI is mentioned
      const shouldTagAI = message.toLowerCase().includes('@ai');
      
      // Insert user message to database
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChat.id,
          sender_id: user.id,
          content: message,
          is_ai: false,
          mentioned_users: mentions
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Only generate AI response if the AI was tagged
      if (shouldTagAI) {
        try {
          // Get relevant chat history (last 10 messages)
          const recentMessages = currentChat.messages.slice(-10).map(msg => ({
            content: msg.content,
            is_ai: msg.is_ai
          }));
          
          // Call the AI chat function
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { 
              message, 
              chatHistory: recentMessages 
            },
          });
          
          if (error) throw error;
          
          // Insert AI response to database
          await supabase
            .from('messages')
            .insert({
              chat_id: currentChat.id,
              content: data.reply,
              is_ai: true,
              mentioned_users: []
            });
          
        } catch (aiError: any) {
          console.error("Error generating AI response:", aiError);
          toast({
            title: "AI Response Error",
            description: "Could not generate AI response. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
      // Refresh chat data
      queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
    }
  };

  // Function to create a new chat
  const createNewChat = async (title: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Insert new chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          title: title || "New Chat",
          created_by: user.id
        })
        .select()
        .single();
      
      if (chatError) throw chatError;
      
      // Add current user as participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatData.id,
          user_id: user.id
        });
      
      if (participantError) throw participantError;
      
      // Refresh chats
      queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
      
      // Create a new chat object with empty messages and current user
      const newChat: Chat = {
        ...chatData,
        messages: [],
        users: [currentUser as User],
      };
      
      // Update state
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      
      toast({
        title: "Chat created",
        description: `"${title}" has been created successfully.`
      });
      
    } catch (error: any) {
      toast({
        title: "Error creating chat",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUsersSidebar = () => {
    setShowUsersSidebar(!showUsersSidebar);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        setCurrentChat,
        users: currentChat?.users || [],
        currentUser: currentUser,
        sendChatMessage,
        createNewChat,
        isLoading: isLoading || isLoadingChats,
        isSendingMessage,
        showUsersSidebar,
        toggleUsersSidebar
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
