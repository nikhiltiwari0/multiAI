import { ChevronLeft, ChevronRight, Menu, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ChatInput";
import { ChatList } from "@/components/ChatList";
import { ChatMessage } from "@/components/ChatMessage";
import { NotificationsPopover } from "./NotificationsPopover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDialog } from "@/components/SettingsDialog";
import { UserList } from "@/components/UserList";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useState } from "react";

export function ChatLayout() {
  const { currentChat, showUsersSidebar, toggleUsersSidebar } = useChat();
  const { currentUser } = useAuth();
  const [showChatSidebar, setShowChatSidebar] = useState(true);

  const toggleChatSidebar = () => {
    setShowChatSidebar(!showChatSidebar);
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleChatSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate flex-1">
              {currentChat ? currentChat.title : "Select a chat"}
            </h1>
            <div className="flex items-center space-x-2">
              <NotificationsPopover />
              <SettingsDialog />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleUsersSidebar}
              className="md:hidden"
            >
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
                    {/* <h1 className="text-3xl font-semibold mb-2">
                    Hello {currentUser ? currentUser.username : 'Guest'}
                    </h1> */}
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
            : "w-0 translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        {showUsersSidebar && (
          <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-sm">
            <UserList />
          </div>
        )}
      </div>

      {/* Sidebar Toggle Buttons (visible on larger screens) */}
      <div className="hidden md:block">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-80 top-1/2 -translate-y-1/2 rounded-full shadow-md"
          onClick={toggleChatSidebar}
          style={{ left: showChatSidebar ? "20rem" : "0" }}
        >
          {showChatSidebar ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-64 top-1/2 -translate-y-1/2 rounded-full shadow-md"
          onClick={toggleUsersSidebar}
          style={{ right: showUsersSidebar ? "16rem" : "0" }}
        >
          {showUsersSidebar ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}
