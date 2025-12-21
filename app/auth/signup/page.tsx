"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, ArrowLeft, Upload, X } from "lucide-react";
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
  const [step, setStep] = useState<"basic-info" | "password" | "media" | "security-questions" | "success">("basic-info")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([
    { question: PREDEFINED_QUESTIONS[0], answer: "" },
    { question: PREDEFINED_QUESTIONS[1], answer: "" },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email) {
      setError("Full name and email are required");
      return;
    }

    setStep("password");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Both password fields are required");
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

    setStep("media");
  };

  const handleMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Profile picture is required
    if (!profilePicture) {
      setError("Profile picture is required");
      return;
    }
    
    setStep("security-questions");
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile picture must be less than 5MB");
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Cover image must be less than 10MB");
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecurityQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (securityQuestions.some((q) => !q.question || !q.answer)) {
      setError("All security questions must be answered");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("fullName", fullName);
      formData.append("securityQuestions", JSON.stringify(securityQuestions));
      
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      
      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      const response = await fetch("/api/admin/auth/signup", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStep("success");
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

  const handleSecurityQuestionChange = (index: number, question: string) => {
    const updated = [...securityQuestions];
    updated[index].question = question;
    setSecurityQuestions(updated);
  };

  const handleSecurityAnswerChange = (index: number, answer: string) => {
    const updated = [...securityQuestions];
    updated[index].answer = answer;
    setSecurityQuestions(updated);
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 via-primary/10 to-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-50 duration-500">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16 animate-pulse-glow">
                <Image
                  src="/v2g-logo.png"
                  alt="Vibe2Gether"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Welcome to Vibe2Gether</h1>
            <p className="text-muted-foreground">Account Created!</p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 pointer-events-none"></div>

            <CardContent className="relative z-10 space-y-4 pt-8">
              <Alert className="bg-green-500/10 border-green-500/50 animate-in fade-in duration-500">
                <AlertDescription className="text-foreground">
                  Your admin account has been successfully created. You can now login with your credentials.
                </AlertDescription>
              </Alert>
              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500">
            Secure admin portal powered by Vibe2Gether
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden py-12">
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
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Vibe2Gether</h1>
          <p className="text-muted-foreground">Admin Registration</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-700" style={{ animationDelay: "100ms" }}>
          {["basic-info", "password", "media", "security-questions"].map((s, idx) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                step === s ? "bg-primary" : ["basic-info", "password", "media", "security-questions"].indexOf(step) > idx ? "bg-primary/40" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all hover:shadow-primary/20 hover:shadow-2xl">
          {/* Card accent border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 pointer-events-none"></div>

          <CardHeader className="space-y-3 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-center text-foreground">
                {step === "basic-info" && "Basic Information"}
                {step === "password" && "Set Password"}
                {step === "media" && "Profile Media"}
                {step === "security-questions" && "Security Questions"}
              </h2>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {step === "basic-info" && "Step 1 of 4"}
                {step === "password" && "Step 2 of 4"}
                {step === "media" && "Step 3 of 4"}
                {step === "security-questions" && "Step 4 of 4"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-4">
            {/* Step 1: Basic Info */}
            {step === "basic-info" && (
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
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
                    className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
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
                    className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-6 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                  style={{ animationDelay: "200ms" }}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="relative my-4 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "250ms" }}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card/95 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <div className="animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "300ms" }}>
                  <GoogleAuthButton disabled={isLoading} text="Sign up with Google" redirectUrl="/auth/google/callback" />
                </div>

                <div className="text-center text-sm text-muted-foreground border-t border-border/30 pt-4 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "350ms" }}>
                  Already have an account?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: Password */}
            {step === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
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
                    className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
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
                    className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("basic-info")}
                    disabled={isLoading}
                    className="flex-1 h-11 border-border/50 hover:bg-muted/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "100ms" }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "200ms" }}
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Media Upload */}
            {step === "media" && (
              <form onSubmit={handleMediaSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  Add a profile picture and cover image (optional but recommended)
                </p>

                {/* Profile Picture Upload */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  <label className="text-sm font-semibold text-foreground">Profile Picture <span className="text-destructive">*</span></label>
                  <div className="relative">
                    {profilePreview ? (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted border border-border/30">
                        <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePicture(null);
                            setProfilePreview("");
                          }}
                          title="Remove profile picture"
                          className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive p-1.5 rounded-full transition-all"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">Click to upload</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          disabled={isLoading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
                  <label className="text-sm font-semibold text-foreground">Cover Image</label>
                  <div className="relative">
                    {coverPreview ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border border-border/30">
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImage(null);
                            setCoverPreview("");
                          }}
                          title="Remove cover image"
                          className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive p-1.5 rounded-full transition-all"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all">
                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">Click to upload</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          disabled={isLoading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("password")}
                    disabled={isLoading}
                    className="flex-1 h-11 border-border/50 hover:bg-muted/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "100ms" }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "200ms" }}
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Security Questions */}
            {step === "security-questions" && (
              <form onSubmit={handleSecurityQuestionsSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  These questions will help you recover your account if needed.
                </p>

                {securityQuestions.map((q, index) => (
                  <div key={index} className="space-y-2 p-3 border border-border/30 rounded-lg bg-muted/20 transition-all duration-300 hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                    <select
                      aria-label={`Security question ${index + 1}`}
                      value={q.question}
                      onChange={(e) => handleSecurityQuestionChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-border/50 rounded-lg text-sm bg-background/50 text-foreground focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
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
                      onChange={(e) => handleSecurityAnswerChange(index, e.target.value)}
                      disabled={isLoading}
                      className="h-10 bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300 text-sm"
                    />
                  </div>
                ))}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("media")}
                    disabled={isLoading}
                    className="flex-1 h-11 border-border/50 hover:bg-muted/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "200ms" }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: "300ms" }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
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