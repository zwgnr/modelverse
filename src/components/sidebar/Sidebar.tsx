import React, { useCallback, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";

import { MessageCirclePlus } from "lucide-react";

import { cn } from "@/lib/utils";

import { DeleteConfirmationDialog } from "@/components/sidebar/DeleteConfirmationDialog";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AccountPopover as AccountPopoverInner } from "./AccountPopover";
import { ConversationListItem } from "./ConversationListItem";
import { SidebarActions as SidebarActionsInner } from "./SidebarActions";
import { SidebarHeader as SidebarHeaderInner } from "./SidebarHeader";

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

const SidebarHeader = React.memo(SidebarHeaderInner);
const SidebarActions = React.memo(SidebarActionsInner);
const AccountPopover = React.memo(AccountPopoverInner);

export function Sidebar({
	currentConversationId,
	currentUser,
	onConversationDelete,
	onOpenCommandPalette,
	onSignOut,
	isVisible,
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
				"flex h-screen w-64 flex-col overflow-hidden border-r p-3 pt-3",
				!isVisible && "pointer-events-none",
			)}
		>
			<div className="flex-shrink-0">
				<SidebarHeader />
				<SidebarActions onOpenCommandPalette={onOpenCommandPalette} />
			</div>

			<div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-2">
				<div className="space-y-1">
					{!conversations || conversations.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
							<div className="mb-4 text-muted-foreground">
								<MessageCirclePlus className="mx-auto mb-2 h-12 w-12 opacity-50" />
							</div>
							<h3 className="mb-2 font-medium text-foreground text-sm">
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
			</div>

			<div className="-mx-2 flex-shrink-0 border-border border-t p-1 pt-3">
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
