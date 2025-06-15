import { useEffect, useId, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { useMutation, useQuery } from "convex/react";

import {
	BarChart3,
	Bot,
	Camera,
	CreditCard,
	Eye,
	Key,
	Lock,
	MessageSquare,
	Settings,
	Shield,
	Upload,
	User,
} from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { api } from "../../../convex/_generated/api";

function SettingsPage() {
	const assistantNameId = useId();
	const traitsId = useId();
	const customInstructionsId = useId();
	const currentPasswordId = useId();
	const newPasswordId = useId();
	const confirmPasswordId = useId();
	const apiKeyId = useId();

	const user = useQuery(api.auth.getCurrentUser);
	const storeKey = useMutation(api.users.storeOpenRouterKey);
	// const setUseBYOKMutation = useMutation(api.users.setUseBYOK);
	const deleteKey = useMutation(api.users.deleteOpenRouterKey);

	const [openRouterKey, setOpenRouterKey] = useState("");
	const [showKey, setShowKey] = useState(false);
	// const [useBYOK, setUseBYOK] = useState(false);

	useEffect(() => {
		if (user) {
		//	setUseBYOK(user.useBYOK ?? false);
			if (user.openRouterKey) {
				setOpenRouterKey("********************");
			} else {
				setOpenRouterKey("");
			}
		}
	}, [user]);

	return (
		<div className="flex min-h-screen flex-col bg-card">
			<div className="container mx-auto mb-16 flex min-h-0 max-w-6xl flex-1 flex-col px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="font-bold text-3xl">Settings</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your account and application preferences
					</p>
				</div>

				<Tabs
					defaultValue="general"
					className="flex min-h-0 flex-1 flex-col space-y-6"
				>
					<TabsList className="mb-4 grid w-full grid-cols-6">
						<TabsTrigger value="general" className="flex items-center gap-2">
							<Settings className="h-4 w-4" />
							General
						</TabsTrigger>
						<TabsTrigger
							value="customization"
							className="flex items-center gap-2"
						>
							<Bot className="h-4 w-4" />
							Customize
						</TabsTrigger>
						<TabsTrigger value="apiKeys" className="flex items-center gap-2">
							<Key className="h-4 w-4" />
							API Keys
						</TabsTrigger>
						<TabsTrigger value="usage" className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4" />
							Usage
						</TabsTrigger>
						<TabsTrigger
							value="subscription"
							className="flex items-center gap-2"
						>
							<CreditCard className="h-4 w-4" />
							Subscription
						</TabsTrigger>
						<TabsTrigger value="security" className="flex items-center gap-2">
							<Lock className="h-4 w-4" />
							Security
						</TabsTrigger>
					</TabsList>

					<div className="flex min-h-0 flex-1 flex-col">
						<TabsContent
							value="general"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							{/* Enhanced Profile Section */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<User className="h-5 w-5" />
										Profile
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-x-8 sm:space-y-0">
										{/* Avatar Section */}
										<div className="flex flex-col items-center space-y-4">
											<div className="relative">
												<div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-4xl text-white">
													Z
												</div>
												<Button
													size="sm"
													className="absolute right-0 bottom-0 h-8 w-8 rounded-full p-0"
													variant="secondary"
												>
													<Camera className="h-4 w-4" />
												</Button>
											</div>
											<div className="flex flex-col gap-2 sm:flex-row">
												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-2"
												>
													<Upload className="h-4 w-4" />
													Upload Photo
												</Button>
												<Button variant="ghost" size="sm">
													Remove
												</Button>
											</div>
										</div>

										{/* Profile Info */}
										<div className="flex-1 space-y-4">
											<div>
												<p className="text-muted-foreground">
													user@example.com
												</p>
												<p className="text-muted-foreground text-sm">
													Member since December 2024
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
												2,847 / 5,000
											</span>
										</div>
										<Progress value={57} className="h-2" />
										<p className="text-muted-foreground text-xs">
											Resets in 12 days
										</p>
									</div>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<div className="rounded-lg border p-4 text-center">
											<div className="font-semibold text-2xl">2,847</div>
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
						</TabsContent>

						<TabsContent
							value="customization"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							{/* ai Configuration */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Bot className="h-5 w-5 text-blue-600" />
										Customize
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Default Model */}
									<div className="space-y-2">
										<Label htmlFor="default-model">Default Model</Label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Select your preferred model" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="gpt-4">GPT-4</SelectItem>
												<SelectItem value="gpt-3.5-turbo">
													GPT-3.5 Turbo
												</SelectItem>
												<SelectItem value="claude-3-opus">
													Claude 3 Opus
												</SelectItem>
												<SelectItem value="claude-3-sonnet">
													Claude 3 Sonnet
												</SelectItem>
												<SelectItem value="claude-3-haiku">
													Claude 3 Haiku
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Assistant Name */}
									<div className="space-y-2">
										<Label htmlFor={assistantNameId}>What's your name?</Label>
										<Input
											id={assistantNameId}
											placeholder="e.g., Alex, CodeHelper, Assistant"
											defaultValue="Assistant"
										/>
									</div>

									{/* Personality Traits */}
									<div className="space-y-2">
										<Label htmlFor={traitsId}>Personality Traits</Label>
										<Textarea
											id={traitsId}
											placeholder="e.g., Helpful, concise, creative, technical, friendly"
											className="min-h-[80px]"
										/>
										<p className="text-muted-foreground text-xs">
											Describe how you want the AI to behave and communicate
										</p>
									</div>

									{/* Custom Instructions */}
									<div className="space-y-2">
										<Label htmlFor={customInstructionsId}>
											Custom Instructions
										</Label>
										<Textarea
											id={customInstructionsId}
											placeholder="Enter specific instructions for how the AI should assist you..."
											className="min-h-[120px]"
										/>
										<p className="text-muted-foreground text-xs">
											Provide detailed instructions for how the AI should help
											you with tasks
										</p>
									</div>

									<div className="flex gap-3 pt-4">
										<Button>Save Changes</Button>
										<Button variant="outline">Reset to Default</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent
							value="apiKeys"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Key className="h-5 w-5 text-blue-600" />
										Bring Your Own Key (BYOK)
									</CardTitle>
									<p className="pt-2 text-muted-foreground text-sm">
										Use your own OpenRouter API key for premium model access.
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor={apiKeyId}>OpenRouter API Key</Label>
										<div className="flex gap-2">
											<Input
												id={apiKeyId}
												type={showKey ? "text" : "password"}
												value={openRouterKey}
												onChange={(e) => setOpenRouterKey(e.target.value)}
												placeholder="Enter your OpenRouter API key"
											/>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowKey(!showKey)}
											>
												<Eye className="h-4 w-4" />
											</Button>
										</div>
										<p className="flex items-center gap-2 pt-1 text-muted-foreground text-xs">
											<Lock className="h-3 w-3" />
											Your API key is encrypted and stored securely.
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Button
											onClick={async () => {
												await storeKey({ key: openRouterKey });
												toast.success("OpenRouter key saved!");
												setOpenRouterKey("********************");
											}}
											disabled={
												!openRouterKey || openRouterKey.includes("*")
											}
										>
											Save Key
										</Button>
										<Button
											variant="destructive"
											onClick={async () => {
												await deleteKey();
												toast.success("OpenRouter key deleted!");
												setOpenRouterKey("");
											}}
											disabled={!user?.openRouterKey}
										>
											Delete Key
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent
							value="usage"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							{/* Usage by Model */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5 text-blue-600" />
										Usage by Model
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										See how you're using different AI models
									</p>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Model Usage Chart Placeholder */}
									<div className="flex h-64 items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed">
										<div className="space-y-2 text-center">
											<BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
											<p className="text-muted-foreground text-sm">
												Model Usage Chart
											</p>
											<p className="text-muted-foreground text-xs">
												Bar chart showing usage by model
											</p>
										</div>
									</div>

									{/* Model Stats */}
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
										<div className="rounded-lg border p-4">
											<div className="mb-2 flex items-center justify-between">
												<span className="font-medium text-sm">GPT-4</span>
												<span className="text-muted-foreground text-xs">
													45%
												</span>
											</div>
											<Progress value={45} className="mb-2 h-2" />
											<p className="text-muted-foreground text-xs">
												1,281 messages
											</p>
										</div>
										<div className="rounded-lg border p-4">
											<div className="mb-2 flex items-center justify-between">
												<span className="font-medium text-sm">
													Claude 3 Sonnet
												</span>
												<span className="text-muted-foreground text-xs">
													35%
												</span>
											</div>
											<Progress value={35} className="mb-2 h-2" />
											<p className="text-muted-foreground text-xs">
												996 messages
											</p>
										</div>
										<div className="rounded-lg border p-4">
											<div className="mb-2 flex items-center justify-between">
												<span className="font-medium text-sm">
													GPT-3.5 Turbo
												</span>
												<span className="text-muted-foreground text-xs">
													20%
												</span>
											</div>
											<Progress value={20} className="mb-2 h-2" />
											<p className="text-muted-foreground text-xs">
												570 messages
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Usage Over Time */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle>Usage Over Time</CardTitle>
									<p className="text-muted-foreground text-sm">
										Track your daily usage patterns
									</p>
								</CardHeader>
								<CardContent>
									{/* Time Series Chart Placeholder */}
									<div className="flex h-64 items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed">
										<div className="space-y-2 text-center">
											<BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
											<p className="text-muted-foreground text-sm">
												Usage Timeline Chart
											</p>
											<p className="text-muted-foreground text-xs">
												Line chart showing usage over time
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Cost Breakdown */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle>Cost Breakdown</CardTitle>
									<p className="text-muted-foreground text-sm">
										Estimated costs by model and usage
									</p>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center justify-between border-b py-2">
											<span className="text-sm">GPT-4</span>
											<span className="font-medium text-sm">$12.40</span>
										</div>
										<div className="flex items-center justify-between border-b py-2">
											<span className="text-sm">Claude 3 Sonnet</span>
											<span className="font-medium text-sm">$8.20</span>
										</div>
										<div className="flex items-center justify-between border-b py-2">
											<span className="text-sm">GPT-3.5 Turbo</span>
											<span className="font-medium text-sm">$2.15</span>
										</div>
										<div className="flex items-center justify-between py-2 font-medium">
											<span className="text-sm">Total Estimated Cost</span>
											<span className="text-sm">$22.75</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent
							value="subscription"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							<Card className="p-4">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<CreditCard className="h-5 w-5 text-blue-600" />
										Subscription Plan
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										Manage your subscription and billing
									</p>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="rounded-lg border p-4">
											<h3 className="font-medium">Free Plan</h3>
											<p className="text-muted-foreground text-sm">
												Basic features with limited usage
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												$0/month
											</p>
										</div>
										<Button className="w-full">Upgrade to Pro</Button>
									</div>
								</CardContent>
							</Card>

							<Card className="p-4">
								<CardHeader>
									<CardTitle>Billing Information</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3">
										<li className="flex items-center justify-between py-2">
											<span className="text-sm">Payment Method</span>
											<Button variant="ghost" size="sm" className="text-xs">
												Add Card
											</Button>
										</li>
										<li className="flex items-center justify-between py-2">
											<span className="text-sm">Billing History</span>
											<Button variant="ghost" size="sm" className="text-xs">
												View
											</Button>
										</li>
										<li className="flex items-center justify-between py-2">
											<span className="text-sm">Download Invoices</span>
											<Button variant="ghost" size="sm" className="text-xs">
												Download
											</Button>
										</li>
									</ul>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent
							value="security"
							className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto"
						>
							{/* Change Password */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Lock className="h-5 w-5 text-blue-600" />
										Change Password
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										Update your account password
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor={currentPasswordId}>Current Password</Label>
										<Input
											id={currentPasswordId}
											type="password"
											placeholder="Enter your current password"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={newPasswordId}>New Password</Label>
										<Input
											id={newPasswordId}
											type="password"
											placeholder="Enter your new password"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={confirmPasswordId}>
											Confirm New Password
										</Label>
										<Input
											id={confirmPasswordId}
											type="password"
											placeholder="Confirm your new password"
										/>
									</div>
									<Button className="mt-4">Update Password</Button>
								</CardContent>
							</Card>

							{/* API Key */}
							<Card className="p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Key className="h-5 w-5 text-blue-600" />
										API Key
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										Manage your API access key
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor={apiKeyId}>API Key</Label>
										<div className="flex gap-2">
											<Input
												id={apiKeyId}
												type="password"
												value="sk-1234567890abcdef1234567890abcdef"
												readOnly
											/>
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="flex gap-2">
										<Button variant="outline">Regenerate Key</Button>
										<Button variant="outline">Copy Key</Button>
									</div>
								</CardContent>
							</Card>

							{/* Delete Account */}
							<Card className="border-destructive/20 p-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-destructive">
										<Shield className="h-5 w-5" />
										Danger Zone
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										Permanently delete your account and all data
									</p>
								</CardHeader>
								<CardContent>
									<Button variant="destructive" className="w-full">
										Delete Account
									</Button>
									<p className="mt-2 text-muted-foreground text-xs">
										This action cannot be undone. All your data will be
										permanently deleted.
									</p>
								</CardContent>
							</Card>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/_layout/settings")({
	component: SettingsPage,
});
