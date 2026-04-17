"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Coins,
  GraduationCap,
  Heart,
  MessageCircle,
  TrendingUp,
  Users2,
  Zap,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "Many", label: "Young professionals reached" },
  { value: "50+", label: "Meaningful connections made" },
  { value: "20+", label: "Opportunities unlocked" },
]

const features = [
  {
    icon: Users2,
    title: "Network and Connect",
    description: "Chat and connect with like-minded individuals. Build meaningful relationships in a supportive community where everyone is committed to growth.",
  },
  {
    icon: BookOpen,
    title: "Grow Your Skills",
    description: "Access curated resources, expert insights, and practical knowledge to accelerate your professional development and business growth.",
  },
  {
    icon: Briefcase,
    title: "Unlock Opportunities",
    description: "Discover internships, jobs, collaborations, and funding opportunities tailored to your profile and career aspirations.",
  },
  {
    icon: Coins,
    title: "Earn & Grow",
    description: "Turn your contributions into real rewards. Earn coins for engagement and unlock premium features while building your influence.",
  },
]

const opportunities = [
  {
    title: "Freelance Social Media Manager",
    company: "Freelance Gig",
    location: "Remote",
    type: "Active Users: Experienced Profiles",
    path: "/opportunities",
  },
  {
    title: "Business Grant for Women Entrepreneurs",
    company: "Business Grant for Women Entrepreneurs",
    location: "Open Worldwide",
    type: "Startup Support • Gigs",
    path: "/opportunities",
  },
  {
    title: "Digital Marketing Internship",
    company: "Digital Marketing Inc",
    location: "Hybrid • Lagos",
    type: "Internship • Gigs",
    path: "/opportunities",
  },
]

const successSteps = [
  {
    number: 1,
    title: "Join the Community",
    description: "Sign up, create your profile with skills and interests.",
  },
  {
    number: 2,
    title: "Discover Opportunities",
    description: "Find jobs, internships, funding and learning resources.",
  },
  {
    number: 3,
    title: "Build Your Network",
    description: "Connect with communities, learn, and grow together.",
  },
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const hasRedirected = useRef(false)


  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.replace("/dashboard/feed")
    }
  }, [status, session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading Vibe2Gether...
      </div>
    )
  }

  if (status === "authenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,119,163,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(143,107,255,0.14),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#ffffff_36%,_#fff7f4_100%)] text-foreground dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,95,149,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(130,104,255,0.14),_transparent_24%),linear-gradient(180deg,_#0d0d0f_0%,_#121218_42%,_#17111c_100%)]">
      <Header />
      <main className="overflow-x-hidden pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Text Content */}
            <div className="flex flex-col justify-center">
              {/* Tagline */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium shadow-[0_20px_60px_rgba(255,108,157,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
                <Zap className="h-4 w-4 text-primary" />
                Africa's premium social hub for growth
              </div>

              {/* Main Heading */}
              <h1 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
                Your Community Hub for
                <span className="block bg-[linear-gradient(135deg,#ff5f95_0%,#ff8a45_55%,#8268ff_100%)] bg-clip-text text-transparent">
                  Networking & Knowledge
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-7 text-lg leading-8 text-muted-foreground sm:text-xl">
                <span className="font-semibold text-foreground">Learn, Connect, and Earn!</span> Vibe2Gether is your platform for growth and opportunity.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-13 rounded-full px-8 text-base font-semibold shadow-[0_20px_50px_rgba(255,90,145,0.28)]">
                  <Link href="/signup">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-full border-white/70 bg-white/70 px-8 text-base shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                >
                  <Link href="/opportunities">Explore Opportunities</Link>
                </Button>
              </div>

              {/* Stats inline */}
              {/* <div className="mt-10 flex gap-6 sm:gap-8">
                {stats.map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-3xl font-black text-primary">{stat.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                ))}
              </div> */}
            </div>

            {/* Right: Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-[32px] shadow-[0_40px_120px_rgba(255,95,149,0.20)]">
                {/* Top-left gradient accent */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl pointer-events-none" />
                {/* Bottom-right gradient accent */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                
                <Image
                  src="/home/people.jpg"
                  alt="Young professionals collaborating on Vibe2Gether"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover rounded-[32px]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section - Mobile visible, hidden on large screens */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:hidden">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(255,108,157,0.10)] transition-all duration-300 hover:shadow-[0_30px_100px_rgba(255,108,157,0.16)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <p className="text-5xl font-black bg-[linear-gradient(135deg,#ff5f95_0%,#ff8a45_55%,#8268ff_100%)] bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-base font-medium text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Four Pillars Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">How It All Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Experience the four pillars of Vibe2Gether</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(255,108,157,0.10)] transition-all duration-300 hover:shadow-[0_30px_100px_rgba(255,108,157,0.16)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 p-4 text-primary transition-transform duration-300 group-hover:scale-110 dark:from-primary/25 dark:to-primary/15">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="text-2xl font-bold tracking-[-0.02em]">{feature.title}</h3>

                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                      {feature.description}
                    </p>

                    <div className="mt-6 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15">
                      Step {index + 1}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Opportunities Showcase Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start mb-12">
            {/* Left: Opportunities showcase */}
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Real Opportunities</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Internships, Jobs & Collaborations Await
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Discover opportunities that match your skills and aspirations. From entry-level roles to advanced collaborations.
              </p>
              
              {/* Opportunities grid on left */}
              <div className="grid gap-4 mt-8 md:grid-cols-2">
                {opportunities.map((opp, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-[20px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_60px_rgba(255,108,157,0.08)] transition-all duration-300 hover:shadow-[0_24px_80px_rgba(255,108,157,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_16px_60px_rgba(0,0,0,0.24)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative">
                      <div className="inline-block rounded-lg bg-primary/15 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                        {opp.type.split(' • ')[0]}
                      </div>
                      
                      <h3 className="mt-3 text-base font-bold line-clamp-2">{opp.title}</h3>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{opp.company}</p>
                      
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {opp.location}
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="mt-4 w-full rounded-lg text-xs group-hover:shadow-md"
                      >
                        <Link href={opp.path}>
                          Apply Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image showcase */}
            <div className="hidden lg:block relative">
              <div className="relative overflow-hidden rounded-[28px] shadow-[0_40px_120px_rgba(255,95,149,0.20)]">
                {/* Gradient accents */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-primary/25 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                <Image
                  src="/home/pexels-jep-gambardella.jpg"
                  alt="Team collaboration discovering opportunities"
                  width={500}
                  height={600}
                  className="w-full h-auto object-cover rounded-[28px]"
                />
              </div>
            </div>
          </div>

          {/* Bottom button - visible on mobile */}
          <div className="flex lg:hidden justify-center mt-8">
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/opportunities">
                Browse All Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Desktop centered button */}
          <div className="hidden lg:flex justify-center mt-12">
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/opportunities">
                Browse All Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,#fff5fa_0%,#f7f2ff_54%,#fff7ee_100%)] p-8 shadow-[0_28px_90px_rgba(130,104,255,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.14)_0%,rgba(130,104,255,0.14)_55%,rgba(255,168,66,0.08)_100%)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Real Stories</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Their Vibe2Gether Journey</h2>
              <p className="mt-4 text-lg text-muted-foreground">See how members turned connections into real growth and opportunities</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {successSteps.map((step) => {
                const icons = [Users2, Briefcase, Heart]
                const StepIcon = icons[step.number - 1]
                
                return (
                  <div key={step.number} className="relative group">
                    {/* Connection lines between steps */}
                    {step.number < 3 && (
                      <div className="absolute top-16 -right-3 h-0.5 w-6 bg-gradient-to-r from-primary/40 to-transparent hidden md:block" />
                    )}

                    <div className="rounded-[24px] border border-white/70 bg-white/90 p-8 shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:hover:shadow-lg">
                      {/* Step circle with icon */}
                      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/20 group-hover:from-primary/40 group-hover:to-primary/30 transition-all duration-300 dark:from-primary/40 dark:to-primary/25">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-primary/60">Step</span>
                          <span className="text-xl font-black text-primary">{step.number}</span>
                        </div>
                      </div>

                      {/* Step icon */}
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 dark:bg-primary/20">
                        <StepIcon className="h-6 w-6 text-primary" />
                      </div>

                      {/* Step title */}
                      <h3 className="text-lg font-bold text-foreground">{step.title}</h3>

                      {/* Step description */}
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                      {/* Tip for step 2 */}
                      {step.number === 2 && (
                        <div className="mt-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 text-xs font-medium text-primary dark:bg-gradient-to-r dark:from-primary/15 dark:to-primary/10 dark:border-primary/30 flex items-start gap-2">
                          <span className="text-sm flex-shrink-0">💡</span>
                          <span className="flex-1">Customize your profile to attract the right connections and opportunities</span>
                        </div>
                      )}

                      {/* Call to action chevron */}
                      <div className="mt-6 pt-6 border-t border-white/50 dark:border-white/10 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest font-semibold text-primary/60">Learn more</span>
                        <ArrowRight className="h-4 w-4 text-primary/60 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Content Creation & Earning Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,_rgba(255,95,149,0.05)_0%,_rgba(130,104,255,0.05)_55%,_rgba(255,168,66,0.03)_100%)] p-8 shadow-[0_28px_90px_rgba(130,104,255,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.08)_0%,rgba(130,104,255,0.08)_55%,rgba(255,168,66,0.05)_100%)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Creator Economy</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Share, Inspire & Monetize
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  Every post, every story, every insight has value. Share your expertise and earn coins as your content resonates with the community. Watch your influence grow and unlock new opportunities.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/25">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-medium">Post to feed and earn coins instantly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/25">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-medium">Your engagement drives marketplace visibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/25">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-medium">Premium members unlock higher earning rates</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-[28px] bg-white/85 p-8 shadow-md dark:bg-white/6">
                <h3 className="text-xl font-bold mb-6">Content Types That Earn</h3>
                <div className="space-y-4">
                  {[
                    { icon: MessageCircle, title: "Discussions", desc: "Share insights & get feedback" },
                    { icon: GraduationCap, title: "Learning Highlights", desc: "Document your growth journey" },
                    { icon: Briefcase, title: "Success Stories", desc: "Inspire others with your wins" },
                    { icon: Heart, title: "Community Support", desc: "Help others get recognized" },
                  ].map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <div key={idx} className="flex items-start gap-4 pb-4 border-b border-white/30 dark:border-white/10 last:pb-0 last:border-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary dark:bg-primary/25">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Highlights Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,#f7f2ff_0%,#fff5fa_50%,#fffbf7_100%)] p-8 shadow-[0_28px_90px_rgba(130,104,255,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(112,89,192,0.08)_0%,rgba(255,95,149,0.06)_50%,rgba(255,168,66,0.04)_100%)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Image on left for desktop */}
              <div className="hidden lg:block order-2 lg:order-1 relative">
                <div className="relative overflow-hidden rounded-[28px] shadow-[0_40px_120px_rgba(255,95,149,0.20)]">
                  {/* Gradient accents */}
                  <div className="absolute -top-20 -left-20 w-44 h-44 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                  <Image
                    src="/home/pexels-brett-sayles.jpg"
                    alt="Community networking and growth on Vibe2Gether"
                    width={500}
                    height={600}
                    className="w-full h-auto object-cover rounded-[28px]"
                  />
                </div>
              </div>

              {/* Text content */}
              <div className="order-1 lg:order-2">
                <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Thriving Ecosystem</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Join a Movement of Growth
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  You're not just joining a platform—you're becoming part of Africa's most dynamic community of young professionals, entrepreneurs, and learners.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Engage with over 1 million users across 48 countries",
                    "Participate in industry-specific communities and interest groups",
                    "Get mentored by experienced professionals in your field",
                    "Celebrate wins with a supportive community that celebrates growth",
                  ].map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/25">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-base text-muted-foreground leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats shown at bottom on mobile, right side on desktop */}
              <div className="mt-8 lg:mt-0 grid gap-4 sm:grid-cols-2 lg:gap-3">
                {[
                  { number: "48", label: "Countries", icon: <Zap className="h-5 w-5" /> },
                  { number: "growing", label: "Users", icon: <Users2 className="h-5 w-5" /> },
                  { number: "increasing", label: "Connections", icon: <Heart className="h-5 w-5" /> },
                  { number: "many", label: "Opportunities", icon: <TrendingUp className="h-5 w-5" /> },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="group rounded-[24px] border border-white/70 bg-white/85 p-6 shadow-md backdrop-blur transition-all duration-300 hover:shadow-lg dark:border-white/10 dark:bg-white/8"
                  >
                    <div className="inline-flex rounded-lg bg-primary/15 p-3 text-primary dark:bg-primary/20">
                      {stat.icon}
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-black text-primary">{stat.number}</p>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Premium Features Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Premium Membership</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Unlock Unlimited Potential
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Level up your experience with premium features designed to accelerate your growth, connections, and earning potential.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Priority Visibility",
                description: "Your posts appear first in feeds, reaching more people in your target communities.",
              },
              {
                icon: MessageCircle,
                title: "Direct Messaging",
                description: "Unlimited direct messages with features like message scheduling and read receipts.",
              },
              {
                icon: Briefcase,
                title: "Opportunity Boost",
                description: "Premium badge on profile and early access to exclusive job and collaboration listings.",
              },
              {
                icon: Heart,
                title: "Custom Profile",
                description: "Showcase your portfolio with custom sections, media galleries, and verified badges.",
              },
              {
                icon: BookOpen,
                title: "Exclusive Content",
                description: "Access premium learning materials, webinars, and expert-led masterclasses.",
              },
              {
                icon: Zap,
                title: "Higher Earning Rates",
                description: "Earn 1.5x more coins on all activities and unlock exclusive earning opportunities.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-white/85 p-7 shadow-[0_20px_70px_rgba(255,108,157,0.08)] transition-all duration-300 hover:shadow-[0_28px_90px_rgba(255,108,157,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_70px_rgba(0,0,0,0.24)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-lg bg-primary/15 p-3 text-primary dark:bg-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full px-8 h-13 shadow-[0_20px_50px_rgba(255,90,145,0.28)]">
              <Link href="/premium">
                Upgrade to Premium
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Getting Started</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Ready to Jump In?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. It's free, simple, and takes just four quick steps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your account with email or Google. Takes less than 2 minutes.",
              },
              {
                step: "2",
                title: "Complete Profile",
                description: "Share your skills, interests, and career goals to match with opportunities.",
              },
              {
                step: "3",
                title: "Explore & Connect",
                description: "Find communities, connect with people, and discover opportunities.",
              },
              {
                step: "4",
                title: "Start Earning",
                description: "Share content, engage with the community, and watch your coins grow.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                {idx < 3 && (
                  <div className="absolute top-12 -right-3 h-0.5 bg-gradient-to-r from-primary/40 to-transparent hidden md:block w-6" />
                )}

                <div className="rounded-[24px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(255,108,157,0.08)] transition-all duration-300 hover:shadow-[0_28px_90px_rgba(255,108,157,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[24px]" />
                  
                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/15 text-lg font-black text-primary dark:from-primary/30 dark:to-primary/20">
                      {item.step}
                    </div>
                    
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,#1d1025_0%,#2c1741_35%,#ff6f95_100%)] px-8 py-12 text-white shadow-[0_30px_100px_rgba(32,16,50,0.30)] sm:px-12 md:py-16">
            <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />
            
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Ready to connect, learn, and earn?
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/90">
                Join thousands of young professionals building meaningful connections and real momentum on Vibe2Gether.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-13 rounded-full px-8 text-base font-semibold text-black shadow-[0_20px_50px_rgba(255,90,145,0.28)] dark:text-black"
                >
                  <Link href="/signup">Join the Community</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-full border-white/25 bg-white/10 px-8 text-base text-white hover:bg-white/15"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
