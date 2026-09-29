"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {Calendar, Loader2, Users, Phone, Mail, Home, Upload, Image as ImageIcon, X, AlertCircle} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { PaymentMethodOptions } from "@/components/payment-method-options"
import { uploadReceiptMedia } from "@/lib/supabase/storage"
import { normalizeMobileMoneyPhone } from "@/lib/mobile-money"

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
]

const USD_TO_NGN = 1450

function getTicketAmountNgn(event: any) {
  const priceNgn = Number(event?.ticket_price_ngn || event?.ticket_price_ngn_amount || 0)
  const priceUsd = Number(event?.ticket_price_usd || 0)
  const ticketPrice = Number(event?.ticket_price || 0)
  const currency = String(event?.currency || "USD").toUpperCase()

  if (priceNgn > 0) return Math.round(priceNgn)
  if (priceUsd > 0) return Math.round(priceUsd * USD_TO_NGN)
  if (currency === "NGN") {
    return ticketPrice >= 100 ? Math.round(ticketPrice) : Math.round(ticketPrice * USD_TO_NGN)
  }
  if (currency === "USD") return Math.round(ticketPrice * USD_TO_NGN)

  return Math.round(ticketPrice * USD_TO_NGN)
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
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
        if (!receiptFile) {
          toast({
            title: "Receipt Required",
            description: "Please upload a screenshot of your payment receipt.",
            variant: "destructive",
          })
          setPurchasing(false)
          return
        }
        
        try {
          if (!session?.user?.id) throw new Error("You must be logged in to pay")
          
          const ticketAmountNgn = getTicketAmountNgn(event)
          
          // 1. Upload receipt
          const { url: receiptUrl, error: uploadError } = await uploadReceiptMedia(session.user.id, receiptFile)
          if (uploadError || !receiptUrl) {
            throw new Error(uploadError || "Failed to upload receipt")
          }
          
          // 2. Submit manual payment
          const response = await fetch("/api/payments/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: ticketAmountNgn,
              currency: "NGN",
              itemType: "event",
              itemData: {
                id: event.id,
                title: event.title,
              },
              receiptUrl,
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
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || error.message || "Failed to submit manual payment")
          }
          
          toast({
            title: "Payment Submitted",
            description: "Your receipt has been uploaded. Verification may take between a few minutes and an hour. Your e-ticket will be sent once verified.",
            variant: "default",
          })
          
          setOpen(false)
          setTicketForm({
            attendeeName: "",
            attendeeEmail: "",
            attendeePhone: "",
            attendeeAddress: "",
          })
        } catch (error) {
          toast({
            title: "Payment Error",
            description: error instanceof Error ? error.message : "Failed to submit payment",
            variant: "destructive",
          })
        }
        setPurchasing(false)
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
                  <div className="space-y-4 rounded-xl border p-4 bg-muted/30">
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-2">
                      <h4 className="font-semibold text-primary mb-1">Mobile Money Transfer (Cameroon)</h4>
                      <p className="text-sm text-muted-foreground mb-3">Please send exactly <strong className="text-foreground">FCFA {Math.round((Number(event.ticket_price) || 0) * 605).toLocaleString()}</strong> to the following account:</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm bg-background p-3 rounded border">
                        <span className="text-muted-foreground">Number:</span>
                        <strong className="font-mono text-base">672945939</strong>
                        <span className="text-muted-foreground">Name:</span>
                        <strong>Nko levis</strong>
                        <span className="text-muted-foreground">Network:</span>
                        <strong>Momo (MTN/Orange)</strong>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="block text-sm font-medium mb-1">Upload Receipt Screenshot</Label>
                        <p className="text-xs text-muted-foreground mb-2">After making the transfer, upload the screenshot or PDF receipt here for verification.</p>
                        
                        {receiptPreview ? (
                          <div className="relative border rounded-md p-2 bg-background flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {receiptFile?.type.startsWith("image/") ? (
                                <img src={receiptPreview!} alt="Preview" className="w-10 h-10 object-cover rounded border" />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <span className="text-sm truncate">{receiptFile?.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" type="button" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById('receipt-upload')?.click()}>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium text-primary">Click to upload receipt</span>
                            <span className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 5MB</span>
                            <input 
                              id="receipt-upload" 
                              type="file" 
                              accept="image/*,.pdf" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setReceiptFile(file)
                                  setReceiptPreview(URL.createObjectURL(file))
                                }
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 flex gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>Verification may take between a few minutes and an hour. Your e-ticket will be sent to your email once verified by admins.</p>
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
              <Button type="submit" className="w-full h-12 rounded-xl gradient-bg text-lg font-bold shadow-lg" disabled={purchasing || (paymentMethod === "flutterwave" && !receiptFile)}>
                  {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : (event.is_free ? "Get Free Ticket" : paymentMethod === "flutterwave" ? "Submit Receipt" : "Pay & Get Ticket")}
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
