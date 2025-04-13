
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, fetchChats, currentUser, User, sendMessage, createChat, Message, MessageType } from '../lib/mock-data';
import { toast } from '@/components/ui/use-toast';

interface ChatContextProps {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
  users: User[];
  currentUser: User;
  sendChatMessage: (message: string) => Promise<void>;
  createNewChat: (title: string) => Promise<void>;
  isLoading: boolean;
  isSendingMessage: boolean;
  showUsersSidebar: boolean;
  toggleUsersSidebar: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showUsersSidebar, setShowUsersSidebar] = useState(false);

  useEffect(() => {
    async function loadChats() {
      try {
        const fetchedChats = await fetchChats();
        setChats(fetchedChats);
        if (fetchedChats.length > 0) {
          setCurrentChat(fetchedChats[0]);
        }
      } catch (error) {
        toast({
          title: "Error loading chats",
          description: "Could not load chat data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadChats();
  }, []);

  const sendChatMessage = async (message: string) => {
    if (!currentChat) return;
    
    setIsSendingMessage(true);
    try {
      // Check for tags in the message
      const shouldTagAI = message.includes('@AI');
      
      // Send user message
      const userMessage = await sendMessage(currentChat.id, message);
      
      // Update current chat with new message
      const updatedChat: Chat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: new Date().toISOString()
      };
      setCurrentChat(updatedChat);
      
      // Update chats list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        )
      );
      
      // Only generate AI response if the AI was tagged
      if (shouldTagAI) {
        // Simulate AI response after a delay
        setTimeout(async () => {
          const aiMsg = await sendMessage(currentChat.id, '', 'ai');
          
          // Ensure the AI message has the correct type structure
          const aiMessage: Message = {
            id: aiMsg.id,
            content: aiMsg.content,
            timestamp: aiMsg.timestamp,
            type: 'ai' as MessageType
          };
          
          const finalChat: Chat = {
            ...updatedChat,
            messages: [...updatedChat.messages, aiMessage],
            updatedAt: new Date().toISOString()
          };
          
          setCurrentChat(finalChat);
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === currentChat.id ? finalChat : chat
            )
          );
        }, 1500);
      } else {
        setIsSendingMessage(false);
      }
      
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Failed to send message",
        variant: "destructive",
      });
      setIsSendingMessage(false);
    }
  };

  const createNewChat = async (title: string) => {
    try {
      setIsLoading(true);
      const newChat = await createChat(title || "New Chat");
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
    } catch (error) {
      toast({
        title: "Error creating chat",
        description: "Failed to create new chat",
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
        currentUser,
        sendChatMessage,
        createNewChat,
        isLoading,
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
