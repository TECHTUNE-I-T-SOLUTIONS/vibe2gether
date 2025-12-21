import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Globe2, Shield, Sparkles, ArrowRight, CheckCircle } from "lucide-react"

const stats = [
  { value: "2M+", label: "Active Users" },
  { value: "150+", label: "Countries" },
  { value: "500K+", label: "Successful Matches" },
  { value: "4.9", label: "App Rating" },
]

const values = [
  {
    icon: Heart,
    title: "Love First",
    description:
      "We believe everyone deserves to find meaningful connections. Our mission is to bring hearts together across the globe.",
  },
  {
    icon: Shield,
    title: "Safety & Trust",
    description:
      "Your security is our priority. We employ advanced verification, encryption, and moderation to keep our community safe.",
  },
  {
    icon: Globe2,
    title: "Global Community",
    description:
      "Love knows no borders. We connect people from every corner of the world, celebrating diversity and cultural exchange.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description:
      "We continuously evolve our platform with cutting-edge technology to create the best possible experience for our users.",
  },
]

const team = [
  {
    name: "Alexandra Chen",
    role: "CEO & Co-Founder",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    name: "Marcus Williams",
    role: "CTO & Co-Founder",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    name: "Sofia Martinez",
    role: "Head of Product",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    name: "David Kim",
    role: "Head of Community",
    image: "/placeholder.svg?height=300&width=300",
  },
]

const milestones = [
  { year: "2025", title: "Founded", description: "Vibe2Gether launched with a vision to revolutionize online dating" },
  // { year: "2021", title: "1M Users", description: "Reached our first million users across 50 countries" },
  {
    year: "2026",
    title: "Marketplace Launch",
    description: "Introducing the romantic marketplace for gifts and experiences",
  },
  // { year: "2023", title: "Global Expansion", description: "Expanded to 150+ countries with multi-language support" },
  { year: "2026", title: "AI Matching", description: "Launching AI-powered compatibility matching algorithm" },
  // { year: "2025", title: "2M+ Users", description: "Growing community with over 2 million active members" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Bringing People <span className="gradient-text">Together</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Vibe2Gether is a social platform where communities form — meet new people, create events, buy & sell, post, and earn rewards for participation. We combine cutting-edge technology with a human-first approach to help you connect, share, and grow your network.
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
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Our <span className="gradient-text">Story</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Vibe2Gether was born from a simple belief: meaningful connections should be exciting, safe, and accessible to everyone. Founded in 2025 by a team passionate about human connection, we set out to create a platform that goes beyond superficial swipes.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Today, we're proud to be a global community of over 2 million members from 150+ countries, all seeking
                  genuine connections. Our unique combination of dating, marketplace, and events creates opportunities
                  for love to bloom in unexpected ways.
                </p>
                <div className="space-y-3">
                  {[
                    "AI-powered matching for genuine compatibility",
                    "Verified profiles for a safe community",
                    "Marketplace for experiences, gifts, and local services",
                    "Curated events for real-world connections",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                      <Image
                        src="/about/couple (1).jpg?height=400&width=300"
                        alt="Happy couple"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      <Image
                        src="/about/couple (2).jpg?height=300&width=300"
                        alt="Romantic date"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      <Image
                        src="/about/couple (3).jpg?height=300&width=300"
                        alt="Adventure together"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                      <Image
                        src="/about/couple (4).jpg?height=400&width=300"
                        alt="Wedding celebration"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our <span className="gradient-text">Values</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do at Vibe2Gether.
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
                      <p className="text-muted-foreground">{value.description}</p>
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
                Our <span className="gradient-text">Journey</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From a simple idea to a global platform — here's how we got here.
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

        {/* Team */}
        {/* <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Meet the <span className="gradient-text">Team</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The passionate people behind Vibe2Gether, working to bring hearts together.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
                  <div className="relative aspect-square">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section> */}

        {/* CTA */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-90" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">Ready to Join Our Story?</h2>
              <p className="text-xl text-white/80 mb-8">
                Become part of a community where love, friendship, and meaningful connections flourish every day.
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
