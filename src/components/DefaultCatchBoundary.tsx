import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function DefaultCatchBoundary({
	error,
	reset,
	info,
}: ErrorComponentProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md p-6 text-center">
				<div className="mb-6">
					<img
						src="/images/sad-cat.webp"
						alt="Sad cat"
						className="mx-auto mb-4 h-72 w-72 rounded-lg object-cover"
					/>
					<h2 className="mb-4 font-semibold text-2xl text-foreground">
						Something went wrong
					</h2>
					<p className="mb-6 text-muted-foreground">
						An unexpected error occurred.
					</p>
				</div>

				<div className="mb-6 text-left">
					<div className="mt-2 rounded-md bg-muted p-3">
						<pre className="whitespace-pre-wrap break-words text-muted-foreground text-xs">
							{error.message || "Unknown error"}
						</pre>
						{info?.componentStack && (
							<pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground text-xs">
								{info.componentStack}
							</pre>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<Button onClick={reset} className="w-full">
						Try Again
					</Button>
					<Button
						variant="outline"
						onClick={() => window.history.back()}
						className="w-full"
					>
						Go Back
					</Button>
					<Button
						variant="ghost"
						onClick={() => { window.location.href = "/" }}
						className="w-full"
					>
						Return Home
					</Button>
				</div>
			</div>
		</div>
	);
}
