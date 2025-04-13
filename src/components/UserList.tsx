
import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function UserList() {
  const { users, currentUser } = useChat();

  const handleInviteUser = () => {
    toast({
      title: "Invite User",
      description: "This would open a user invitation dialog in a real app.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Users in Chat</h2>
      </div>
      
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-2">
          {users.map((user) => (
            <div 
              key={user.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name}
                  {user.id === currentUser.id && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleInviteUser}
        >
          <UserPlus size={16} />
          <span>Invite User</span>
        </Button>
      </div>
    </div>
  );
}
