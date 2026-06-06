import Image from "next/image"
import { Calendar, ImageIcon, MapPin, ShieldCheck, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PublicSubscriptionHeroActions, PublicSubscriptionPrimaryAction } from "@/components/subscriptions/public-subscription-actions"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Subscriptions | Vibe2Gether",
  description: "Browse active Vibe2Gether subscription services created by verified admins.",
}

function formatDuration(service: any) {
  const value = Number(service.duration_value || 1)
  const unit = service.duration_unit || "month"
  return `${value} ${unit}${value === 1 ? "" : "s"}`
}

export default async function PublicSubscriptionsPage() {
  const supabase = createServiceRoleClient()
  const { data: services } = await supabase
    .from("subscription_services")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  const activeServices = services || []

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4 gap-2 gradient-bg text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
                Verified Services
              </Badge>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Community <span className="gradient-text">Subscriptions</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Browse available services from Vibe2Gether partners. Log in to subscribe, pay securely, and keep receipts in your dashboard.
              </p>
              <PublicSubscriptionHeroActions />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          {activeServices.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <h2 className="text-xl font-semibold">No subscriptions available</h2>
                  <p className="text-sm text-muted-foreground">Check back soon for new active services.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeServices.map((service: any) => {
                const features = service.featured_services || []
                return (
                  <Card key={service.id} className="overflow-hidden border-border/60 bg-card/70">
                    <div className="relative aspect-video bg-muted">
                      {service.image_url ? (
                        <Image src={service.image_url} alt={service.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <Badge>{service.category}</Badge>
                        {service.is_featured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        <h2 className="text-xl font-bold">{service.name}</h2>
                        <p className="text-sm text-muted-foreground">{service.company || "Vibe2Gether partner"}</p>
                      </div>
                      <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {features.slice(0, 4).map((feature: string) => (
                          <Badge key={feature} variant="outline">{feature}</Badge>
                        ))}
                        {features.length > 4 && <Badge variant="outline">+{features.length - 4} more</Badge>}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDuration(service)}
                        </div>
                        {service.location_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {service.location_name}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-2xl font-bold">
                            {service.currency} {Number(service.price).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Secure checkout after login</p>
                        </div>
                        <PublicSubscriptionPrimaryAction />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
