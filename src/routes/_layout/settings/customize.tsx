import { useId } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_layout/settings/customize")({
	component: CustomizationSettings,
}); 

function CustomizationSettings() {
	const assistantNameId = useId();
	const traitsId = useId();
	const customInstructionsId = useId();

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
		</div>
	)
}

