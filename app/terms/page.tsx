import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, UserCheck, Ban, CreditCard, Scale, AlertTriangle, RefreshCw, Mail } from "lucide-react"

const sections = [
  {
    icon: UserCheck,
    title: "1. Eligibility",
    content: `To use Vibe2Gether, you must:
    
• Be at least 18 years of age
• Be legally able to enter into a binding contract
• Not be prohibited from using the service under any applicable laws
• Not have been previously banned from our platform
• Create only one account per person

By creating an account, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    icon: FileText,
    title: "2. Your Account",
    content: `You are responsible for:

• Providing accurate and truthful information
• Maintaining the confidentiality of your login credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorized access

You may not:
• Share your account with others
• Create accounts for others
• Use another person's account without permission`,
  },
  {
    icon: Scale,
    title: "3. User Conduct",
    content: `You agree not to:

• Harass, bully, stalk, or intimidate other users
• Post false, misleading, or fraudulent content
• Impersonate any person or entity
• Use the service for commercial purposes without authorization
• Collect user information without consent
• Transmit spam, chain letters, or unsolicited promotions
• Post content that infringes intellectual property rights
• Attempt to circumvent security measures`,
  },
  {
    icon: Ban,
    title: "4. Prohibited Content",
    content: `The following content is prohibited:

• Nudity or sexually explicit material
• Hate speech or content promoting discrimination
• Violence, threats, or harassment
• Illegal activities or substances
• Personal information of others without consent
• Copyrighted material without authorization
• Malware, viruses, or malicious code
• Spam or deceptive content`,
  },
  {
    icon: CreditCard,
    title: "5. Purchases & Subscriptions",
    content: `Premium subscriptions and in-app purchases:

• Are billed through your app store or payment provider
• Automatically renew unless cancelled before renewal date
• Can be cancelled at any time through your account settings
• Refunds are subject to our refund policy
• Prices may change with notice to existing subscribers

Virtual currency (Coins):
• Have no real-world monetary value
• Cannot be exchanged for cash
• May expire if account is inactive for 12 months`,
  },
  {
    icon: AlertTriangle,
    title: "6. Disclaimers",
    content: `Important disclaimers:

• We do not conduct background checks on users
• We cannot guarantee the accuracy of user-provided information
• We are not responsible for user conduct on or off the platform
• The service is provided "as is" without warranties
• We do not guarantee any specific outcomes from using the service
• We are not responsible for content posted by users`,
  },
  {
    icon: RefreshCw,
    title: "7. Modifications",
    content: `We reserve the right to:

• Modify or discontinue the service at any time
• Change these Terms with reasonable notice
• Update pricing with notice to subscribers
• Remove content that violates our policies
• Suspend or terminate accounts that violate our Terms

Continued use after changes constitutes acceptance of new Terms.`,
  },
]

export default function TermsPage() {
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
                <FileText className="w-4 h-4 mr-1" />
                Legal
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Terms of <span className="gradient-text">Service</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Please read these terms carefully before using Vibe2Gether.
              </p>
              <p className="text-sm text-muted-foreground">
                Effective Date: December 1, 2025 | Last Updated: December 1, 2025
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-muted-foreground">
                Welcome to Vibe2Gether. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
                Vibe2Gether application, website, and services (collectively, the &quot;Service&quot;). By creating an
                account or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms,
                do not use the Service.
              </p>
            </div>
          </div>
        </section>

        {/* Terms Sections */}
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
                      <div className="text-muted-foreground whitespace-pre-line">{section.content}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Questions About Our Terms?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              If you have any questions about these Terms of Service, please contact our legal team.
            </p>
            <button className="px-8 py-3 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 mx-auto">
              <Mail className="w-5 h-5" />
              legal@vibe2gether.com
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
