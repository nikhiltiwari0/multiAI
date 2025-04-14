# SharedAI
# Real-time Chat and Notifications with Socket.IO

This application demonstrates a real-time chat and notification system built with:

- **React + Vite** - Frontend framework and build tool
- **Express.js** - Backend server
- **Socket.IO** - Real-time communication
- **TypeScript** - Type safety throughout

## Features

- Real-time chat messages
- User-to-user and room-based messaging
- Real-time notifications
- Connection status management
- Proper TypeScript typing

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start both the frontend and backend servers:
   ```
   npm run dev:all
   ```

   This will start:
   - Vite dev server for the frontend at `http://localhost:5173`
   - Express.js + Socket.IO server at `http://localhost:3001`

3. Visit `http://localhost:5173` in your browser to see the chat demo in action.

## Development

- Frontend code is in `src/`
- Backend (Socket.IO server) code is in `server/`
- Socket.IO client configuration is in `src/lib/socket.ts`
- React hook for Socket.IO is in `src/hooks/useSocket.ts`

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run server:dev` - Start the Socket.IO server in development mode
- `npm run dev:all` - Start both servers concurrently
- `npm run build` - Build the frontend
- `npm run server:build` - Build the backend
- `npm run server:start` - Start the production server

## Testing the Implementation

To verify the real-time functionality is working:

1. Start the development servers:
   ```
   npm run dev:all
   ```

2. Open two browser windows/tabs to `http://localhost:5173/chat-demo`

3. In the first window:
   - Connect to the Socket.IO server using the "Connect" button
   - Join a chat room using the dropdown
   - Type a message and send it

4. In the second window:
   - Connect to the Socket.IO server
   - Join the same chat room
   - You should see the message sent from the first window appear instantly
   - Try sending a message with @username to trigger a notification

5. Test reconnection:
   - Click "Disconnect" in one window
   - Send a message from the other window
   - Reconnect the first window
   - You should be able to see new messages after reconnecting

All communication happens in real-time without page refreshes, demonstrating the power of WebSockets with Socket.IO.

## Next Steps

Now that you have a working real-time system, here are some ideas for further development:

1. **Database Integration**: Connect your Socket.IO events to a persistent database (like your existing Supabase setup) to store messages and notifications.

2. **User Authentication**: Integrate the real-time functionality with your authentication system to identify users properly.

3. **Rich Message Content**: Add support for images, files, or formatted text in messages.

4. **Typing Indicators**: Implement "user is typing" indicators using the real-time capabilities.

5. **Message Status**: Add read receipts or message delivery status updates.

6. **Private Messaging**: Extend the room-based chat to support direct messages between users.

7. **Production Deployment**: When deploying to production, make sure your hosting environment supports WebSocket connections (services like Vercel, Netlify, and Heroku all support WebSockets).

## Summary

You now have a complete, working real-time chat system built with:

1. **Server Implementation**:
   - Express.js server with Socket.IO integration
   - Room-based chat management
   - Real-time notifications with mention detection
   - Type-safe event handling

2. **Client Implementation**:
   - Socket.IO client configuration
   - Custom React hook for Socket.IO
   - Demo chat component

3. **Project Structure**:
   - `/server` - Backend implementation
   - `/src/lib/socket.ts` - Socket client
   - `/src/hooks/useSocket.ts` - React hook
   - `/src/components/ChatDemo.tsx` - Demo component
   - `/src/pages/ChatDemoPage.tsx` - Demo page

All of these components work together to provide a complete real-time communication system with bidirectional messaging, live notifications, and proper error handling. The implementation is fully TypeScript-based with shared types between client and server to ensure type safety.

Start developing by running `npm run dev:all` and visiting `http://localhost:5173/chat-demo` to test the functionality.
