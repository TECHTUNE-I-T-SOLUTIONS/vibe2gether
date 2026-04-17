"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Users, CircleDollarSign, Lightbulb, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const iconMap = {
  Briefcase: Briefcase,
  Users: Users,
  CircleDollarSign: CircleDollarSign,
  Lightbulb: Lightbulb,
}

export function FeatureCards() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/opportunities/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats || [])
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[140px] h-32 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] || Briefcase
        return (
          <Card 
            key={stat.id} 
            className="min-w-[140px] border-none shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95 bg-card/50 backdrop-blur-sm"
            onClick={() => router.push(stat.id === 'tips' ? '/dashboard/learn' : '/dashboard/opportunities')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-primary font-bold mt-0.5">{stat.count} new</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {/* Create Room / Call to Action card */}
      <Card 
        className="min-w-[140px] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
        onClick={() => router.push('/dashboard/opportunities?showCreateModal=true')}
      >
        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full space-y-2">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary">
            <span className="text-2xl font-light">+</span>
          </div>
          <p className="text-xs font-bold text-primary">Create New</p>
        </CardContent>
      </Card>
    </div>
  )
}
