import { Bot, Brain, Zap, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { atom } from "jotai";

export interface Model {
  id: string;
  name: string;
  icon?: ComponentType;
  description?: string;
}

export const models: Model[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "4o mini",
    icon: Bot,
    description: "Fast and efficient for most tasks",
  },
  {
    id: "openai/chatgpt-4o-latest",
    name: "4o",
    icon: Brain,
    description: "Latest and most capable ChatGPT model",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    icon: Zap,
    description: "Powerful reasoning and analysis",
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    icon: Sparkles,
    description: "Google's fast multimodal AI model",
  },
];

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

// Jotai atom for selected model
export const selectedModelAtom = atom(DEFAULT_MODEL);

// Helper function to get display model name
export const getModelDisplayName = (modelId: string): string | null => {
  if (!modelId) return null;

  // Remove :online suffix for display
  const baseModel = modelId.replace(":online", "");
  const isWebSearch = modelId.includes(":online");

  const modelNames: Record<string, string> = {
    "openai/gpt-4o-mini": "GPT-4o mini",
    "openai/chatgpt-4o-latest": "GPT-4o",
    "anthropic/claude-sonnet-4": "Claude Sonnet",
    "google/gemini-2.5-flash-preview-05-20": "Gemini 2.5 Flash",
  };

  const displayName = modelNames[baseModel] || baseModel;
  return isWebSearch ? `${displayName} + Web` : displayName;
};
