"use client"

import { useI18n } from "@/lib/i18n/context"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react"
import Link from "next/link"

const opportunities = [
  {
    type: "Freelance",
    title: "Freelance Social Media Manager",
    location: "Remote",
    company: "ErcSomm",
    category: "Marketing",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    type: "Funding",
    title: "Business Grants for Women Entrepreneurs",
    location: "Douala",
    company: "SafeCo",
    category: "Funding",
    color: "bg-pink-500/10 text-pink-500",
  },
]

export function FeaturedOpps() {
  const { t } = useI18n()

  return (
    <section className="py-24 bg-[#0d0d0f] text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">{t("exploreOpps")}</h2>
            <p className="text-zinc-400 max-w-xl">
              {t("featuresDescription")}
            </p>
          </div>
          <Link href="/opportunities">
            <Button variant="outline" className="rounded-full border-zinc-700 hover:bg-zinc-200 text-black dark:text-white">
              {t("viewAll")}
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {opportunities.map((opp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden group hover:border-primary/50 transition-colors">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className={`${opp.color} border-none`}>{opp.type}</Badge>
                    <span className="text-zinc-500 text-xs">2 days ago</span>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {opp.title}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Briefcase className="w-4 h-4" />
                      <span>{opp.company}</span>
                    </div>
                  </div>

                  <Button className="w-full rounded-xl bg-zinc-800 hover:bg-primary hover:text-white transition-all">
                    {t("apply") || "Apply Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Featured Image Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 hidden lg:block"
          >
            <div className="h-full rounded-3xl overflow-hidden relative group">
              <img 
                src="https://images.pexels.com/photos/5398945/pexels-photo-5398945.jpeg" 
                alt="Professional woman using Vibe2Gether"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 space-y-2">
                <p className="text-primary font-bold tracking-widest text-xs uppercase">{t("successStories")}</p>
                <p className="text-xl font-bold">"I got my dream internship through Vibe2Gether. It connected me with amazing opportunities."</p>
                <p className="text-zinc-400">— Grace A.</p>
                <Button variant="link" className="p-0 text-white h-auto font-bold mt-4">
                  {t("readMoreStories")}
                  <ArrowUpRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
