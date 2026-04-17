"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2, BookOpen, GraduationCap, Sparkles, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ResourceCard } from "@/components/learn/resource-card"
import { CreateResourceModal } from "@/components/learn/create-resource-modal"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function LearnDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-secondary" /></div>}>
      <LearnContent />
    </Suspense>
  )
}

function LearnContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUserProfile()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("all")
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)

  useEffect(() => {
    if (searchParams.get("showCreateModal") === "true") {
      setShowCreateModal(true)
      router.replace("/dashboard/learn")
    }
  }, [searchParams, router])

  const fetchResources = useCallback(async () => {
    if (!user?.is_premium) return
    try {
      setLoading(true)
      let url = "/api/learn"
      if (activeTab === "my") url = "/api/learn/my"
      else if (activeTab === "saved") url = "/api/learn/saved"

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources || [])
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, user?.is_premium])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && user) {
      fetchResources()
    }
  }, [status, activeTab, fetchResources, user])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this resource?")) return
    
    try {
      const res = await fetch(`/api/learn/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Removed", description: "Resource removed successfully." })
        fetchResources()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" })
    }
  }

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading" || userLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-secondary" /></div>
  }

  // Premium Access Gate
  if (user && !user.is_premium) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-[80vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary animate-pulse">
            <Lock className="w-12 h-12" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-4 border-background shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        
        <div className="space-y-3 max-w-md">
          <h1 className="text-4xl font-black tracking-tight">Premium Feature</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            The Learn & Grow section is reserved for our Pro members. Unlock expert courses, mentorship, and business tools today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="rounded-full h-14 px-10 text-lg font-bold gradient-bg shadow-lg shadow-primary/20" onClick={() => router.push("/dashboard/premium")}>
            Upgrade to Premium
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="rounded-full h-14 px-10 text-lg font-bold" onClick={() => router.push("/dashboard/feed")}>
            Back to Feed
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 border-t border-border w-full max-w-2xl opacity-60">
           <div className="space-y-1">
             <p className="font-bold text-foreground">Expert Courses</p>
             <p className="text-xs text-muted-foreground">Learn from the best</p>
           </div>
           <div className="space-y-1">
             <p className="font-bold text-foreground">Business Tools</p>
             <p className="text-xs text-muted-foreground">Grow your network</p>
           </div>
           <div className="space-y-1 hidden md:block">
             <p className="font-bold text-foreground">Exclusive Events</p>
             <p className="text-xs text-muted-foreground">Networking sessions</p>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
            <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Learn & Grow</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Enhance your skills with courses, guides, and mentorship resources.</p>
          </div>
        </div>
        <Button variant="secondary" className="w-full md:w-auto h-12 md:h-11 rounded-xl md:rounded-full px-6 shadow-lg shadow-secondary/10" onClick={() => {
          setEditingResource(null)
          setShowCreateModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <TabsList className="w-full md:w-auto flex overflow-x-auto no-scrollbar bg-transparent gap-2 h-auto p-0">
            <TabsTrigger value="all" className="flex-1 md:flex-none rounded-full px-6 py-2 text-xs md:text-sm data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">Resources</TabsTrigger>
            <TabsTrigger value="my" className="flex-1 md:flex-none rounded-full px-6 py-2 text-xs md:text-sm data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">My Listings</TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 md:flex-none rounded-full px-6 py-2 text-xs md:text-sm data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">Saved</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
            <Input 
              placeholder="Search resources..." 
              className="pl-10 h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-secondary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0 pt-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[420px] rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map(res => (
                <ResourceCard 
                  key={res.id} 
                  resource={res} 
                  isOwner={activeTab === "my"}
                  onEdit={(r) => {
                    setEditingResource(r)
                    setShowCreateModal(true)
                  }}
                  onDelete={handleDelete}
                  onRefresh={fetchResources}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-secondary/5 rounded-[2.5rem] border border-dashed border-secondary/20">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-secondary opacity-40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">No resources here yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">Start your learning journey by exploring available resources or share your own knowledge with the community.</p>
              </div>
              <Button variant="outline" className="rounded-full px-8 h-12 border-secondary/20 hover:bg-secondary/10" onClick={() => {
                 setSearchQuery("")
                 setActiveTab("all")
              }}>
                Browse All Resources
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateResourceModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        resource={editingResource}
        onSuccess={fetchResources}
      />
    </div>
  )
}
