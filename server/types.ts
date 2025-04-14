import { Socket } from "socket.io";

// Message Types
export enum MessageType {
  CHAT = "chat",
  SYSTEM = "system"
}

// User-related types
export interface User {
  id: string;
  username: string;
}

// Message-related types
export interface ChatMessage {
  id: string;
  userId: string;
  roomId: string;
  text: string;
  timestamp: number;
}

// Notification-related types
export enum NotificationType {
  MESSAGE = "message",
  MENTION = "mention",
  SYSTEM = "system",
}

export interface Notification {
  id: string;
  type: NotificationType;
  targetUserId: string;
  sourceUserId?: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Room-related types
export interface Room {
  id: string;
  name: string;
  users: string[]; // Array of user IDs
}

// Socket event types
export interface ServerToClientEvents {
  chatMessage: (message: ChatMessage) => void;
  notification: (notification: Notification) => void;
  error: (error: { message: string }) => void;
  connectionStateChange: (state: { connected: boolean }) => void;
  roomUpdate: (room: Room) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  readNotification: (notificationId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User;
}

// Socket with custom event typings
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Export a type for the server instance
export interface SocketIOServer {
  emit: <T extends keyof ServerToClientEvents>(
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ) => boolean;
}

// Helper types for in-memory storage used in server implementation
export type ActiveUsers = Map<string, string>; // userId -> socketId
export type UserRooms = Map<string, Set<string>>; // userId -> set of roomIds

