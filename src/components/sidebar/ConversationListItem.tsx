import { memo, useState } from "react";

import { Link } from "@tanstack/react-router";

import { useMutation } from "convex/react";

import {
	Check,
	Edit2,
	MoreVertical,
	Pin,
	PinOff,
	Split,
	Trash2,
	X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

import { api } from "../../../convex/_generated/api.js";
import type { Doc, Id } from "../../../convex/_generated/dataModel.js";

interface ConversationListItemProps {
	conversation: Doc<"conversations">;
	isActive: boolean;
	isVisible: boolean;
	onDelete: (conversationId: Id<"conversations">) => void;
}

export function ConversationRow({
	conversation,
	isActive,
	isVisible,
	onDelete,
}: ConversationListItemProps) {
	const updateTitle = useMutation(api.conversations.updateTitle);
	const togglePin = useMutation(api.conversations.togglePin);

	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(conversation.title);
	const [actionsPopoverOpen, setActionsPopoverOpen] = useState(false);

	const handleEditStart = () => {
		setIsEditing(true);
		setEditTitle(conversation.title);
		setActionsPopoverOpen(false);
	};

	const handleEditSave = async () => {
		if (editTitle.trim()) {
			await updateTitle({
				conversationId: conversation._id,
				title: editTitle.trim(),
			});
			setIsEditing(false);
		}
	};

	const handleEditCancel = () => {
		setIsEditing(false);
		setEditTitle(conversation.title);
	};

	const handleDelete = () => {
		onDelete(conversation._id);
		setActionsPopoverOpen(false);
	};

	const handleTogglePin = () => {
		togglePin({ conversationId: conversation._id });
		setActionsPopoverOpen(false);
	};

	return (
		<div
			className={cn(
				"relative min-w-0 overflow-hidden rounded-lg border border-transparent text-secondary-foreground before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-transparent before:via-transparent before:to-transparent hover:border-black/5 hover:bg-black/[0.03] hover:backdrop-blur-md hover:before:from-black/2 dark:hover:border-white/5 dark:hover:bg-white/[0.02] dark:hover:shadow-black/20 dark:hover:before:from-white/2",
				isActive
					? "border-black/5 bg-black/[0.03] backdrop-blur-md before:from-black/2 dark:border-white/5 dark:bg-white/[0.02] dark:shadow-black/20 dark:before:from-white/2"
					: "",
				!isVisible && "pointer-events-none",
			)}
		>
			{isEditing ? (
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
				<div className="group relative flex items-center justify-between ">
					<Link
						to="/chat/$chatid"
						params={{ chatid: conversation._id }}
						className="block w-full min-w-0 p-2 pr-8"
					>
						<div className="flex items-center gap-1 truncate text-sm">
							{conversation.branchParent && (
								<Split className="h-4 w-4 flex-shrink-0 text-amber-400 dark:text-amber-200" />
							)}
							<span className="truncate">{conversation.title}</span>
						</div>
					</Link>

					<Popover
						open={actionsPopoverOpen}
						onOpenChange={setActionsPopoverOpen}
					>
						<PopoverTrigger asChild>
							<button
								type="button"
								aria-label="Actions"
								className={cn(
									"-translate-y-1/2 absolute top-1/2 right-1 z-10 flex size-8 items-center justify-center text-muted-foreground opacity-0 transition-all duration-200 hover:border-none hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100",
								)}
							>
								<MoreVertical className="h-4 w-4" />
							</button>
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
									onClick={handleTogglePin}
									className="h-8 w-full justify-start hover:shadow-none"
								>
									{conversation.isPinned ? (
										<PinOff className="mr-2 h-3 w-3" />
									) : (
										<Pin className="mr-2 h-3 w-3" />
									)}
									{conversation.isPinned ? "Unpin" : "Pin"}
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleEditStart}
									className="h-8 w-full justify-start hover:shadow-none"
								>
									<Edit2 className="mr-2 h-3 w-3" />
									Edit
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleDelete}
									className="h-8 w-full justify-start hover:shadow-none [&>svg]:text-destructive"
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
}

export const ConversationListItem = memo(ConversationRow);
