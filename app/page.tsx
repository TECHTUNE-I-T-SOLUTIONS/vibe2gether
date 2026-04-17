"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Coins,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  TrendingUp,
  Users2,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { TestimonialsSection } from "@/components/testimonials-section"

const stats = [
  { value: "1M+", label: "Young professionals reached" },
  { value: "50K+", label: "Meaningful connections made" },
  { value: "200K+", label: "Opportunities unlocked" },
]

const spotlightCards = [
  {
    icon: Briefcase,
    title: "Opportunities",
    text: "Discover internships, grants, jobs, and collaboration calls in one premium feed.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    text: "Curated resources, business knowledge, and practical skills that move your career forward.",
  },
  {
    icon: CalendarDays,
    title: "Events",
    text: "Join webinars, community meetups, and networking sessions built for real outcomes.",
  },
]

const ecosystem = [
  {
    eyebrow: "Network & Connect",
    title: "Meet the right people faster",
    description:
      "From founders and creatives to students and professionals, Vibe2Gether helps you build warm, valuable relationships.",
    image: "/happy-diverse-young-people-socializing-at-sunset.jpg",
  },
  {
    eyebrow: "Explore Opportunities",
    title: "Find the next move that fits",
    description:
      "Track internships, business openings, funding calls, and curated career options without jumping between platforms.",
    image: "/person-writing-phone.jpg",
  },
  {
    eyebrow: "Share & Earn",
    title: "Turn activity into momentum",
    description:
      "Post content, grow visibility, earn coins, and build a stronger presence with every meaningful interaction.",
    image: "/smiling-woman-portrait.png",
  },
]

const storySteps = [
  "Join the community and create a profile that shows your goals.",
  "Discover opportunities, resources, and people aligned with your next step.",
  "Build your network, share your progress, and earn recognition as you grow.",
]

const trustLogos = [
  "/forbes-logo-generic.png",
  "/techcrunch-logo-generic.png",
  "/cnn-logo.png",
  "/wired-logo.jpg",
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Avoid dispatching through the app router during early client boot.
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
        <section className="relative">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-6 sm:px-6 md:pb-24 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium shadow-[0_20px_60px_rgba(255,108,157,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
                <Sparkles className="h-4 w-4 text-primary" />
                Africa’s premium social hub for growth, networking, and opportunity
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Connect, network,
                <span className="block bg-[linear-gradient(135deg,#ff5f95_0%,#ff8a45_55%,#8268ff_100%)] bg-clip-text text-transparent">
                  and grow on Vibe2Gether
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Join a polished community experience where young people meet, learn, discover opportunities, and turn
                visibility into real progress.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-13 rounded-full px-8 text-base font-semibold shadow-[0_20px_50px_rgba(255,90,145,0.28)]">
                  <Link href="/signup">
                    Join for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-full border-white/70 bg-white/70 px-8 text-base shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                >
                  <Link href="/opportunities">Explore opportunities</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(255,108,157,0.10)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                  >
                    <div className="text-2xl font-black tracking-[-0.04em]">{stat.value}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex-1">
              <div className="absolute -left-8 top-10 hidden h-48 w-48 rounded-full bg-primary/15 blur-3xl md:block" />
              <div className="absolute -right-10 bottom-8 hidden h-52 w-52 rounded-full bg-secondary/15 blur-3xl md:block" />

              <div className="relative mx-auto max-w-2xl">
                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-[0_30px_90px_rgba(140,86,255,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Community activity</p>
                        <h2 className="text-xl font-bold">Your growth platform</h2>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15">
                        Live
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {spotlightCards.map((card) => (
                        <div
                          key={card.title}
                          className="rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#fff7fb_100%)] p-2 shadow-sm dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]"
                        >
                          <card.icon className="h-5 w-5 text-primary" />
                          <h3 className="mt-3 text-xs font-semibold break-words">{card.title}</h3>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#fef2f7_0%,#f6f2ff_46%,#fff5ef_100%)] p-3 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.12)_0%,rgba(130,104,255,0.12)_55%,rgba(255,168,66,0.08)_100%)]">
                      <div className="relative overflow-hidden rounded-[22px]">
                        <Image
                          src="/app-screenshots.jpg"
                          alt="Vibe2Gether product preview"
                          width={1200}
                          height={720}
                          className="h-auto w-full object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(255,136,82,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-secondary/70">Smart discovery</p>
                      <h3 className="mt-2 text-xl font-bold">Explore opportunities and elevate your career</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Find internships, funding, collaborations, and real community conversations in one calm,
                        premium interface.
                      </p>
                      <Button asChild className="mt-5 rounded-full px-6">
                        <Link href="/signup">Join now</Link>
                      </Button>
                    </div>

                    <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#fffafc_0%,#fff2f7_100%)] p-4 shadow-[0_24px_80px_rgba(255,108,157,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
                      <div className="relative overflow-hidden rounded-[24px]">
                        <Image
                          src="/v2gsnap.jpeg"
                          alt="Vibe2Gether phone mockup"
                          width={900}
                          height={900}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-4 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-white/70 bg-white/80 px-6 py-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_70px_rgba(0,0,0,0.26)]">
            <div className="grid items-center gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-primary/70">Trusted momentum</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                  A modern platform built for connection, knowledge, and opportunity
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {trustLogos.map((logo) => (
                  <div key={logo} className="flex h-16 items-center justify-center rounded-2xl bg-white/90 p-3 shadow-sm dark:bg-white/8">
                    <Image
                      src={logo}
                      alt="Press logo"
                      width={140}
                      height={40}
                      className="h-8 w-auto object-contain opacity-70 dark:opacity-85"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-secondary/70">Platform ecosystem</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Your community hub for networking, knowledge, and momentum
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {ecosystem.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(255,108,157,0.10)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              >
                <div className="relative h-64 w-full">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                </div>
                <div className="space-y-3 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/70">{item.eyebrow}</p>
                  <h3 className="text-2xl font-bold tracking-[-0.03em]">{item.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#fff5fa_0%,#f7f2ff_54%,#fff7ee_100%)] p-6 shadow-[0_28px_90px_rgba(130,104,255,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.14)_0%,rgba(130,104,255,0.14)_55%,rgba(255,168,66,0.08)_100%)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
              <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Success stories</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Premium product flow, simplified for real people
              </h2>
              <div className="mt-8 space-y-5">
                {storySteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-4 rounded-2xl bg-white/85 p-4 shadow-sm dark:bg-white/8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[34px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(255,146,90,0.12)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Everything important in one elegant flow</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Opportunities, events, resources, and community interactions live in one polished experience.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[linear-gradient(180deg,#fff9fb_0%,#ffffff_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
                    <Users2 className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold">Community-first networking</p>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(180deg,#fff9fb_0%,#ffffff_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
                    <Coins className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold">Recognition and coin rewards</p>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(180deg,#fff9fb_0%,#ffffff_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold">Meaningful social interactions</p>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(180deg,#fff9fb_0%,#ffffff_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold">Designed for progress, not noise</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(255,108,157,0.10)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#fff3f7_0%,#f7f2ff_60%,#fff7ef_100%)] p-4 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.12)_0%,rgba(130,104,255,0.12)_55%,rgba(255,168,66,0.08)_100%)]">
                  <Image
                    src="/couple-coffee-date.png"
                    alt="People networking on Vibe2Gether"
                    width={1200}
                    height={900}
                    className="h-auto w-full rounded-[24px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,#1d1025_0%,#2c1741_35%,#ff6f95_100%)] px-6 py-8 text-white shadow-[0_30px_100px_rgba(32,16,50,0.30)] sm:px-8 md:px-10 md:py-10">
            <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Join the movement</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Vibe2Gether: network, share, and unlock more opportunities with style
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                  Built for creators, students, entrepreneurs, and professionals who want a cleaner, more aspirational
                  social product for growth.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="h-13 rounded-full px-8 text-base font-semibold text-black shadow-[0_20px_50px_rgba(255,90,145,0.28)] dark:text-black"
                  >
                    <Link href="/signup">Join for free</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-13 rounded-full border-white/25 bg-white/10 px-8 text-base text-white hover:bg-white/15"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute inset-0 rounded-[32px] bg-white/10 blur-2xl" />
                <div className="relative rounded-[32px] border border-white/20 bg-white/10 p-3 backdrop-blur">
                  <div className="overflow-hidden rounded-[24px] bg-white/95 dark:bg-white/10">
                    <Image
                      src="/v2gsnap.jpeg"
                      alt="Vibe2Gether mobile preview"
                      width={900}
                      height={900}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                </div>
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
