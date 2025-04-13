
import { cn } from "@/lib/utils";
import { Chat } from "@/lib/mock-data";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";

export function ChatList() {
  const { chats, currentChat, setCurrentChat, createNewChat } = useChat();

  const handleNewChat = () => {
    createNewChat("New Chat");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <Button 
          variant="secondary" 
          className="w-full justify-start gap-2" 
          onClick={handleNewChat}
        >
          <PlusCircle size={16} />
          <span>New Chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={cn(
                "w-full flex items-start p-3 text-sm rounded-md text-left transition-colors hover:bg-accent/50",
                currentChat?.id === chat.id 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <div className="flex-1 truncate">
                <div className="font-medium truncate">{chat.title}</div>
                <div className="text-xs truncate opacity-60">
                  {chat.messages.length > 0 
                    ? `${chat.messages.length} messages` 
                    : "No messages yet"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
