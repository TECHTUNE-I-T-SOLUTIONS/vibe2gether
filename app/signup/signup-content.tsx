"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Mail, Lock, User, Calendar, Phone, MapPin, Loader2, Upload, X, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthHeader } from "@/components/auth-header"
import { VideoBackground } from "@/components/video-background"
import { useLanguage } from "@/lib/i18n/context"
import { COUNTRIES } from "@/lib/countries"

const countryCodes = [
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
]

export default function SignupContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    city: "",
    countryCode: "+1",
    mobileNumber: "",
    country: "",
    profilePicture: null as File | null,
    coverPicture: null as File | null,
    interests: [] as string[],
    lookingFor: "",
    referralCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const refCode = searchParams?.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      // Validate step 1
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match",
          variant: "destructive",
        })
        return
      }
      if (formData.password.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters",
          variant: "destructive",
        })
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      // Validate step 2 - required fields are dateOfBirth, gender, displayName only
      if (!formData.dateOfBirth || !formData.gender || !formData.displayName) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields: Date of Birth, Gender, and Display Name",
          variant: "destructive",
        })
        return
      }

      // Check age (must be 18+)
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        toast({
          title: "Age requirement",
          description: "You must be at least 18 years old to join",
          variant: "destructive",
        })
        return
      }

      setStep(3)
      return
    }

    // Final step - submit registration
    if (!agreedToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to our Terms of Service and Privacy Policy",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use FormData if profile picture is present, otherwise use JSON
      let response: Response
      
      if (formData.profilePicture || formData.coverPicture) {
        const formDataToSend = new FormData()
        formDataToSend.append("email", formData.email.toLowerCase())
        formDataToSend.append("password", formData.password)
        formDataToSend.append("fullName", formData.fullName)
        formDataToSend.append("displayName", formData.displayName || formData.fullName.split(" ")[0])
        formDataToSend.append("dateOfBirth", formData.dateOfBirth)
        formDataToSend.append("gender", formData.gender)
        formDataToSend.append("bio", formData.bio)
        formDataToSend.append("city", formData.city)
        formDataToSend.append("mobileNumber", formData.mobileNumber)
        formDataToSend.append("country", formData.country)
        formDataToSend.append("interests", JSON.stringify(formData.interests))
        formDataToSend.append("lookingFor", formData.lookingFor)
        formDataToSend.append("referralCode", formData.referralCode)
        if (formData.profilePicture) {
          formDataToSend.append("profilePicture", formData.profilePicture)
        }
        if (formData.coverPicture) {
          formDataToSend.append("coverPicture", formData.coverPicture)
        }

        response = await fetch("/api/auth/register", {
          method: "POST",
          body: formDataToSend,
        })
      } else {
        response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            password: formData.password,
            fullName: formData.fullName,
            displayName: formData.displayName || formData.fullName.split(" ")[0],
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            bio: formData.bio,
            city: formData.city,
            mobileNumber: formData.mobileNumber,
            country: formData.country,
            interests: formData.interests,
            lookingFor: formData.lookingFor,
            referralCode: formData.referralCode,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast({
        title: "Account created!",
        description: "Welcome to Vibe2Gether! Signing you in...",
      })

      // Sign in automatically
      const result = await signIn("credentials", {
        email: formData.email.toLowerCase(),
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | File | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <>
      <AuthHeader showBackButton />
      <div className="min-h-screen flex pt-20 relative overflow-hidden bg-background">
        {/* Left - Form Section */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center overflow-y-auto py-8 lg:py-0 relative z-20 bg-gradient-to-b from-background to-background/95 px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "gradient-bg" : "bg-muted"}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, delay: s * 0.1 }}
                />
              ))}
            </div>

            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">
                {step === 1 && "Create your account"}
                {step === 2 && "About you"}
                {step === 3 && "Contact & Location"}
              </h1>
              <p className="text-muted-foreground mb-8">
                {step === 1 && "Start your journey to finding meaningful connections."}
                {step === 2 && "Help us know you better for personalized matching."}
                {step === 3 && "Almost there! Add your contact details."}
              </p>
            </motion.div>
          </AnimatePresence>

          {step === 1 && (
            <>
              {/* Social Signup */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-red-400/80 hover:bg-orange-600/80"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
                {/* <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-transparent"
                  onClick={() => handleOAuthSignIn("facebook")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Continue with Facebook
                </Button> */}
              </div>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="Enter referral code to earn bonus"
                        value={formData.referralCode}
                        onChange={(e) => handleChange("referralCode", e.target.value.toUpperCase())}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    {formData.referralCode && (
                      <p className="text-xs text-green-600">✓ Referral code applied - you'll earn 20 bonus coins!</p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">You must be 18 or older to join</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name (How you'll appear to others)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="displayName"
                        placeholder="e.g., Alex, Adventure Seeker"
                        value={formData.displayName}
                        onChange={(e) => handleChange("displayName", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Optional - defaults to your first name</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Tell us about yourself)</Label>
                    <textarea
                      id="bio"
                      placeholder="Share a bit about yourself, your interests, and what you're looking for..."
                      value={formData.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      className="h-24 rounded-xl border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="city"
                        placeholder="Your city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
                    <div className="space-y-3">
                      {formData.profilePicture && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                          <img
                            src={URL.createObjectURL(formData.profilePicture)}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange("profilePicture", null)}
                            className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                            aria-label="Remove profile picture"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center justify-center h-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          id="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file size (max 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                toast({
                                  title: "File too large",
                                  description: "Profile picture must be less than 5MB",
                                  variant: "destructive",
                                })
                                return
                              }
                              handleChange("profilePicture", file)
                            }
                          }}
                          className="hidden"
                        />
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="w-4 h-4" />
                          Click to upload photo
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label>Phone Number (Optional)</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.countryCode}
                        onValueChange={(value) => handleChange("countryCode", value)}
                      >
                        <SelectTrigger className="w-[120px] h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          value={formData.mobileNumber}
                          onChange={(e) => handleChange("mobileNumber", e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                        <SelectTrigger className="h-12 rounded-xl pl-10">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              <span className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lookingFor">What are you looking for? (Optional)</Label>
                    <Select value={formData.lookingFor} onValueChange={(value) => handleChange("lookingFor", value)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select what you're looking for" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relationship">Serious Relationship</SelectItem>
                        <SelectItem value="casual">Casual Dating</SelectItem>
                        <SelectItem value="friendship">Friendship</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="not-sure">Not Sure Yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Your Interests (Optional)</Label>
                    <div className="space-y-3">
                      <textarea
                        id="interests"
                        placeholder="e.g. Travel, Music, Cooking, Gaming (comma-separated)"
                        value={formData.interests.join(", ")}
                        onChange={(e) => {
                          const interests = e.target.value
                            .split(",")
                            .map((i) => i.trim())
                            .filter((i) => i.length > 0)
                          handleChange("interests", interests)
                        }}
                        className="h-20 rounded-xl border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest, index) => (
                          <div key={index} className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm">
                            <span>{interest}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.interests.filter((_, i) => i !== index)
                                handleChange("interests", updated)
                              }}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverPicture">Cover Picture (Optional)</Label>
                    <div className="space-y-3">
                      {formData.coverPicture && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                          <img
                            src={URL.createObjectURL(formData.coverPicture)}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange("coverPicture", null)}
                            className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                            aria-label="Remove cover picture"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center justify-center h-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          id="coverPicture"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast({
                                  title: "File too large",
                                  description: "Cover picture must be less than 5MB",
                                  variant: "destructive",
                                })
                                return
                              }
                              handleChange("coverPicture", file)
                            }
                          }}
                          className="hidden"
                        />
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="w-4 h-4" />
                          Click to upload cover photo
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl gradient-bg text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : step < 3 ? (
                  "Continue"
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
          </div>
        </div>

        {/* Right - Video/Pictures Section (Hidden on Mobile) */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black/5">
          <VideoBackground />
        </div>
      </div>
    </>
  )
}
