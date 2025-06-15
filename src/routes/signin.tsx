import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/signin")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	component: SignInForm,
});

export function SignInForm() {
	const navigate = useNavigate();
	const search = Route.useSearch();

	const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const formData = new FormData(e.target as HTMLFormElement);
			formData.set("flow", flow);

			if (flow === "signIn") {
				await authClient.signIn.email(
					{
						email: formData.get("email") as string,
						password: formData.get("password") as string,
					},
					{
						onSuccess: () => {
							navigate({ to: (search.redirect as string) || "/" });
						},
						onError: (error) => {
							setError(error.error.message);
						},
					},
				);
			} else {
				await authClient.signUp.email(
					{
						name: "",
						email: formData.get("email") as string,
						password: formData.get("password") as string,
					},
					{
						onSuccess: () => {
							navigate({ to: (search.redirect as string) || "/" });
						},
						onError: (error) => {
							setError(error.error.message);
						},
					},
				);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-background p-4">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>

			<div className="w-full max-w-md space-y-6">
				{/* Branding */}
				<div className="space-y-2 text-center">
					<div className="mb-4 flex items-center justify-center gap-2">
						<span className="text-2xl">💬</span>
						<div className="font-bold text-2xl text-foreground">
							<span className="text-primary">ask</span>hole
						</div>
					</div>
				</div>

				{/* Main Card */}
				<Card className="border bg-card p-4">
					<CardHeader className="space-y-1 pb-6">
						<CardTitle className="text-center font-semibold text-2xl">
							{flow === "signIn" ? "Sign In" : "Create Account"}
						</CardTitle>
						<CardDescription className="text-center text-muted-foreground">
							{flow === "signIn"
								? "Enter your email and password to access your account"
								: "Fill in your information to create a new account"}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
								<div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-destructive/20">
									<div className="h-2 w-2 rounded-full bg-destructive" />
								</div>
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-5">
							{/* Email Field */}
							<div className="space-y-2">
								<Label htmlFor="email" className="font-medium text-sm">
									Email address
								</Label>
								<div className="relative">
									<Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
									<Input
										name="email"
										type="email"
										placeholder="Enter your email"
										className="h-12 border-border bg-background pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
							</div>

							{/* Password Field */}
							<div className="space-y-2">
								<Label htmlFor="password" className="font-medium text-sm">
									Password
								</Label>
								<div className="relative">
									<Lock className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
									<Input
										name="password"
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										className="h-12 border-border bg-background pr-12 pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20"
										required
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="-translate-y-1/2 absolute top-1/2 right-2 h-8 w-8 transform p-0 hover:bg-transparent"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										) : (
											<Eye className="h-4 w-4 text-muted-foreground" />
										)}
									</Button>
								</div>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								className="group h-12 w-full bg-primary font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
								disabled={submitting}
							>
								{submitting ? (
									<div className="flex items-center gap-2">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
										Please wait...
									</div>
								) : (
									<div className="flex items-center gap-2">
										{flow === "signIn" ? "Sign In" : "Create Account"}
									</div>
								)}
							</Button>
						</form>

						{/* Separator */}
						<div className="relative">
							<Separator />
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="bg-card px-2 text-muted-foreground text-xs">
									OR
								</span>
							</div>
						</div>

						{/* Toggle Flow */}
						<div className="text-center">
							<p className="text-muted-foreground text-sm">
								{flow === "signIn"
									? "Don't have an account?"
									: "Already have an account?"}
							</p>
							<Button
								type="button"
								variant="link"
								className="h-auto p-0 font-medium text-primary hover:text-primary/80"
								onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
							>
								{flow === "signIn" ? "Create an account" : "Sign in instead"}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<p className="text-center text-muted-foreground text-xs">
					By continuing, you agree to our{" "}
					<Button variant="link" className="h-auto p-0 text-xs underline">
						Terms of Service
					</Button>{" "}
					and{" "}
					<Button variant="link" className="h-auto p-0 text-xs underline">
						Privacy Policy
					</Button>
				</p>
			</div>
		</div>
	);
}
