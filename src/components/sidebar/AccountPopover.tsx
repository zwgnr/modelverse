import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { LogOut, Settings, User } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle.js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface AccountPopoverProps {
	currentUser: { email?: string | null } | null;
	onSignOut: () => void;
}

export function AccountPopover({
	currentUser,
	onSignOut,
}: AccountPopoverProps) {
	const [popoverOpen, setPopoverOpen] = useState(false);

	return (
		<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className="h-auto w-full justify-start p-2 transition-all duration-200"
				>
					<Avatar className="mr-3 h-8 w-8">
						<AvatarFallback className="text-sm">
							<User className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 text-left">
						<p className="truncate text-muted-foreground text-sm">
							{currentUser?.email ?? "anon"}
						</p>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64" align="start" side="top" sideOffset={8}>
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarFallback className="text-xs">
								<User className="h-5 w-5" />
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="truncate text-muted-foreground text-sm">
								{currentUser?.email ?? "anon"}
							</p>
						</div>
					</div>

					<div className="border-border border-t" />

					<div className="space-y-2">
						<div className="flex items-center justify-between px-3 py-3">
							<span className="font-medium text-sm">Theme</span>
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

					<div className="border-border border-t" />

					<Button
						onClick={onSignOut}
						variant="ghost"
						className="h-auto w-full justify-start px-3 py-3 text-red-600 text-sm transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign Out
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
