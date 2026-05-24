import type { Metadata, ResolvingMetadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TicketActions } from "./ticket-actions"
import { ShareActions } from "./share-actions"

type Props = {
  params: Promise<{ slug: string }>
}

function slugify(value: string) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatDateTime(value: string | null) {
  if (!value) return "TBA"
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function buildAbsoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  return new URL(path, base).toString()
}

async function findEventBySlugOrId(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, users:created_by(display_name, profile_picture, id)")
    .eq("status", "upcoming")

  const events = data || []
  return events.find((event: any) => slugify(event.title) === slug || event.id === slug) || null
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const event = await findEventBySlugOrId(slug)

  if (!event) {
    return {
      title: "Event Not Found - Vibe2gether",
      description: "The event you are looking for could not be found.",
    }
  }

  const title = `${event.title} | Vibe2gether`
  const description = event.description || "Join us for this event on Vibe2gether."
  const image = event.thumbnail || event.thumbnail_url || buildAbsoluteUrl("/placeholder.svg")
  const shareUrl = buildAbsoluteUrl(`/events/${slugify(event.title)}`)

  return {
    title,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params
  const event = await findEventBySlugOrId(slug)

  if (!event) notFound()

  const shareSlug = slugify(event.title)
  const shareUrl = buildAbsoluteUrl(`/events/${shareSlug}`)
  const image = event.thumbnail || event.thumbnail_url || "/placeholder.svg"
  const ticketPriceNgn = Math.round(Number(event.ticket_price || 0) * 1450)
  const tickets = event.is_free
    ? [{ name: "General Access", price: "Free", note: "Secure your spot with free entry." }]
    : [
        { name: "General Ticket", price: `NGN ${ticketPriceNgn.toLocaleString()}`, note: "Standard event access." },
        { name: "VIP Pass", price: `NGN ${Math.round(ticketPriceNgn * 1.5).toLocaleString()}`, note: "Priority experience and perks." },
        { name: "Premium Table", price: `NGN ${Math.round(ticketPriceNgn * 3).toLocaleString()}`, note: "Best for groups and premium seating." },
      ]

  const related = await (async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from("events")
      .select("id, title, description, thumbnail, thumbnail_url, event_date, location_name, category")
      .eq("status", "upcoming")
      .neq("id", event.id)
      .order("event_date", { ascending: true })
      .limit(6)
    return data || []
  })()

  return (
    <div className="min-h-screen bg-primary-gradient dark:bg-[#0b0b0d] text-black dark:text-white">
      <main className="mx-auto max-w-auto px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/events">
            <Button variant="ghost" className="rounded-full bg-black dark:bg-white/5 text-white hover:bg-white/10">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <ShareActions title={event.title} description={event.description} shareUrl={shareUrl} />
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
          <div className="absolute inset-0">
            <Image src={image} alt={event.title} fill priority className="object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-black/55 to-black/35" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,145,0,0.28),transparent_45%)]" />
          </div>

          <div className="relative flex min-h-[760px] flex-col justify-end px-5 py-6 sm:px-8 sm:py-10 lg:min-h-[980px] lg:px-12 lg:py-12">
            <div className="max-w-5xl space-y-5 pb-6 sm:pb-10 lg:pb-16">
              <Badge className="w-fit rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-orange-200">
                {event.category || "Event"}
              </Badge>
              <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-yellow-300 drop-shadow-[0_12px_35px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-8xl">
                {event.title}
              </h1>
              <p className="max-w-2xl text-sm text-white/82 sm:text-base">
                {event.description || "A beautifully curated event experience built for the community."}
              </p>
              <TicketActions event={{ ...event, ticket_price_ngn: ticketPriceNgn }} />
            </div>
          </div>
        </section>

        <section className="-mt-10 grid gap-6 lg:-mt-10 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-white/10 bg-background dark:bg-[#111114] text-black dark:text-white shadow-2xl">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-orange-300">About This Event</p>
                <h2 className="mt-1 text-2xl font-bold">What to expect</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/72 dark:text-white/72">
                  {event.description || "An unforgettable experience with strong visuals, clear information, and easy access to tickets."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 dark:bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black dark:text-white/45">Capacity</p>
                  <p className="mt-2 text-lg font-semibold">{event.capacity || "Unlimited"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 dark:bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black dark:text-white/45">Organizer</p>
                  <p className="mt-2 text-lg font-semibold">{event.organizer_name || event.users?.display_name || "Vibe2gether"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 dark:bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black dark:text-white/45">Price</p>
                  <p className="mt-2 text-lg font-semibold">{event.is_free ? "Free" : `NGN ${ticketPriceNgn.toLocaleString()}`}</p>
                </div>
              </div>

              {event.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: string) => (
                    <Badge key={tag} className="rounded-full border border-white/10 bg-black/10 dark:bg-white/5 px-3 py-1 text-black dark:text-white/70">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card id="tickets" className="border-white/10 bg-background dark:bg-[#111114] text-black dark:text-white shadow-2xl">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Quick Access</p>
              <h2 className="text-2xl font-bold">Tickets & Sharing</h2>
              <div className="space-y-3 text-sm text-black/72 dark:text-white/72">
                <p>Share this event.</p>
                <p className="break-all rounded-2xl border border-white/10 bg-black/10 dark:bg-white/5 p-4 text-black dark:text-white/80">{shareUrl}</p>
              </div>
              <ShareActions title={event.title} description={event.description} shareUrl={shareUrl} />
            </CardContent>
          </Card>
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Recommended For You</p>
              <h2 className="text-2xl font-bold">You May Also Like</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item: any) => (
              <Link key={item.id} href={`/events/${slugify(item.title)}`}>
                <Card className="group overflow-hidden border-white/10 bg-background dark:bg-[#151518] transition-transform duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[4/5]">
                    <Image src={item.thumbnail || item.thumbnail_url || "/placeholder.svg"} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                    <Badge className="absolute left-3 top-3 border-0 bg-black/10 dark:bg-black/50 text-black dark:text-white">{item.category || "Event"}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-black/65 dark:text-white/65">{item.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-black/55 dark:text-white/55">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(item.event_date)}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-orange-300">View event</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
