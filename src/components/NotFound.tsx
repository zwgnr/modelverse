import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md p-6 text-center">
				<div className="mb-8">
					<h1 className="mb-2 font-bold text-4xl text-foreground">404</h1>
					<h2 className="mb-4 font-semibold text-2xl text-foreground">
						Page Not Found
					</h2>
					<p className="mb-6 text-muted-foreground">
						I was trained on everything... except this page.
					</p>
				</div>

				<div className="space-y-3">
					<Button asChild className="w-full">
						<Link to="/">Go Home</Link>
					</Button>
					<Button
						variant="outline"
						onClick={() => window.history.back()}
						className="w-full"
					>
						Go Back
					</Button>
				</div>
			</div>
		</div>
	);
}
