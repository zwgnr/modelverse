import { Bot, Brain, Zap, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { atom } from "jotai";

export interface Model {
  id: string;
  name: string;
  icon?: ComponentType;
  description?: string;
  company: "OpenAI" | "Anthropic" | "Google" | "X.AI";
}

export const models: Model[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "4o mini",
    icon: Bot,
    description: "Fast and efficient for most tasks",
    company: "OpenAI",
  },
  {
    id: "openai/chatgpt-4o-latest",
    name: "4o",
    icon: Brain,
    description: "Latest and most capable ChatGPT model",
    company: "OpenAI",
  },
  {
    id: "openai/gpt-4.1",
    name: "4.1",
    icon: Brain,
    description: "Advanced reasoning and problem-solving",
    company: "OpenAI",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    icon: Zap,
    description: "Powerful reasoning and analysis",
    company: "Anthropic",
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    icon: Sparkles,
    description: "Google's fast multimodal AI model",
    company: "Google",
  },
  {
    id: "x-ai/grok-3-beta",
    name: "Grok 3",
    icon: Zap,
    description: "X.AI's latest conversational AI model",
    company: "X.AI",
  },
];

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

// Regular jotai atom for selected model (client-side routing preserves state)
export const selectedModelAtom = atom(DEFAULT_MODEL);

// Helper function to group models by company
export const getModelsByCompany = () => {
  return models.reduce((acc, model) => {
    if (!acc[model.company]) {
      acc[model.company] = [];
    }
    acc[model.company].push(model);
    return acc;
  }, {} as Record<string, Model[]>);
};

// Helper function to get display model name
export const getModelDisplayName = (modelId: string): string | null => {
  if (!modelId) return null;

  // Remove :online suffix for display
  const baseModel = modelId.replace(":online", "");
  const isWebSearch = modelId.includes(":online");

  const modelNames: Record<string, string> = {
    "openai/gpt-4o-mini": "GPT-4o mini",
    "openai/chatgpt-4o-latest": "GPT-4o",
    "openai/gpt-4.1": "GPT-4.1",
    "anthropic/claude-sonnet-4": "Claude Sonnet 4",
    "google/gemini-2.5-flash-preview-05-20": "Gemini 2.5 Flash",
    "x-ai/grok-3-beta": "Grok 3",
  };

  const displayName = modelNames[baseModel] || baseModel;
  return isWebSearch ? `${displayName} + Web` : displayName;
};
