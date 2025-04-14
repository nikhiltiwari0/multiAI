import {
  ClientToServerEvents as ClientEvents,
  ChatMessage as ServerChatMessage,
  ServerToClientEvents as ServerEvents,
  Notification as ServerNotification,
  NotificationType as ServerNotificationType,
  Room as ServerRoom,
  User as ServerUser
} from "../../server/types";
import { Socket, io } from "socket.io-client";

// Define local types that match server types (for backward compatibility)
export interface ServerToClientEvents extends ServerEvents {}

export interface ClientToServerEvents extends ClientEvents {}

// Export server types for use in components
export type User = ServerUser;
export type ChatMessage = ServerChatMessage;
export type NotificationType = ServerNotificationType;
export type Notification = ServerNotification;
export type Room = ServerRoom;

// Create and export the socket instance
const URL = process.env.NODE_ENV === "production"
  ? "https://shared-ai.vercel.app"
  : "https://shared-ai.vercel.app";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  reconnectionDelayMax: 5000,
});

// Add some connection event listeners for debugging
socket.on("connect", () => {
  console.log("Socket connected");
});

socket.on("disconnect", (reason) => {
  console.log(`Socket disconnected: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

// Connection helper function
export const connectSocket = (user: { id: string; username: string }) => {
  // Set auth data
  socket.auth = { userId: user.id, username: user.username };
  
  // Connect if not already connected
  if (!socket.connected) {
    socket.connect();
  }
};

// Disconnection helper
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Room management helpers
export const joinRoom = (roomId: string) => {
  if (socket.connected) {
    socket.emit("joinRoom", roomId);
  } else {
    console.warn("Cannot join room: Socket not connected");
  }
};

export const leaveRoom = (roomId: string) => {
  if (socket.connected) {
    socket.emit("leaveRoom", roomId);
  }
};

// Message handling helper
export const sendMessage = (roomId: string, text: string) => {
  if (socket.connected && socket.auth?.userId) {
    socket.emit("sendMessage", {
      roomId,
      userId: socket.auth.userId as string,
      text
    });
  } else {
    console.warn("Cannot send message: Socket not connected or user not authenticated");
  }
};

// Notification helper
export const markNotificationAsRead = (notificationId: string) => {
  if (socket.connected) {
    socket.emit("readNotification", notificationId);
  }
};

// Development-only debugging
if (process.env.NODE_ENV !== "production") {
  socket.onAny((event, ...args) => {
    console.log(`[Socket.IO] ${event}:`, args);
  });
}

