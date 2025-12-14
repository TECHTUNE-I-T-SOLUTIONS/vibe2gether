"use client"

import { Heart, Users, ShoppingBag, MessageCircle, Bell, Coins, Globe2, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Heart,
    title: "smartMatching",
    description: "smartMatchingDesc",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "discoverPeople",
    description: "discoverPeopleDesc",
    gradient: "from-orange-400 to-amber-500",
  },
  {
    icon: ShoppingBag,
    title: "marketplace",
    description: "marketplaceDesc",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: MessageCircle,
    title: "realTimeChat",
    description: "realTimeChatDesc",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Bell,
    title: "smartNotifications",
    description: "smartNotificationsDesc",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Coins,
    title: "earnRedeem",
    description: "earnRedeemDesc",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Globe2,
    title: "multiLanguage",
    description: "multiLanguageDesc",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Shield,
    title: "safeSecure",
    description: "safeSecureDesc",
    gradient: "from-slate-500 to-gray-600",
  },
]

export function FeaturesSection() {
  const { t } = useLanguage()

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("everythingYouNeed")} <span className="gradient-text">{t("toConnect")}</span>
          </h2>
          <p className="text-lg text-foreground/70 dark:text-foreground/75 max-w-2xl mx-auto">
            {t("featuresDescription")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Card
                key={i}
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center"
              >
                <CardContent className="p-6 flex flex-col items-center z-10 relative">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white flex items-center justify-center" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white text-black">{t(feature.title)}</h3>
                  <p className="text-sm text-foreground/70 dark:text-foreground/75 leading-relaxed">{t(feature.description)}</p>
                </CardContent>
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
