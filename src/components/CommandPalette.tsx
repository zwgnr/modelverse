import { useEffect, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

import { MessageSquare, Plus, Search } from "lucide-react";

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
	onNewChatWithModel?: (modelId: string) => void;
}

export function CommandPalette({
	open,
	onOpenChange,
	onNewChatWithModel,
}: CommandPaletteProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: conversations } = useSuspenseQuery(
		convexQuery(api.conversations.get, {}),
	);

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

	const formatConversationTitle = (conversation: any, index: number) => {
		if (conversation.title) return conversation.title;
		return `Conversation ${index + 1}`;
	};

	return (
		<>
			<CommandDialog open={open} onOpenChange={onOpenChange}>
				<CommandInput
					placeholder="Type a command or search..."
					value={searchQuery}
					onValueChange={setSearchQuery}
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>

					{/* Quick Actions */}
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
					</CommandGroup>

					<CommandSeparator />

					{/* New Chat with Specific Model */}
					<CommandGroup heading="New Chat with Model">
						{models.map((model) => {
							const Icon = model.icon;

							return (
								<CommandItem
									key={`new-${model.id}`}
									onSelect={() =>
										handleSelect(() => {
											if (onNewChatWithModel) {
												onNewChatWithModel(model.id);
											}
										})
									}
								>
									<Link to="/" className="flex w-full items-center">
										<Plus className="mr-2 h-4 w-4" />
										{Icon && <Icon />}
										<div className="flex flex-col">
											<span>New chat with {model.name}</span>
											<span className="text-muted-foreground text-xs">
												{model.description}
											</span>
										</div>
									</Link>
								</CommandItem>
							);
						})}
					</CommandGroup>

					<CommandSeparator />

					{/* Recent Conversations */}
					{conversations.length > 0 && (
						<CommandGroup heading="Recent Conversations">
							{conversations.slice(0, 8).map((conversation, index) => (
								<CommandItem
									key={conversation._id}
									onSelect={() => handleSelect()}
								>
									<Link
										to="/chat/$chatid"
										params={{ chatid: conversation._id }}
										className="flex w-full items-center"
									>
										<MessageSquare className="mr-2 h-4 w-4" />
										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate">
												{formatConversationTitle(conversation, index)}
											</span>
										</div>
									</Link>
								</CommandItem>
							))}
						</CommandGroup>
					)}

					{/* Search functionality - placeholder for future implementation */}
					{searchQuery && (
						<>
							<CommandSeparator />
							<CommandGroup heading="Search Results">
								<CommandItem>
									<Search className="mr-2 h-4 w-4" />
									<span>Search for "{searchQuery}" in conversations</span>
									<div className="ml-auto text-muted-foreground text-xs">
										Coming Soon
									</div>
								</CommandItem>
							</CommandGroup>
						</>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
