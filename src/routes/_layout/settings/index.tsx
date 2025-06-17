import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

import { BarChart3, MessageSquare, TrendingUp, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export const Route = createFileRoute("/_layout/settings/")({
	component: GeneralSettings,
	loader: async ({ context }) => {
		await context.convexClient.query(api.usage.getUserUsageStats, {});
	},
});

function GeneralSettings() {
	const { data: user } = useSuspenseQuery(
		convexQuery(api.auth.getCurrentUser, {}),
	);
	const { data: usageStats } = useSuspenseQuery(
		convexQuery(api.usage.getUserUsageStats, {}),
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
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
								<p className="text-muted-foreground">{user?.email}</p>
								<p className="text-muted-foreground text-sm">
									Member since{" "}
									{user?._creationTime
										? new Date(user._creationTime).toLocaleDateString("en-US", {
												month: "long",
												year: "numeric",
											})
										: "Recently"}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Message Analytics */}
			<Card className="p-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5 text-primary" />
						Message Analytics
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						Your AI conversation activity
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						{/* Total Conversations */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-4 w-4 text-purple-500" />
								<span className="font-medium text-sm">Conversations</span>
							</div>
							<p className="font-bold text-3xl">{usageStats?.totalConversations ?? 0}</p>
							<p className="text-muted-foreground text-xs">
								All time chats
							</p>
						</div>

						{/* Total Messages */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-4 w-4 text-blue-500" />
								<span className="font-medium text-sm">Messages</span>
							</div>
							<p className="font-bold text-3xl">{usageStats?.totalMessages ?? 0}</p>
							<p className="text-muted-foreground text-xs">
								Total exchanges
							</p>
						</div>

						{/* Models Used */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<TrendingUp className="h-4 w-4 text-green-500" />
								<span className="font-medium text-sm">Models Used</span>
							</div>
							<p className="font-bold text-3xl">
								{usageStats?.modelUsage?.length ?? 0}
							</p>
							<p className="text-muted-foreground text-xs">
								Different AI models
							</p>
						</div>

						{/* Most Used Model */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<BarChart3 className="h-4 w-4 text-orange-500" />
								<span className="font-medium text-sm">Most Used</span>
							</div>
							<p className="font-bold text-lg">
								{usageStats?.modelUsage && usageStats.modelUsage.length > 0
									? usageStats.modelUsage.reduce((prev, current) =>
											prev.count > current.count ? prev : current,
										).model.split("/")[1]?.replace("-", " ") || "None"
									: "None"}
							</p>
							<p className="text-muted-foreground text-xs">
								{usageStats?.modelUsage && usageStats.modelUsage.length > 0
									? `${
											usageStats.modelUsage.reduce((prev, current) =>
												prev.count > current.count ? prev : current,
											).count
										} messages`
									: "No usage yet"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
