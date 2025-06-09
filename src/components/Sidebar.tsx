import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  PanelLeftClose,
  MessageCirclePlus,
  Lollipop,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { RouterState } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DarkModeToggle } from "@/components/dark-mode-toggle";

interface SidebarProps {
  currentConversationId?: Id<"conversations">;
  onConversationSelect: (conversationId: Id<"conversations">) => void;
  onConversationDelete?: (deletedConversationId: Id<"conversations">) => void;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
  onOpenCommandPalette?: () => void;
  onSignOut: () => void;
  onGoToSettings: () => void;
  routerState: RouterState;
}

export function Sidebar({
  currentConversationId,
  onConversationSelect,
  onConversationDelete,
  onToggleSidebar,
  onNewChat,
  onOpenCommandPalette,
  onSignOut,
  onGoToSettings,
  routerState,
}: SidebarProps) {
  const conversations = useQuery(api.conversations.list);
  const updateTitle = useMutation(api.conversations.updateTitle);
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const [editingId, setEditingId] = useState<Id<"conversations"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<Id<"conversations"> | null>(null);

  const isIndexRoute = routerState.location.pathname === '/';

  const handleEditStart = (conversation: any) => {
    setEditingId(conversation._id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = async () => {
    if (editingId && editTitle.trim()) {
      await updateTitle({ conversationId: editingId, title: editTitle.trim() });
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = async (conversationId: Id<"conversations">) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      // Notify parent component about the deletion first
      onConversationDelete?.(conversationId);

      await deleteConversation({ conversationId });
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col p-2">
      {/* Header with Branding */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="font-bold text-primary">askhole</span>
          </div>
        </div>
      </div>

      {/* Search and New Chat Actions */}
      <div className="flex-shrink-0 space-y-2 p-2">
        <div className="flex gap-2">
          {/* Full width search command palette */}
          <Button
            onClick={onOpenCommandPalette}
            variant="outline"
            className="h-9 flex-1 justify-start border-dashed text-left text-sm hover:bg-secondary hover:text-secondary-foreground"
            title="Command Palette (⌘K)"
          >
            <Search className="mr-3 h-4 w-4" />
            <span>Search</span>
            <div className="ml-auto flex items-center">
              <kbd className="bg-muted text-muted-foreground inline-flex h-4 items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-medium opacity-100 select-none">
                <span className="text-xs">
                  {typeof navigator !== "undefined" &&
                  navigator.platform.includes("Mac")
                    ? "⌘"
                    : "Ctrl"}
                </span>
                K
              </kbd>
            </div>
          </Button>

          {/* New Chat Button - Peach themed */}
          <Button
            onClick={onNewChat}
            variant="outline"
            size="icon"
            title="New Chat (⌘N)"
          >
            <MessageCirclePlus className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="min-h-0 flex-1 p-2">
        <div className="space-y-1">
          {conversations?.map((conversation) => {
            return (
              <div
                key={conversation._id}
                className={`relative rounded-lg transition-all duration-200 ${
                  currentConversationId === conversation._id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onMouseEnter={() => setHoveredId(conversation._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {editingId === conversation._id ? (
                  <div className="flex items-center gap-1 p-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave();
                        if (e.key === "Escape") handleEditCancel();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditSave}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditCancel}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer items-center p-2"
                    onClick={() => onConversationSelect(conversation._id)}
                  >
                    <div className={`min-w-0 flex-1 transition-all duration-200 ${
                      hoveredId === conversation._id 
                        ? "max-w-[140px]" 
                        : "max-w-[150px]"
                    }`}>
                      <div className="truncate text-sm font-medium">
                        {conversation.title}
                      </div>
                    </div>
                    <div
                      className={`ml-auto flex gap-1 transition-opacity duration-200 ${
                        hoveredId === conversation._id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(conversation);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        title="Edit conversation name"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conversation._id);
                        }}
                        className="h-6 w-6 p-0 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Account Popover - Pinned to Bottom */}
      <div className="flex-shrink-0 border-t p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-secondary hover:text-secondary-foreground"
            >
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">@zwgnr</p>
                <p className="text-muted-foreground truncate text-xs">
                  user@example.com
                </p>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start" side="right">
            <div className="space-y-2">
              {/* Header with avatar and user info inline */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">@zwgnr</p>
                  <p className="text-muted-foreground truncate text-xs">
                    user@example.com
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-border border-t" />

              {/* Menu items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-3">
                  <span className="text-sm font-medium">Theme</span>
                  <DarkModeToggle className="h-8 w-8" />
                </div>

                <Button
                  onClick={onGoToSettings}
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-3 text-sm"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>

              {/* Divider */}
              <div className="border-border border-t" />

              <Button
                onClick={onSignOut}
                variant="ghost"
                className="h-auto w-full justify-start px-3 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
