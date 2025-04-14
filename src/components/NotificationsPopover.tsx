import { Bell, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useQueryClient } from "@tanstack/react-query";

type Invitation = Database["public"]["Tables"]["chat_invitations"]["Row"] & {
  chats: Pick<Database["public"]["Tables"]["chats"]["Row"], "title"> | null;
  inviting_profile: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "username"
  > | null;
};

export function NotificationsPopover() {
  const { user } = useAuth();
  const { acceptInvitation } = useChat();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({}); // Track processing state per invitation
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      fetchPendingInvitations();
    }
  }, [user]);

  const fetchPendingInvitations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_invitations")
        .select(
          `
          *,
          chats ( title ),
          inviting_profile: profiles!chat_invitations_inviting_user_id_fkey ( username )
        `
        )
        .eq("invited_user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      setInvitations(data as Invitation[]);
    } catch (error: unknown) {
      console.error("Error fetching invitations:", (error as Error).message);
      toast({
        title: "Error Fetching Invitations",
        description:
          (error as Error).message || "Could not load pending invitations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the handleInvitationAction function
  const handleInvitationAction = async (
    invitationId: string,
    action: "accepted" | "declined"
  ) => {
    if (!user) return;

    setIsProcessing((prev) => ({ ...prev, [invitationId]: true }));

    try {
      if (action === "accepted") {
        // Use the acceptInvitation function from ChatContext
        await acceptInvitation(invitationId);
      } else {
        // Handle declining the invitation
        const { error } = await supabase
          .from("chat_invitations")
          .update({ 
            status: "declined", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", invitationId)
          .eq("invited_user_id", user.id);

        if (error) throw error;

        toast({
          title: "Invitation Declined",
          description: "You have declined the invitation.",
        });
      }

      // Remove the processed invitation from the local state
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error: unknown) {
      console.error(`Error ${action === "accepted" ? "accepting" : "declining"} invitation:`, (error as Error).message);
      toast({
        title: `Error ${action === "accepted" ? "Accepting" : "Declining"} Invitation`,
        description: (error as Error).message || `Could not ${action} the invitation.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing((prev) => ({ ...prev, [invitationId]: false }));
    }
  };
  const hasPendingInvitations = invitations.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasPendingInvitations && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4">
          <h4 className="text-sm font-medium leading-none">Notifications</h4>
          <p className="text-sm text-muted-foreground">
            You have {invitations.length} pending invitations.
          </p>
        </div>
        <Separator />
        {isLoading ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            Loading...
          </div>
        ) : hasPendingInvitations ? (
          <div className="max-h-60 overflow-y-auto">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 hover:bg-muted/50">
                <p className="text-sm mb-2">
                  <span className="font-semibold">
                    {invitation.inviting_profile?.username || "Someone"}
                  </span>{" "}
                  invited you to join the chat{" "}
                  <span className="font-semibold">
                    "{invitation.chats?.title || "Unnamed Chat"}"
                  </span>
                  .
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleInvitationAction(invitation.id, "declined")
                    }
                    disabled={isProcessing[invitation.id]}
                    className="px-2 py-1 h-auto"
                  >
                    <X className="h-4 w-4 mr-1" /> Decline
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      handleInvitationAction(invitation.id, "accepted")
                    }
                    disabled={isProcessing[invitation.id]}
                    className="px-2 py-1 h-auto"
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No new invitations.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
