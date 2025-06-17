import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { getModelDisplayName } from "@/lib/models";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { AnthropicIcon } from "@/components/ui/svg/anthropic";
import { DeepSeek } from "@/components/ui/svg/deepseek";
import { GeminiIcon } from "@/components/ui/svg/gemini";
import { OpenAIIcon } from "@/components/ui/svg/openai";
import xAIGrok from "@/components/ui/svg/xia";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_layout/settings/usage")({
	component: UsageSettings,
	loader: async ({ context }) => {
		await Promise.all([
			context.convexClient.query(api.usage.getUserUsageStats, {}),
			context.convexClient.query(api.usage.getDetailedUsage, {}),
		]);
	},
});

// Helper function to get provider icon and brand color based on model name
function getProviderIconWithColor(model: string) {
	const modelLower = model.toLowerCase();

	if (modelLower.includes("gpt") || modelLower.includes("openai")) {
		return {
			icon: OpenAIIcon,
			colorClass: "text-emerald-600",
		};
	}
	if (modelLower.includes("claude") || modelLower.includes("anthropic")) {
		return {
			icon: AnthropicIcon,
			colorClass: "text-orange-500",
		};
	}
	if (modelLower.includes("gemini") || modelLower.includes("google")) {
		return {
			icon: GeminiIcon,
			colorClass: "text-blue-500",
		};
	}
	if (modelLower.includes("grok") || modelLower.includes("x.ai")) {
		return {
			icon: xAIGrok,
			colorClass: "text-gray-800 dark:text-gray-200",
		};
	}
	if (modelLower.includes("deepseek")) {
		return {
			icon: DeepSeek,
			colorClass: "text-indigo-600",
		};
	}

	// Default fallback
	return null;
}

function UsageSettings() {
	const { data: usageStats } = useSuspenseQuery(
		convexQuery(api.usage.getUserUsageStats, {}),
	);

	// Process model usage data with proper deduplication
	const processedUsageData =
		usageStats?.modelUsage?.reduce(
			(acc, usage) => {
				// Always use getModelDisplayName for consistency
				const displayName =
					getModelDisplayName(usage.model) ||
					usage.model.split("/")[1] ||
					usage.model;

				// Find existing entry with same display name
				const existingIndex = acc.findIndex(
					(item) => item.model === displayName,
				);

				if (existingIndex >= 0) {
					// Merge counts if display name already exists
					acc[existingIndex].count += usage.count;
				} else {
					// Add new entry
					acc.push({
						model: displayName,
						count: usage.count,
						originalModel: usage.model,
					});
				}

				return acc;
			},
			[] as Array<{ model: string; count: number; originalModel: string }>,
		) || [];

	// Add percentage and sort by count
	const modelUsageData = processedUsageData
		.map((usage) => ({
			model: usage.model,
			count: usage.count,
			percentage: Math.round(
				(usage.count / (usageStats?.totalMessages || 1)) * 100,
			),
		}))
		.sort((a, b) => b.count - a.count);

	// Create chart config with proper color mapping
	const chartConfig: ChartConfig = {
		count: {
			label: "Messages",
		},
		...modelUsageData.reduce((acc, item, index) => {
			const colors = [
				"hsl(var(--chart-1))",
				"hsl(var(--chart-2))",
				"hsl(var(--chart-3))",
				"hsl(var(--chart-4))",
				"hsl(var(--chart-5))",
			];

			const cleanKey = item.model.replace(/[^a-zA-Z0-9]/g, "");
			acc[cleanKey] = {
				label: item.model,
				color: colors[index % colors.length],
			};
			return acc;
		}, {} as ChartConfig),
	};

	// Add chart color keys to data for proper chart integration
	const chartDataWithColors = modelUsageData.map((item, index) => {
		const colors = [
			"hsl(var(--chart-1))",
			"hsl(var(--chart-2))",
			"hsl(var(--chart-3))",
			"hsl(var(--chart-4))",
			"hsl(var(--chart-5))",
		];

		return {
			...item,
			fill: colors[index % colors.length],
		};
	});

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
					{/* Model Usage Chart */}
					{modelUsageData.length > 0 ? (
						<ChartContainer config={chartConfig} className="h-[400px] w-full">
							<BarChart data={chartDataWithColors} margin={{ left: -40 }}>
								<XAxis
									dataKey="model"
									tick={{ fontSize: 12 }}
									interval={0}
									angle={-45}
									textAnchor="end"
									height={100}
								/>
								<YAxis tick={{ fontSize: 12 }} />
								<ChartTooltip content={<ChartTooltipContent hideLabel />} />
								<Bar
									className="fill-foreground"
									dataKey="count"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					) : (
						<div className="flex h-64 items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed">
							<div className="space-y-2 text-center">
								<BarChart3 className="mx-auto h-8 w-8" />
								<p className="text-muted-foreground text-sm">
									No usage data yet
								</p>
								<p className="text-muted-foreground text-xs">
									Start a conversation to see your usage analytics
								</p>
							</div>
						</div>
					)}

					{/* Model Stats */}
					{modelUsageData.length > 0 && (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{modelUsageData.map((usage) => {
								const providerInfo = getProviderIconWithColor(usage.model);

								return (
									<div key={usage.model} className="rounded-lg border p-4">
										<div className="mb-2 flex items-center justify-between">
											<div className="flex items-center gap-2">
												{providerInfo && (
													<providerInfo.icon
														className={cn("h-4 w-4", providerInfo.colorClass)}
													/>
												)}
												<span className="font-medium text-sm">
													{usage.model}
												</span>
											</div>
											<span className="text-muted-foreground text-xs">
												{usage.percentage}%
											</span>
										</div>
										<Progress value={usage.percentage} className="mb-2 h-2" />
										<p className="text-muted-foreground text-xs">
											{usage.count} message{usage.count !== 1 ? "s" : ""}
										</p>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
