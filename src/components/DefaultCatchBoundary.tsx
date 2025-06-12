import {  ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function DefaultCatchBoundary({ error, reset, info }: ErrorComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        <div className="mb-6">
          <img src="/images/sad-cat.webp" alt="Sad cat" className="w-72 h-72 mx-auto mb-4 rounded-lg object-cover" />
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">An unexpected error occurred.</p>
        </div>
        
        <div className="mb-6 text-left">
          <div className="mt-2 p-3 bg-muted rounded-md">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
              {error.message || "Unknown error"}
            </pre>
            {info?.componentStack && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-2">
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
            onClick={() => window.location.href = "/"} 
            className="w-full"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
} 