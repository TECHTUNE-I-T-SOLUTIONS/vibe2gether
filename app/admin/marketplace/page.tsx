"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import Image from "next/image"
import { Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle, Upload, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function MarketplaceAdminPage() {
  const router = useRouter()
  const { admin, loading: authLoading, isAuthenticated } = useAdminAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<"admin" | "pending" | "all">("admin")
  const [adminProducts, setAdminProducts] = useState<any[]>([])
  const [pendingProducts, setPendingProducts] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusProduct, setStatusProduct] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("active")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newProduct, setNewProduct] = useState({
    user_id: "",
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "",
    condition: "good",
    location: "",
    tags: "",
    images: [] as File[],
    imagePreviews: [] as string[],
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAllData()
      fetchUsers()
    }
  }, [authLoading, isAuthenticated])

  async function fetchUsers() {
    try {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name")
        .order("full_name", { ascending: true })
      
      setUsers(data || [])
    } catch (error: any) {
      console.error("Error fetching users:", error?.message || JSON.stringify(error))
    }
  }

  async function fetchAllData() {
    try {
      setLoading(true)
      const { data: adminProductsData } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("user_id", admin?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      const { data: pending } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("status", "inactive")
        .order("created_at", { ascending: false })

      const { data: all } = await supabase
        .from("marketplace_products")
        .select("*")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })

      setAdminProducts(adminProductsData || [])
      setPendingProducts(pending || [])
      setAllProducts(all || [])
    } catch (error: any) {
      console.error("Error fetching products:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, file],
          imagePreviews: [...prev.imagePreviews, reader.result as string],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }))
  }

  async function uploadImages(productId: string, files: File[]) {
    const uploadedUrls = []
    for (const file of files) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from("marketplace-images").upload(fileName, file)

      if (error) throw error
      const { data: publicUrl } = supabase.storage.from("marketplace-images").getPublicUrl(fileName)
      uploadedUrls.push(publicUrl.publicUrl)
    }
    return uploadedUrls
  }

  async function handleCreateProduct() {
    if (!newProduct.title || !newProduct.price || !newProduct.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, price, and category",
        variant: "destructive",
      })
      return
    }

    try {
      if (!newProduct.user_id) {
        toast({
          title: "Error",
          description: "Please select a user for this product",
          variant: "destructive",
        })
        return
      }

      // Insert product
      const { data: product, error: insertError } = await supabase
        .from("marketplace_products")
        .insert({
          user_id: newProduct.user_id,
          title: newProduct.title,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          currency: newProduct.currency,
          category: newProduct.category,
          condition: newProduct.condition,
          location_name: newProduct.location,
          tags: newProduct.tags.split(",").map((t) => t.trim()),
          status: "active", // Admin products are directly active
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload images if any
      if (newProduct.images.length > 0) {
        const urls = await uploadImages(product.id, newProduct.images)
        await supabase
          .from("marketplace_products")
          .update({ images: urls })
          .eq("id", product.id)
      }

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      setNewProduct({
        user_id: "",
        title: "",
        description: "",
        price: "",
        currency: "USD",
        category: "",
        condition: "good",
        location: "",
        tags: "",
        images: [],
        imagePreviews: [],
      })
      setCreatingProduct(false)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error creating product:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  }

  async function handleEditProduct() {
    if (!editingProduct?.title || !editingProduct?.price || !editingProduct?.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, price, and category",
        variant: "destructive",
      })
      return
    }

    try {
      // Upload new images if any
      let imageUrls = editingProduct.images || []
      if (editingProduct.newImages && editingProduct.newImages.length > 0) {
        const urls = await uploadImages(editingProduct.id, editingProduct.newImages)
        imageUrls = [...imageUrls, ...urls]
      }

      await supabase
        .from("marketplace_products")
        .update({
          title: editingProduct.title,
          description: editingProduct.description,
          price: parseFloat(editingProduct.price),
          currency: editingProduct.currency,
          category: editingProduct.category,
          condition: editingProduct.condition,
          location_name: editingProduct.location,
          tags: editingProduct.tags.split(",").map((t) => t.trim()),
          images: imageUrls,
        })
        .eq("id", editingProduct.id)

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setEditingProduct(null)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error updating product:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!window.confirm("Are you sure you want to delete this product?")) return

    try {
      await supabase.from("marketplace_products").delete().eq("id", productId)

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      await fetchAllData()
    } catch (error: any) {
      console.error("Error deleting product:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  async function handleStatusUpdate() {
    if (!statusProduct) return

    try {
      await supabase
        .from("marketplace_products")
        .update({ status: newStatus })
        .eq("id", statusProduct.id)

      toast({
        title: "Success",
        description: `Product ${newStatus === "active" ? "approved" : "rejected"} successfully`,
      })

      setStatusDialogOpen(false)
      setStatusProduct(null)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error updating status:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      })
    }
  }

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const ProductCard = ({ product, showStatusButton = false }: { product: any; showStatusButton?: boolean }) => {
    // Extract first image from media array
    const imageUrl = product.media && Array.isArray(product.media) && product.media.length > 0
      ? product.media[0].url
      : product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : null

    return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
        )}
        <Badge className="absolute top-2 right-2">{product.category}</Badge>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold">{product.currency} {product.price}</span>
          <Badge
            variant="secondary"
            className={
              product.status === "active"
                ? "bg-green-500/20 text-green-600"
                : product.status === "inactive"
                  ? "bg-yellow-500/20 text-yellow-600"
                  : "bg-red-500/20 text-red-600"
            }
          >
            {product.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Condition: {product.condition}</p>
        <div className="flex gap-2">
          <Dialog open={editingProduct?.id === product.id} onOpenChange={() => setEditingProduct(null)}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingProduct(product)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={editingProduct?.title || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingProduct?.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct?.price || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <select
                      value={editingProduct?.currency || "USD"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="NGN">Nigerian Naira (₦)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <select
                      value={editingProduct?.category || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion & Clothing</option>
                      <option value="Home">Home & Kitchen</option>
                      <option value="Sports">Sports & Outdoors</option>
                      <option value="Books">Books & Media</option>
                      <option value="Toys">Toys & Games</option>
                      <option value="Beauty">Beauty & Personal Care</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <select
                      value={editingProduct?.condition || "good"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, condition: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="new">Brand New</option>
                      <option value="excellent">Excellent Condition</option>
                      <option value="good">Good Condition</option>
                      <option value="fair">Fair Condition</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editingProduct?.location || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={editingProduct?.tags?.join(", ") || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {editingProduct?.images?.map((url: string, idx: number) => (
                      <div key={idx} className="relative">
                        <Image src={url} alt={`Preview ${idx}`} width={100} height={100} className="w-full h-20 object-cover rounded" />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Images
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
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
                  />
                </div>
                <Button className="w-full gradient-bg" onClick={handleEditProduct}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => handleDeleteProduct(product.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          {showStatusButton && (
            <Dialog open={statusDialogOpen && statusProduct?.id === product.id} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusProduct(product)
                    setNewStatus(product.status === "inactive" ? "active" : "inactive")
                  }}
                >
                  {product.status === "inactive" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Product Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>New Status</Label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="active">Approve (Active)</option>
                      <option value="inactive">Keep Pending (Inactive)</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                  <Button className="w-full gradient-bg" onClick={handleStatusUpdate}>
                    Update Status
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace Admin</h1>
        <Dialog open={creatingProduct} onOpenChange={setCreatingProduct}>
          <DialogTrigger asChild>
            <Button className="gradient-bg gap-2">
              <Plus className="w-4 h-4" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>Admin products are directly published as active</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User *</Label>
                <select
                  value={newProduct.user_id}
                  onChange={(e) => setNewProduct({ ...newProduct, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select a user to own this product</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="Product title"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Product description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Currency *</Label>
                  <select
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion & Clothing</option>
                    <option value="Home">Home & Kitchen</option>
                    <option value="Sports">Sports & Outdoors</option>
                    <option value="Books">Books & Media</option>
                    <option value="Toys">Toys & Games</option>
                    <option value="Beauty">Beauty & Personal Care</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Condition *</Label>
                  <select
                    value={newProduct.condition}
                    onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="new">Brand New</option>
                    <option value="excellent">Excellent Condition</option>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair Condition</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Lagos, Nigeria"
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  placeholder="e.g., solar, panels, energy, renewable"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                />
              </div>
              <div>
                <Label>Product Images</Label>
                <div className="bg-muted rounded-md p-4 mb-3">
                  {newProduct.imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {newProduct.imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <Image src={preview} alt={`Preview ${idx}`} width={100} height={100} className="w-full h-24 object-cover rounded" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">No images selected</div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
              <Button className="w-full gradient-bg" onClick={handleCreateProduct}>
                Create Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin">
            Admin Products ({adminProducts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals ({pendingProducts.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Products ({allProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          {adminProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No admin products yet. Create one to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending products to review
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} showStatusButton={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No products available
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
