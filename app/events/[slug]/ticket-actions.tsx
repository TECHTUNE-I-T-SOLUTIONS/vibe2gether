"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Calendar, Loader2, Users, Phone, Mail, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { PaymentMethodOptions } from "@/components/payment-method-options"

const MOBILE_MONEY_COUNTRIES = [
  {
    code: "CM",
    label: "Cameroon",
    dialCode: "237",
    currency: "XAF",
    placeholder: "6XXXXXXXX",
    networks: [
      { value: "MTN", label: "MTN Mobile Money" },
      { value: "ORANGE", label: "Orange Money" },
    ],
  },
  {
    code: "NG",
    label: "Nigeria",
    dialCode: "234",
    currency: "NGN",
    placeholder: "8XXXXXXXXX",
    networks: [{ value: "MTN", label: "MTN MoMo" }],
  },
  {
    code: "US",
    label: "United States",
    dialCode: "1",
    currency: "USD",
    placeholder: "5550100000",
    networks: [{ value: "MOBILE_MONEY", label: "Mobile Money" }],
  },
]

const USD_TO_NGN = 1450

function getTicketAmountNgn(event: any) {
  const explicitNgn = Number(event?.ticket_price_ngn || event?.ticket_price_ngn_amount || 0)
  if (explicitNgn > 0) return Math.round(explicitNgn)

  const amount = Number(event?.ticket_price_usd || event?.ticket_price || 0)
  if ((event?.currency || "USD").toUpperCase() === "NGN") {
    return Math.round(amount)
  }

  return Math.round(amount * USD_TO_NGN)
}

export function TicketActions({ event }: { event: any }) {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "flutterwave">("paystack")
  const [mobileMoney, setMobileMoney] = useState({
    country: "CM",
    countryCode: "237",
    currency: "XAF",
    network: "MTN",
    phoneNumber: "",
  })
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [ticketForm, setTicketForm] = useState({
    attendeeName: "",
    attendeeEmail: "",
    attendeePhone: "",
    attendeeAddress: "",
  })
  const selectedMobileMoneyCountry =
    MOBILE_MONEY_COUNTRIES.find((country) => country.code === mobileMoney.country) || MOBILE_MONEY_COUNTRIES[0]
  const ticketAmountNgn = getTicketAmountNgn(event)

  async function handlePurchaseTicket(e: FormEvent) {
    e.preventDefault()
    try {
      setPurchasing(true)
      if (event.is_free || !event.ticket_price) {
        const res = await fetch("/api/events/tickets/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id, ...ticketForm }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        toast({ title: "Success", description: "Ticket reserved successfully!" })
        setOpen(false)
        return
      }

      if (paymentMethod === "flutterwave") {
        if (!mobileMoney.countryCode || !mobileMoney.network || mobileMoney.phoneNumber.length < 8) {
          toast({
            title: "Wallet details required",
            description: "Enter a valid mobile money wallet before continuing.",
            variant: "destructive",
          })
          return
        }

        const res = await fetch("/api/flutterwave/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: ticketAmountNgn,
            itemType: "event",
            itemData: {
              id: event.id,
              title: event.title,
            },
            mobileMoney,
            metadata: {
              type: "event_registration",
              eventId: event.id,
              eventTitle: event.title,
              attendeeName: ticketForm.attendeeName,
              attendeeEmail: ticketForm.attendeeEmail,
              attendeePhone: ticketForm.attendeePhone,
              attendeeAddress: ticketForm.attendeeAddress,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || "Failed to initialize Method II payment")
        if (data.authorizationUrl) window.location.href = data.authorizationUrl
        return
      }

      const res = await fetch("/api/events/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ticketForm.attendeeEmail,
          fullName: ticketForm.attendeeName,
          eventId: event.id,
          attendeeName: ticketForm.attendeeName,
          attendeeEmail: ticketForm.attendeeEmail,
          attendeePhone: ticketForm.attendeePhone,
          attendeeAddress: ticketForm.attendeeAddress,
          ticketPriceNgn: ticketAmountNgn,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to purchase ticket", variant: "destructive" })
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => (session?.user ? setOpen(true) : setAuthOpen(true))} className="h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 font-bold text-black hover:from-orange-400 hover:to-yellow-400">
          Get Tickets Now
        </Button>
        {/* <Button asChild variant="outline" className="h-12 rounded-full border-white/20 bg-black/5 dark:bg-white/5 px-6 text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 hover:text-white dark:hover:text-white">
          <a href={shareUrl} >Share Event</a>
        </Button> */}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Get Ticket: {event.title}</DialogTitle>
              <DialogDescription>Complete the form below to secure your spot.</DialogDescription>
            </DialogHeader>

            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
              {event.thumbnail ? (
                <Image loading="eager" src={event.thumbnail} alt={event.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Calendar className="w-12 h-12 text-muted-foreground" /></div>
              )}
            </div>

            <form onSubmit={handlePurchaseTicket} className="space-y-4">
              {!event.is_free && <PaymentMethodOptions value={paymentMethod} onChange={setPaymentMethod} />}
              {!event.is_free && paymentMethod === "flutterwave" && (
                <div className="space-y-3 rounded-xl border p-4">
                  <div>
                    <p className="font-semibold">Mobile money wallet</p>
                    <p className="text-sm text-muted-foreground">Choose the country/currency and wallet that will approve this payment.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Country</Label>
                      <select
                        value={mobileMoney.country}
                        onChange={(changeEvent) =>
                          setMobileMoney((current) => {
                            const country = MOBILE_MONEY_COUNTRIES.find((item) => item.code === changeEvent.target.value) || MOBILE_MONEY_COUNTRIES[0]
                            return {
                              ...current,
                              country: country.code,
                              countryCode: country.dialCode,
                              currency: country.currency,
                              network: country.networks[0]?.value || "",
                            }
                          })
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {MOBILE_MONEY_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.label} ({country.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Network</Label>
                      <select
                        value={mobileMoney.network}
                        onChange={(changeEvent) => setMobileMoney((current) => ({ ...current, network: changeEvent.target.value }))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {selectedMobileMoneyCountry.networks.map((network) => (
                          <option key={network.value} value={network.value}>
                            {network.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-3">
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Code</Label>
                      <Input value={mobileMoney.countryCode} readOnly />
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Wallet phone</Label>
                      <Input
                        value={mobileMoney.phoneNumber}
                        onChange={(changeEvent) =>
                          setMobileMoney((current) => ({
                            ...current,
                            phoneNumber: changeEvent.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder={selectedMobileMoneyCountry.placeholder}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="attendeeName">Full Name *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="attendeeName" className="pl-10" value={ticketForm.attendeeName} onChange={e => setTicketForm({ ...ticketForm, attendeeName: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendeeEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="attendeeEmail" type="email" className="pl-10" value={ticketForm.attendeeEmail} onChange={e => setTicketForm({ ...ticketForm, attendeeEmail: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attendeePhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="attendeePhone" className="pl-10" value={ticketForm.attendeePhone} onChange={e => setTicketForm({ ...ticketForm, attendeePhone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendeeAddress">Address</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="attendeeAddress" className="pl-10" value={ticketForm.attendeeAddress} onChange={e => setTicketForm({ ...ticketForm, attendeeAddress: e.target.value })} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gradient-bg text-lg font-bold shadow-lg" disabled={purchasing}>
        {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : (event.is_free ? "Get Free Ticket" : "Pay & Get Ticket")}
      </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle>Sign in to book this ticket</DialogTitle>
              <DialogDescription>
                You need to be logged in before you can reserve or pay for this event.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {status === "loading"
                ? "Checking your session..."
                : "Once you're signed in, you can continue with the booking and payment flow."}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1 gradient-bg">
                <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
                  Log In
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/signup?callbackUrl=${encodeURIComponent(pathname)}`}>
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
