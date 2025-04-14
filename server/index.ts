import {
  ActiveUsers,
  ChatMessage,
  ClientToServerEvents,
  InterServerEvents,
  Notification,
  NotificationType,
  Room,
  ServerToClientEvents,
  SocketData,
  TypedSocket,
  UserRooms,
} from "./types";

import { Server } from "socket.io";
import cors from "cors";
import express from "express";
import http from "http";
import { v4 as uuidv4 } from "uuid";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Log server start
console.log("Starting Socket.IO server...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Configure CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? "https://shared-ai.vercel.app"
      : "https://shared-ai.vercel.app", // Default Vite dev server port
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Parse JSON body
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with typed events
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? "https://shared-ai.vercel.app"
      : "https://shared-ai.vercel.app", // Default Vite dev server port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory storage for active users
const activeUsers: ActiveUsers = new Map<string, string>(); // userId -> socketId
const userRooms: UserRooms = new Map<string, Set<string>>(); // userId -> set of roomIds

// Basic API routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Socket.IO connection handler
io.on("connection", (socket: TypedSocket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Emit connection state change
  socket.emit("connectionStateChange", { connected: true });

  // Handle user authentication
  // In a real app, you'd verify tokens and get user data
  const userId = socket.handshake.auth.userId || `user-${uuidv4()}`;
  const username = socket.handshake.auth.username || `Anonymous-${socket.id.substring(0, 5)}`;

  // Set socket data
  socket.data.user = { id: userId, username };
  
  // Store user connection
  activeUsers.set(userId, socket.id);

  // Handle joining a room
  socket.on("joinRoom", (roomId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);
    
    // Track room membership for this user
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    }
    userRooms.get(userId)?.add(roomId);

    // Notify others in the room with room update
    const room: Room = {
      id: roomId,
      name: roomId.startsWith('room-') ? roomId.substring(5) : roomId,
      users: Array.from(io.sockets.adapter.rooms.get(roomId) || [])
    };
    io.to(roomId).emit("roomUpdate", room);
  });

  // Handle leaving a room
  socket.on("leaveRoom", (roomId) => {
    console.log(`User ${userId} left room ${roomId}`);
    socket.leave(roomId);
    
    // Update room membership
    userRooms.get(userId)?.delete(roomId);
  });

  // Handle sending a message
  socket.on("sendMessage", (messageData) => {
    try {
      // Create a complete message with ID and timestamp
      const message: ChatMessage = {
        id: uuidv4(),
        userId: userId,
        roomId: messageData.roomId,
        text: messageData.text,
        timestamp: Date.now(),
      };

      console.log(`New message in room ${message.roomId}: ${message.text}`);
      
      // Broadcast the message to everyone in the room including sender
      io.to(message.roomId).emit("chatMessage", message);
      
      // Create notifications for mentions (@username)
      if (message.text.includes("@")) {
        // Extract usernames from message (simple implementation)
        const mentionedUsers = message.text.match(/@(\w+)/g);
        
        if (mentionedUsers) {
          mentionedUsers.forEach(mention => {
            const mentionedUsername = mention.substring(1); // Remove @ symbol
            
            // In a real app, you'd look up the user ID from the username
            // For demo purposes, we'll just broadcast to everyone
            
            const notification: Notification = {
              id: uuidv4(),
              type: NotificationType.MENTION,
              targetUserId: "all", // In reality, you'd specify the exact user
              sourceUserId: userId,
              message: `${username} mentioned you in a message`,
              timestamp: Date.now(),
              read: false,
            };
            
            io.emit("notification", notification);
          });
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", { message: "Failed to process message" });
    }
  });

  // Handle reading notifications
  socket.on("readNotification", (notificationId) => {
    // In a real app, you'd mark the notification as read in your database
    console.log(`User ${userId} read notification ${notificationId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Clean up user data
    activeUsers.delete(userId);
    
    // Update room information for rooms this user was in
    const rooms = userRooms.get(userId) || new Set();
    for (const roomId of rooms) {
      // Emit room update to remaining users in the room
      const room: Room = {
        id: roomId,
        name: roomId.startsWith('room-') ? roomId.substring(5) : roomId,
        users: Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      };
      io.to(roomId).emit("roomUpdate", room);
    }
    
    userRooms.delete(userId);
    
    // Emit connection state change (though client likely won't receive this)
    socket.emit("connectionStateChange", { connected: false });
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

