"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Download,
  ImagePlus,
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const emptyForm = {
  name: "",
  company: "",
  description: "",
  category: "Gym",
  price: "",
  currency: "NGN",
  duration_value: "1",
  duration_unit: "month",
  location_name: "",
  featured_services: "",
  terms: "",
  image_url: "",
  is_featured: false,
  is_active: true,
}

const steps = ["Basics", "Pricing", "Details"]

const serviceCategories = [
  "Gym",
  "Fitness",
  "Wellness",
  "Coworking",
  "Learning",
  "Entertainment",
  "Healthcare",
  "Beauty",
  "Food",
  "Transport",
  "Events",
  "General",
]

function serviceToForm(service: any) {
  return {
    name: service.name || "",
    company: service.company || "",
    description: service.description || "",
    category: service.category || "Gym",
    price: service.price ? String(service.price) : "",
    currency: service.currency || "NGN",
    duration_value: service.duration_value ? String(service.duration_value) : "1",
    duration_unit: service.duration_unit || "month",
    location_name: service.location_name || "",
    featured_services: (service.featured_services || []).join(", "),
    terms: service.terms || "",
    image_url: service.image_url || "",
    is_featured: Boolean(service.is_featured),
    is_active: service.is_active !== false,
  }
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [form, setForm] = useState<any>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [managementTab, setManagementTab] = useState("services")
  const [subscriberStatus, setSubscriberStatus] = useState("all")
  const [subscriberService, setSubscriberService] = useState("all")
  const [search, setSearch] = useState("")
  const [step, setStep] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadServices() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/subscriptions")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load subscriptions")
      setServices(data.services || [])
      setPurchases(data.purchases || [])
    } catch (error: any) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = [service.name, service.company, service.category, service.location_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && service.is_active) ||
        (activeTab === "inactive" && !service.is_active) ||
        (activeTab === "featured" && service.is_featured)

      return matchesSearch && matchesTab
    })
  }, [services, search, activeTab])

  const counts = useMemo(
    () => ({
      all: services.length,
      active: services.filter((service) => service.is_active).length,
      inactive: services.filter((service) => !service.is_active).length,
      featured: services.filter((service) => service.is_featured).length,
      subscribers: purchases.length,
      paid: purchases.filter((purchase) => purchase.payment_status === "paid").length,
      revenue: purchases
        .filter((purchase) => purchase.payment_status === "paid")
        .reduce((total, purchase) => total + Number(purchase.amount || 0), 0),
    }),
    [services, purchases]
  )

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch = [
        purchase.user?.full_name,
        purchase.user?.email,
        purchase.service?.name,
        purchase.receipt_number,
        purchase.paystack_reference,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        subscriberStatus === "all" ||
        purchase.status === subscriberStatus ||
        purchase.payment_status === subscriberStatus
      const matchesService = subscriberService === "all" || purchase.service_id === subscriberService

      return matchesSearch && matchesStatus && matchesService
    })
  }, [purchases, search, subscriberStatus, subscriberService])

  function exportSubscribers() {
    const headers = [
      "Subscriber",
      "Email",
      "Service",
      "Status",
      "Payment Status",
      "Amount",
      "Currency",
      "Receipt",
      "Paid At",
      "Starts At",
      "Expires At",
    ]
    const escapeCsv = (value: any) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const rows = filteredPurchases.map((purchase) => [
      purchase.user?.full_name,
      purchase.user?.email,
      purchase.service?.name,
      purchase.status,
      purchase.payment_status,
      purchase.amount,
      purchase.currency,
      purchase.receipt_number,
      purchase.paid_at,
      purchase.starts_at,
      purchase.expires_at,
    ])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `subscription-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview("")
    setStep(0)
    setModalOpen(true)
  }

  function openEditModal(service: any) {
    setEditingId(service.id)
    setForm(serviceToForm(service))
    setImageFile(null)
    setImagePreview(service.image_url || "")
    setStep(0)
    setModalOpen(true)
  }

  function viewServiceSubscribers(serviceId: string) {
    setSubscriberService(serviceId)
    setSubscriberStatus("all")
    setManagementTab("subscribers")
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid image", description: "Please select an image file.", variant: "destructive" })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please upload an image below 5MB.", variant: "destructive" })
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.image_url

    setUploadingImage(true)
    try {
      const body = new FormData()
      body.append("file", imageFile)

      const res = await fetch("/api/admin/subscriptions/upload-image", {
        method: "POST",
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Image upload failed")

      return data.url
    } finally {
      setUploadingImage(false)
    }
  }

  function validateStep(currentStep = step) {
    if (currentStep === 0 && (!form.name.trim() || !form.description.trim() || !form.category.trim())) {
      toast({ title: "Missing details", description: "Name, category, and description are required.", variant: "destructive" })
      return false
    }

    if (currentStep === 1 && (!form.price || Number(form.price) < 0 || !form.duration_value || Number(form.duration_value) < 1)) {
      toast({ title: "Invalid pricing", description: "Add a valid price and duration.", variant: "destructive" })
      return false
    }

    return true
  }

  function goNext() {
    if (!validateStep()) return
    setStep((value) => Math.min(value + 1, steps.length - 1))
  }

  async function save() {
    if (!validateStep(0) || !validateStep(1)) return

    setSaving(true)
    try {
      const imageUrl = await uploadImageIfNeeded()
      const payload = {
        ...form,
        image_url: imageUrl || null,
        price: Number(form.price),
        duration_value: Number(form.duration_value),
        featured_services: String(form.featured_services || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const res = await fetch(editingId ? `/api/admin/subscriptions/${editingId}` : "/api/admin/subscriptions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")

      toast({
        title: editingId ? "Subscription updated" : "Subscription created",
        description: `${form.name} is ${form.is_active ? "visible to users" : "saved as unavailable"}.`,
      })
      setModalOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      setImageFile(null)
      setImagePreview("")
      await loadServices()
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function deleteService() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/subscriptions/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete subscription")

      toast({ title: "Deleted", description: `${deleteTarget.name} has been removed.` })
      setDeleteTarget(null)
      await loadServices()
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-2 text-muted-foreground">Create and manage paid services shown to users.</p>
        </div>
        <Button className="w-full gap-2 md:w-auto" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          New Subscription
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", counts.all, BadgeCheck],
          ["Active", counts.active, Sparkles],
          ["Subscribers", counts.subscribers, Users],
          ["Paid", counts.paid, CalendarClock],
          ["Revenue", `NGN ${Number(counts.revenue).toLocaleString()}`, Building2],
        ].map(([label, value, Icon]: any) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={managementTab} onValueChange={setManagementTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {managementTab === "services" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
            <TabsList className="grid h-auto w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Unavailable</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl">
            <Select value={subscriberStatus} onValueChange={setSubscriberStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriberService} onValueChange={setSubscriberService}>
              <SelectTrigger>
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={exportSubscribers} disabled={filteredPurchases.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        )}
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={managementTab === "services" ? "Search subscriptions..." : "Search subscribers..."}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : managementTab === "subscribers" ? (
        filteredPurchases.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <h3 className="text-lg font-semibold">No subscribers found</h3>
                <p className="text-sm text-muted-foreground">Paid and pending subscription purchases will appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{purchase.user?.full_name || "Unknown user"}</h3>
                      <Badge variant={purchase.status === "active" ? "default" : "secondary"}>{purchase.status}</Badge>
                      <Badge variant={purchase.payment_status === "paid" ? "outline" : "secondary"}>{purchase.payment_status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {purchase.user?.email || "No email"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="font-medium">{purchase.service?.name || "Deleted service"}</p>
                    <p className="text-sm text-muted-foreground">{purchase.service?.company || "No company"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Validity</p>
                    <p className="text-sm">
                      {purchase.expires_at ? `Until ${new Date(purchase.expires_at).toLocaleDateString()}` : "Awaiting activation"}
                    </p>
                    <p className="text-sm font-semibold">
                      {purchase.currency} {Number(purchase.amount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-3 text-sm lg:text-right">
                    <p className="text-xs text-muted-foreground">Receipt</p>
                    <p className="font-medium">{purchase.receipt_number || "Not issued"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {purchase.paid_at ? new Date(purchase.paid_at).toLocaleString() : "Not paid"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <BadgeCheck className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <h3 className="text-lg font-semibold">No subscriptions found</h3>
              <p className="text-sm text-muted-foreground">Create a service or adjust your search filters.</p>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} className="w-full">
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => {
                const features = service.featured_services || []
                const subscriberCount = purchases.filter((purchase) => purchase.service_id === service.id).length
                return (
                  <Card key={service.id} className="overflow-hidden">
                    {service.image_url && (
                      <div className="aspect-video bg-muted">
                        <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-lg font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.company || "No company"}</p>
                        </div>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Active" : "Unavailable"}
                        </Badge>
                      </div>

                      <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        {service.is_featured && <Badge variant="outline">Featured</Badge>}
                        {service.location_name && (
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {service.location_name}
                          </Badge>
                        )}
                      </div>

                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {features.slice(0, 3).map((feature: string) => (
                            <span key={feature} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {feature}
                            </span>
                          ))}
                          {features.length > 3 && (
                            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                              +{features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-xl font-bold">
                            {service.currency} {Number(service.price).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {service.duration_value} {service.duration_unit}(s) • {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => viewServiceSubscribers(service.id)}>
                            <Users className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(service)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(service)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-h-[92vh] sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{editingId ? "Edit Subscription" : "Create Subscription"}</DialogTitle>
            <DialogDescription>
              Add the service details, pricing, and visibility users will see before purchasing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 overflow-x-auto border-b px-5 py-3">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (index <= step || validateStep()) setStep(index)
                }}
                className={cn(
                  "flex min-w-32 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  step === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/30 text-xs">
                  {index + 1}
                </span>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location_name} onChange={(event) => setForm({ ...form, location_name: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={5}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration value *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.duration_value}
                    onChange={(event) => setForm({ ...form, duration_value: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration unit</Label>
                  <Select value={form.duration_unit} onValueChange={(value) => setForm({ ...form, duration_unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">Inactive services remain visible as unavailable.</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                  <div>
                    <Label>Featured</Label>
                    <p className="text-xs text-muted-foreground">Featured services appear before regular services.</p>
                  </div>
                  <Switch checked={form.is_featured} onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Image</Label>
                  {imagePreview || form.image_url ? (
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img src={imagePreview || form.image_url} alt="Subscription preview" className="h-48 w-full object-cover" />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-2 h-8 w-8"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview("")
                          setForm({ ...form, image_url: "" })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="Paste image URL" />
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <label>
                        <ImagePlus className="h-4 w-4" />
                        Attach
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Paste an image URL or upload a new image.</p>
                </div>
                <div className="space-y-2">
                  <Label>Featured services</Label>
                  <Textarea
                    value={form.featured_services}
                    onChange={(event) => setForm({ ...form, featured_services: event.target.value })}
                    placeholder="Personal training, Sauna access, Monthly check-in"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Separate each item with a comma.</p>
                </div>
                <div className="space-y-2">
                  <Label>Terms</Label>
                  <Textarea value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} rows={5} />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex-col gap-2 border-t px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:pb-0">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => (step === 0 ? setModalOpen(false) : setStep((value) => value - 1))}>
                {step === 0 ? "Cancel" : "Back"}
              </Button>
              {step < steps.length - 1 ? (
                <Button className="w-full sm:w-auto" onClick={goNext}>Continue</Button>
              ) : (
              <Button className="w-full sm:w-auto" onClick={save} disabled={saving || uploadingImage}>
                  {saving || uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Subscription
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name || "this subscription service"}. Users will no longer see it for purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                deleteService()
              }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
