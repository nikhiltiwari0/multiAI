import { useEffect, useState, useCallback } from "react";
import { socket, connectSocket, disconnectSocket, ChatMessage, Notification } from "../lib/socket";

export interface UseSocketOptions {
  user?: { id: string; username: string };
  autoConnect?: boolean;
}

export function useSocket({ user, autoConnect = false }: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Connect to socket
  useEffect(() => {
    // Only connect if we have a user and autoConnect is true
    if (user && autoConnect) {
      connectSocket(user);
    }

    // Connection status listeners
    const onConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      setError(`Connection error: ${err.message}`);
    };

    // Add event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Cleanup on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      
      // Only disconnect if we connected in this hook
      if (autoConnect) {
        disconnectSocket();
      }
    };
  }, [user, autoConnect]);

  // Message handling
  useEffect(() => {
    // Handle incoming messages
    const onChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    // Handle errors
    const onError = (err: { message: string }) => {
      setError(err.message);
    };

    // Add message listener
    socket.on("chatMessage", onChatMessage);
    socket.on("error", onError);

    // Cleanup
    return () => {
      socket.off("chatMessage", onChatMessage);
      socket.off("error", onError);
    };
  }, []);

  // Notification handling
  useEffect(() => {
    // Handle incoming notifications
    const onNotification = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);
    };

    // Add notification listener
    socket.on("notification", onNotification);

    // Cleanup
    return () => {
      socket.off("notification", onNotification);
    };
  }, []);

  // Join room function
  const joinRoom = useCallback((roomId: string) => {
    if (isConnected) {
      socket.emit("joinRoom", roomId);
    } else {
      setError("Cannot join room: not connected");
    }
  }, [isConnected]);

  // Leave room function
  const leaveRoom = useCallback((roomId: string) => {
    if (isConnected) {
      socket.emit("leaveRoom", roomId);
    }
  }, [isConnected]);

  // Send message function
  const sendMessage = useCallback((roomId: string, text: string) => {
    if (!isConnected) {
      setError("Cannot send message: not connected");
      return;
    }

    if (!user) {
      setError("Cannot send message: no user data");
      return;
    }

    socket.emit("sendMessage", {
      userId: user.id,
      roomId,
      text,
    });
  }, [isConnected, user]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    if (isConnected) {
      socket.emit("readNotification", notificationId);
      
      // Optimistically update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    }
  }, [isConnected]);

  // Manual connect function
  const connect = useCallback(() => {
    if (user) {
      connectSocket(user);
    } else {
      setError("Cannot connect: no user data");
    }
  }, [user]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
  }, []);

  // Clear messages function
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear notifications function
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Socket connection state
    isConnected,
    error,
    
    // Connection management
    connect,
    disconnect,
    
    // Room management
    joinRoom,
    leaveRoom,
    
    // Messages
    messages,
    sendMessage,
    clearMessages,
    
    // Notifications
    notifications,
    markNotificationAsRead,
    clearNotifications,
    
    // Error handling
    clearError,
  };
}
