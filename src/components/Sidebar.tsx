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
  MoreVertical,
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
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface SidebarProps {
  currentConversationId?: Id<"conversations">;
  onConversationDelete?: (deletedConversationId: Id<"conversations">) => void;
  onOpenCommandPalette?: () => void;
  onSignOut: () => void;
  routerState: RouterState;
  isVisible: boolean;
  hasBeenToggled?: boolean;
}

export function Sidebar({
  currentConversationId,
  onConversationDelete,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Id<"conversations"> | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [actionsPopoverOpen, setActionsPopoverOpen] = useState(false);
  const [actionsPopoverConversationId, setActionsPopoverConversationId] =
    useState<Id<"conversations"> | null>(null);

  const closeActionsPopover = () => {
    setActionsPopoverOpen(false);
    setActionsPopoverConversationId(null);
  };

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

  const handleDeleteClick = (conversationId: Id<"conversations">) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (conversationToDelete) {
      // Notify parent component about the deletion first
      onConversationDelete?.(conversationToDelete);

      await deleteConversation({ conversationId: conversationToDelete });
      setConversationToDelete(null);
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
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">💬</span>
            <div className="text-foreground text-xl font-bold">
              <span className="text-primary">ask</span>hole
            </div>
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
          "min-h-0 flex-1 p-2 transition-all duration-300 [&>div>div]:!block",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <div className="space-y-1">
          {conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="text-muted-foreground mb-4">
                <MessageCirclePlus className="mx-auto mb-2 h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                No conversations yet
              </h3>
            </div>
          ) : (
            conversations?.map((conversation) => {
              return (
                <div
                  key={conversation._id}
                  className={cn(
                    "relative min-w-0 overflow-hidden rounded-lg",
                    currentConversationId === conversation._id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    !isVisible && "pointer-events-none",
                  )}
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
                    <div className="group relative flex items-center justify-between p-1">
                      <Link
                        to="/chat/$chatid"
                        params={{ chatid: conversation._id }}
                        className="block w-full min-w-0 p-2 pr-8"
                      >
                        <div className="truncate text-sm font-medium">
                          {conversation.title}
                        </div>
                      </Link>

                      <Popover
                        key={`popover-${conversation._id}`}
                        open={
                          actionsPopoverOpen &&
                          actionsPopoverConversationId === conversation._id
                        }
                        onOpenChange={(open) => {
                          if (open) {
                            setActionsPopoverOpen(open);
                          } else {
                            closeActionsPopover();
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActionsPopoverConversationId(conversation._id);
                              setActionsPopoverOpen(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-1/2 right-1 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center p-0 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:scale-110 data-[state=open]:opacity-100",
                            )}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-40 p-1"
                          align="center"
                          side="right"
                          sideOffset={4}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditStart(conversation);
                                closeActionsPopover();
                              }}
                              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-full justify-start text-sm transition-all duration-200"
                            >
                              <Edit2 className="mr-2 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(conversation._id);
                                closeActionsPopover();
                              }}
                              className="h-8 w-full justify-start text-sm text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Account Popover - Pinned to Bottom */}
      <div
        className={cn(
          "flex-shrink-0 border-t p-2 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
          <PopoverContent
            className="w-64"
            align="start"
            side="top"
            sideOffset={8}
          >
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
                  onClick={() => setPopoverOpen(false)}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
