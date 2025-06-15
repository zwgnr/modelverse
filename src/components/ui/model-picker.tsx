import * as React from "react";

import type { modelId } from "convex/schema";
import type { Infer } from "convex/values";

import { Check, ChevronDown, } from "lucide-react";

import type { Model } from "@/lib/models";
import { models } from "@/lib/models";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { AnthropicIcon } from "@/components/ui/svg/anthropic";
// Import provider icons
import { OpenAIIcon } from "@/components/ui/svg/openai";
import xAIGrok from "@/components/ui/svg/xia";

import { GeminiIcon } from "./svg/gemini";

interface ModelPickerProps {
	value?: string;
	onValueChange?: (value: Infer<typeof modelId>) => void;
	className?: string;
}

// Provider icons mapping
const providerIcons = {
	OpenAI: OpenAIIcon,
	Anthropic: AnthropicIcon,
	Google: GeminiIcon, 
	"X.AI": xAIGrok,
};

// Company icon colors for selected state
const companyIconColors = {
	OpenAI: "text-emerald-500",
	Anthropic: "text-orange-500",
	Google: "text-blue-500",
	"X.AI": "text-purple-500",
};

// Company accent colors for indicators
const companyAccentColors = {
	OpenAI: "bg-emerald-500",
	Anthropic: "bg-orange-500",
	Google: "bg-blue-500",
	"X.AI": "bg-purple-500",
};

export function ModelPicker({
	value,
	onValueChange,
	className,
}: ModelPickerProps) {
	const [open, setOpen] = React.useState(false);

	const selectedModel = React.useMemo(() => {
		return models.find((model) => model.id === value);
	}, [value]);

	const groupedModels = React.useMemo(() => {
		return models.reduce(
			(acc, model) => {
				if (!acc[model.company]) {
					acc[model.company] = [];
				}
				acc[model.company].push(model);
				return acc;
			},
			{} as Record<string, Model[]>,
		);
	}, []);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-expanded={open}
					className={cn(
						"group relative h-10 justify-between overflow-hidden border-0 bg-secondary/30 px-3 text-left font-medium transition-all hover:bg-secondary/50",
						className,
					)}
				>
					<div className="flex min-w-0 items-center gap-2">
						{selectedModel && (
							<div className="flex items-center justify-center">
								{React.createElement(providerIcons[selectedModel.company], {
									className: cn(
										"h-4 w-4 shrink-0 transition-colors",
										companyIconColors[selectedModel.company]
									)
								})}
							</div>
						)}
						<span className="truncate text-sm">
							{selectedModel?.name || "Select model…"}
						</span>
					</div>
					<ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 border-0 p-0 shadow-xl" align="start">
				<Command className="overflow-hidden rounded-lg border border-border/50 bg-secondary backdrop-blur-lg">
					<CommandInput placeholder="Search models..." className="border-0" />
					<CommandList className="max-h-96">
						<CommandEmpty>No models found.</CommandEmpty>
						
						{Object.entries(groupedModels).map(([company, companyModels]) => (
							<CommandGroup key={company} className="p-2">
								<div className="mb-1 flex items-center gap-2 px-2 py-1">
									<div
										className={cn(
											"h-2 w-2 rounded-full",
											companyAccentColors[company as keyof typeof companyAccentColors],
										)}
									/>
									<span className="font-medium text-sm">{company}</span>
								</div>
								
								{companyModels.map((model) => {
									const isSelected = value === model.id;
									const ProviderIcon = providerIcons[model.company];

									return (
										<CommandItem
											key={model.id}
											value={`${model.company} ${model.name} ${model.description || ""}`}
											onSelect={() => {
												onValueChange?.(model.id);
												setOpen(false);
											}}
											className={cn(
												"group relative cursor-pointer rounded-lg p-4 transition-all duration-200",
												"hover:bg-secondary/50",
											)}
										>
											<div className="flex items-start gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/50 transition-colors">
													{React.createElement(ProviderIcon, {
														className: cn(
															"h-4 w-4 transition-colors",
															isSelected 
																? companyIconColors[model.company]
																: "text-muted-foreground"
														)
													})}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<span className="font-medium text-sm">
															{model.name}
														</span>
														{isSelected && (
															<Check className={cn(
																"h-3 w-3",
																companyIconColors[model.company]
															)} />
														)}
													</div>
													{model.description && (
														<p className="mt-0.5 line-clamp-2 text-muted-foreground/80 text-xs">
															{model.description}
														</p>
													)}
												</div>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
} 