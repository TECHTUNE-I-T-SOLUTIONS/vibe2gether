import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Download, ExternalLink, Mail, Calendar } from "lucide-react"

const pressReleases = [
  {
    date: "December 5, 2024",
    title: "Vibe2Gether Reaches 10 Million Users Worldwide",
    excerpt:
      "The dating platform celebrates a major milestone as it expands into 50 new countries across Asia and Europe.",
  },
  {
    date: "November 20, 2024",
    title: "Vibe2Gether Launches Revolutionary AI Matching System",
    excerpt:
      "New AI-powered matching algorithm increases successful connections by 40% compared to traditional methods.",
  },
  {
    date: "October 15, 2024",
    title: "Vibe2Gether Raises $50M Series B Funding",
    excerpt: "Investment led by top-tier VC firms will accelerate product development and global expansion.",
  },
  {
    date: "September 1, 2024",
    title: "Introducing Vibe2Gether Marketplace",
    excerpt: "Users can now buy and sell romantic gifts, experiences, and services directly within the platform.",
  },
]

const mediaLogos = [
  { name: "TechCrunch", logo: "/techcrunch-logo-generic.png" },
  { name: "Forbes", logo: "/forbes-logo-generic.png" },
  { name: "Wired", logo: "/wired-logo.jpg" },
  { name: "The Verge", logo: "/the-verge-logo.png" },
  { name: "Business Insider", logo: "/business-insider-logo.jpg" },
  { name: "CNN", logo: "/cnn-logo.png" },
]

export default function PressPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="gradient-bg text-primary-foreground mb-4">Press & Media</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Vibe2Gether</span> in the News
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Get the latest news, press releases, and media assets from Vibe2Gether.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="rounded-full gradient-bg">
                  <Download className="w-5 h-5 mr-2" />
                  Press Kit
                </Button>
                <Button size="lg" variant="outline" className="rounded-full bg-transparent">
                  <Mail className="w-5 h-5 mr-2" />
                  Media Inquiries
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured In */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <p className="text-center text-muted-foreground mb-8">Featured In</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {mediaLogos.map((media, i) => (
                <div key={i} className="grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                  <Image
                    src={media.logo || "/placeholder.svg"}
                    alt={media.name}
                    width={120}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Press Releases</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Latest announcements and updates from Vibe2Gether
            </p>
            <div className="max-w-4xl mx-auto space-y-6">
              {pressReleases.map((release, i) => (
                <Card
                  key={i}
                  className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <CardContent className="py-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      {release.date}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {release.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{release.excerpt}</p>
                    <Button variant="ghost" className="text-primary p-0 h-auto">
                      Read More
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Assets */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Brand Assets</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Download official Vibe2Gether logos, screenshots, and brand guidelines
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                    <Image src="/v2g-logo.png" alt="Logo" width={60} height={60} className="rounded-xl" />
                  </div>
                  <h3 className="font-semibold mb-2">Logo Pack</h3>
                  <p className="text-sm text-muted-foreground mb-4">PNG, SVG, and EPS formats</p>
                  <Button variant="outline" className="rounded-full w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <div className="w-16 h-10 bg-gradient-to-r from-primary to-accent rounded" />
                  </div>
                  <h3 className="font-semibold mb-2">Brand Guidelines</h3>
                  <p className="text-sm text-muted-foreground mb-4">Colors, typography, usage</p>
                  <Button variant="outline" className="rounded-full w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <Image src="/app-screenshots.jpg" alt="Screenshots" width={80} height={80} />
                  </div>
                  <h3 className="font-semibold mb-2">Screenshots</h3>
                  <p className="text-sm text-muted-foreground mb-4">High-res product images</p>
                  <Button variant="outline" className="rounded-full w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Media Inquiries</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              For press inquiries, interviews, or additional information, please contact our media relations team.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full">
              <Mail className="w-5 h-5 mr-2" />
              press@vibe2gether.com
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
