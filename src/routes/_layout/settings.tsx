import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

import {
	BarChart3,
	Bot,
	Key,
	Settings,
	Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

function SettingsLayout() {
	const location = useLocation();
	
	const tabs = [
		{
			value: "general",
			label: "General",
			icon: Settings,
			path: "/settings",
		},
		{
			value: "customize",
			label: "Customize",
			icon: Bot,
			path: "/settings/customize",
		},
		{
			value: "apiKeys",
			label: "API Keys",
			icon: Key,
			path: "/settings/api-keys",
		},
		{
			value: "usage",
			label: "Usage",
			icon: BarChart3,
			path: "/settings/usage",
		},
		{
			value: "security",
			label: "Security",
			icon: Shield,
			path: "/settings/security",
		},
	];

	return (
		<div className="flex min-h-screen flex-col bg-card">
			<div className="container mx-auto mb-16 flex min-h-0 max-w-6xl flex-1 flex-col p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="font-bold text-3xl">Settings</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your account and application preferences
					</p>
				</div>

				{/* Navigation */}
				<div className="mb-6 grid w-full grid-cols-5 rounded-lg bg-muted p-1">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = location.pathname === tab.path;
						
						return (
							<Link
								key={tab.value}
								to={tab.path}
								className={cn(
									"flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors",
									isActive
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</Link>
						);
					})}
				</div>

				{/* Page Content */}
				<div className="flex min-h-0 flex-1 flex-col">
					<Outlet />
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/_layout/settings")({
	component: SettingsLayout,
});
