import { useId, useState } from "react";

import { createFileRoute, useNavigate, } from "@tanstack/react-router";

import { Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_layout/settings/security")({
	component: SecuritySettings,
});

function SecuritySettings() {
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const confirmInputId = useId();
	const navigate = useNavigate();

	const handleDeleteAccount = async () => {
		if (confirmText !== "DELETE") {
			return;
		}

		setIsDeleting(true);
		try {
			const result = await authClient.deleteUser();
			if (!result.data?.success) {
				throw new Error();
			}
			navigate({ to: "/" });
		} catch (e) {
			console.error("Failed to delete account:", e);
			toast.error("Failed to delete account. Please try again.");
		}
	};

	const handleDialogClose = () => {
		setIsDialogOpen(false);
		setConfirmText("");
	};

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
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="destructive" className="w-full">
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Account
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Delete Account</DialogTitle>
								<DialogDescription>
									This action cannot be undone. This will permanently delete
									your account and all associated data including:
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<ul className="list-disc space-y-1 pl-6 text-muted-foreground text-sm">
									<li>All conversations and messages</li>
									<li>Stored API keys and settings</li>
									<li>Usage statistics</li>
									<li>Account information</li>
								</ul>
								<div className="space-y-2">
									<Label htmlFor={confirmInputId}>
										Type <strong>DELETE</strong> to confirm:
									</Label>
									<Input
										id={confirmInputId}
										value={confirmText}
										onChange={(e) => setConfirmText(e.target.value)}
										placeholder="Type DELETE to confirm"
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={handleDialogClose}>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteAccount}
									disabled={confirmText !== "DELETE" || isDeleting}
								>
									{isDeleting ? "Deleting..." : "Delete Account"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<p className="mt-2 text-muted-foreground text-xs">
						This action cannot be undone. All your data will be permanently
						deleted.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
