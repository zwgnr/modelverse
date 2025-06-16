import { createFileRoute, Link } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Planet } from "@/components/ui/svg/planet";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPolicy,
});

export function PrivacyPolicy() {
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
						<CardTitle className="text-center text-2xl">Privacy Policy</CardTitle>
						<p className="text-center text-muted-foreground text-sm">
							Last updated: {new Date().toLocaleDateString()}
						</p>
					</CardHeader>

					<CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
						<section className="space-y-3">
							<h2 className="font-semibold text-lg">1. Information We Collect</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>We collect information you provide directly to us, such as when you:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>Create an account through GitHub OAuth</li>
									<li>Use our AI model management services</li>
									<li>Contact us for support</li>
								</ul>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">2. How We Use Your Information</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>We use the information we collect to:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>Provide, maintain, and improve our services</li>
									<li>Process transactions and send related information</li>
									<li>Send technical notices and support messages</li>
									<li>Respond to your comments and questions</li>
									<li>Monitor and analyze trends and usage</li>
									<li>Detect and prevent fraudulent activities</li>
								</ul>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">3. Information Sharing</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>With your explicit consent</li>
									<li>To comply with legal obligations</li>
									<li>To protect our rights and safety</li>
									<li>With trusted service providers who assist our operations</li>
								</ul>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">4. Data Security</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>
									We implement appropriate security measures to protect your personal information against unauthorized access,
									alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
								</p>
								<p>
									<strong>API Key Security:</strong> We make significant efforts to protect API keys and sensitive credentials
									that you provide to our service. This includes encryption at rest, secure transmission protocols, and access
									controls. However, while we strive to use commercially acceptable means to protect your information, we cannot
									guarantee its absolute security.
								</p>
								<p>
									<strong>Limitation of Security Liability:</strong> You acknowledge that internet-based services carry inherent
									security risks. We shall not be liable for any unauthorized access to, alteration of, or loss of your data,
									API keys, or other information that results from circumstances beyond our reasonable control, including but not
									limited to acts of hackers, crackers, or unauthorized third parties.
								</p>
								<p>
									<strong>Your Responsibility:</strong> You are responsible for maintaining the confidentiality of your account
									credentials and API keys. We recommend regularly rotating your API keys and immediately notifying us of any
									suspected unauthorized access to your account.
								</p>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">5. GitHub OAuth</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>When you sign in with GitHub, we collect:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>Your GitHub username and public profile information</li>
									<li>Your email address associated with your GitHub account</li>
									<li>Your GitHub user ID</li>
								</ul>
								<p>We do not access your private repositories or any data beyond what is necessary for authentication.</p>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">6. Cookies and Tracking</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>We use cookies and similar technologies to:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>Maintain your login session</li>
									<li>Remember your preferences</li>
									<li>Analyze how you use our service</li>
									<li>Improve our service performance</li>
								</ul>
								<p>You can control cookie settings in your browser, but this may affect service functionality.</p>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">7. Data Retention</h2>
							<p className="text-muted-foreground">
								We retain your personal information for as long as your account is active or as needed to provide services.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">8. Your Rights</h2>
							<div className="space-y-2 text-muted-foreground">
								<p>You have the right to:</p>
								<ul className="ml-6 list-disc space-y-1">
									<li>Access your personal information</li>
									<li>Correct inaccurate information</li>
									<li>Delete your account and associated data</li>
									<li>Opt out of certain communications</li>
									<li>Data portability where technically feasible</li>
								</ul>
							</div>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">9. Children's Privacy</h2>
							<p className="text-muted-foreground">
								Our service is not intended for children under 13 years of age. We do not knowingly collect
								personal information from children under 13. If we learn we have collected such information,
								we will delete it immediately.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">10. International Data Transfers</h2>
							<p className="text-muted-foreground">
								Your information may be transferred to and maintained on computers located outside of your jurisdiction
								where data protection laws may differ. By using our service, you consent to this transfer.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">11. Changes to Privacy Policy</h2>
							<p className="text-muted-foreground">
								We may update this Privacy Policy periodically. We will notify you of any changes by posting
								the new policy on this page and updating the "Last updated" date.
							</p>
						</section>

						<section className="space-y-3">
							<h2 className="font-semibold text-lg">12. Contact Us</h2>
							<p className="text-muted-foreground">
								If you have any questions about this Privacy Policy, please contact us via Github.
							</p>
						</section>
					</CardContent>
				</Card>
			</div>
		</div>
	);
} 