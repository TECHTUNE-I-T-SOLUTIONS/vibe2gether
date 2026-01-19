import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Globe2, Shield, Zap, ArrowRight, CheckCircle, Users, TrendingUp } from "lucide-react"

const stats = [
  { value: "5K+", label: "Active Community Members" },
  { value: "40+", label: "Countries" },
  { value: "200+", label: "Marketplace Listings" },
  { value: "50+", label: "Events Hosted" },
]

const values = [
  {
    icon: Briefcase,
    title: "Business & Growth",
    description:
      "We empower entrepreneurs and professionals to build networks, discover opportunities, and grow their businesses through meaningful connections.",
  },
  {
    icon: Shield,
    title: "Safety & Transparency",
    description:
      "We prioritize community safety with verified profiles and transparent practices. Your trust is our foundation.",
  },
  {
    icon: Globe2,
    title: "Global Opportunities",
    description:
      "Connect with professionals and entrepreneurs worldwide. Discover partnerships, collaborations, and business ventures across borders.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "We're building modern tools to help you network, collaborate, and succeed. We listen to our community and evolve continuously.",
  },
]

const features = [
  {
    title: "Professional Networking",
    description: "Build meaningful professional connections and expand your network",
  },
  {
    title: "Business Marketplace",
    description: "Buy and sell services, products, and opportunities in one place",
  },
  {
    title: "Events & Meetups",
    description: "Discover and host events to connect with like-minded professionals",
  },
  {
    title: "Community Feed",
    description: "Share insights, updates, and opportunities with your network",
  },
]

const milestones = [
  { year: "2025", title: "Platform Launch", description: "Vibe2Gether launched as a community platform for networking and opportunities" },
  {
    year: "2025",
    title: "Early Community",
    description: "Growing community with thousands of active members discovering opportunities",
  },
  {
    year: "2026",
    title: "Marketplace Expansion",
    description: "Launching enhanced marketplace features for buying and selling services",
  },
  { year: "2026+", title: "Global Growth", description: "Expanding to more countries and adding advanced networking tools" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-teal-50/50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Opportunities Know <span className="gradient-text">No Borders</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Vibe2Gether connects entrepreneurs, professionals, and creators worldwide. Build your network, discover business opportunities, 
                showcase your services, and grow together in a thriving global community.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="rounded-full gradient-bg">
                    Join Our Community
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="rounded-full bg-transparent">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our <span className="gradient-text">Mission</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Founded in 2025, Vibe2Gether is built on the belief that professional networks and business opportunities shouldn't be limited by geography, 
                background, or platform. We're creating a space where entrepreneurship thrives, partnerships form naturally, and everyone has a shot at success.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our growing community includes business owners, freelancers, creators, and professionals from 40+ countries. We're still early, still growing, 
                and committed to building a platform that's transparent about its journey while delivering real value to our community.
              </p>

              <h3 className="text-2xl font-bold mb-6 mt-10">What You Can Do on Vibe2Gether</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Briefcase className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our <span className="gradient-text">Core Values</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These principles guide how we build and operate Vibe2Gether.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => {
                const Icon = value.icon
                return (
                  <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our <span className="gradient-text">Roadmap</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're transparent about where we are and where we're headed.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-secondary" />

                {/* Timeline Items */}
                <div className="space-y-12">
                  {milestones.map((milestone, i) => (
                    <div
                      key={i}
                      className={`relative flex items-center gap-6 ${
                        i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                      }`}
                    >
                      <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"} hidden md:block`}>
                        <Card className="inline-block border-border/50 bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="text-sm text-primary font-semibold mb-1">{milestone.year}</div>
                            <div className="font-semibold mb-1">{milestone.title}</div>
                            <div className="text-sm text-muted-foreground">{milestone.description}</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Dot */}
                      <div className="relative z-10 w-8 h-8 rounded-full gradient-bg flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>

                      <div className="flex-1 md:hidden">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="text-sm text-primary font-semibold mb-1">{milestone.year}</div>
                            <div className="font-semibold mb-1">{milestone.title}</div>
                            <div className="text-sm text-muted-foreground">{milestone.description}</div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex-1 hidden md:block" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-90" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">Ready to Grow Together?</h2>
              <p className="text-xl text-white/80 mb-8">
                Join thousands of professionals and entrepreneurs building meaningful connections and discovering opportunities on Vibe2Gether.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90">
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-2 border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    Contact Us
                  </Button>
                </Link>
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
