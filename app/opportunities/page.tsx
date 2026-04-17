"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { OpportunityCard } from "@/components/opportunities/opportunity-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Briefcase, Sparkles } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"

const CATEGORIES = ["All", "Job Posting", "Hiring Notice", "Funding/Grants", "Internship", "Partnership", "Gig/Freelance"]

export default function PublicOpportunitiesPage() {
  const { data: session } = useSession()
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    fetchOpportunities()
  }, [selectedCategory])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/opportunities?category=${selectedCategory}`)
      if (res.ok) {
        const data = await res.json()
        setOpportunities(data.opportunities || [])
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOpps = opportunities.filter(opp => 
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-bg-[radial-gradient(circle_at_top_left,_rgba(255,119,163,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(143,107,255,0.14),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#ffffff_36%,_#fff7f4_100%)] text-foreground dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,95,149,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(130,104,255,0.14),_transparent_24%),linear-gradient(180deg,_#0d0d0f_0%,_#121218_42%,_#17111c_100%)] text-white">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold border border-primary/30">
                <Sparkles className="w-4 h-4" />
                <span>Endless Possibilities</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-black dark:text-white">
                Unlock Your Next <span className="gradient-text">Big Opportunity</span>
              </h1>
              <p className="text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed">
                Connect with top employers, find funding for your startup, or discover exclusive partnerships across Africa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search for jobs, grants, or internships..." 
                    className="pl-12 h-14 bg-zinc-600/50 dark:bg-zinc-800/50 border-zinc-800 dark:border-zinc-600 rounded-2xl text-lg focus-visible:ring-primary text-white dark:text:white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="h-14 px-8 rounded-2xl gradient-bg text-lg font-bold">
                  Find Now
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full overflow-x-auto">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-nowrap w-fit">
                {CATEGORIES.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-4 shrink-0">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground">{filteredOpps.length}</span> opportunities
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOpps.map(opp => (
                <OpportunityCard 
                  key={opp.id} 
                  opportunity={opp} 
                  isAuthenticated={!!session?.user}
                  onRefresh={fetchOpportunities}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-primary opacity-30" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No results found</h2>
              <p className="text-muted-foreground mb-8">Try broadening your search or choosing a different category.</p>
              <Button variant="outline" className="rounded-full px-8" onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
              }}>
                Reset Filters
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
