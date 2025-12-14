"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Heart, Star, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-bg opacity-90" />

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 animate-float" />
      <div
        className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-white/10 animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-white/10 animate-float"
        style={{ animationDelay: "0.5s" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icons */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Find Your
            <span className="block">Perfect Match?</span>
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join millions of people who have already found meaningful connections on Vibe2Gether. Your journey to love
            starts here.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/90 h-14 px-8 text-lg font-semibold shadow-lg"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white/10 bg-transparent"
              >
                Browse Profiles
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            <div className="flex items-center gap-2 text-white/80">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/50 overflow-hidden">
                    <Image
                      src={`/thoughtful-woman.jpg?height=32&width=32&query=person portrait ${i}`}
                      alt="User"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-sm">2M+ active users</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-white text-white" />
                ))}
              </div>
              <span className="text-sm">4.9 rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
