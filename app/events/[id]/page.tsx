import { Metadata, ResolvingMetadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { EventRedirectClient } from "./client"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", resolvedParams.id)
    .single()

  if (!event) {
    return {
      title: "Event Not Found - Vibe2gether",
    }
  }

  const title = `${event.title} | Vibe2gether`
  const description = event.description || "Join us for this amazing event on Vibe2gether!"
  const imageUrl = event.thumbnail || "https://vibe2gether.vercel.app/placeholder.svg" // fallback if needed

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function EventSharePage({ params }: Props) {
  const resolvedParams = await params
  return <EventRedirectClient id={resolvedParams.id} />
}
