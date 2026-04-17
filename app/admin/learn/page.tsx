"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink,
  GraduationCap,
  BookOpen,
  MoreVertical,
  Filter,
  Eye,
  Clock,
  Shield
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AdminLearnPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "course",
    link_url: "",
    image_url: "",
    content: ""
  })

  useEffect(() => {
    fetchResources()
  }, [activeTab])

  async function fetchResources() {
    try {
      setLoading(true)
      let status = activeTab === "pending" ? "pending" : "all"
      let type = activeTab === "admin" ? "admin" : "all"
      
      const res = await fetch(`/api/admin/learn?status=${status}&type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources || [])
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      const body: any = { status }
      if (status === "rejected") body.rejection_reason = rejectionReason

      const res = await fetch(`/api/admin/learn/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast({ title: "Success", description: `Resource ${status} successfully.` })
        setRejectingId(null)
        setRejectionReason("")
        fetchResources()
      }
    } catch (err) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return
    try {
      const res = await fetch(`/api/admin/learn/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Resource removed." })
        fetchResources()
      }
    } catch (err) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast({ title: "Created", description: "Resource posted and approved." })
        setShowCreateModal(false)
        setFormData({ title: "", description: "", category: "course", link_url: "", image_url: "", content: "" })
        fetchResources()
      }
    } catch (err) {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
             <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
           </div>
           <div className="space-y-0.5">
             <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Learn & Grow Admin</h1>
             <p className="text-sm md:text-base text-muted-foreground">Manage courses, resources, and mentorship listings.</p>
           </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="secondary" className="w-full md:w-auto h-12 md:h-11 rounded-xl md:rounded-full shadow-lg shadow-secondary/10">
          <Plus className="w-5 h-5 mr-2" />
          Add Official Resource
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="w-full md:w-auto flex overflow-x-auto no-scrollbar bg-muted/50 p-1 h-auto min-h-[44px]">
            <TabsTrigger value="pending" className="flex-1 md:flex-none rounded-lg px-4 py-2 text-xs md:text-sm">
              <Clock className="w-3.5 h-3.5 mr-2 md:hidden" />
              <span className="hidden md:inline">Pending Approval</span>
              <span className="md:hidden">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none rounded-lg px-4 py-2 text-xs md:text-sm">
              <Filter className="w-3.5 h-3.5 mr-2 md:hidden" />
              <span className="hidden md:inline">All Resources</span>
              <span className="md:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex-1 md:flex-none rounded-lg px-4 py-2 text-xs md:text-sm">
              <Shield className="w-3.5 h-3.5 mr-2 md:hidden" />
              <span className="hidden md:inline">Admin Posted</span>
              <span className="md:hidden">Admin</span>
            </TabsTrigger>
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

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-secondary mb-4" />
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredResources.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all group">
                  <div className="relative h-48 bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                        <BookOpen className="w-12 h-12 text-secondary opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                       <Badge className={cn(
                         "shadow-lg",
                         item.status === 'approved' ? 'bg-green-500' : 
                         item.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                       )}>
                         {item.status.toUpperCase()}
                       </Badge>
                       {item.admin_id && <Badge variant="secondary" className="shadow-lg">OFFICIAL</Badge>}
                    </div>
                  </div>
                  
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 uppercase">{item.category}</Badge>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views_count} views</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{item.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                           <img alt="Author"
                             src={item.admin_id ? item.admins?.profile_picture : item.users?.profile_picture || '/placeholder.jpg'} 
                             className="w-full h-full object-cover" 
                           />
                         </div>
                         <div className="text-[10px]">
                           <p className="font-medium text-foreground">{item.admin_id ? item.admins?.full_name : item.users?.display_name}</p>
                           <p className="text-muted-foreground italic">{new Date(item.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleAction(item.id, 'approved')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setRejectingId(item.id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(item.link_url, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open Resource
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed rounded-[2.5rem] space-y-4 bg-muted/5">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
              <div>
                <p className="text-xl font-bold">No resources found</p>
                <p className="text-muted-foreground max-w-sm mx-auto">Try switching tabs or adjust your filters to see more results.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Official Learning Resource</DialogTitle>
            <DialogDescription>Create courses, guides, or mentorship listings for the community.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="tool">Business Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (Short Excerpt)</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Full Content / Modules</Label>
              <Textarea className="h-32" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>External Link / LMS URL</Label>
                <Input value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail Image URL</Label>
                <Input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
               <Button type="submit" variant="secondary" disabled={creating}>
                 {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                 Add Resource
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Resource</DialogTitle>
            <DialogDescription>State the reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Reason</Label>
            <Textarea 
              placeholder="e.g. Incomplete information, low quality..." 
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectingId && handleAction(rejectingId, 'rejected')}>Reject Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
