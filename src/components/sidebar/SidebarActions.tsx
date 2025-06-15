import { Link } from "@tanstack/react-router";

import { MessageCirclePlus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SidebarActionsProps {
	onOpenCommandPalette?: () => void;
}

export function SidebarActions({ onOpenCommandPalette }: SidebarActionsProps) {
	return (
		<div className="flex-shrink-0 space-y-2 p-2">
			<div className="flex gap-2">
				{/* Full width search command palette */}
				<Button
					onClick={onOpenCommandPalette}
					variant="outline"
					className="h-9 flex-1 justify-start border-dashed text-left text-sm transition-all duration-200 hover:bg-secondary hover:text-secondary-foreground"
					title="Command Palette (⌘K)"
				>
					<Search className="mr-3 h-4 w-4" />
					<span>Search</span>
					<div className="ml-auto flex items-center">
						<kbd className="inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[9px] text-muted-foreground opacity-100">
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
						<MessageCirclePlus className="h-4 w-4 text-primary" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
