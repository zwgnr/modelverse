import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

export const Route = createFileRoute("/signin")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: SignInForm,
});

export function SignInForm() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const router = useRouter();

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
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="space-y-2 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-2xl">💬</span>
            <div className="text-foreground text-2xl font-bold">
              <span className="text-primary">ask</span>hole
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-card border p-4">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-center text-2xl font-semibold">
              {flow === "signIn" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              {flow === "signIn"
                ? "Enter your email and password to access your account"
                : "Fill in your information to create a new account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="text-destructive bg-destructive/10 border-destructive/20 flex items-center gap-2 rounded-lg border p-4 text-sm">
                <div className="bg-destructive/20 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full">
                  <div className="bg-destructive h-2 w-2 rounded-full" />
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background border-border focus:border-primary focus:ring-primary/20 h-12 pl-10 focus:ring-2"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-background border-border focus:border-primary focus:ring-primary/20 h-12 pr-12 pl-10 focus:ring-2"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 transform p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 group h-12 w-full font-medium shadow-sm transition-all duration-200"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
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
                <span className="bg-card text-muted-foreground px-2 text-xs">
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
                className="text-primary hover:text-primary/80 h-auto p-0 font-medium"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Create an account" : "Sign in instead"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-xs">
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
