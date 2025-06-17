import React, { useCallback, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";

import { MessageCirclePlus } from "lucide-react";

import { cn } from "@/lib/utils";

import { DeleteConfirmationDialog } from "@/components/sidebar/DeleteConfirmationDialog";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ConversationListItem } from "./ConversationListItem";
import { SidebarActions as SidebarActionsInner } from "./SidebarActions";
import { SidebarFooter as SidebarFooterInner } from "./SidebarFooter";
import { SidebarHeader as SidebarHeaderInner } from "./SidebarHeader";

interface SidebarProps {
	currentConversationId?: Id<"conversations">;
	onConversationDelete?: (deletedConversationId: Id<"conversations">) => void;
	onOpenChange?: (open: boolean) => void;
	onOpenCommandPalette?: () => void;
	onSignOut: () => void;
	isVisible: boolean;
	hasBeenToggled?: boolean;
}

const SidebarHeader = React.memo(SidebarHeaderInner);
const SidebarActions = React.memo(SidebarActionsInner);
const SidebarFooter = React.memo(SidebarFooterInner);

export function Sidebar({
	currentConversationId,
	onConversationDelete,
	onOpenCommandPalette,
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
				"flex h-screen w-64 flex-col overflow-hidden border-border border-r pb-1",
				!isVisible && "pointer-events-none",
			)}
		>
			<div className="flex-shrink-0 px-2 pb-2">
				<SidebarHeader />
				<SidebarActions onOpenCommandPalette={onOpenCommandPalette} />
			</div>

			<div className="relative min-h-0 flex-1">
				<div className="sidebar-scroll h-full overflow-y-auto px-4 py-4">
					{!conversations || conversations.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<div className="mb-4 text-muted-foreground">
								<MessageCirclePlus className="mx-auto mb-2 h-12 w-12 opacity-50" />
							</div>
							<h3 className="mb-2 font-medium text-foreground text-sm">
								No conversations yet
							</h3>
						</div>
					) : (
						<div className="space-y-6">
							{/* Pinned Conversations Section */}
							{conversations.some(conv => conv.isPinned) && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 px-2">
										<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
											Pinned
										</h3>
									</div>
									<div className="space-y-1">
										{conversations
											.filter(conversation => conversation.isPinned)
											.map((conversation) => (
												<ConversationListItem
													key={conversation._id}
													conversation={conversation}
													isActive={conversation._id === currentConversationId}
													isVisible={isVisible}
													onDelete={handleDeleteClick}
												/>
											))
										}
									</div>
								</div>
							)}

							{/* Regular Conversations Section */}
							{conversations.some(conv => !conv.isPinned) && (
								<div className="space-y-3">
									{conversations.some(conv => conv.isPinned) && (
										<div className="flex items-center gap-2 px-2">
											<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
												Recent
											</h3>
										</div>
									)}
									<div className="space-y-1">
										{conversations
											.filter(conversation => !conversation.isPinned)
											.map((conversation) => (
												<ConversationListItem
													key={conversation._id}
													conversation={conversation}
													isActive={conversation._id === currentConversationId}
													isVisible={isVisible}
													onDelete={handleDeleteClick}
												/>
											))
										}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
				<div className="pointer-events-none absolute bottom-0 left-0 h-10 w-full bg-gradient-to-t from-background to-transparent" />
			</div>

			<SidebarFooter />
			<DeleteConfirmationDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
