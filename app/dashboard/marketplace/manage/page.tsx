"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Loader2, Plus, Upload, Trash2, Eye, Package, X, Edit2, MessageCircle } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { createClient } from "@/lib/supabase/client"

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Art & Crafts",
  "Services",
  "Other",
]

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Used",
]

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR"]

export default function DashboardMarketplaceManagePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"my-products" | "purchased" | "all">("all")
  const [products, setProducts] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingLoading, setEditingLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    price: "",
    currency: "USD",
    location: "",
    tags: "",
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  const supabase = createClient()
  const isAdmin = user?.is_admin === true

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (session === undefined) {
      // Session is still loading
      return
    }

    if (!session?.user?.id) {
      // Not logged in, redirect to login
      router.push("/login")
      return
    }

    // User is authenticated, proceed with fetching data
    fetchUserProducts()
  }, [session])

  // Fetch based on active tab
  useEffect(() => {
    if (!session?.user?.id) return

    if (activeTab === "purchased") {
      fetchPurchasedProducts()
    } else if (activeTab === "all") {
      fetchAllProducts()
    }
  }, [activeTab, session?.user?.id])

  async function fetchUserProducts() {
    try {
      setLoading(true)
      if (!session?.user?.id) {
        setProducts([])
        return
      }
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching products:", error.message || error)
        throw error
      }
      setProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function fetchPurchasedProducts() {
    try {
      if (!session?.user?.id) {
        setPurchases([])
        return
      }
      const { data, error } = await supabase
        .from("marketplace_purchases")
        .select(`
          *,
          product:marketplace_products(
            id,
            title,
            description,
            price,
            currency,
            media,
            user_id,
            users(display_name, profile_picture, id)
          )
        `)
        .eq("buyer_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching purchases:", error.message || error)
        throw error
      }
      setPurchases(data || [])
    } catch (error: any) {
      console.error("Error fetching purchases:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load purchases", variant: "destructive" })
    }
  }

  async function fetchAllProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*, users(display_name, profile_picture, id)")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching all products:", error.message || error)
        throw error
      }
      setAllProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching all products:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length + imagePreviewUrls.length + images.length > 5) {
      toast({ title: "Error", description: "Maximum 5 images allowed", variant: "destructive" })
      return
    }
    setImages([...images, ...files])
  }

  async function uploadImages(productId: string): Promise<string[]> {
    const urls: string[] = [...imagePreviewUrls]

    for (const file of images) {
      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${productId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("marketplace-images")
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("marketplace-images").getPublicUrl(fileName)
        urls.push(data.publicUrl)
      } catch (error) {
        console.error("Error uploading file:", error)
        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
      }
    }

    return urls
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.title || !formData.category || !formData.price || !formData.condition) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" })
      return
    }

    try {
      setUploading(true)

      // Create product
      const { data: newProduct, error: createError } = await supabase
        .from("marketplace_products")
        .insert({
          user_id: session.user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          price: parseFloat(formData.price),
          currency: formData.currency,
          location_name: formData.location,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          status: isAdmin ? "active" : "inactive", // Users start with inactive (pending approval)
          media: [],
        })
        .select()
        .single()

      if (createError) throw createError

      // Upload images if any
      if (images.length > 0) {
        const uploadedUrls = await uploadImages(newProduct.id)
        if (uploadedUrls.length > 0) {
          const { error: updateError } = await supabase
            .from("marketplace_products")
            .update({ media: uploadedUrls.map(url => ({ url, type: "image" })) })
            .eq("id", newProduct.id)

          if (updateError) throw updateError
        }
      }

      toast({
        title: "Success",
        description: isAdmin
          ? "Product created successfully"
          : "Product created! Awaiting admin approval.",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        condition: "",
        price: "",
        currency: "USD",
        location: "",
        tags: "",
      })
      setImages([])
      setImagePreviewUrls([])
      setShowCreateDialog(false)
      fetchUserProducts()
    } catch (error) {
      console.error("Error creating product:", error)
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("marketplace_products").delete().eq("id", productId)

      if (error) throw error

      toast({ title: "Success", description: "Product deleted" })
      fetchUserProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" })
    }
  }

  async function handleEditProduct() {
    if (!editingProduct?.title || !editingProduct?.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and price",
        variant: "destructive",
      })
      return
    }

    setEditingLoading(true)
    try {
      let mediaUrls = editingProduct.media || []

      // Upload new images if any
      if (editingProduct.newImages && editingProduct.newImages.length > 0) {
        for (const file of editingProduct.newImages) {
          try {
            const fileExt = file.name.split(".").pop()
            const fileName = `${editingProduct.id}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase
              .storage
              .from("marketplace-images")
              .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from("marketplace-images").getPublicUrl(fileName)
            mediaUrls.push({ url: data.publicUrl, type: "image" })
          } catch (err) {
            console.error("Error uploading image:", err)
          }
        }
      }

      // Update product
      const { error } = await supabase
        .from("marketplace_products")
        .update({
          title: editingProduct.title,
          description: editingProduct.description,
          category: editingProduct.category,
          condition: editingProduct.condition,
          price: parseFloat(editingProduct.price),
          currency: editingProduct.currency,
          location_name: editingProduct.location,
          tags: Array.isArray(editingProduct?.tags) ? editingProduct.tags : editingProduct.tags.split(",").map((t: string) => t.trim()),
          media: mediaUrls,
        })
        .eq("id", editingProduct.id)
        .eq("user_id", session?.user?.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setEditingProduct(null)
      setEditDialogOpen(false)
      await fetchUserProducts()
    } catch (error: any) {
      console.error("Error updating product:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setEditingLoading(false)
    }
  }

  async function handleUpdateStatus(productId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("marketplace_products")
        .update({ status: newStatus })
        .eq("id", productId)

      if (error) throw error

      toast({ title: "Success", description: "Product status updated" })
      fetchUserProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" })
    }
  }

  async function handleBuyProduct() {
    if (!selectedProduct || !session?.user?.id) {
      toast({ title: "Error", description: "Product or session not found", variant: "destructive" })
      return
    }

    try {
      setProcessingPayment(true)
      
      // Convert price to Naira if needed
      let priceInNaira = selectedProduct.price
      if (selectedProduct.currency === "USD") {
        priceInNaira = selectedProduct.price * 1450
      } else if (selectedProduct.currency !== "NGN") {
        // Handle other currencies - convert to USD first, then to Naira
        priceInNaira = selectedProduct.price * 1450
      }

      const amount = Math.round(priceInNaira * 100) // Convert to kobo

      // Initialize Paystack payment
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          amount: amount,
          metadata: {
            productId: selectedProduct.id,
            productTitle: selectedProduct.title,
            sellerId: selectedProduct.user_id,
            buyerId: session.user.id,
            price: selectedProduct.price,
            currency: selectedProduct.currency,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize payment")
      }

      const { authorization_url } = await response.json()
      
      if (authorization_url) {
        // Redirect to Paystack
        window.location.href = authorization_url
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({ 
        title: "Payment Error", 
        description: error instanceof Error ? error.message : "Failed to process payment", 
        variant: "destructive" 
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen w-full">
      {/* Main Content Area with proper padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-1">Manage your products and purchases</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create Product
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="my-products">My Products</TabsTrigger>
              <TabsTrigger value="purchased">Purchases</TabsTrigger>
            </TabsList>

            {/* My Products Tab */}
            <TabsContent value="my-products" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No products yet</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                      Start selling by creating your first product listing
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                      {/* Product Image */}
                      <div className="relative w-full h-48 bg-muted">
                        {product.media && product.media.length > 0 ? (
                          <Image
                            src={product.media[0]?.url || "/placeholder.jpg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold line-clamp-2 text-sm md:text-base">{product.title}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description || "No description"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <p className="font-bold text-base md:text-lg">
                                {product.currency} {product.price.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">{product.condition}</p>
                            </div>
                            <Badge variant={product.status === "active" && product.is_available !== false ? "default" : "secondary"} className="text-xs">
                              {product.is_available === false
                                ? "Unavailable"
                                : product.status === "active"
                                  ? "Active"
                                  : product.status === "inactive"
                                    ? "Inactive"
                                    : product.status || "Unavailable"}
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-4 py-2 text-xs md:text-sm text-muted-foreground border-y">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {product.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {product.interest_count || 0}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct({ ...product, location: product.location_name, newImages: [], imagePreviews: [] })
                              setEditDialogOpen(true)
                            }}
                            className="flex-1 gap-1 text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                          {isAdmin && product.status === "inactive" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateStatus(product.id, "active")}
                              className="flex-1 text-xs"
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex-1 gap-1 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchased" className="space-y-4 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : purchases.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No purchases yet</h3>
                    <p className="text-muted-foreground text-center mt-2">
                      Your purchases will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Product Info */}
                          <div className="sm:col-span-2">
                            <h3 className="font-semibold text-sm md:text-base">{purchase.product?.title}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {purchase.product?.description}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-2">
                              Seller: {purchase.seller?.display_name || "Unknown"}
                            </p>
                          </div>

                          {/* Price Info */}
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Total Amount</p>
                            <p className="text-base md:text-lg font-bold mt-1">
                              ${purchase.total_amount?.toFixed(2) || "0.00"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Qty: {purchase.quantity || 1}</p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Status</p>
                            <Badge className="mt-2 text-xs">{purchase.status || "pending"}</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* All Products Tab */}
            <TabsContent value="all" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : allProducts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No products available</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      There are no products available at the moment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProducts.map((product) => {
                    const isOwnProduct = product.user_id === session?.user?.id
                    const unavailableReason =
                      product.is_available === false || product.status !== "active"
                        ? "Product isn't available"
                        : ""
                    return (
                      <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                        {/* Product Image */}
                        <div className="relative w-full h-48 bg-muted">
                          {product.media && product.media.length > 0 ? (
                            <Image
                              src={product.media[0]?.url || "/placeholder.jpg"}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex-1 flex flex-col">
                          <div className="space-y-3 flex-1">
                            <div>
                              <h3 className="font-semibold line-clamp-2 text-sm md:text-base">{product.title}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                                {product.description || "No description"}
                              </p>
                              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                                By: {product.users?.display_name || "Unknown Seller"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div>
                                <p className="font-bold text-base md:text-lg">
                                  {product.currency} {product.price.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">{product.condition}</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {isOwnProduct ? (
                            <Button disabled className="w-full gap-1 text-xs mt-3 opacity-50">
                              Your Product
                            </Button>
                          ) : (
                            <Button 
                              className="w-full gap-1 text-xs mt-3"
                              disabled={Boolean(unavailableReason)}
                              onClick={() => {
                                if (unavailableReason) return
                                setSelectedProduct(product)
                                setShowDetailDialog(true)
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              {unavailableReason || "View Details"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              {isAdmin ? "Your product will be listed immediately." : "Your product will be pending admin approval before being visible."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <form onSubmit={handleCreateProduct} className="space-y-4 pr-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Vintage Leather Jacket"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger id="category" className="text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                    <SelectTrigger id="condition" className="text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond} value={cond}>
                          {cond}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger id="currency" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem key={cur} value={cur}>
                          {cur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location & Tags */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., vintage, leather, jacket"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Images (Max 5)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload images</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                  </label>
                </div>
                {(images.length + imagePreviewUrls.length) > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {images.length + imagePreviewUrls.length}/5 images selected
                  </p>
                )}
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product details
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="space-y-4 pr-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Product Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Vintage Leather Jacket"
                  value={editingProduct?.title || ""}
                  onChange={(e) =>
                    setEditingProduct((prev: any) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe your product..."
                  value={editingProduct?.description || ""}
                  onChange={(e) =>
                    setEditingProduct((prev: any) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingProduct?.category || ""}
                    onValueChange={(value) =>
                      setEditingProduct((prev: any) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition</Label>
                  <Select
                    value={editingProduct?.condition || ""}
                    onValueChange={(value) =>
                      setEditingProduct((prev: any) => ({
                        ...prev,
                        condition: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond} value={cond}>
                          {cond}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price and Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-price">Price *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={editingProduct?.price || ""}
                    onChange={(e) =>
                      setEditingProduct((prev: any) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select
                    value={editingProduct?.currency || "USD"}
                    onValueChange={(value) =>
                      setEditingProduct((prev: any) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem key={cur} value={cur}>
                          {cur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  placeholder="e.g., New York, USA"
                  value={editingProduct?.location || ""}
                  onChange={(e) =>
                    setEditingProduct((prev: any) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  placeholder="e.g., vintage, leather, jacket"
                  value={editingProduct?.tags || ""}
                  onChange={(e) =>
                    setEditingProduct((prev: any) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Current Images */}
              {editingProduct?.media && editingProduct.media.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {editingProduct.media.map((img: any, idx: number) => (
                      <div key={`current-${idx}`} className="relative w-full h-20">
                        <Image
                          src={img.url || "/placeholder.jpg"}
                          alt={`product-${idx}`}
                          fill
                          className="object-cover rounded"
                        />
                        <p className="text-xs text-muted-foreground text-center mt-1">Existing</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {editingProduct?.imagePreviews && editingProduct.imagePreviews.length > 0 && (
                <div className="space-y-2">
                  <Label>New Images to Upload</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {editingProduct.imagePreviews.map((preview: string, idx: number) => (
                      <div key={`new-${idx}`} className="relative w-full h-20">
                        <img
                          src={preview}
                          alt={`new-${idx}`}
                          className="w-full h-full object-cover rounded border-2 border-green-500"
                        />
                        <p className="text-xs text-green-600 text-center mt-1">New</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingProduct((prev: any) => ({
                        ...prev,
                        newImages: [],
                        imagePreviews: [],
                      }))
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear New Images
                  </Button>
                </div>
              )}

              {/* Add New Images */}
              <div className="space-y-2">
                <Label>Add More Images (Max 5 total)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      files.forEach((file) => {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setEditingProduct((prev: any) => ({
                            ...prev,
                            newImages: [...(prev.newImages || []), file],
                            imagePreviews: [...(prev.imagePreviews || []), reader.result as string],
                          }))
                        }
                        reader.readAsDataURL(file)
                      })
                    }}
                    className="hidden"
                    id="edit-file-upload"
                  />
                  <label htmlFor="edit-file-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to add more images</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={editingLoading}>
              {editingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedProduct.title}</DialogTitle>
              </DialogHeader>
              
              {selectedProduct.media && selectedProduct.media.length > 0 && (
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={typeof selectedProduct.media[0] === 'string' ? selectedProduct.media[0] : selectedProduct.media[0]?.url} 
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <div className="space-y-1">
                    {selectedProduct.currency === "USD" ? (
                      <>
                        <p className="text-lg font-semibold">${selectedProduct.price}</p>
                        <p className="text-sm text-muted-foreground">₦{(selectedProduct.price * 1450).toLocaleString()}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold">₦{selectedProduct.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">${(selectedProduct.price / 1450).toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <p className="text-lg font-semibold">{selectedProduct.condition || "Not specified"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-2">{selectedProduct.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="mt-2">{selectedProduct.location_name || "Not specified"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Seller</label>
                <p className="mt-2">{selectedProduct.users?.display_name || selectedProduct.seller_name || "Unknown"}</p>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (selectedProduct) {
                      window.location.href = `/dashboard/messages?userId=${selectedProduct.user_id}`
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>    </div>
  )
}
