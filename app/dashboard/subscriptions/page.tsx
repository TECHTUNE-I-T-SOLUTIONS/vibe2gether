"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function UserSubscriptionsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UserSubscriptionsContent />
    </Suspense>
  )
}

function formatDuration(service: any) {
  const value = Number(service.duration_value || 1)
  const unit = service.duration_unit || "month"
  return `${value} ${unit}${value === 1 ? "" : "s"}`
}

function UserSubscriptionsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [confirmService, setConfirmService] = useState<any>(null)
  const [viewTab, setViewTab] = useState("services")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [verificationReference, setVerificationReference] = useState("")
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null)

  async function loadSubscriptions() {
    try {
      setLoading(true)
      const res = await fetch("/api/subscriptions")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load subscriptions")
      setServices(data.services || [])
      setPurchases(data.purchases || [])
    } catch (error: any) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [])

  useEffect(() => {
    const reference = searchParams.get("reference")
    if (!reference || verificationReference === reference) return

    setVerificationReference(reference)

    async function verify() {
      const res = await fetch("/api/subscriptions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast({
          title: "Subscription active",
          description: data.receiptEmailSent
            ? "Your receipt has been emailed to you."
            : "Your payment was verified, but the receipt email could not be sent. You can retry from My subscriptions.",
        })
        setViewTab("mine")
        loadSubscriptions()
      } else {
        toast({ title: "Payment not confirmed", description: "Please contact support if you were debited.", variant: "destructive" })
      }
    }

    verify()
  }, [searchParams, toast, verificationReference])

  async function checkout(serviceId: string) {
    setPayingId(serviceId)
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")
      window.location.href = data.authorizationUrl
    } catch (error: any) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" })
    } finally {
      setPayingId(null)
    }
  }

  function requestCheckout(service: any) {
    if (!service.is_active || activePurchaseByService.has(service.id)) return
    setConfirmService(service)
  }

  async function resendReceipt(purchaseId: string) {
    setResendingReceiptId(purchaseId)
    try {
      const res = await fetch("/api/subscriptions/resend-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to resend receipt")
      toast({ title: "Receipt sent", description: "We emailed the receipt to your account email." })
    } catch (error: any) {
      toast({ title: "Receipt email failed", description: error.message, variant: "destructive" })
    } finally {
      setResendingReceiptId(null)
    }
  }

  const activePurchases = purchases.filter((purchase) => purchase.status === "active")
  const activePurchaseByService = new Map(activePurchases.map((purchase) => [purchase.service_id, purchase]))
  const categories = useMemo(() => ["all", ...Array.from(new Set(services.map((service) => service.category).filter(Boolean)))], [services])

  const filteredServices = services.filter((service) => {
    const matchesSearch = [service.name, service.company, service.description, service.location_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = category === "all" || service.category === category
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 gap-2">
            <ShieldCheck className="h-4 w-4" />
            Secure Paystack checkout
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse verified community services, purchase access, and keep your receipts and active plans in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activePurchases.length}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Receipts</p>
              <p className="text-2xl font-bold">{purchases.filter((purchase) => purchase.receipt_number).length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={viewTab} onValueChange={setViewTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="mine">My subscriptions</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewTab === "services" ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={category} onValueChange={setCategory} className="w-full lg:w-auto">
              <TabsList className="flex h-auto w-full justify-start overflow-x-auto lg:w-auto">
                {categories.map((item) => (
                  <TabsTrigger key={item} value={item} className="capitalize">
                    {item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services..." className="pl-9" />
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <h3 className="text-lg font-semibold">No subscriptions found</h3>
                  <p className="text-sm text-muted-foreground">Try another category or search term.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => {
                const activePurchase = activePurchaseByService.get(service.id)
                const features = service.featured_services || []
                const unavailable = !service.is_active
                return (
                  <Card key={service.id} className={cn("overflow-hidden", unavailable && "opacity-80")}>
                    <div className="relative aspect-video bg-muted">
                      {service.image_url ? (
                        <Image src={service.image_url} loading="eager" alt={service.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <Badge>{service.category}</Badge>
                        {service.is_featured && <Badge variant="secondary">Featured</Badge>}
                        {unavailable && <Badge variant="secondary">Unavailable</Badge>}
                      </div>
                    </div>

                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.company || "Vibe2Gether partner"}</p>
                          </div>
                          {activePurchase && <Badge className="shrink-0">Purchased</Badge>}
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {features.slice(0, 4).map((item: string) => (
                          <Badge key={item} variant="outline">{item}</Badge>
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
                        {activePurchase?.expires_at && (
                          <div className="flex items-center gap-2 text-primary">
                            <Clock className="h-4 w-4" />
                            Active until {new Date(activePurchase.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-2xl font-bold">{service.currency} {Number(service.price).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Receipt sent by email after purchase</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedService(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                          <Button disabled={unavailable || Boolean(activePurchase) || payingId === service.id} onClick={() => requestCheckout(service)}>
                            {payingId === service.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                            {activePurchase ? "Active" : unavailable ? "Unavailable" : "Subscribe"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </section>
          )}
        </>
      ) : (
        <section className="space-y-4">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                <ReceiptText className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <h3 className="text-lg font-semibold">No subscriptions yet</h3>
                  <p className="text-sm text-muted-foreground">Your active and pending subscriptions will appear here after checkout.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {purchase.service?.image_url ? (
                        <Image src={purchase.service.image_url} loading="eager" alt={purchase.service?.name || "Subscription"} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ReceiptText className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{purchase.service?.name || "Subscription"}</p>
                        <Badge variant={purchase.status === "active" ? "default" : "secondary"}>{purchase.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{purchase.service?.company || "Vibe2Gether partner"}</p>
                      <p className="mt-2 text-sm">
                        {purchase.expires_at ? `Valid until ${new Date(purchase.expires_at).toLocaleDateString()}` : "Awaiting activation"}
                      </p>
                      <p className="text-sm font-semibold">
                        {purchase.currency} {Number(purchase.amount || 0).toLocaleString()}
                      </p>
                      {purchase.receipt_number && (
                        <p className="mt-1 text-xs text-muted-foreground">Receipt: {purchase.receipt_number}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={purchase.payment_status !== "paid" || !purchase.receipt_number || resendingReceiptId === purchase.id}
                          onClick={() => resendReceipt(purchase.id)}
                        >
                          {resendingReceiptId === purchase.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ReceiptText className="mr-2 h-4 w-4" />
                          )}
                          Email receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedService.name}</DialogTitle>
                <DialogDescription>{selectedService.company || "Vibe2Gether partner"}</DialogDescription>
              </DialogHeader>
              {selectedService.image_url && (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <Image src={selectedService.image_url} loading="eager" alt={selectedService.name} fill className="object-cover" />
                </div>
              )}
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{selectedService.description}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-bold">{selectedService.currency} {Number(selectedService.price).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-lg font-bold">{formatDuration(selectedService)}</p>
                  </div>
                </div>
                {(selectedService.featured_services || []).length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Included services</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedService.featured_services.map((item: string) => (
                        <div key={item} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedService.terms && (
                  <div>
                    <h3 className="mb-2 font-semibold">Terms</h3>
                    <p className="whitespace-pre-wrap rounded-lg border p-3 text-sm text-muted-foreground">{selectedService.terms}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedService(null)}>Close</Button>
                <Button
                  disabled={!selectedService.is_active || activePurchaseByService.has(selectedService.id) || payingId === selectedService.id}
                  onClick={() => requestCheckout(selectedService)}
                >
                  {payingId === selectedService.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                  {activePurchaseByService.has(selectedService.id) ? "Already Active" : selectedService.is_active ? "Subscribe" : "Unavailable"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmService} onOpenChange={(open) => !open && setConfirmService(null)}>
        <DialogContent className="sm:max-w-md">
          {confirmService && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm subscription</DialogTitle>
                <DialogDescription>
                  You are about to subscribe to {confirmService.name}. You will be redirected to Paystack to complete payment.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">{confirmService.name}</p>
                <p className="text-sm text-muted-foreground">{formatDuration(confirmService)} access</p>
                <p className="mt-2 text-2xl font-bold">
                  {confirmService.currency} {Number(confirmService.price).toLocaleString()}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmService(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    const serviceId = confirmService.id
                    setConfirmService(null)
                    checkout(serviceId)
                  }}
                  disabled={payingId === confirmService.id}
                >
                  {payingId === confirmService.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                  Proceed to Paystack
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
