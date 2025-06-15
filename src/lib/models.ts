import type { ComponentType } from "react";

import type { Infer } from "convex/values";

import { atom } from "jotai";
import { Bot, Brain, Sparkles, Zap } from "lucide-react";

import { MODEL_IDS, type modelId } from "../../convex/schema";

export interface Model {
	id: Infer<typeof modelId>;
	name: string;
	icon?: ComponentType;
	description?: string;
	company: "OpenAI" | "Anthropic" | "Google" | "X.AI";
}

export const models: Model[] = [
	{
		id: MODEL_IDS[0], // "openai/gpt-4o-mini"
		name: "4o mini",
		icon: Bot,
		description: "Fast and efficient for most tasks",
		company: "OpenAI",
	},
	{
		id: MODEL_IDS[1], // "openai/chatgpt-4o-latest"
		name: "4o",
		icon: Brain,
		description: "Latest and most capable ChatGPT model",
		company: "OpenAI",
	},
	{
		id: MODEL_IDS[2], // "openai/gpt-4.1"
		name: "4.1",
		icon: Brain,
		description: "Advanced reasoning and problem-solving",
		company: "OpenAI",
	},
	{
		id: MODEL_IDS[3], // "anthropic/claude-sonnet-4"
		name: "Claude Sonnet 4",
		icon: Zap,
		description: "Powerful reasoning and analysis",
		company: "Anthropic",
	},
	{
		id: MODEL_IDS[4], // "google/gemini-2.5-flash-preview-05-20"
		name: "Gemini 2.5 Flash",
		icon: Sparkles,
		description: "Google's fast multimodal AI model",
		company: "Google",
	},
	{
		id: MODEL_IDS[5], // "x-ai/grok-3-beta"
		name: "Grok 3",
		icon: Zap,
		description: "X.AI's latest conversational AI model",
		company: "X.AI",
	},
];

export const DEFAULT_MODEL = MODEL_IDS[0]; // First model from schema

// Regular jotai atom for selected model (client-side routing preserves state)
export const selectedModelAtom = atom<Infer<typeof modelId>>(DEFAULT_MODEL);

// Helper function to group models by company
export const getModelsByCompany = () => {
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
};

// Helper function to get display model name
export const getModelDisplayName = (modelId: string): string | null => {
	if (!modelId) return null;

	// Remove :online suffix for display
	const baseModel = modelId.replace(":online", "");
	const isWebSearch = modelId.includes(":online");

	// Create display name mapping from schema constants
	const modelNames: Record<string, string> = {
		[MODEL_IDS[0]]: "GPT-4o mini",
		[MODEL_IDS[1]]: "GPT-4o",
		[MODEL_IDS[2]]: "GPT-4.1",
		[MODEL_IDS[3]]: "Claude Sonnet 4",
		[MODEL_IDS[4]]: "Gemini 2.5 Flash",
		[MODEL_IDS[5]]: "Grok 3",
	};

	const displayName = modelNames[baseModel] || baseModel;
	return isWebSearch ? `${displayName} + Web` : displayName;
};
