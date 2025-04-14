import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useChat } from "@/contexts/ChatContext";
import { useState } from "react";

export function UserList() {
  const { users, currentUser, currentChat,  } = useChat();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleRemoveUser = async () => {
    
  }
  const handleInviteUser = async () => {
    if (!inviteUsername.trim() || !currentChat || !currentUser) return;

    setIsInviting(true);
    try {
      // --- Placeholder for Supabase Function Call ---
      // In a real app, you would call a Supabase Edge Function here
      // to handle the logic securely (finding user ID, checking permissions, etc.)
      // For now, we'll simulate the check and direct DB interaction (less secure)

      // 1. Find the invited user's ID
      const { data: invitedProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", inviteUsername.trim())
        .single();

      if (profileError || !invitedProfile) {
        throw new Error(`User "${inviteUsername.trim()}" not found.`);
      }

      const invitedUserId = invitedProfile.id;

      // 2. Check if user is already in the chat
      const isAlreadyParticipant = users.some(
        (user) => user.id === invitedUserId
      );
      if (isAlreadyParticipant) {
        throw new Error(
          `User "${inviteUsername.trim()}" is already in this chat.`
        );
      }

      // 3. Check for existing pending invitation
      const { data: existingInvitation, error: existingInviteError } =
        await supabase
          .from("chat_invitations")
          .select("id")
          .eq("chat_id", currentChat.id)
          .eq("invited_user_id", invitedUserId)
          .eq("status", "pending")
          .maybeSingle(); // Use maybeSingle to not error if no invite exists

      if (existingInviteError) throw existingInviteError;
      if (existingInvitation) {
        throw new Error(
          `An invitation is already pending for "${inviteUsername.trim()}".`
        );
      }

      // 4. Create invitation (Direct DB call - consider moving to function)
      const { error: insertError } = await supabase
        .from("chat_invitations")
        .insert({
          chat_id: currentChat.id,
          inviting_user_id: currentUser.id,
          invited_user_id: invitedUserId,
          status: "pending",
        });

      if (insertError) throw insertError;

      // --- End Placeholder ---

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteUsername.trim()}.`,
      });
      setInviteUsername("");
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error Sending Invitation",
        description: error.message || "Could not send invitation.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Users in Chat</h2>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="AI" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                AI
                <span className="ml-1 text-xs text-muted-foreground">
                  (AI Assistant)
                </span>
              </p>
            </div>
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.username}
                  {user.id === currentUser?.id && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={!currentChat}
            >
              <UserPlus size={16} />
              <span>Invite User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite User to Chat</DialogTitle>
              <DialogDescription>
                Enter the username of the user you want to invite.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter username..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleInviteUser}
                disabled={isInviting || !inviteUsername.trim()}
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
