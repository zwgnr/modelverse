import { z } from "zod";

// Validation schema for personality traits
export const personalityTraitSchema = z
	.string()
	.min(1, "Trait cannot be empty")
	.max(100, "Trait must be 100 characters or less")
	.trim();

export const personalityTraitsSchema = z
	.array(personalityTraitSchema)
	.max(50, "Maximum 50 personality traits allowed");

// Validation schema for custom instructions
export const customInstructionsSchema = z
	.string()
	.max(3000, "Custom instructions must be 3000 characters or less");

// Combined customization schema
export const customizationSchema = z.object({
	defaultModel: z.string().optional(),
	personalityTraits: personalityTraitsSchema.optional(),
	customInstructions: customInstructionsSchema.optional(),
});

export type CustomizationData = z.infer<typeof customizationSchema>;

// Helper function to validate a single trait
export function validatePersonalityTrait(trait: string): {
	success: boolean;
	error?: string;
} {
	try {
		personalityTraitSchema.parse(trait);
		return { success: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		return { success: false, error: "Invalid trait" };
	}
}

// Helper function to validate traits array
export function validatePersonalityTraits(traits: string[]): {
	success: boolean;
	error?: string;
} {
	try {
		personalityTraitsSchema.parse(traits);
		return { success: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		return { success: false, error: "Invalid traits" };
	}
}

// Helper function to validate custom instructions
export function validateCustomInstructions(instructions: string): {
	success: boolean;
	error?: string;
} {
	try {
		customInstructionsSchema.parse(instructions);
		return { success: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		return { success: false, error: "Invalid instructions" };
	}
}
