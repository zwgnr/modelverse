import { useEffect, useId, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { useMutation, useQuery } from "convex/react";

import { Eye, Key, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_layout/settings/api-keys")({
	component: ApiKeysSettings,
});

function ApiKeysSettings() {
	const apiKeyId = useId();

	const user = useQuery(api.auth.getCurrentUser);
	const storeKey = useMutation(api.users.storeOpenRouterKey);
	const deleteKey = useMutation(api.users.deleteOpenRouterKey);

	const [openRouterKey, setOpenRouterKey] = useState("");
	const [showKey, setShowKey] = useState(false);

	const hasApiKey = !!user?.openRouterKey;

	useEffect(() => {
		if (hasApiKey) {
			setOpenRouterKey("********************");
		} else {
			setOpenRouterKey("");
		}
	}, [hasApiKey]);

	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
			<Card className="p-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5" />
						Bring Your Own Key (BYOK)
					</CardTitle>
					<p className="pt-2 text-muted-foreground text-sm">
						Use your own OpenRouter API key for access to all models.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={apiKeyId}>OpenRouter API Key</Label>
						<div className="flex gap-2">
							<Input
								id={apiKeyId}
								type={showKey ? "text" : "password"}
								value={openRouterKey}
								onChange={(e) => setOpenRouterKey(e.target.value)}
								placeholder="Enter your OpenRouter API key"
							/>
							{!hasApiKey && (
								<Button
									variant="outline"
									size="icon"
									onClick={() => setShowKey(!showKey)}
								>
									<Eye className="h-4 w-4" />
								</Button>
							)}
						</div>
						<p className="flex items-center gap-2 pt-1 text-muted-foreground text-xs">
							<Lock className="h-3 w-3" />
							Your API key is encrypted and stored securely.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={async () => {
								await storeKey({ key: openRouterKey });
								toast.success("OpenRouter key saved!");
							}}
							disabled={!openRouterKey || openRouterKey.includes("*")}
						>
							Save Key
						</Button>
						<Button
							variant="destructive"
							onClick={async () => {
								await deleteKey();
								toast.success("OpenRouter key deleted!");
								setOpenRouterKey("");
							}}
							disabled={!hasApiKey}
						>
							Delete Key
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
