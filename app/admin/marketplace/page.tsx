"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { getMarketplaceProducts, deleteMarketplaceProduct, updateMarketplaceProduct } from "@/lib/supabase/queries"

export default function MarketplaceAdminPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await getMarketplaceProducts(100, 0)
      if (!error && data) {
        setProducts(data)
      }
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(productId: string) {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteMarketplaceProduct(productId)
        setProducts((prev) => prev.filter((p) => p.id !== productId))
      } catch (err) {
        console.error("Failed to delete product:", err)
      }
    }
  }

  async function handleToggleAvailability(product: any) {
    try {
      await updateMarketplaceProduct(product.id, {
        is_available: !product.is_available,
      })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        )
      )
    } catch (err) {
      console.error("Failed to update product:", err)
    }
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace Management</h1>
        <Button className="gradient-bg gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Seller</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] && (
                            <div className="relative w-10 h-10 rounded overflow-hidden">
                              <Image
                                src={product.images[0].url || product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm">{product.title}</p>
                            <p className="text-xs text-muted-foreground">{product.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{product.user?.display_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold">${product.price}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            product.is_available
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                          }
                        >
                          {product.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAvailability(product)}
                            title={product.is_available ? "Hide" : "Show"}
                          >
                            {product.is_available ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editingProduct?.title || ""}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editingProduct?.description || ""}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  className="w-full gradient-bg"
                                  onClick={async () => {
                                    await updateMarketplaceProduct(editingProduct.id, editingProduct)
                                    setEditingProduct(null)
                                    await fetchProducts()
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
