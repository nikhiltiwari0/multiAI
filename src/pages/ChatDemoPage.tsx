import { ChatDemo } from "@/components/ChatDemo";

export default function ChatDemoPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Real-time Chat Demo</h1>
      <p className="text-center text-gray-600 mb-8">
        This demo shows real-time chat and notifications using Socket.IO.
        Open multiple browser windows to see the real-time functionality in action.
      </p>
      
      <ChatDemo />
      
      <div className="mt-10 text-center text-sm text-gray-500">
        <p>
          Try these features:
        </p>
        <ul className="list-disc list-inside mt-2 max-w-md mx-auto text-left">
          <li>Send messages between different browser windows</li>
          <li>Use @username to trigger notifications</li>
          <li>Try disconnecting and reconnecting</li>
          <li>Switch between different chat rooms</li>
        </ul>
      </div>
    </div>
  );
}

