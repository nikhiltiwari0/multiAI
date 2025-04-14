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
  // Removed local chats state - using React Query's fetchedChats exclusively
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

  // Query to fetch all chats the user participates in - this is our single source of truth
  const { data: chats, isLoading: isLoadingChats } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      try {
        setIsLoading(true);
        if (!user) return [];

        // First, get all chat participations for the current user
        const { data: participations, error: participationsError } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", user.id);

        if (participationsError) throw participationsError;
        if (!participations || !Array.isArray(participations) || participations.length === 0) {
          console.log("No chat participations found for user");
          return [];
        }
        
        const chatIds = participations.map((p) => p.chat_id);

        const { data: fetchedChats, error: chatsError } = await supabase
          .from("chats")
          .select("*")
          .in("id", chatIds)
          .order("created_at", { ascending: false });

        if (chatsError) throw chatsError;
        if (!fetchedChats || !Array.isArray(fetchedChats)) {
          console.error("Unexpected format for fetchedChats:", fetchedChats);
          return [];
        }

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
  
  // Effect to update UI when chats data changes
  useEffect(() => {
    // Add type checking and error handling for chats
    if (chats && Array.isArray(chats)) {
      console.log("Loaded chats:", chats.length);

      // Set current chat if we don't have one but chats are available
      if (chats.length > 0 && !currentChat) {
        setCurrentChat(chats[0]);
      }

      // If current chat exists but might be stale, refresh it
      if (currentChat) {
        const updatedCurrentChat = chats.find(
          (chat) => chat.id === currentChat.id
        );
        if (updatedCurrentChat) {
          setCurrentChat(updatedCurrentChat);
        } else if (chats.length > 0) {
          // Current chat no longer exists, switch to the first available one
          setCurrentChat(chats[0]);
        }
      }
    } else {
      console.warn("chats is not an array or is empty:", chats);
      // Reset state if no valid chats were returned
      if (chats === null || chats === undefined) {
        if (currentChat) {
          setCurrentChat(null);
        }
      }
    }
  }, [chats, currentChat]);

  // Set up real-time subscriptions for all chat-related changes
  useEffect(() => {
    if (!user) return;
    
    console.log(`Setting up comprehensive real-time subscriptions for chat updates`);
    
    // Create a unique channel name with timestamp for this session
    const channelName = `chat-realtime-${new Date().getTime()}`;
    
    const channel = supabase
      .channel(channelName)
      // Handle message INSERT events
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Real-time message INSERT received:", payload.new);

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender_id: payload.new.sender_id,
            timestamp: payload.new.created_at,
            is_ai: payload.new.is_ai,
            type: payload.new.is_ai ? "ai" : "user",
            mentioned_users: payload.new.mentioned_users,
          };

          const chatId = payload.new.chat_id;

          // Check if this is our own message
          // Check if this is our own message
          const isOwnMessage = payload.new.sender_id === user.id;

          // Update React Query cache instead of local state
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map(chat => {
                // Skip chats that don't match the message's chat_id
                if (chat.id !== chatId) return chat;

                // Check if this message already exists in the chat
                const messageExists = chat.messages.some(
                  (msg) => msg.id === newMessage.id
                );
                if (messageExists) return chat;

                // Check if this message should replace a temporary message
                if (isOwnMessage) {
                  const tempMessage = chat.messages.find(
                    (msg) =>
                      msg.id.startsWith("temp-") &&
                      msg.content === payload.new.content &&
                      msg.sender_id === user.id
                  );

                  if (tempMessage) {
                    console.log(
                      `Replacing temporary message ${tempMessage.id} with real message ${newMessage.id} in chat ${chat.id}`
                    );

                    // Replace the temporary message with the real one
                    return {
                      ...chat,
                      messages: chat.messages.map((msg) =>
                        msg.id === tempMessage.id ? newMessage : msg
                      ),
                      updatedAt: new Date().toISOString(),
                    };
                  }
                }

                // Otherwise add the new message to the chat
                return {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                };
              })
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
              });
          });

          // Also update current chat if it matches
          if (currentChat?.id === chatId) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return prevChat;

              // Check if this message already exists in the current chat
              const messageExists = prevChat.messages.some(
                (msg) => msg.id === newMessage.id
              );
              if (messageExists) return prevChat;

              // Check if this message should replace a temporary message
              if (isOwnMessage) {
                const tempMessage = prevChat.messages.find(
                  (msg) =>
                    msg.id.startsWith("temp-") &&
                    msg.content === payload.new.content &&
                    msg.sender_id === user.id
                );

                if (tempMessage) {
                  console.log(
                    `Replacing temporary message ${tempMessage.id} with real message ${newMessage.id} in current chat`
                  );

                  // Replace the temporary message with the real one
                  return {
                    ...prevChat,
                    messages: prevChat.messages.map((msg) =>
                      msg.id === tempMessage.id ? newMessage : msg
                    ),
                  };
                }
              }

              // Otherwise add the new message to the current chat
              return {
                ...prevChat,
                messages: [...prevChat.messages, newMessage],
              };
            });
          }
        }
      )
      // Handle message UPDATE events
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Real-time message UPDATE received:", payload.new);

          const updatedMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender_id: payload.new.sender_id,
            timestamp: payload.new.created_at,
            is_ai: payload.new.is_ai,
            type: payload.new.is_ai ? "ai" : "user",
            mentioned_users: payload.new.mentioned_users,
          };

          const chatId = payload.new.chat_id;

          // Update React Query cache for message updates
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map((chat) => {
              if (chat.id !== chatId) return chat;

              // Find and update the message in this chat
              return {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                ),
                updatedAt: new Date().toISOString(),
              };
            });
          });

          // Update current chat if it matches
          if (currentChat?.id === chatId) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return prevChat;

              return {
                ...prevChat,
                messages: prevChat.messages.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                ),
              };
            });
          }
        }
      )
      // Handle message DELETE events
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Real-time message DELETE received:", payload.old);

          const messageId = payload.old.id;
          const chatId = payload.old.chat_id;

          // Update React Query cache for message deletions
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map((chat) => {
              if (chat.id !== chatId) return chat;

              return {
                ...chat,
                messages: chat.messages.filter((msg) => msg.id !== messageId),
                updatedAt: new Date().toISOString(),
              };
            });
          });

          // Remove from current chat if it matches
          if (currentChat?.id === chatId) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return prevChat;

              return {
                ...prevChat,
                messages: prevChat.messages.filter(
                  (msg) => msg.id !== messageId
                ),
              };
            });
          }
        }
      )
      // Handle new chat INSERT events
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
        },
        async (payload) => {
          console.log("Real-time chat INSERT received:", payload.new);

          const chatId = payload.new.id;
          const createdBy = payload.new.created_by;

          // Skip if this chat was created by the current user (already handled by our own actions)
          if (createdBy === user.id) return;

          try {
            // Check if current user is a participant in this new chat
            const { data: participant, error: participantError } =
              await supabase
                .from("chat_participants")
                .select("*")
                .eq("chat_id", chatId)
                .eq("user_id", user.id)
                .single();

            if (participantError || !participant) {
              // Current user is not a participant, so we don't need to add this chat
              return;
            }

            // Fetch messages for this chat
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*")
              .eq("chat_id", chatId)
              .order("created_at", { ascending: true });

            if (messagesError) throw messagesError;

            // Fetch participants for this chat
            const { data: participants, error: participantsError } =
              await supabase
                .from("chat_participants")
                .select("user_id")
                .eq("chat_id", chatId);

            if (participantsError) throw participantsError;

            const participantIds = participants.map((p) => p.user_id);

            // Fetch user profiles for participants
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

            // Create new chat object
            const newChat: Chat = {
              id: chatId,
              title: payload.new.title,
              created_at: payload.new.created_at,
              created_by: createdBy,
              messages: messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                timestamp: msg.created_at,
                is_ai: msg.is_ai,
                type: msg.is_ai ? "ai" : "user",
                mentioned_users: msg.mentioned_users,
              })),
              users: chatUsers,
              updatedAt: new Date().toISOString(),
            };

            // Add new chat to state
            // Add new chat to React Query cache
            queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              // Check if chat already exists
              const chatExists = oldData.some((chat) => chat.id === chatId);
              if (chatExists) return oldData;

              // Add new chat and sort
              return [...oldData, newChat].sort((a, b) => {
                  const aLatestMessage = a.messages.length > 0
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
              });
            });

            // Notify user about new chat
            toast({
              title: "New Chat Added",
              description: `You've been added to "${payload.new.title}"`,
            });
          } catch (error) {
            console.error("Error processing new chat:", error);
          }
        }
      )
      // Handle chat UPDATE events (e.g., renames)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
        },
        (payload) => {
          console.log("Real-time chat UPDATE received:", payload.new);

          const chatId = payload.new.id;
          const updatedTitle = payload.new.title;

          // Update chat title in React Query cache
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map((chat) => {
              if (chat.id !== chatId) return chat;

              return {
                ...chat,
                title: updatedTitle,
                updatedAt: new Date().toISOString(),
              };
            });
          });

          // Update current chat if it matches
          if (currentChat?.id === chatId) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return prevChat;

              return {
                ...prevChat,
                title: updatedTitle,
              };
            });

            // Only notify if we didn't perform this update ourselves
            if (payload.new.created_by !== user.id) {
              toast({
                title: "Chat Renamed",
                description: `Chat renamed to "${updatedTitle}"`,
              });
            }
          }
        }
      )
      // Handle chat DELETE events
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chats",
        },
        (payload) => {
          console.log("Real-time chat DELETE received:", payload.old);

          const chatId = payload.old.id;

          // Remove the chat from React Query cache
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.filter((chat) => chat.id !== chatId);
          });

          // If this was the current chat, switch to another one
          if (currentChat?.id === chatId) {
            setCurrentChat((prev) => {
              // Get current chats from React Query cache
              const currentChats = queryClient.getQueryData<Chat[]>(["chats", user.id]) || [];
              const remainingChats = currentChats.filter((c) => c.id !== chatId);
              return remainingChats.length > 0 ? remainingChats[0] : null;
            });

            toast({
              title: "Chat Deleted",
              description: "The chat you were viewing was deleted.",
            });
          }
        }
      )
      // Handle chat_participants INSERT events (new members)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_participants",
        },
        async (payload) => {
          console.log(
            "Real-time chat participant INSERT received:",
            payload.new
          );

          const chatId = payload.new.chat_id;
          const newUserId = payload.new.user_id;

          // Skip if this is about the current user (already handled by our own actions)
          if (newUserId === user.id) return;

          try {
            // Fetch the new user's profile
            const { data: userProfile, error } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", newUserId)
              .single();

            if (error) throw error;

            const newUser: User = {
              id: userProfile.id,
              username: userProfile.username,
              avatar: userProfile.avatar_url,
            };

            // Update the chat's users list
            // Update chat's users list in React Query cache
            queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              return oldData.map((chat) => {

                // Check if user already exists in the chat
                const userExists = chat.users.some((u) => u.id === newUser.id);
                if (userExists) return chat;

                return {
                  ...chat,
                  users: [...chat.users, newUser],
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            // Update current chat if it matches
            if (currentChat?.id === chatId) {
              setCurrentChat((prevChat) => {
                if (!prevChat) return prevChat;

                // Check if user already exists in the chat
                const userExists = prevChat.users.some(
                  (u) => u.id === newUser.id
                );
                if (userExists) return prevChat;

                return {
                  ...prevChat,
                  users: [...prevChat.users, newUser],
                };
              });

              // Notify about new participant
              toast({
                title: "New Chat Participant",
                description: `${newUser.username} joined the chat.`,
              });
            }
          } catch (error) {
            console.error("Error processing new chat participant:", error);
          }
        }
      )
      // Handle chat_participants DELETE events (members leaving)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_participants",
        },
        (payload) => {
          console.log(
            "Real-time chat participant DELETE received:",
            payload.old
          );

          const chatId = payload.old.chat_id;
          const removedUserId = payload.old.user_id;

          // Skip if this is about the current user (already handled by our own actions)
          if (removedUserId === user.id) return;

          // Update chat's users list for removals in React Query cache
          queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map((chat) => {
              if (chat.id !== chatId) return chat;

              return {
                ...chat,
                users: chat.users.filter((u) => u.id !== removedUserId),
                updatedAt: new Date().toISOString(),
              };
            });
          });

          // Update current chat if it matches
          if (currentChat?.id === chatId) {
            setCurrentChat((prevChat) => {
              if (!prevChat) return prevChat;

              // Find the user who left
              const removedUser = prevChat.users.find(
                (u) => u.id === removedUserId
              );
              const username = removedUser ? removedUser.username : "A user";

              // Notify about participant leaving
              toast({
                title: "Chat Participant Left",
                description: `${username} left the chat.`,
              });

              return {
                ...prevChat,
                users: prevChat.users.filter((u) => u.id !== removedUserId),
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase real-time subscription status: ${status}`);

        if (status === "SUBSCRIBED") {
          console.log(
            `Successfully subscribed to real-time updates for all chat changes`
          );
        }
      });

    // Return cleanup function
    return () => {
      console.log(`Cleaning up real-time subscription`);
      supabase.removeChannel(channel);
    };
  }, [user]); // Only depend on user, not currentChat or chats to avoid reconnecting too often

  // Function to send a message
  const sendChatMessage = async (message: string) => {
    if (!currentChat || !user || !currentUser) return;

    // Extract @mentions from the message content
    const mentionRegex = /@(AI|[A-Za-z0-9_]+)/g;
    const mentions: string[] = [];
    let match;

    // Collect all mentions in the message
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]); // Push the username without the @
    }

    // Generate a temporary ID for immediate display
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const now = new Date().toISOString();

    // Create temporary message for immediate display
    const tempMessage: Message = {
      id: tempId,
      content: message,
      sender_id: user.id,
      timestamp: now,
      is_ai: false,
      type: "user",
      mentioned_users: mentions,
    };

    console.log("Creating temporary message with ID:", tempId);

    // Immediately update UI with temporary message
    setCurrentChat((prevChat) => {
      if (!prevChat || prevChat.id !== currentChat.id) return prevChat;
      return {
        ...prevChat,
        messages: [...prevChat.messages, tempMessage],
      };
    });

    // Also update the chats list with temporary message in React Query cache
    queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      return oldData
        .map((chat) =>
          chat.id === currentChat.id
            ? {
                ...chat,
                messages: [...chat.messages, tempMessage],
                updatedAt: now,
              }
            : chat
        )
        .sort((a, b) => {
          const aLatestMessage =
            a.messages.length > 0
              ? new Date(a.messages[a.messages.length - 1].timestamp).getTime()
              : new Date(a.created_at).getTime();
          const bLatestMessage =
            b.messages.length > 0
              ? new Date(b.messages[b.messages.length - 1].timestamp).getTime()
              : new Date(b.created_at).getTime();
          return bLatestMessage - aLatestMessage; // Most recent first
        })
  });

    setIsSendingMessage(true);
    try {
      console.log("Sending message to database:", message);

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

      console.log("Message successfully inserted with ID:", messageData?.id);

      // Replace temporary message with the real one from the database
      if (messageData) {
        console.log(
          "Replacing temporary message with real message:",
          messageData.id
        );

        const newMessage: Message = {
          id: messageData.id,
          content: messageData.content,
          sender_id: messageData.sender_id,
          timestamp: messageData.created_at,
          is_ai: messageData.is_ai,
          type: messageData.is_ai ? "ai" : "user",
          mentioned_users: messageData.mentioned_users,
        };

        // Replace the temporary message with the real one in current chat
        setCurrentChat((prevChat) => {
          if (!prevChat || prevChat.id !== currentChat.id) return prevChat;

          return {
            ...prevChat,
            messages: prevChat.messages.map((msg) =>
              msg.id === tempId ? newMessage : msg
            ),
          };
        });

        // Replace the temporary message with the real one in chats list
        // Replace the temporary message with the real one in chats list via React Query cache
        queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          
          return oldData.map((chat) =>
              chat.id === currentChat.id
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === tempId ? newMessage : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : chat
          )
        });
      }

      // Only generate AI response if the AI was tagged
      if (mentions.includes("AI")) {
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
      // Refresh chat data - handled by realtime subscription now
      // queryClient.invalidateQueries({ queryKey: ["chats", user.id] });
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

      // Update React Query cache
      queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        
        return oldData.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        );
      });

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
        const currentChats = queryClient.getQueryData<Chat[]>(["chats", user.id]) || [];
        const remainingChats = currentChats.filter((c) => c.id !== chatId);
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

      // Update React Query cache
      queryClient.setQueryData(["chats", user.id], (oldData: Chat[] | undefined) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter((chat) => chat.id !== chatId);
      });

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
        chats: chats || [], // Ensure we always pass an array
        currentChat,
        setCurrentChat,
        users: currentChat?.users || [],
        currentUser: currentUser,
        sendChatMessage,
        createNewChat,
        renameChat,
        deleteChat,
        acceptInvitation,
        isLoading,
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
