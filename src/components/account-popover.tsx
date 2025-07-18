import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { LogOut, Settings, User } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle.js";
import { Avatar, AvatarFallback, } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface AccountPopoverProps {
	currentUser: {
		_creationTime: number | null;
		email: string | null;
		image: string | null;
		name: string | null;
		hasOpenRouterKey: boolean | null;
		useBYOK: boolean | null;
		defaultModel: string | null;
	} | null;
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
				<button
					type="button"
					aria-label="Account"
					className="h-8 w-8 rounded-full p-0 transition-all duration-200"
				>
					<Avatar className="h-10 w-10">
						<AvatarFallback className="bg-secondary text-sm">
							{currentUser?.image ? (
								<img
									src={currentUser.image}
									alt="Profile"
									className="h-full w-full rounded-full object-cover"
								/>
							) : (
								currentUser?.name?.[0] || currentUser?.email?.[0] || (
									<User className="h-4 w-4" />
								)
							)}
						</AvatarFallback>
					</Avatar>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64" align="end" side="bottom" sideOffset={8}>
				<div className="space-y-2">
					<div className="flex items-center gap-3 p-1">
						<div className="min-w-0 flex-1">
							<p className="truncate text-muted-foreground">
								{currentUser?.email ?? "anon"}
							</p>
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between p-3">
							<span>Theme</span>
							<ThemeToggle />
						</div>

						<Button
							asChild
							variant="ghost"
							className="h-auto w-full justify-start p-3 hover:shadow-none"
							onClick={() => setPopoverOpen(false)}
						>
							<Link to="/settings">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Link>
						</Button>
					</div>

					<Button
						onClick={onSignOut}
						variant="ghost"
						className="h-auto w-full justify-start p-3 text-red-600 text-sm transition-all duration-200 hover:text-red-700 hover:shadow-none"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign Out
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
