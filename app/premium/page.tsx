import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Eye, MessageCircle, Zap, Crown, Star, Shield, Infinity, Coins } from "lucide-react"

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "Get started with essential features",
    features: ["10 daily swipes", "Basic matching", "Send messages", "View profiles", "Create posts"],
    popular: false,
    cta: "Current Plan",
  },
  {
    name: "Premium",
    price: "$14.99",
    period: "/month",
    description: "Unlock all features and find your match faster",
    features: [
      "Unlimited swipes",
      "See who likes you",
      "Advanced filters",
      "Priority messaging",
      "Profile boost (1x/month)",
      "Read receipts",
      "Undo last swipe",
      "No ads",
    ],
    popular: true,
    cta: "Upgrade Now",
    coins: 500,
  },
  {
    name: "VIP",
    price: "$29.99",
    period: "/month",
    description: "The ultimate dating experience",
    features: [
      "Everything in Premium",
      "Verified badge",
      "Weekly profile boost",
      "Priority support",
      "Exclusive events access",
      "Advanced analytics",
      "Video chat",
      "Gift sending",
      "Incognito mode",
    ],
    popular: false,
    cta: "Go VIP",
    coins: 1500,
  },
]

const benefits = [
  {
    icon: Eye,
    title: "See Who Likes You",
    description: "No more guessing. See everyone who swiped right on you instantly.",
  },
  {
    icon: Infinity,
    title: "Unlimited Swipes",
    description: "Swipe as much as you want without any daily limits.",
  },
  {
    icon: Zap,
    title: "Profile Boost",
    description: "Get 10x more visibility and match faster.",
  },
  {
    icon: Shield,
    title: "Incognito Mode",
    description: "Browse profiles without anyone knowing you viewed them.",
  },
  {
    icon: MessageCircle,
    title: "Priority Messaging",
    description: "Your messages appear at the top of their inbox.",
  },
  {
    icon: Star,
    title: "Exclusive Events",
    description: "Access to VIP-only events and meetups.",
  },
]

const testimonials = [
  {
    name: "Jessica M.",
    text: "Premium was worth every penny! I met my fiance within 2 weeks of upgrading.",
    avatar: "/smiling-woman-avatar.png",
  },
  {
    name: "David K.",
    text: "The profile boost feature got me 5x more matches. Highly recommend!",
    avatar: "/man-avatar-happy.jpg",
  },
  {
    name: "Sarah L.",
    text: "Being able to see who likes me saved so much time. Found my perfect match!",
    avatar: "/professional-woman-avatar.png",
  },
]

export default function PremiumPage() {
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
                <Crown className="w-4 h-4 mr-1" />
                Premium
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Find Love <span className="gradient-text">Faster</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Upgrade to Premium and unlock powerful features that help you make meaningful connections.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <Card
                  key={i}
                  className={`border-border/50 relative ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.coins && (
                      <div className="flex items-center justify-center gap-1 text-accent mt-2">
                        <Coins className="w-4 h-4" />
                        <span className="font-medium">+{plan.coins} coins/month</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-full ${plan.popular ? "gradient-bg" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Premium Benefits</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Everything you need to find your perfect match
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              See what our Premium members are saying
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.text}&quot;</p>
                    <p className="font-semibold">{testimonial.name}</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                      ))}
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Perfect Match?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of happy couples who found love with Vibe2Gether Premium
            </p>
            <Button size="lg" variant="secondary" className="rounded-full">
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
