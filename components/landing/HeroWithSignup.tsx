"use client"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, CheckCircle2, Zap, Layout, Globe, Users, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Image from "next/image"

export function HeroWithSignup() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-[#0d0d0f]">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4 z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4 z-0" />
      
      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] z-0" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Side: Impactful Text */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs font-black text-zinc-300 tracking-[0.2em] uppercase">{t("heroBadge")}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.95] tracking-tighter">
              {t("heroTitle").split(" ").map((word, i) => (
                <span key={i} className={i >= 2 ? "gradient-text block" : "block"}>
                  {word}
                </span>
              ))}
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 max-w-xl leading-relaxed font-medium">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <Button size="lg" className="rounded-full h-18 px-12 text-xl font-black gradient-bg shadow-[0_20px_50px_rgba(255,71,126,0.4)] hover:shadow-[0_25px_60px_rgba(255,71,126,0.6)] transition-all hover:-translate-y-1" onClick={() => router.push("/signup")}>
                {t("getStarted")}
                <ArrowRight className="ml-3 w-7 h-7" />
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full h-18 px-10 text-xl font-bold text-white hover:bg-white/5 group" onClick={() => router.push("/about")}>
                Learn More
                <div className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden ml-2">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-12 pt-12 border-t border-white/10">
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-white">1M+</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Users</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-white">50K+</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Listings</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-white">24/7</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Support</span>
               </div>
            </div>
          </motion.div>

          {/* Right Side: Pro Mockup & Lottie */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
            className="relative"
          >
            <div className="relative z-10 flex justify-center lg:justify-end">
              {/* Premium Phone Mockup */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative w-[340px] h-[680px] bg-zinc-950 rounded-[3.5rem] border-[14px] border-zinc-900 shadow-[0_80px_120px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/10">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-zinc-900 rounded-b-3xl z-30" />
                  
                  {/* Screen Content */}
                  <div className="absolute inset-0 bg-white">
                    <Image 
                      src="/v2gsnap.jpeg" 
                      alt="Vibe2Gether Interface" 
                      fill 
                      className="object-cover"
                      priority
                    />
                  </div>
                  
                  {/* Reflection Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent z-20 pointer-events-none" />
                </div>
              </div>

              {/* Lottie Animation 1 - Professional Workers */}
              <div className="absolute -top-32 -left-20 w-80 h-80 z-20 pointer-events-none hidden xl:block animate-float">
                <DotLottieReact
                  src="https://lottie.host/3b35a6b6-9e3a-4e42-b235-b831f1457986/A7eXHg67Ud.lottie"
                  loop
                  autoplay
                />
              </div>

              {/* Lottie Animation 2 - Network/Team */}
              <div className="absolute -bottom-20 -right-32 w-96 h-96 z-20 pointer-events-none hidden xl:block animate-float" style={{ animationDelay: '2s' }}>
                <DotLottieReact
                  src="https://lottie.host/d66087d8-4545-4adb-bdf7-8fe8b7aa9d3f/UtVaL5KYKq.lottie"
                  loop
                  autoplay
                />
              </div>

              {/* Floating Performance Badge */}
              <div className="absolute top-1/4 -left-32 bg-zinc-900/80 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3 hidden md:block animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base italic">99.9% Reliable</p>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Africa&apos;s Fastest App</p>
                  </div>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute bottom-1/4 -left-40 bg-zinc-900/80 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3 hidden md:block animate-float" style={{ animationDelay: '3s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base italic">100% Secured</p>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">End-to-End Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
