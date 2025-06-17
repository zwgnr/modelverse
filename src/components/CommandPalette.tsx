import { useCallback, useEffect, useMemo, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { modelId as modelIdType } from "convex/schema";
import type { Infer } from "convex/values";

import { MessageSquare, Plus } from "lucide-react";

import { models } from "@/lib/models";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const navigate = useNavigate();
	const { data: conversations } = useSuspenseQuery(
		convexQuery(api.conversations.get, {}),
	);

	const createConversation = useMutation(api.conversations.create);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, onOpenChange]);

	const handleSelect = (callback?: () => void) => {
		if (callback) callback();
		onOpenChange(false);
		setSearchQuery("");
	};

	const formatConversationTitle = useMemo(
		() => (conversation: Doc<"conversations">) => {
			if (conversation.title) return conversation.title;
			return `Conversation ${new Date(conversation.createdAt).toLocaleDateString()}`;
		},
		[],
	);

	// Filter conversations based on search query
	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return [];

		const query = searchQuery.toLowerCase();
		return conversations.filter((conversation: Doc<"conversations">) => {
			const title = formatConversationTitle(conversation).toLowerCase();
			return title.includes(query);
		});
	}, [conversations, searchQuery, formatConversationTitle]);

	// Get specific models for quick actions
	const quickActionModels = useMemo(() => {
		return [
			models.find((m) => m.id === "openai/chatgpt-4o-latest"), // GPT-4o
			models.find((m) => m.id === "anthropic/claude-sonnet-4"), // Claude Sonnet 4
			models.find((m) => m.id === "x-ai/grok-3-beta"), // Grok
		].filter(Boolean);
	}, []);

	const handleNewChatWithModel = useCallback(
		async (modelId: Infer<typeof modelIdType>) => {
			try {
				const conversationId = await createConversation({
					model: modelId,
				});
				navigate({
					to: "/chat/$chatid",
					params: { chatid: conversationId },
				});
			} catch (error) {
				console.error("Failed to create conversation:", error);
			}
		},
		[createConversation, navigate],
	);

	return (
		<>
			<CommandDialog open={open} onOpenChange={onOpenChange}>
				<CommandInput
					placeholder="Search conversations or type a command..."
					value={searchQuery}
					onValueChange={setSearchQuery}
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>

					{/* Quick Action Buttons */}
					<CommandGroup heading="Quick Actions">
						<CommandItem onSelect={() => handleSelect()}>
							<Link to="/" className="flex w-full items-center">
								<Plus className="mr-2 h-4 w-4" />
								<span>New Chat</span>
								<div className="ml-auto text-muted-foreground text-xs">
									Ctrl+N
								</div>
							</Link>
						</CommandItem>

						{quickActionModels.map((model) => {
							if (!model) return null;
							return (
								<CommandItem
									key={`quick-${model.id}`}
									onSelect={() =>
										handleSelect(() => {
											handleNewChatWithModel(model.id);
										})
									}
								>
									<div className="flex w-full items-center">
										<Plus className="mr-2 h-4 w-4" />
										<span>New chat with {model.name}</span>
									</div>
								</CommandItem>
							);
						})}
					</CommandGroup>

					{/* Search Results */}
					{searchQuery && (
						<>
							<CommandSeparator />
							<CommandGroup
								heading={`Search Results (${filteredConversations.length})`}
							>
								{filteredConversations.length === 0 ? (
									<CommandItem disabled>
										<MessageSquare className="mr-2 h-4 w-4" />
										<span>No conversations found matching "{searchQuery}"</span>
									</CommandItem>
								) : (
									filteredConversations.slice(0, 10).map((conversation) => (
										<CommandItem
											key={`search-${conversation._id}`}
											onSelect={() =>
												handleSelect(() => {
													navigate({
														to: "/chat/$chatid",
														params: { chatid: conversation._id },
													});
												})
											}
										>
											<div className="flex w-full items-center">
												<MessageSquare className="mr-2 h-4 w-4" />
												<div className="flex min-w-0 flex-1 flex-col">
													<span className="truncate">
														{formatConversationTitle(conversation)}
													</span>
													<span className="text-muted-foreground text-xs">
														{new Date(
															conversation.updatedAt || conversation.createdAt,
														).toLocaleDateString()}
													</span>
												</div>
											</div>
										</CommandItem>
									))
								)}
							</CommandGroup>
						</>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
