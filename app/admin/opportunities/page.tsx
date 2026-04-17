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
  Briefcase,
  MapPin,
  MoreVertical,
  Clock,
  Filter,
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

export default function AdminOpportunitiesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "job",
    location: "",
    link_url: "",
    image_url: "",
    content: ""
  })

  useEffect(() => {
    fetchOpportunities()
  }, [activeTab])

  async function fetchOpportunities() {
    try {
      setLoading(true)
      let status = activeTab === "pending" ? "pending" : "all"
      let type = activeTab === "admin" ? "admin" : "all"
      
      const res = await fetch(`/api/admin/opportunities?status=${status}&type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setOpportunities(data.opportunities || [])
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      const body: any = { status }
      if (status === "rejected") body.rejection_reason = rejectionReason

      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast({ title: "Success", description: `Opportunity ${status} successfully.` })
        setRejectingId(null)
        setRejectionReason("")
        fetchOpportunities()
      }
    } catch (err) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this posting?")) return
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Opportunity removed." })
        fetchOpportunities()
      }
    } catch (err) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast({ title: "Created", description: "Opportunity posted and approved." })
        setShowCreateModal(false)
        setFormData({ title: "", description: "", category: "job", location: "", link_url: "", image_url: "", content: "" })
        fetchOpportunities()
      }
    } catch (err) {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const filteredOpps = opportunities.filter(opp => 
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Opportunities</h1>
          <p className="text-sm md:text-base text-muted-foreground">Approve community postings or create official ones.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto h-12 md:h-11 rounded-xl md:rounded-full gradient-bg shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" />
          Create Admin Post
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
              <span className="hidden md:inline">All Postings</span>
              <span className="md:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex-1 md:flex-none rounded-lg px-4 py-2 text-xs md:text-sm">
              <Shield className="w-3.5 h-3.5 mr-2 md:hidden" />
              <span className="hidden md:inline">Admin Posted</span>
              <span className="md:hidden">Admin</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search opportunities..." 
              className="pl-10 h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading opportunities...</p>
            </div>
          ) : filteredOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOpps.map((opp) => (
                <Card key={opp.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all group">
                  <div className="relative h-48 bg-muted">
                    {opp.image_url ? (
                      <img src={opp.image_url} alt={opp.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Briefcase className="w-12 h-12 text-primary opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                       <Badge className={cn(
                         "shadow-lg",
                         opp.status === 'approved' ? 'bg-green-500' : 
                         opp.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                       )}>
                         {opp.status.toUpperCase()}
                       </Badge>
                       {opp.admin_id && <Badge variant="secondary" className="shadow-lg">ADMIN</Badge>}
                    </div>
                  </div>
                  
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm line-clamp-1">{opp.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[8px] h-4 uppercase">{opp.category}</Badge>
                        <span className="flex items-center gap-1 text-[8px]"><MapPin className="w-3 h-3" /> {opp.location || 'Remote'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{opp.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                           <img alt='poster profile'
                             src={opp.admin_id ? opp.admins?.profile_picture : opp.users?.profile_picture || '/placeholder.jpg'} 
                             className="w-full h-full object-cover" 
                           />
                         </div>
                         <div className="text-[10px]">
                           <p className="font-medium text-foreground">{opp.admin_id ? opp.admins?.full_name : opp.users?.display_name}</p>
                           <p className="text-muted-foreground italic">{new Date(opp.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {opp.status === 'pending' && (
                          <>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleAction(opp.id, 'approved')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setRejectingId(opp.id)}>
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
                            <DropdownMenuItem onClick={() => window.open(opp.link_url, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" /> View Link
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(opp.id)}>
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
            <div className="text-center py-20 border-2 border-dashed rounded-3xl space-y-3">
              <p className="text-xl font-semibold">No opportunities found</p>
              <p className="text-muted-foreground">Try switching tabs or searching for something else.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>Create Official Opportunity</DialogTitle>
            <DialogDescription>This will be automatically approved and visible to all users.</DialogDescription>
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
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="funding">Funding</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="volunteering">Volunteering</SelectItem>
                    <SelectItem value="gig">Gig/Freelance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Input placeholder="e.g. Lagos, Nigeria or Remote" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description (Short)</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Full Content / Details</Label>
              <Textarea className="h-32" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>External Link</Label>
                <Input value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail Image URL</Label>
                <Input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
               <Button type="submit" className="gradient-bg" disabled={creating}>
                 {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                 Post Opportunity
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Opportunity</DialogTitle>
            <DialogDescription>Provide a reason so the user knows why their post was rejected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Rejection Reason</Label>
            <Textarea 
              placeholder="e.g. Missing contact details, irrelevant content..." 
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectingId && handleAction(rejectingId, 'rejected')}>Reject Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
