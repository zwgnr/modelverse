import { useId, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation, useQuery } from "convex/react";

import { Bot, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { models } from "@/lib/models";
import { cn } from "@/lib/utils";
import {
	customizationSchema,
	validateCustomInstructions,
	validatePersonalityTrait,
	validatePersonalityTraits,
} from "@/lib/validation";

import { ModelPicker } from "@/components/chat/model-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { api } from "../../../../convex/_generated/api";

// Preset personality traits
const PRESET_TRAITS = [
	"Helpful",
	"Concise",
	"Creative",
	"Technical",
	"Friendly",
];

export const Route = createFileRoute("/_layout/settings/customize")({
	component: CustomizationSettings,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.users.getCustomization, {}),
		);
	},
});

function CustomizationSettings() {
	const traitsId = useId();
	const customInstructionsId = useId();

	const customization = useQuery(api.users.getCustomization);
	const updateCustomization = useMutation(api.users.updateCustomization);

	const [unsavedChanges, setUnsavedChanges] = useState<{
		defaultModel?: string;
		personalityTraits?: string[];
		customInstructions?: string;
	}>({});
	const [isSaving, setIsSaving] = useState(false);
	const [newTrait, setNewTrait] = useState("");

	// Get current values (saved + unsaved changes)
	const currentDefaultModel =
		unsavedChanges.defaultModel ?? customization?.defaultModel ?? models[0].id;
	const currentPersonalityTraits =
		unsavedChanges.personalityTraits ?? customization?.personalityTraits ?? [];
	const currentCustomInstructions =
		unsavedChanges.customInstructions ??
		customization?.customInstructions ??
		"";

	const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

	const handleSave = async () => {
		if (!hasUnsavedChanges) return;

		// Validate all data before saving
		const validation = customizationSchema.safeParse(unsavedChanges);
		if (!validation.success) {
			const errorMessage = validation.error.errors[0].message;
			toast.error(errorMessage);
			return;
		}

		setIsSaving(true);
		try {
			await updateCustomization(unsavedChanges);
			setUnsavedChanges({});
			toast.success("Settings saved successfully!");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save settings. Please try again.",
			);
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		setUnsavedChanges({});
		setNewTrait("");
	};

	const addTrait = (trait: string) => {
		if (!trait.trim()) return;

		// Validate single trait
		const traitValidation = validatePersonalityTrait(trait);
		if (!traitValidation.success) {
			toast.error(traitValidation.error);
			return;
		}

		// Check for duplicates
		if (currentPersonalityTraits.includes(trait.trim())) {
			toast.error("This trait is already added");
			return;
		}

		const updatedTraits = [...currentPersonalityTraits, trait.trim()];

		// Validate the entire traits array
		const traitsValidation = validatePersonalityTraits(updatedTraits);
		if (!traitsValidation.success) {
			toast.error(traitsValidation.error);
			return;
		}

		setUnsavedChanges((prev) => ({
			...prev,
			personalityTraits: updatedTraits,
		}));
		setNewTrait("");
	};

	const removeTrait = (traitToRemove: string) => {
		const updatedTraits = currentPersonalityTraits.filter(
			(trait) => trait !== traitToRemove,
		);
		setUnsavedChanges((prev) => ({
			...prev,
			personalityTraits: updatedTraits,
		}));
	};

	const addPresetTrait = (trait: string) => {
		addTrait(trait);
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
			{/* AI Configuration */}
			<Card className="p-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bot className="h-5 w-5" />
						Customize
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Default Model */}
					<div className="space-y-2">
						<Label htmlFor="default-model">Default Model</Label>
						<ModelPicker
							value={currentDefaultModel}
							onValueChange={(value) =>
								setUnsavedChanges((prev) => ({ ...prev, defaultModel: value }))
							}
						/>
						<p className="text-muted-foreground text-xs">
							This will be the default model for new conversations. You can
							still change the model within individual chats.
						</p>
					</div>

					{/* Personality Traits */}
					<div className="space-y-3">
						<Label htmlFor={traitsId}>
							Personality Traits ({currentPersonalityTraits.length}/50)
						</Label>

						{/* Current traits */}
						{currentPersonalityTraits.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{currentPersonalityTraits.map((trait) => (
									<Badge
										key={trait}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{trait}
										<button
											type="button"
											onClick={() => removeTrait(trait)}
											className="ml-1 text-muted-foreground hover:text-foreground"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}

						{/* Add new trait */}
						<div className="flex gap-2">
							<Input
								id={traitsId}
								placeholder="Add a custom trait..."
								value={newTrait}
								onChange={(e) => setNewTrait(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTrait(newTrait);
									}
								}}
								maxLength={100}
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => addTrait(newTrait)}
								disabled={
									!newTrait.trim() || currentPersonalityTraits.length >= 50
								}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						{/* Preset traits */}
						{PRESET_TRAITS.slice(0, 5).filter(
							(trait) => !currentPersonalityTraits.includes(trait),
						).length > 0 && (
							<div className="space-y-2">
								<p className="text-muted-foreground text-sm">Quick add:</p>
								<div className="flex flex-wrap gap-2">
									{PRESET_TRAITS.slice(0, 5)
										.filter(
											(trait) => !currentPersonalityTraits.includes(trait),
										)
										.map((trait) => (
											<Badge
												key={trait}
												variant="outline"
												className={cn(
													"cursor-pointer hover:bg-secondary",
													currentPersonalityTraits.length >= 50 &&
														"cursor-not-allowed opacity-50",
												)}
												onClick={() =>
													currentPersonalityTraits.length < 50 &&
													addPresetTrait(trait)
												}
											>
												{trait}
											</Badge>
										))}
								</div>
							</div>
						)}

						<p className="text-muted-foreground text-xs">
							Define personality traits to shape how the AI responds. Max 50
							traits, 100 characters each.
						</p>
					</div>

					{/* Custom Instructions */}
					<div className="space-y-2">
						<Label htmlFor={customInstructionsId}>
							Custom Instructions ({currentCustomInstructions.length}/3000)
						</Label>
						<Textarea
							id={customInstructionsId}
							placeholder="Enter specific instructions for how the AI should assist you..."
							className="min-h-[120px]"
							value={currentCustomInstructions}
							onChange={(e) => {
								const value = e.target.value;
								const validation = validateCustomInstructions(value);
								if (validation.success) {
									setUnsavedChanges((prev) => ({
										...prev,
										customInstructions: value,
									}));
								} else {
									// Still allow typing but show error on save
									setUnsavedChanges((prev) => ({
										...prev,
										customInstructions: value,
									}));
								}
							}}
							maxLength={3000}
						/>
						<p className="text-muted-foreground text-xs">
							Provide detailed instructions for how the AI should help you with
							tasks. Max 3000 characters.
						</p>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							onClick={handleSave}
							disabled={isSaving || !hasUnsavedChanges}
						>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
						<Button
							variant="outline"
							onClick={handleReset}
							disabled={!hasUnsavedChanges}
						>
							Reset Changes
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
