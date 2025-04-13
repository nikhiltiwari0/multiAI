
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/contexts/ChatContext";

interface Message {
  id: string;
  content: string;
  sender_id?: string | null;
  timestamp: string;
  is_ai: boolean;
  type?: 'user' | 'ai';
  userId?: string;
  mentioned_users?: string[];
}

interface User {
  id: string;
  username: string;
  avatar?: string;
}

interface ChatMessageProps {
  message: Message;
  users: User[];
}

export function ChatMessage({ message, users }: ChatMessageProps) {
  const { currentUser } = useChat();
  
  // Find the sender (for user messages)
  const sender = message.sender_id 
    ? users.find(user => user.id === message.sender_id) 
    : null;
  
  const isAI = message.is_ai;
  const isCurrentUser = currentUser && sender && currentUser.id === sender.id;
  
  // Format the message timestamp
  const formattedTime = formatRelativeTime(message.timestamp);
  
  // Formatting the message content to highlight @mentions
  const formatMessageContent = (content: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regular expression to find @mentions
    const mentionRegex = /@(AI|[A-Za-z0-9_]+)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      // Add the text before the mention
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
      }
      
      // Add the mention with highlighting
      parts.push(
        <span 
          key={`mention-${match.index}`} 
          className="bg-accent/20 text-accent-foreground px-1 rounded font-medium"
        >
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? parts : content;
  };
  
  return (
    <div className={cn(
      "flex gap-3 p-4 transition-colors animate-fade-in",
      isAI ? "bg-muted/10 border-l-2 border-accent/50" : "bg-transparent hover:bg-muted/5",
      isCurrentUser ? "bg-accent/5" : "", // Highlight own messages
    )}>
      {/* Avatar for the message sender */}
      <Avatar className="h-8 w-8 ring-2 ring-background">
        <AvatarImage 
          src={isAI ? "/placeholder.svg" : sender?.avatar} 
          alt={isAI ? "AI" : sender?.username}
        />
        <AvatarFallback className={cn(
          "text-primary-foreground font-medium text-sm",
          isAI ? "bg-accent" : "bg-primary"
        )}>
          {isAI ? "AI" : sender?.username.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      {/* Message content */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm",
            isAI && "text-accent"
          )}>
            {isAI ? "AI Assistant" : sender?.username}
            {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
          </span>
          <span className="text-xs text-muted-foreground">
            {formattedTime}
          </span>
        </div>
        <div className="text-sm leading-relaxed">
          {message.content.split('\n').map((line, index) => (
            <p key={index} className={index > 0 ? "mt-2" : ""}>
              {formatMessageContent(line)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to format timestamps in a more readable way
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return the original string if it's not a valid date
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}
