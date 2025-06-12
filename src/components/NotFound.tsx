import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md p-6 text-center">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">404</h1>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
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
