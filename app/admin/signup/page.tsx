"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/google-auth-button";

interface SecurityQuestion {
  question: string;
  answer: string;
}

const PREDEFINED_QUESTIONS = [
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first pet?",
  "What is your favorite book?",
  "What was your first car model?",
];

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>(
    [
      { question: PREDEFINED_QUESTIONS[0], answer: "" },
      { question: PREDEFINED_QUESTIONS[1], answer: "" },
    ]
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password || !fullName) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (
      securityQuestions.some((q) => !q.question || !q.answer)
    ) {
      setError("All security questions must be answered");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          securityQuestions,
        }),
      });

      if (response.ok) {
        // Redirect to login
        router.push("/auth/login?created=true");
      } else {
        const data = await response.json();
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityQuestionChange = (
    index: number,
    question: string
  ) => {
    const updated = [...securityQuestions];
    updated[index].question = question;
    setSecurityQuestions(updated);
  };

  const handleSecurityAnswerChange = (
    index: number,
    answer: string
  ) => {
    const updated = [...securityQuestions];
    updated[index].answer = answer;
    setSecurityQuestions(updated);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Admin Signup</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a new admin account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-3 block">
                Security Questions (for password recovery)
              </label>

              {securityQuestions.map((q, index) => (
                <div key={index} className="space-y-2 mb-4 p-3 border rounded">
                  <select
                    value={q.question}
                    onChange={(e) =>
                      handleSecurityQuestionChange(index, e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded text-sm"
                    disabled={isLoading}
                  >
                    {PREDEFINED_QUESTIONS.map((question) => (
                      <option key={question} value={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="text"
                    placeholder="Your answer"
                    value={q.answer}
                    onChange={(e) =>
                      handleSecurityAnswerChange(index, e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card/95 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <GoogleAuthButton disabled={isLoading} text="Sign up with Google" redirectUrl="/auth/google/callback" />

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
