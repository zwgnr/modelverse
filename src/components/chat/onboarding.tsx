import { Link } from "@tanstack/react-router";

import { ArrowRight, Key, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingProps {
  className?: string;
}

export function Onboarding({ className }: OnboardingProps) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Card className="w-full max-w-lg p-8 py-12">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
              <Key className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <p className="text-muted-foreground">
            Add your OpenRouter API key to start chatting
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-foreground text-sm leading-relaxed">
            To access AI models and start conversations, you'll need to provide your OpenRouter API key. 
            This gives you access to premium models with your own usage limits.
          </p>
          
          <div className="rounded-lg border border-border/50 bg-muted/50 p-4">
            <p className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Lock className="h-3.5 w-3.5" />
              Your API key is encrypted and stored securely
            </p>
          </div>

          <Button asChild size="lg" className="group w-full">
            <Link to="/settings/api-keys">
              Add OpenRouter API Key
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 