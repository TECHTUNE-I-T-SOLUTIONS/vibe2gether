"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Loader2, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { OpportunityCard } from "@/components/opportunities/opportunity-card"
import { CreateOpportunityModal } from "@/components/opportunities/create-opportunity-modal"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function OpportunitiesDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
      <OpportunitiesContent />
    </Suspense>
  )
}

function OpportunitiesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUserProfile()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("all")
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null)

  useEffect(() => {
    if (searchParams.get("showCreateModal") === "true") {
      setShowCreateModal(true)
      // Clean up URL to avoid re-opening on refresh if needed, 
      // but usually users want it to stay if they shared the link.
      // However, for this UX, once opened, we might want to clear it.
      router.replace("/dashboard/opportunities")
    }
  }, [searchParams, router])

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true)
      let url = "/api/opportunities"
      if (activeTab === "my") url = "/api/opportunities/my"
      else if (activeTab === "bookmarked") url = "/api/opportunities/bookmarked"

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOpportunities(data.opportunities || [])
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchOpportunities()
    }
  }, [status, activeTab, fetchOpportunities])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return
    
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Opportunity deleted successfully." })
        fetchOpportunities()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const filteredOpps = opportunities.filter(opp => 
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Discover jobs, grants, and more within the Vibe2Gether community.</p>
        </div>
        <Button className="w-full md:w-auto h-12 md:h-11 rounded-xl md:rounded-full px-6 gradient-bg shadow-lg shadow-primary/20" onClick={() => {
          setEditingOpportunity(null)
          setShowCreateModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Posting
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="w-full md:w-auto flex overflow-x-auto no-scrollbar bg-muted/50 p-1 h-auto min-h-[44px]">
            <TabsTrigger value="all" className="flex-1 md:flex-none rounded-lg px-6 py-2 text-xs md:text-sm">Explore</TabsTrigger>
            <TabsTrigger value="my" className="flex-1 md:flex-none rounded-lg px-6 py-2 text-xs md:text-sm">My Postings</TabsTrigger>
            <TabsTrigger value="bookmarked" className="flex-1 md:flex-none rounded-lg px-6 py-2 text-xs md:text-sm">Bookmarked</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search..." 
              className="pl-10 h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpps.map(opp => (
                <OpportunityCard 
                  key={opp.id} 
                  opportunity={opp} 
                  isOwner={activeTab === "my"}
                  onEdit={(o) => {
                    setEditingOpportunity(o)
                    setShowCreateModal(true)
                  }}
                  onDelete={handleDelete}
                  onRefresh={fetchOpportunities}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No opportunities found</h3>
                <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => {
                 setSearchQuery("")
                 setActiveTab("all")
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateOpportunityModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        opportunity={editingOpportunity}
        onSuccess={fetchOpportunities}
      />
    </div>
  )
}
