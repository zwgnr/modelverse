import { useEffect, useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Github } from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Planet } from "@/components/ui/svg/planet";

export const Route = createFileRoute("/signin")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	component: SignInForm,
});

export function SignInForm() {
	const navigate = useNavigate();
	const search = Route.useSearch();

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Set page title for signin page
	useEffect(() => {
		document.title = "modelverse";
	}, []);

	const handleGitHubSignIn = async () => {
		setSubmitting(true);
		setError(null);

		try {
			await authClient.signIn.social(
				{
					provider: "github",
					callbackURL: "/"
				},
				{
					onSuccess: () => {
					},
					onError: (error) => {
						setError(error.error.message);
					},
					onSettled: () => {
						setSubmitting(false);
					},
				},
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "GitHub sign in failed");
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-background p-4">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>

			<div className="flex w-full max-w-md flex-col items-center gap-4 space-y-6">
				<div className="flex flex-col items-center gap-4">
				{/* Branding */}
				<div className="space-y-2 text-center">
					<div className="mb-4 flex items-center justify-center gap-2">
						<Planet />
						<div className="font-bold text-3xl text-foreground">
							<span className="text-primary">modelverse</span>
						</div>
					</div>
				</div>

						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
								<div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-destructive/20">
									<div className="h-2 w-2 rounded-full bg-destructive" />
								</div>
								{error}
							</div>
						)}

						{/* GitHub Sign In */}
						<Button
							type="button"
							className="group h-12 w-56 border-border font-medium transition-all duration-200"
							onClick={handleGitHubSignIn}
							disabled={submitting}
						>
							{submitting ? (
								<div className="flex items-center gap-2">
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
									Please wait...
								</div>
							) : (
								<div className="flex items-center gap-2">
									<Github className="h-5 w-5" />
									Continue with GitHub
								</div>
							)}
						</Button>
						</div>
				{/* Footer */}
				<p className="text-center text-muted-foreground text-xs">
					By continuing, you agree to our{" "}
					<Link to="/terms">
						<Button variant="link" className="h-auto p-0 text-xs underline">
							Terms of Service
						</Button>
					</Link>{" "}
					and{" "}
					<Link to="/privacy">
						<Button variant="link" className="h-auto p-0 text-xs underline">
							Privacy Policy
						</Button>
					</Link>
				</p>
			</div>
		</div>
	);
}
