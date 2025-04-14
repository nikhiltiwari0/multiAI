import { Pencil, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { useState } from "react";

export function ChatList() {
  const {
    chats,
    currentChat,
    setCurrentChat,
    createNewChat,
    renameChat,
    deleteChat,
    isLoading,
  } = useChat();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  const handleNewChat = () => {
    setEditingChatId(null);
    setEditingTitle("");
    createNewChat("New Chat");
  };

  const handleStartRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleSaveRename = async () => {
    if (editingChatId && editingTitle.trim()) {
      if (
        editingTitle.trim() !== chats.find((c) => c.id === editingChatId)?.title
      ) {
        try {
          await renameChat(editingTitle.trim(), editingChatId);
        } catch (error) {
          console.error("Failed to rename chat:", error);
        }
      }
      handleCancelRename();
    } else {
      handleCancelRename();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveRename();
    } else if (event.key === "Escape") {
      handleCancelRename();
    }
  };

  const handleDeleteChat = (chatId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (confirmDelete) {
      deleteChat(chatId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
          disabled={!!editingChatId}
        >
          <PlusCircle size={16} />
          <span>New Chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group w-full flex items-center justify-between p-3 text-sm rounded-md text-left transition-colors hover:bg-accent/50 relative",
                currentChat?.id === chat.id && !editingChatId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              onClick={(e) => {
                if (editingChatId !== chat.id) {
                  setCurrentChat(chat);
                }
              }}
            >
              {editingChatId === chat.id ? (
                <Input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveRename}
                  autoFocus
                  className="h-7 flex-grow mr-2 text-sm bg-transparent focus:ring-0 focus:outline-none border border-primary rounded px-1 text-foreground"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex-1 flex flex-col truncate mr-2 cursor-pointer">
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs truncate opacity-60">
                    {chat.messages.length > 0
                      ? `${chat.messages.length} messages`
                      : "No messages yet"}
                  </div>
                </div>
              )}

              {editingChatId !== chat.id && (
                <div className="flex items-center space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(chat.id, chat.title);
                    }}
                    aria-label={`Rename chat ${chat.title}`}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    aria-label={`Delete chat ${chat.title}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
