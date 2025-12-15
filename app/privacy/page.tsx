import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Eye, Database, Share2, Shield, Settings, Clock, Globe } from "lucide-react"

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Profile information (name, age, photos, bio, interests)",
      "Contact information (email, phone number)",
      "Location data (approximate location for matching)",
      "Usage data (how you interact with our services)",
      "Device information (device type, operating system)",
      "Communications (messages within the app)",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To provide and improve our matching services",
      "To personalize your experience and recommendations",
      "To communicate with you about your account",
      "To ensure safety and prevent fraud",
      "To analyze usage patterns and improve features",
      "To comply with legal obligations",
    ],
  },
  {
    icon: Share2,
    title: "How We Share Your Information",
    content: [
      "With other users (only information you choose to share)",
      "With service providers who help operate our platform",
      "With law enforcement when required by law",
      "In connection with business transfers or mergers",
      "We never sell your personal data to third parties",
    ],
  },
  {
    icon: Shield,
    title: "How We Protect Your Information",
    content: [
      "End-to-end encryption for messages",
      "Secure data storage with industry-standard protocols",
      "Regular security audits and penetration testing",
      "Employee access controls and training",
      "Two-factor authentication options",
    ],
  },
  {
    icon: Settings,
    title: "Your Privacy Controls",
    content: [
      "Access and download your data anytime",
      "Delete your account and data permanently",
      "Control who can see your profile and location",
      "Manage notification preferences",
      "Opt out of promotional communications",
      "Request data portability",
    ],
  },
  {
    icon: Clock,
    title: "Data Retention",
    content: [
      "Active account data is retained while your account is active",
      "Deleted accounts are removed within 30 days",
      "Backups may be retained for up to 90 days",
      "Legal compliance data may be retained longer",
      "Anonymized analytics data may be retained indefinitely",
    ],
  },
]

export default function PrivacyPage() {
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
                <Lock className="w-4 h-4 mr-1" />
                Privacy Policy
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Your Privacy <span className="gradient-text">Matters</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                We&apos;re committed to protecting your personal information and being transparent about how we use it.
              </p>
              <p className="text-sm text-muted-foreground">Last updated: December 1, 2025</p>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-center mb-8">Key Points</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
              <div>
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">End-to-end encrypted messages</p>
              </div>
              <div>
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">We never sell your data</p>
              </div>
              <div>
                <Settings className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Full control over your data</p>
              </div>
              <div>
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">GDPR & CCPA compliant</p>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {sections.map((section, i) => {
                const Icon = section.icon
                return (
                  <Card key={i} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.content.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Questions About Privacy?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              If you have any questions about this Privacy Policy or your data, please contact our Data Protection
              Officer.
            </p>
            <button className="px-8 py-3 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors">
              privacy@vibe2gether.com
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
