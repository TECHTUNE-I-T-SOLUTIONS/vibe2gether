"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight } from "lucide-react";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  // Animation trigger and auth check
  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 via-primary/10 to-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-md transform transition-all duration-700 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        {/* Logo and Header Section */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16 animate-pulse-glow">
              <Image
                src="/v2g-logo.png"
                alt="Vibe2Gether"
                loading="eager"                
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Vibe2Gether</h1>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all hover:shadow-primary/20 hover:shadow-2xl">
          {/* Card accent border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 pointer-events-none"></div>

          <CardHeader className="space-y-3 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-center text-foreground">Welcome Back</h2>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Sign in to your admin account
              </p>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@vibe2gether.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300 placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "200ms" }}>
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300 placeholder:text-muted-foreground/60"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-6 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                style={{ animationDelay: "300ms" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative my-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "350ms" }}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card/95 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "400ms" }}>
                <GoogleAuthButton disabled={isLoading} />
              </div>

              <div className="text-center text-sm text-muted-foreground border-t border-border/30 pt-4 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "450ms" }}>
                Don't have an account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                >
                  Create one
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "500ms" }}>
          Secure admin portal powered by Vibe2Gether
        </p>
      </div>
    </div>
  );
}
