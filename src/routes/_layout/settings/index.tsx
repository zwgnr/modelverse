import { createFileRoute, } from "@tanstack/react-router";

import { useQuery } from "convex/react";

import { MessageSquare, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_layout/settings/")({
	component: GeneralSettings,
}); 

function GeneralSettings() {
	const user = useQuery(api.auth.getCurrentUser);

	return 		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
	{/* Enhanced Profile Section */}
	<Card className="p-6">
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<User className="h-5 w-5 text-primary" />
				Profile
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-x-8 sm:space-y-0">
				{/* Avatar Section */}
				<div className="flex flex-col items-center space-y-4">
					<div className="relative">
						{user?.image ? (
							<img 
								src={user.image} 
								alt="Profile" 
								className="h-32 w-32 rounded-full border-4 border-primary/20 object-cover"
							/>
						) : (
							<div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-4xl text-white">
								{user?.name?.[0] || user?.email?.[0] || "U"}
							</div>
						)}
					</div>
				</div>

				{/* Profile Info */}
				<div className="flex-1 space-y-4">
					<div>
						<h3 className="font-medium text-lg">{user?.name || "User"}</h3>
						<p className="text-muted-foreground">
							{user?.email}
						</p>
						<p className="text-muted-foreground text-sm">
							Member since {user?._creationTime ? new Date(user._creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
						</p>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	{/* Model Usage Section */}
	<Card className="p-6">
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<MessageSquare className="h-5 w-5 text-blue-600" />
				Usage Analytics
			</CardTitle>
			<p className="text-muted-foreground text-sm">
				Track your AI model usage and limits
			</p>
		</CardHeader>
		<CardContent className="space-y-6">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="font-medium text-sm">
						Messages this month
					</span>
					<span className="text-muted-foreground text-sm">
						{user?.totalMessages || 0} / 5,000
					</span>
				</div>
				<Progress value={(user?.totalMessages || 0) / 50} className="h-2" />
				<p className="text-muted-foreground text-xs">
					Resets in 12 days
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="rounded-lg border p-4 text-center">
					<div className="font-semibold text-2xl">{user?.totalMessages || 0}</div>
					<div className="text-muted-foreground text-sm">
						Total Messages
					</div>
				</div>
				<div className="rounded-lg border p-4 text-center">
					<div className="font-semibold text-2xl">156</div>
					<div className="text-muted-foreground text-sm">
						This Week
					</div>
				</div>
				<div className="rounded-lg border p-4 text-center">
					<div className="font-semibold text-2xl">23</div>
					<div className="text-muted-foreground text-sm">Today</div>
				</div>
			</div>
		</CardContent>
	</Card>
</div>;
};

