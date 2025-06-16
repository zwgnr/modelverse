import { createFileRoute } from "@tanstack/react-router";

import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_layout/settings/usage")({
	component: UsageSettings,
}); 

function UsageSettings() {
	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
			{/* Usage by Model */}
			<Card className="p-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
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
							<BarChart3 className="mx-auto h-8 w-8" />
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
		</div>
	);
}

