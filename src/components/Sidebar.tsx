import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  MessageCirclePlus,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { RouterState } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentConversationId?: Id<"conversations">;
  onConversationDelete?: (deletedConversationId: Id<"conversations">) => void;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onSignOut: () => void;
  routerState: RouterState;
  isVisible: boolean;
  hasBeenToggled?: boolean;
}

export function Sidebar({
  currentConversationId,
  onConversationDelete,
  onToggleSidebar,
  onOpenCommandPalette,
  onSignOut,
  routerState,
  isVisible,
  hasBeenToggled = false,
}: SidebarProps) {
  const { data: conversations } = useQuery(
    convexQuery(api.conversations.list, {}),
  );
  const updateTitle = useMutation(api.conversations.updateTitle);
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const [editingId, setEditingId] = useState<Id<"conversations"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<Id<"conversations"> | null>(null);

  const isIndexRoute = routerState.location.pathname === "/";

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
    <div
      className={cn(
        "flex h-screen w-64 flex-col overflow-hidden p-2 transition-all duration-300 ease-out",
        hasBeenToggled &&
          isVisible &&
          "animate-in slide-in-from-left duration-300 ease-out",
        hasBeenToggled &&
          !isVisible &&
          "animate-out slide-out-to-left pointer-events-none duration-300 ease-in",
        !hasBeenToggled && !isVisible && "pointer-events-none",
      )}
    >
      {/* Header with Branding */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="text-primary font-bold">askhole</span>
          </div>
        </div>
      </div>

      {/* Search and New Chat Actions */}
      <div
        className={cn(
          "flex-shrink-0 space-y-2 p-2 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <div className="flex gap-2">
          {/* Full width search command palette */}
          <Button
            onClick={onOpenCommandPalette}
            variant="outline"
            className="hover:bg-secondary hover:text-secondary-foreground h-9 flex-1 justify-start border-dashed text-left text-sm transition-all duration-200"
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

          {/* New Chat Button */}
          <Button
            asChild
            variant="outline"
            size="icon"
            title="New Chat (⌘N)"
            className="transition-all duration-200 hover:scale-105"
          >
            <Link to="/">
              <MessageCirclePlus className="text-primary h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea
        className={cn(
          "min-h-0 flex-1 p-2 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <div className="space-y-1">
          {conversations?.map((conversation) => {
            return (
              <div
                key={conversation._id}
                className={cn(
                  "relative rounded-lg",
                  currentConversationId === conversation._id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                  !isVisible && "pointer-events-none",
                )}
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
                  <Link
                    to="/chat/$chatid"
                    params={{ chatid: conversation._id }}
                    className="flex w-full items-center p-2"
                  >
                    <div
                      className={cn(
                        "min-w-0 flex-1 transition-all duration-200",
                        hoveredId === conversation._id
                          ? "max-w-[140px]"
                          : "max-w-[150px]",
                      )}
                    >
                      <div className="truncate text-sm font-medium">
                        {conversation.title}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "ml-auto flex gap-1 transition-opacity duration-200",
                        hoveredId === conversation._id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditStart(conversation);
                        }}
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                        title="Edit conversation name"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(conversation._id);
                        }}
                        className="h-6 w-6 p-0 text-red-400 transition-all duration-200 hover:scale-110 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Account Popover - Pinned to Bottom */}
      <div
        className={cn(
          "flex-shrink-0 border-t p-2 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-secondary hover:text-secondary-foreground h-auto w-full justify-start p-2 transition-all duration-200"
            >
              <Avatar className="mr-3 h-8 w-8">
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
                  <ThemeToggle />
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-3 text-sm transition-all duration-200"
                >
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </div>

              {/* Divider */}
              <div className="border-border border-t" />

              <Button
                onClick={onSignOut}
                variant="ghost"
                className="h-auto w-full justify-start px-3 py-3 text-sm text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
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
