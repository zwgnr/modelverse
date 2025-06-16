import { createFileRoute } from "@tanstack/react-router";

import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_layout/settings/security")({
	component: SecuritySettings,
}); 

function SecuritySettings() {
	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
			{/* Delete Account */}
			<Card className="border-destructive/20 p-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<Shield className="h-5 w-5" />
						Danger Zone
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						Permanently delete your account and all data
					</p>
				</CardHeader>
				<CardContent>
					<Button variant="destructive" className="w-full">
						Delete Account
					</Button>
					<p className="mt-2 text-muted-foreground text-xs">
						This action cannot be undone. All your data will be
						permanently deleted.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

