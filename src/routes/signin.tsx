
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSignIn, useSignUp } from "@clerk/tanstack-react-start";

export const Route = createFileRoute('/signin')({
  component: SignInForm,
});

export function SignInForm() {
 // const { signIn } = useAuthActions();
 // const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set("flow", flow);
      
      if (flow === "signIn") {
        const result = await signIn?.create({
          identifier: formData.get("email") as string,
          password: formData.get("password") as string,
        });
        console.log("result", result);
        if (result?.status === "complete") {
          // Sign in successful, redirect to home page
          navigate({ to: "/" });
        }
      } else {
        const result = await signUp?.create({
          emailAddress: formData.get("email") as string,
          password: formData.get("password") as string,
        });
        
        if (result?.status === "complete") {
          // Sign up successful, redirect to home page
          navigate({ to: "/" });
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  // if (isAuthenticated) {
  //   return <Navigate to="." />;
  // }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 relative">
      {/* <div id="clerk-captcha" /> */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
     
      <div className="w-full max-w-md space-y-8">

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              {flow === "signIn" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {flow === "signIn"
                ? "Enter your email and password to access your account"
                : "Fill in your information to create a new account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
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
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-12 h-12 bg-background/50 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {flow === "signIn" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>
            </div>

            {/* Toggle Flow */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Create an account" : "Sign in instead"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Button variant="link" className="p-0 h-auto text-xs underline">
            Terms of Service
          </Button>{" "}
          and{" "}
          <Button variant="link" className="p-0 h-auto text-xs underline">
            Privacy Policy
          </Button>
        </p>
      </div>
    </div>
  );
}
