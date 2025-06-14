import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCirclePlus } from "lucide-react";
import { Doc, Id } from "../../../convex/_generated/dataModel.js";
import { RouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { AccountPopover as AccountPopoverInner } from "./AccountPopover.js";
import { SidebarHeader as SidebarHeaderInner } from "./SidebarHeader.js";
import { SidebarActions as SidebarActionsInner } from "./SidebarActions.js";
import { ConversationListItem } from "./ConversationListItem.js";
import { modelId } from "../../../convex/schema";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

type CurrentUser = {
  totalMessages: number;
  image?: string;
  twoFactorEnabled?: boolean;
  name: string;
  email: string;
  emailVerified: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  _id?: Id<"users">;
  _creationTime?: number;
  modelUsage?: {
    model: string;
    count: number;
  }[];
} | null;

interface SidebarProps {
  currentConversationId?: Id<"conversations">;
  currentUser: CurrentUser;
  onConversationDelete?: (deletedConversationId: Id<"conversations">) => void;
  onOpenChange?: (open: boolean) => void;
  onOpenCommandPalette?: () => void;
  onSignOut: () => void;
  isVisible: boolean;
  hasBeenToggled?: boolean;
}

const SidebarHeader   = React.memo(SidebarHeaderInner);
const SidebarActions = React.memo(SidebarActionsInner);
const AccountPopover = React.memo(AccountPopoverInner);

export function Sidebar({
  currentConversationId,
  currentUser,
  onConversationDelete,
  onOpenCommandPalette,
  onSignOut,
  isVisible,
  hasBeenToggled = false,
}: SidebarProps) {
  const deleteConversation = useMutation(api.conversations.deleteConversation);
  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.get, {}),
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Id<"conversations"> | null>(null);

    const handleDeleteClick = useCallback((id: Id<"conversations">) => {
      setConversationToDelete(id);
      setDeleteDialogOpen(true);
    }, []);


  const handleDeleteConfirm = useCallback(async () => {
    if (conversationToDelete) {
      onConversationDelete?.(conversationToDelete);
      await deleteConversation({ conversationId: conversationToDelete });
      setConversationToDelete(null);
    }
  }, [conversationToDelete, onConversationDelete, deleteConversation]);

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
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <SidebarHeader />
        <SidebarActions onOpenCommandPalette={onOpenCommandPalette} />
      </div>

      <ScrollArea
        className={cn(
          "min-h-0 flex-1 p-2 transition-all duration-300 [&>div>div]:!block",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <div className="space-y-1">
          {!conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="text-muted-foreground mb-4">
                <MessageCirclePlus className="mx-auto mb-2 h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                No conversations yet
              </h3>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                isActive={conversation._id === currentConversationId}
                isVisible={isVisible}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div
        className={cn(
          "flex-shrink-0 border-t p-2 transition-all duration-300",
          !isVisible && "pointer-events-none opacity-0",
        )}
      >
        <AccountPopover currentUser={currentUser} onSignOut={onSignOut} />
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
