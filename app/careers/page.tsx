import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Heart, Zap, Coffee, Plane, GraduationCap, ChevronRight, Building } from "lucide-react"

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision insurance" },
  { icon: Plane, title: "Unlimited PTO", description: "Take time off when you need it" },
  { icon: GraduationCap, title: "Learning Budget", description: "$2,000 annual learning and development budget" },
  { icon: Coffee, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: Zap, title: "Stock Options", description: "Equity in a fast-growing company" },
  { icon: Users, title: "Team Events", description: "Annual retreats and team bonding" },
]

const openings = [
  {
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    level: "Senior",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "New York, USA",
    type: "Full-time",
    level: "Mid-Senior",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    level: "Senior",
  },
  {
    title: "Community Manager",
    department: "Community",
    location: "London, UK",
    type: "Full-time",
    level: "Mid-Level",
  },
  { title: "Data Scientist", department: "Data", location: "Remote", type: "Full-time", level: "Senior" },
  { title: "Mobile Engineer (iOS)", department: "Engineering", location: "Remote", type: "Full-time", level: "Senior" },
]

const values = [
  { title: "User First", description: "Every decision starts with our users in mind" },
  { title: "Move Fast", description: "We ship quickly and iterate based on feedback" },
  { title: "Be Authentic", description: "We celebrate individuality and honest communication" },
  { title: "Spread Love", description: "We believe in the power of genuine connections" },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="gradient-bg text-primary-foreground mb-4">We&apos;re Hiring</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Join the <span className="gradient-text">Vibe</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Help us build the future of meaningful connections. We&apos;re looking for passionate people who want to
                make a difference.
              </p>
              <Button size="lg" className="rounded-full gradient-bg">
                View Open Positions
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold gradient-text">50+</p>
                <p className="text-muted-foreground">Team Members</p>
              </div>
              <div>
                <p className="text-4xl font-bold gradient-text">15</p>
                <p className="text-muted-foreground">Countries</p>
              </div>
              <div>
                <p className="text-4xl font-bold gradient-text">10M+</p>
                <p className="text-muted-foreground">Users Worldwide</p>
              </div>
              <div>
                <p className="text-4xl font-bold gradient-text">4.8</p>
                <p className="text-muted-foreground">Glassdoor Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Our Values</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              These principles guide everything we do at Vibe2Gether
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <Card key={i} className="border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-white">{i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Benefits & Perks</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              We take care of our team so they can focus on what matters most
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon
                return (
                  <Card key={i} className="border-border/50">
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-muted-foreground text-sm">{benefit.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Find your perfect role and join our growing team
            </p>
            <div className="max-w-4xl mx-auto space-y-4">
              {openings.map((job, i) => (
                <Card
                  key={i}
                  className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{job.level}</Badge>
                      <Button className="rounded-full gradient-bg">Apply</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Don&apos;t see the right role?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              We&apos;re always looking for talented people. Send us your resume and we&apos;ll keep you in mind for
              future opportunities.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full">
              Send General Application
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
