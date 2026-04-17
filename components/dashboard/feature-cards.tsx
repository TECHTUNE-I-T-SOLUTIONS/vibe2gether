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
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] || Briefcase
        return (
          <Card 
            key={stat.id} 
            className="min-w-[80px] sm:min-w-[100px] border-none shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95 bg-card/50 backdrop-blur-sm"
            onClick={() => router.push(stat.id === 'tips' ? '/dashboard/learn' : '/dashboard/opportunities')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center space-y-1.5">
              <div className={cn("w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white flex-shrink-0", stat.color)}>
                <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground line-clamp-2">{stat.label}</p>
                <p className="text-[10px] sm:text-xs text-primary font-bold mt-0.5">{stat.count} new</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {/* Create Room / Call to Action card */}
      <Card 
        className="min-w-[100px] sm:min-w-[100px] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
        onClick={() => router.push('/dashboard/opportunities?showCreateModal=true')}
      >
        <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center h-full space-y-1.5">
          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
            <span className="text-xl sm:text-2xl font-light">+</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-primary">Create New</p>
        </CardContent>
      </Card>
    </div>
  )
}
