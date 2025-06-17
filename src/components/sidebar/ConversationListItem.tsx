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
				"relative mr-2.5 min-w-0 overflow-hidden rounded-lg",
				isActive
					? "bg-secondary text-secondary-foreground"
					: "hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-secondary/50",
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
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"-translate-y-1/2 absolute top-1/2 right-1 z-10 flex h-6 w-6 items-center justify-center p-0 text-muted-foreground opacity-0 transition-all duration-200 hover:scale-110 hover:bg-secondary hover:text-secondary-foreground group-hover:opacity-100 data-[state=open]:opacity-100",
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
									onClick={handleTogglePin}
									className="h-8 w-full justify-start text-muted-foreground text-sm transition-all duration-200"
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
									className="h-8 w-full justify-start text-muted-foreground text-sm transition-all duration-200"
								>
									<Edit2 className="mr-2 h-3 w-3" />
									Edit
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleDelete}
									className="h-8 w-full justify-start text-red-600 text-sm transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
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
