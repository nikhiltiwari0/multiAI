import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

type MessageType = "user" | "ai";

// Export the Chat interface
export interface Chat {
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
  renameChat: (newTitle: string, chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
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
  const currentUser: User | null =
    user && profile
      ? {
          id: user.id,
          username: profile.username,
          avatar: profile.avatar_url,
        }
      : null;

  // Query to fetch all chats the user participates in
  const { isLoading: isLoadingChats, data: fetchedChats } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data: participations, error: participationsError } =
          await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", user.id);

        if (participationsError) throw participationsError;
        if (!participations || !participations.length) return [];

        const chatIds = participations.map((p) => p.chat_id);

        const { data: fetchedChats, error: chatsError } = await supabase
          .from("chats")
          .select("*")
          .in("id", chatIds)
          .order("created_at", { ascending: false });

        if (chatsError) throw chatsError;

        // Enhance chats with messages and participants
        const enhancedChats = await Promise.all(
          fetchedChats.map(async (chat) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*")
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: true });

            if (messagesError) throw messagesError;

            const { data: participants, error: participantsError } =
              await supabase
                .from("chat_participants")
                .select("user_id")
                .eq("chat_id", chat.id);

            if (participantsError) throw participantsError;

            const participantIds = participants.map((p) => p.user_id);
            const { data: userProfiles, error: profilesError } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .in("id", participantIds);

            if (profilesError) throw profilesError;

            const chatUsers = userProfiles.map((profile) => ({
              id: profile.id,
              username: profile.username,
              avatar: profile.avatar_url,
            }));

            return {
              ...chat,
              messages: messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                timestamp: msg.created_at,
                is_ai: msg.is_ai,
                type: msg.is_ai ? ("ai" as const) : ("user" as const),
                mentioned_users: msg.mentioned_users,
              })),
              users: chatUsers,
            } as Chat;
          })
        );

        // Sort chats by most recent message
        const sortedChats = enhancedChats.sort((a, b) => {
          const aLatestMessage =
            a.messages.length > 0
              ? new Date(a.messages[a.messages.length - 1].timestamp).getTime()
              : new Date(a.created_at).getTime();

          const bLatestMessage =
            b.messages.length > 0
              ? new Date(b.messages[b.messages.length - 1].timestamp).getTime()
              : new Date(b.created_at).getTime();

          return bLatestMessage - aLatestMessage; // Most recent first
        });

        return sortedChats;
      } catch (error: unknown) {
        console.error("Error fetching chats:", (error as Error).message);
        toast({
          title: "Error loading chats",
          description: (error as Error).message,
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!user,
  });

  // Effect to update chats when fetched data changes
  useEffect(() => {
    if (fetchedChats) {
      setChats(fetchedChats);

      // Set current chat if we don't have one but chats are available
      if (fetchedChats.length > 0 && !currentChat) {
        setCurrentChat(fetchedChats[0]);
      }

      // If current chat exists but might be stale, refresh it
      if (currentChat) {
        const updatedCurrentChat = fetchedChats.find(
          (chat) => chat.id === currentChat.id
        );
        if (updatedCurrentChat) {
          setCurrentChat(updatedCurrentChat);
        }
      }
    }
  }, [fetchedChats, currentChat]);

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!user || !currentChat) return;

    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${currentChat.id}`,
        },
        (payload) => {
          // Update the current chat with the new message
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender_id: payload.new.sender_id,
            timestamp: payload.new.created_at,
            is_ai: payload.new.is_ai,
            type: payload.new.is_ai ? "ai" : "user",
            mentioned_users: payload.new.mentioned_users,
          };

          // Only update if the message is for the current chat
          if (payload.new.chat_id === currentChat.id) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return null;
              return {
                ...prevChat,
                messages: [...prevChat.messages, newMessage],
              };
            });

            // Also update the chat in the list
            setChats((prevChats) =>
              prevChats
                .map((chat) =>
                  chat.id === currentChat.id
                    ? {
                        ...chat,
                        messages: [...chat.messages, newMessage],
                        updatedAt: new Date().toISOString(),
                      }
                    : chat
                )
                .sort((a, b) => {
                  const aLatestMessage =
                    a.messages.length > 0
                      ? new Date(
                          a.messages[a.messages.length - 1].timestamp
                        ).getTime()
                      : new Date(a.created_at).getTime();

                  const bLatestMessage =
                    b.messages.length > 0
                      ? new Date(
                          b.messages[b.messages.length - 1].timestamp
                        ).getTime()
                      : new Date(b.created_at).getTime();

                  return bLatestMessage - aLatestMessage; // Most recent first
                })
            );
          }
        }
      )
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
      const shouldTagAI = message.toLowerCase().includes("@ai");

      // Insert user message to database
      const { data: messageData, error } = await supabase
        .from("messages")
        .insert({
          chat_id: currentChat.id,
          sender_id: user.id,
          content: message,
          is_ai: false,
          mentioned_users: mentions,
        })
        .select()
        .single();

      if (error) throw error;

      // Only generate AI response if the AI was tagged
      if (shouldTagAI) {
        try {
          // Get relevant chat history (last 10 messages)
          const recentMessages = currentChat.messages.slice(-10).map((msg) => ({
            content: msg.content,
            is_ai: msg.is_ai,
          }));

          // Call the AI chat function
          const { data, error } = await supabase.functions.invoke("ai-chat", {
            body: {
              message,
              chatHistory: recentMessages,
            },
          });

          if (error) throw error;

          // Insert AI response to database
          await supabase.from("messages").insert({
            chat_id: currentChat.id,
            content: data.reply,
            is_ai: true,
            mentioned_users: [],
          });
        } catch (aiError: unknown) {
          console.error(
            "Error generating AI response:",
            (aiError as Error).message
          );
          toast({
            title: "AI Response Error",
            description:
              (aiError as Error).message ||
              "Could not generate AI response. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Error sending message",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
      // Refresh chat data
      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });
    }
  };

  // Function to create a new chat
  const createNewChat = async (title: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Insert new chat
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .insert({
          title: title || "New Chat",
          created_by: user.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add current user as participant
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert({
          chat_id: chatData.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      // No need to invalidate here if we are optimistically updating or setting current chat directly
      // queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      // Create a new chat object with empty messages and current user
      const newChat: Chat = {
        ...chatData,
        messages: [],
        // Ensure users array is populated correctly for the new chat
        users: currentUser ? [currentUser] : [],
      };

      // Update state: Prepend new chat to the list and set it as current
      // Let the query invalidation handle updating the main list if needed,
      // but set currentChat immediately for responsiveness.
      // setChats([newChat, ...chats]); // REMOVE THIS LINE
      setCurrentChat(newChat);

      // Invalidate query in the background to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      toast({
        title: "Chat created",
        description: `"${title}" has been created successfully.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error creating chat",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to rename a chat
  const renameChat = async (newTitle: string, chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("chats")
        .update({ title: newTitle })
        .eq("id", chatId);

      if (error) throw error;

      // Update local state
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );

      // Update current chat if it's the one being renamed
      if (currentChat?.id === chatId) {
        setCurrentChat((prev) => (prev ? { ...prev, title: newTitle } : null));
      }

      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      toast({
        title: "Chat renamed",
        description: `Chat successfully renamed to "${newTitle}".`,
      });
    } catch (error: unknown) {
      console.error("Error renaming chat:", (error as Error).message);
      toast({
        title: "Error renaming chat",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Function to delete a chat
  const deleteChat = async (chatId: string) => {
    if (!user) return;

    // Optional: Add a confirmation step here before proceeding

    try {
      // If the chat being deleted is the current chat, switch to another or null
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter((c) => c.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }

      // Delete chat participants first (if no CASCADE DELETE is set up)
      const { error: participantsError } = await supabase
        .from("chat_participants")
        .delete()
        .eq("chat_id", chatId);

      if (participantsError) throw participantsError;

      // Delete messages (if no CASCADE DELETE is set up)
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId);

      if (messagesError) throw messagesError;

      // Delete the chat itself
      const { error: chatError } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

      if (chatError) throw chatError;

      // Update local state
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      toast({
        title: "Chat deleted",
        description: `Chat successfully deleted.`,
      });
    } catch (error: unknown) {
      // Consider adding more specific error types
      console.error("Error deleting chat:", (error as Error).message);
      // If deletion failed, maybe refresh the chat list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });
      toast({
        title: "Error deleting chat",
        description:
          (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const toggleUsersSidebar = () => {
    setShowUsersSidebar(!showUsersSidebar);
  };
  const removeChatParticipant = async (chatId: string, userId: string) => {
    if (!user) return;

    try {
      // Check if the current user is the creator of the chat
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("created_by")
        .eq("id", chatId)
        .single();

      if (chatError) throw chatError;

      if (chatData.created_by !== user.id) {
        throw new Error("Only the chat creator can remove participants.");
      }

      // Remove the participant
      const { error: removeError } = await supabase
        .from("chat_participants")
        .delete()
        .eq("chat_id", chatId)
        .eq("user_id", userId);

      if (removeError) throw removeError;

      // Optionally, refresh the chat list
      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      toast({
        title: "Participant Removed",
        description: `User has been removed from the chat.`,
      });
    } catch (error: unknown) {
      console.error("Error removing participant:", (error as Error).message);
      toast({
        title: "Error Removing Participant",
        description:
          (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Function to accept a chat invitation
  const acceptInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      // First, get the invitation details to show in toast
      const { data: invitation, error: invitationError } = await supabase
        .from("chat_invitations")
        .select("*, chats(id, title)")
        .eq("id", invitationId)
        .eq("invited_user_id", user.id)
        .single();

      if (invitationError) throw invitationError;
      if (!invitation) throw new Error("Invitation not found");

      // Call the accept_chat_invitation RPC function to handle the transaction atomically
      const { error: rpcError } = await supabase.rpc("accept_chat_invitation", {
        invitation_id: invitationId,
      });

      if (rpcError) {
        throw new Error(`Failed to accept invitation: ${rpcError.message}`);
      }

      // After successfully accepting the invitation, refresh the chats list
      // to include the newly joined chat
      queryClient.invalidateQueries({ queryKey: ["chats", user.id] });

      toast({
        title: "Invitation Accepted",
        description: `You have joined the chat "${invitation.chats?.title}"`,
      });
    } catch (error: unknown) {
      console.error("Error accepting invitation:", (error as Error).message);
      toast({
        title: "Error Accepting Invitation",
        description:
          (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
      throw error; // Re-throw to let the caller handle it
    }
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
        renameChat,
        deleteChat,
        acceptInvitation,
        isLoading: isLoading || isLoadingChats,
        isSendingMessage,
        showUsersSidebar,
        toggleUsersSidebar,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
