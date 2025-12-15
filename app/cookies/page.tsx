import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Cookie, Shield, BarChart, Target, Settings, Info } from "lucide-react"

const cookieTypes = [
  {
    icon: Shield,
    title: "Essential Cookies",
    description: "Required for the website to function properly. Cannot be disabled.",
    required: true,
    examples: ["Authentication", "Security tokens", "Session management", "Load balancing"],
  },
  {
    icon: BarChart,
    title: "Analytics Cookies",
    description: "Help us understand how visitors interact with our website.",
    required: false,
    examples: ["Page views", "User journey tracking", "Feature usage", "Error reporting"],
  },
  {
    icon: Target,
    title: "Marketing Cookies",
    description: "Used to deliver personalized advertisements and measure their effectiveness.",
    required: false,
    examples: ["Ad targeting", "Conversion tracking", "Social media pixels", "Retargeting"],
  },
  {
    icon: Settings,
    title: "Preference Cookies",
    description: "Remember your settings and preferences for a better experience.",
    required: false,
    examples: ["Language preference", "Theme settings", "Display preferences", "Location settings"],
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="gradient-bg text-primary-foreground mb-4">
                <Cookie className="w-4 h-4 mr-1" />
                Cookie Policy
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How We Use <span className="gradient-text">Cookies</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Learn about the cookies we use and manage your preferences.
              </p>
              <p className="text-sm text-muted-foreground">Last updated: December 1, 2025</p>
            </div>
          </div>
        </section>

        {/* What Are Cookies */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold mb-3">What Are Cookies?</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are placed on your device when you visit a website. They help
                    websites remember your preferences, understand how you use the site, and provide personalized
                    experiences. Cookies can be &quot;session&quot; cookies (deleted when you close your browser) or
                    &quot;persistent&quot; cookies (remain on your device for a set period).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Types */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Types of Cookies We Use</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {cookieTypes.map((cookie, i) => {
                const Icon = cookie.icon
                return (
                  <Card key={i} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{cookie.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{cookie.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cookie.required ? <Badge variant="secondary">Required</Badge> : <Switch defaultChecked />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">Examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {cookie.examples.map((example, j) => (
                          <Badge key={j} variant="outline" className="font-normal">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">Managing Your Cookie Preferences</h2>
              <p className="text-muted-foreground text-center mb-12">You have several options for managing cookies</p>

              <div className="space-y-6">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Browser Settings</h3>
                    <p className="text-muted-foreground text-sm">
                      Most browsers allow you to control cookies through their settings. You can typically find these
                      options in the &quot;Privacy&quot; or &quot;Security&quot; section of your browser&apos;s
                      preferences.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Our Cookie Banner</h3>
                    <p className="text-muted-foreground text-sm">
                      When you first visit our site, you&apos;ll see a cookie banner that allows you to accept or
                      customize your cookie preferences. You can change these settings at any time.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Opt-Out Tools</h3>
                    <p className="text-muted-foreground text-sm">
                      For advertising cookies, you can use industry opt-out tools like the Digital Advertising
                      Alliance&apos;s opt-out page or the Network Advertising Initiative&apos;s opt-out page.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Update Preferences */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Update Your Preferences</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              You can update your cookie preferences at any time by clicking the button below.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full">
              <Settings className="w-5 h-5 mr-2" />
              Cookie Settings
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
