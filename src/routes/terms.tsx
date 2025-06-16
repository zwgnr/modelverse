import { createFileRoute, Link } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Planet } from "@/components/ui/svg/planet";

export const Route = createFileRoute("/terms")({
	component: TermsOfService,
});

export function TermsOfService() {
	return (
		<div className="relative min-h-screen bg-background p-4">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>

			<div className="mx-auto max-w-4xl space-y-6 py-8">
				{/* Header */}
				<div className="space-y-4">
					<Link to="/signin">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Sign In
						</Button>
					</Link>

					<div className="flex items-center justify-center gap-2">
						<Planet />
						<div className="font-bold text-3xl text-foreground">
							<span className="text-primary">modelverse</span>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<Card className="border bg-card p-4">
					<CardHeader>
						<CardTitle className="text-center text-2xl">Terms of Service</CardTitle>
						<p className="text-center text-muted-foreground text-sm">
							Last updated: {new Date().toLocaleDateString()}
						</p>
					</CardHeader>

					<CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
						<section className="space-y-3">
							<h2 className="font-semibold text-lg">1. Acceptance of Terms</h2>
							<p className="text-muted-foreground">
								By accessing and using modelverse, you accept and agree to be bound by the terms and provision of this agreement.
								If you do not agree to abide by the above, please do not use this service.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">2. Description of Service</h2>
							<p className="text-muted-foreground">
								modelverse is a platform that provides a multi-model AI chat interface powered by open router. We reserve the right to modify,
								suspend, or discontinue the service at any time without notice.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">3. User Accounts</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>When you create an account with us, you must provide information that is accurate and complete.</p>
								<p>You are responsible for safeguarding your account and all activities that occur under your account.</p>
								<p>You must not use your account for any illegal or unauthorized purpose.</p>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">4. Acceptable Use</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>You agree not to use the service:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
									<li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
									<li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
									<li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
									<li>To submit false or misleading information</li>
								</ul>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">5. Intellectual Property</h2>
							<p className="text-muted-foreground">
								The service and its original content, features, and functionality are and will remain the exclusive property of
								modelverse and its licensors. The service is protected by copyright, trademark, and other laws.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">6. Privacy Policy</h2>
							<p className="text-muted-foreground">
								Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service,
								to understand our practices.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">7. Termination</h2>
							<p className="text-muted-foreground">
								We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability,
								under our sole discretion, for any reason whatsoever including breach of the Terms.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">8. Limitation of Liability</h2>
							<p className="text-muted-foreground">
								In no event shall modelverse, nor its directors, employees, partners, agents, suppliers, or affiliates,
								be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation,
								loss of profits, data, use, goodwill, or other intangible losses.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">9. Changes to Terms</h2>
							<p className="text-muted-foreground">
								We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
								If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">10. Contact Information</h2>
							<p className="text-muted-foreground">
								If you have any questions about these Terms of Service, please reach out via Github.
							</p>
						</section>
					</CardContent>
				</Card>
			</div>
		</div>
	);
} 