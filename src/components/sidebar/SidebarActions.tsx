import { Link } from "@tanstack/react-router";

import { MessageCirclePlus, Telescope } from "lucide-react";


import { Button } from "@/components/ui/button";

interface SidebarActionsProps {
	onOpenCommandPalette?: () => void;
}

export function SidebarActions({ onOpenCommandPalette }: SidebarActionsProps) {
	return (
		<div className="flex-shrink-0 space-y-2 p-2">
			<div className="flex justify-between gap-2">
				{/* search command palette */}
				<Button
					onClick={onOpenCommandPalette}
					size="lg"
					variant="outline"
					className="grow"
					title="Command Palette (⌘K)"
				>
					<Telescope className="mr-3 h-4 w-4 opacity-70" />
					<span className="text-muted-foreground">Search</span>
					<div className="ml-auto flex items-center">
						<kbd className="inline-flex h-4 select-none items-center gap-1 rounded border border-input/30 bg-muted/50 px-1.5 font-medium font-mono text-[9px] text-muted-foreground/80 backdrop-blur-sm">
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
					aria-label="New Chat"
					asChild
					variant="outline"
					size="icon"
					title="New Chat (⌘N)"
				>
					<Link to="/">
						<MessageCirclePlus className="h-4 w-4 opacity-80" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
