import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Menu, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ChatInput";
import { ChatList } from "@/components/ChatList";
import { ChatMessage } from "@/components/ChatMessage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotificationsPopover } from "./NotificationsPopover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDialog } from "@/components/SettingsDialog";
import { UserList } from "@/components/UserList";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

export function ChatLayout() {
  const { currentChat, users } = useChat();
  const { currentUser } = useAuth();
  const [showUsersSidebar, setShowUsersSidebar] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Effect to set sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowChatSidebar(true); // Show chat sidebar on larger screens
        setShowUsersSidebar(true); // Show user sidebar on larger screens
      } else {
        setShowChatSidebar(false); // Hide chat sidebar on mobile
        setShowUsersSidebar(false); // Hide user sidebar on mobile
      }
    };

    handleResize(); // Call on initial load
    window.addEventListener("resize", handleResize); // Add resize event listener

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup listener on unmount
    };
  }, []);

  const toggleChatSidebar = () => {
    setShowChatSidebar((prev) => !prev);
  };

  const toggleUsersSidebar = () => {
    setShowUsersSidebar((prev) => !prev);
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim() || !currentChat || !currentUser) return;

    setIsInviting(true);
    try {
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
          .maybeSingle();

      if (existingInviteError) throw existingInviteError;
      if (existingInvitation) {
        throw new Error(
          `An invitation is already pending for "${inviteUsername.trim()}".`
        );
      }

      // 4. Create invitation
      const { error: insertError } = await supabase
        .from("chat_invitations")
        .insert({
          chat_id: currentChat.id,
          inviting_user_id: currentUser.id,
          invited_user_id: invitedUserId,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteUsername.trim()}.`,
      });
      setInviteUsername("");
      setIsInviteDialogOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Error Sending Invitation",
        description: (error as Error).message || "Could not send invitation.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Chat List */}
      <div
        className={cn(
          "border-r transition-all duration-300 ease-in-out",
          showChatSidebar
            ? "w-80 translate-x-0"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        {/* Only render content when sidebar is visible */}
        {showChatSidebar && (
          <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="font-semibold">Shared AI</h1>
              <Button variant="ghost" size="icon" onClick={toggleChatSidebar}>
                ✕
              </Button>
            </div>
            <ChatList />
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleChatSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate flex-1">
              {currentChat ? currentChat.title : "Select a chat"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <SettingsDialog />

            <Dialog
              open={isInviteDialogOpen}
              onOpenChange={setIsInviteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!currentChat}
                  title="Invite User"
                >
                  <UserPlus className="h-5 w-5" />
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

            <Button variant="ghost" size="icon" onClick={toggleUsersSidebar}>
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          {currentChat ? (
            <div className="pb-20">
              {currentChat.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  users={currentChat.users}
                />
              ))}
              {currentChat.messages.length === 0 && (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <div className="max-w-md">
                    <h3 className="text-xl font-semibold mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Begin chatting with the AI and other participants in this
                      shared space. Tag the AI with{" "}
                      <span className="font-mono">@AI</span> or users with{" "}
                      <span className="font-mono">@username</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <h3 className="text-xl font-semibold mb-2">
                  Select a chat or create a new one
                </h3>
                <p className="text-muted-foreground">
                  Choose an existing conversation from the sidebar or start a
                  fresh discussion
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <ChatInput />
      </div>

      {/* Right Sidebar - User List */}
      <div
        className={cn(
          "border-l transition-all duration-300 ease-in-out",
          showUsersSidebar
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        {showUsersSidebar && (
          <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Users</h2>
              <Button variant="ghost" size="icon" onClick={toggleUsersSidebar}>
                ✕
              </Button>
            </div>
            <UserList />
          </div>
        )}
      </div>
    </div>
  );
}
