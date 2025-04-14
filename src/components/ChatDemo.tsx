import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { LoadingSpinner } from "./ChatDemo/LoadingSpinner";

// Demo user for testing
const DEMO_USER = {
  id: "user-" + Math.random().toString(36).substring(2, 9),
  username: "User-" + Math.floor(Math.random() * 1000),
};

// Demo rooms for testing
const DEMO_ROOMS = [
  { id: "room-general", name: "General" },
  { id: "room-support", name: "Support" },
  { id: "room-random", name: "Random" },
];

export function ChatDemo() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState(DEMO_ROOMS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Initialize the socket hook with our demo user
  const {
    isConnected,
    connect,
    disconnect,
    error,
    clearError,
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
    notifications,
    markNotificationAsRead,
  } = useSocket({
    user: DEMO_USER,
    autoConnect: true, // Auto-connect when component mounts
  });

  // Join the demo room when connected
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);
      joinRoom(roomId)
        .catch((err) => {
          console.error("Failed to join room:", err);
          toast({
            title: "Error",
            description: "Failed to join room",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    
    // Cleanup: leave room when component unmounts
    return () => {
      if (isConnected) {
        leaveRoom(roomId).catch((err) => {
          console.error("Failed to leave room:", err);
        });
      }
    };
  }, [isConnected, joinRoom, leaveRoom, roomId, toast]);

  // Update user count when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const roomMessages = messages.filter(msg => msg.roomId === roomId);
      const uniqueUsers = new Set(roomMessages.map(msg => msg.userId));
      setUserCount(uniqueUsers.size);
    }
  }, [messages, roomId]);
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show error messages as toasts
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Show notifications as toasts
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      toast({
        title: "New Notification",
        description: latestNotification.message,
      });
    }
  }, [notifications, toast]);

  // Handle connection errors
  const handleConnect = useCallback(async () => {
    try {
      setIsLoading(true);
      await connect();
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [connect, toast]);

  // Handle disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      await disconnect();
    } catch (err) {
      toast({
        title: "Disconnection Error",
        description: "Failed to disconnect cleanly. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [disconnect, toast]);

  // Handle message sending with retry
  const handleMessageSend = useCallback(async (text: string, retries = 2) => {
    if (!text.trim() || !isConnected) return;

    try {
      setIsLoading(true);
      await sendMessage(roomId, text);
      setMessage("");
    } catch (err) {
      if (retries > 0) {
        toast({
          title: "Retrying",
          description: "Failed to send message, retrying...",
        });
        return handleMessageSend(text, retries - 1);
      }
      toast({
        title: "Error",
        description: "Failed to send message after multiple attempts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, roomId, sendMessage, toast]);

  // Handle form submission to send a message
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      handleMessageSend(message);
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle changing rooms
  const handleRoomChange = (newRoom: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to the server first",
      });
      return;
    }
    
    setIsLoading(true);
    leaveRoom(roomId)
      .then(() => {
        setRoomId(newRoom);
        return joinRoom(newRoom);
      })
      .catch((err) => {
        console.error("Failed to change room:", err);
        toast({
          title: "Error",
          description: "Failed to change room",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto border rounded-lg shadow-md">
      {/* Connection status and controls */}
      <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            role="status"
            aria-label={isConnected ? "Connected" : "Disconnected"}
            title={isConnected ? "Connected to server" : "Not connected to server"}
          />
          <span className="sr-only">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="text-sm">
            {isConnected ? "Connected as " : "Disconnected - "}
            <strong>{DEMO_USER.username}</strong>
          </span>
          {error && (
            <div className="text-red-500 ml-4 flex items-center gap-2">
              Error: {error}
              <button
                onClick={clearError}
                className="text-xs bg-red-100 hover:bg-red-200 p-1 rounded"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleConnect}
            disabled={isConnected || isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center gap-1"
            aria-label="Connect to server"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Connect"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={!isConnected || isLoading}
            className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300"
            aria-label="Disconnect from server"
          >
            Disconnect
          </button>
        </div>
      </div>
      {/* Room selection */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Active Room:</label>
          <select 
            value={roomId}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="border rounded p-1"
            disabled={!isConnected || isLoading}
          >
            {DEMO_ROOMS.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
          {userCount > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {userCount} user{userCount !== 1 ? 's' : ''} in chat
            </span>
          )}
          <span className="ml-4 text-sm text-gray-600">
            Logged in as: <span className="font-medium">{DEMO_USER.username}</span>
          </span>
        </div>
      </div>
      
      {/* Chat area split into messages and notifications */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages panel */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-medium">Messages</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">
                No messages yet. Say something!
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`mb-3 ${msg.userId === DEMO_USER.id ? 'text-right' : ''}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg ${
                      msg.userId === DEMO_USER.id 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 rounded-bl-none'
                    }`}
                  >
                    <div className="text-sm opacity-75 mb-1">
                      {msg.userId === DEMO_USER.id ? 'You' : 'Someone else'}
                    </div>
                    <div>{msg.text}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-3 border-t">
            <form 
              onSubmit={handleSubmit} 
              className="flex gap-2"
              aria-label="Message input form"
            >
              <input
                type="text"
                id="message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isConnected
                    ? "Type a message... (use @username to mention someone)"
                    : "Connect to start chatting"
                }
                disabled={!isConnected || isLoading}
                className="flex-1 p-2 border rounded"
                aria-label="Message input"
                aria-disabled={!isConnected || isLoading}
              />
              <button
                type="submit"
                disabled={!isConnected || !message.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center gap-1"
                aria-label="Send message"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Send"}
              </button>
            </form>
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to send • Use @username to mention someone
            </div>
          </div>
        </div>
        
        {/* Notifications panel */}
        <div className="w-72 flex flex-col overflow-hidden">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-medium">Notifications</h3>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 mb-2 border rounded-lg ${
                    notification.read ? 'bg-gray-50' : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">
                      {notification.type === 'mention' ? '@Mention' : 'Notification'}
                    </div>
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="text-xs bg-gray-100 p-1 rounded"
                      disabled={notification.read}
                    >
                      {notification.read ? 'Read' : 'Mark read'}
                    </button>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

