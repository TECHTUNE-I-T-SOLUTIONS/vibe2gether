import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, AlertTriangle, Lock, MapPin, Phone, Flag, Ban, CheckCircle, MessageCircle } from "lucide-react"

const safetyFeatures = [
  {
    icon: Shield,
    title: "Profile Verification",
    description:
      "Verified profiles show a blue checkmark. We verify identities through photo matching and ID verification.",
  },
  {
    icon: Ban,
    title: "Block & Report",
    description: "Easily block anyone and report inappropriate behavior. Our team reviews all reports within 24 hours.",
  },
  {
    icon: Eye,
    title: "Photo Moderation",
    description: "AI-powered moderation screens all photos for inappropriate content before they go live.",
  },
  {
    icon: Lock,
    title: "Data Encryption",
    description:
      "Your messages and personal data are encrypted end-to-end. We never share your data with third parties.",
  },
  {
    icon: MapPin,
    title: "Location Privacy",
    description: "Your exact location is never shown. We only display approximate distances to protect your privacy.",
  },
  {
    icon: Phone,
    title: "Video Call Safety",
    description: "Our in-app video calls keep your phone number private and can be ended instantly if needed.",
  },
]

const datingTips = [
  {
    title: "Meet in Public",
    description: "Always meet new people in busy, public places like coffee shops or restaurants.",
  },
  {
    title: "Tell Someone",
    description: "Let a friend or family member know where you're going and who you're meeting.",
  },
  {
    title: "Trust Your Gut",
    description: "If something feels off, it probably is. Don't hesitate to leave or end the date.",
  },
  {
    title: "Arrange Your Own Transport",
    description: "Don't rely on your date for transportation, especially on the first few dates.",
  },
  {
    title: "Don't Share Personal Info",
    description: "Avoid sharing your address, workplace, or financial information until you know someone well.",
  },
  {
    title: "Video Chat First",
    description: "Use our video chat feature to verify someone before meeting in person.",
  },
]

const redFlags = [
  "Asks for money or financial help",
  "Refuses to video chat or meet in person",
  "Pushes you to move to another platform",
  "Profile seems too good to be true",
  "Avoids answering direct questions",
  "Gets aggressive when you set boundaries",
]

export default function SafetyPage() {
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
                <Shield className="w-4 h-4 mr-1" />
                Safety First
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Your Safety is Our <span className="gradient-text">Priority</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Learn how we protect our community and how you can stay safe while connecting with others.
              </p>
              <link rel="stylesheet" href="/contact" />
              <Button size="lg" className="rounded-full gradient-bg">
                <Flag className="w-5 h-5 mr-2" />
                Report an Issue
              </Button>
              <link/>
            </div>
          </div>
        </section>

        {/* Safety Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">How We Keep You Safe</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              We use advanced technology and human moderation to create a safe dating environment
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyFeatures.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Dating Tips */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Safe Dating Tips</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Follow these tips to have safe and enjoyable dating experiences
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {datingTips.map((tip, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{tip.title}</h3>
                      <p className="text-muted-foreground text-sm">{tip.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Red Flags */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="destructive" className="mb-4">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Warning Signs
                </Badge>
                <h2 className="text-3xl font-bold mb-4">Red Flags to Watch For</h2>
                <p className="text-muted-foreground">
                  If you notice any of these behaviors, please report the profile immediately
                </p>
              </div>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {redFlags.map((flag, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency */}
        {/* <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">In Case of Emergency</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              If you ever feel unsafe or in danger, please contact local emergency services immediately.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="rounded-full">
                <Phone className="w-5 h-5 mr-2" />
                Call Emergency: 911
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white text-white hover:bg-white/20 bg-transparent"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                24/7 Support Chat
              </Button>
            </div>
          </div>
        </section> */}
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
