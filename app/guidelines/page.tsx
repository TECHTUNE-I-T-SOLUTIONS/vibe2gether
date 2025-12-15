import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Shield, CheckCircle, XCircle, AlertTriangle, Users, MessageCircle, Camera, Scale } from "lucide-react"

const guidelines = [
  {
    icon: Heart,
    title: "Be Authentic",
    description: "Use real photos and accurate information. Represent yourself honestly.",
    dos: ["Use recent photos of yourself", "Be honest about your age and intentions", "Share genuine interests"],
    donts: ["Use fake or misleading photos", "Pretend to be someone else", "Hide important information"],
  },
  {
    icon: Users,
    title: "Respect Others",
    description: "Treat everyone with dignity and respect, even if you're not interested.",
    dos: ["Be polite when declining", "Respect boundaries", "Accept rejection gracefully"],
    donts: ["Send harassing messages", "Use offensive language", "Pressure anyone for responses"],
  },
  {
    icon: Camera,
    title: "Photo Guidelines",
    description: "Keep photos appropriate and representative of who you are.",
    dos: ["Post clear face photos", "Show your personality", "Keep it tasteful"],
    donts: ["Post nude or explicit content", "Include others without consent", "Use heavily filtered photos"],
  },
  {
    icon: MessageCircle,
    title: "Communication",
    description: "Keep conversations respectful and meaningful.",
    dos: ["Start with genuine conversation", "Ask thoughtful questions", "Take no for an answer"],
    donts: ["Send unsolicited explicit content", "Spam or send chain messages", "Request money or gifts"],
  },
]

const violations = [
  { level: "Minor", consequence: "Warning", examples: "Inactive account, minor profile violations" },
  { level: "Moderate", consequence: "Temporary ban (7-30 days)", examples: "Harassment, fake profile, spam" },
  { level: "Severe", consequence: "Permanent ban", examples: "Threats, scams, illegal content, underage users" },
]

export default function GuidelinesPage() {
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
                <Scale className="w-4 h-4 mr-1" />
                Community Rules
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Community <span className="gradient-text">Guidelines</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Our rules for creating a safe, respectful, and authentic dating experience for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-semibold">Safety First</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                <span className="font-semibold">Authentic Connections</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                <span className="font-semibold">Inclusive Community</span>
              </div>
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Guidelines</h2>
            <div className="space-y-8 max-w-4xl mx-auto">
              {guidelines.map((guideline, i) => {
                const Icon = guideline.icon
                return (
                  <Card key={i} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle>{guideline.title}</CardTitle>
                          <p className="text-muted-foreground text-sm">{guideline.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-600 flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            Do
                          </h4>
                          <ul className="space-y-2">
                            {guideline.dos.map((item, j) => (
                              <li key={j} className="text-sm flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-destructive flex items-center gap-2 mb-3">
                            <XCircle className="w-5 h-5" />
                            Don&apos;t
                          </h4>
                          <ul className="space-y-2">
                            {guideline.donts.map((item, j) => (
                              <li key={j} className="text-sm flex items-start gap-2">
                                <span className="text-destructive mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Violations */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Violation Consequences</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              We take violations seriously to maintain a safe community
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {violations.map((violation, i) => (
                <Card
                  key={i}
                  className={`border-border/50 ${violation.level === "Severe" ? "border-destructive/30" : ""}`}
                >
                  <CardContent className="flex items-center gap-6 py-6">
                    <AlertTriangle
                      className={`w-8 h-8 flex-shrink-0 ${
                        violation.level === "Minor"
                          ? "text-yellow-500"
                          : violation.level === "Moderate"
                            ? "text-orange-500"
                            : "text-destructive"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant={violation.level === "Severe" ? "destructive" : "outline"}>
                          {violation.level}
                        </Badge>
                        <span className="font-semibold">{violation.consequence}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{violation.examples}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Report */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See a Violation?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Help us keep the community safe by reporting any behavior that violates our guidelines.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors">
                Report a User
              </button>
              <button className="px-6 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
