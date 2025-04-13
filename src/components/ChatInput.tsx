
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState, FormEvent, KeyboardEvent } from "react";
import { useChat } from "@/contexts/ChatContext";
import { toast } from "@/components/ui/use-toast";

export function ChatInput() {
  const [message, setMessage] = useState("");
  const { sendChatMessage, isSendingMessage, currentChat, users, currentUser } = useChat();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSendingMessage || !currentChat || !currentUser) return;
    
    await sendChatMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Tag the AI with @AI or users with @username)"
            className="min-h-24 resize-none"
            disabled={isSendingMessage || !currentChat || !currentUser}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="mb-1 h-10 w-10 shrink-0"
            disabled={!message.trim() || isSendingMessage || !currentChat || !currentUser}
          >
            <Send size={18} />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
          <span>Press Enter to send, Shift+Enter for a new line</span>
          <span>•</span>
          <span>
            Tag the AI with <code className="bg-muted px-1 rounded">@AI</code> or users with <code className="bg-muted px-1 rounded">@username</code>
          </span>
        </div>
      </div>
    </form>
  );
}
