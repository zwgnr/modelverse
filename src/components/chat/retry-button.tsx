import { useState } from "react";

import type { Infer } from "convex/values";

import { Check, RotateCcw } from "lucide-react";

import { models } from "@/lib/models";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AnthropicIcon } from "@/components/ui/svg/anthropic";
import { DeepSeek } from "@/components/ui/svg/deepseek";
import { GeminiIcon } from "@/components/ui/svg/gemini";
import { OpenAIIcon } from "@/components/ui/svg/openai";
import xAIGrok from "@/components/ui/svg/xia";

import type { modelId } from "../../../convex/schema";

interface RetryButtonProps {
  onRetry: (model: Infer<typeof modelId>) => void;
  currentModel?: string;
  disabled?: boolean;
}

// Provider icons mapping
const providerIcons = {
  OpenAI: OpenAIIcon,
  Anthropic: AnthropicIcon,
  Google: GeminiIcon,
  "X.AI": xAIGrok,
  DeepSeek: DeepSeek,
};

// Company icon colors for selected state
const companyIconColors = {
  OpenAI: "text-emerald-500",
  Anthropic: "text-orange-500",
  Google: "text-blue-500",
  "X.AI": "text-purple-500",
  DeepSeek: "text-cyan-500",
};

// Company accent colors for indicators
const companyAccentColors = {
  OpenAI: "bg-emerald-500",
  Anthropic: "bg-orange-500",
  Google: "bg-blue-500",
  "X.AI": "bg-purple-500",
  DeepSeek: "bg-cyan-500",
};

export function RetryButton({ onRetry, currentModel, disabled }: RetryButtonProps) {
  const [open, setOpen] = useState(false);

  const handleRetry = (model: Infer<typeof modelId>) => {
    onRetry(model);
    setOpen(false);
  };

  // Group models by company
  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.company]) {
        acc[model.company] = [];
      }
      acc[model.company].push(model);
      return acc;
    },
    {} as Record<string, typeof models>,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Retry with different model"
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Retry with different model"
        >
          <RotateCcw size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command className="rounded-lg border border-border">
          <div className="border-border border-b px-3 py-2">
            <div className="font-medium text-sm">Retry with different model</div>
          </div>
          <CommandInput placeholder="Search models..." className="border-0" />
          <CommandList className="max-h-80">
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
                  const isSelected = currentModel === model.id;
                  const ProviderIcon = providerIcons[model.company];

                  return (
                    <CommandItem
                      key={model.id}
                      value={`${model.company} ${model.name} ${model.description || ""}`}
                      onSelect={() => handleRetry(model.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-center gap-3">
                        <div className="flex size-8 items-center justify-center">
                          {ProviderIcon && (
                            <ProviderIcon
                              className={cn(
                                "size-5",
                                isSelected
                                  ? companyIconColors[model.company]
                                  : "text-muted-foreground",
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {model.name}
                            </span>
                            {isSelected && (
                              <Check
                                className={cn(
                                  "h-3 w-3",
                                  companyIconColors[model.company],
                                )}
                              />
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