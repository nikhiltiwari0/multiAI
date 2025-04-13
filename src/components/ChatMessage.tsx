
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User, mockUsers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: Message;
  users: User[];
}

export function ChatMessage({ message, users }: ChatMessageProps) {
  // Find the user who sent the message (for user messages)
  const sender = message.userId 
    ? users.find(user => user.id === message.userId) || mockUsers[0]
    : null;
  
  const isAI = message.type === 'ai';
  
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
    )}>
      {/* Avatar for the message sender */}
      <Avatar className="h-8 w-8 ring-2 ring-background">
        <AvatarImage 
          src={isAI ? "/placeholder.svg" : sender?.avatar} 
          alt={isAI ? "AI" : sender?.name}
        />
        <AvatarFallback className={cn(
          "text-primary-foreground font-medium text-sm",
          isAI ? "bg-accent" : "bg-primary"
        )}>
          {isAI ? "AI" : sender?.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      {/* Message content */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm",
            isAI && "text-accent"
          )}>
            {isAI ? "AI Assistant" : sender?.name}
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
