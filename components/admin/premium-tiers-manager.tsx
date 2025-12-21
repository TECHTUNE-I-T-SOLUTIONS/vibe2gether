"use client";

import { useState } from "react";
import { usePremiumTiers, type PremiumTier } from "@/hooks/use-premium-tiers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";

interface TierFormData {
  name: string;
  description: string;
  monthly_price: number;
  max_boosts: number;
  max_profile_views: number;
  priority_support: boolean;
  analytics: boolean;
  features: Record<string, any>;
}

export function PremiumTiersManager() {
  const { tiers, loading, createTier, updateTier, deleteTier } =
    usePremiumTiers();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TierFormData>({
    name: "",
    description: "",
    monthly_price: 0,
    max_boosts: 0,
    max_profile_views: 0,
    priority_support: false,
    analytics: false,
    features: {},
  });

  const handleOpenDialog = (tier?: PremiumTier) => {
    if (tier) {
      setFormData({
        name: tier.name,
        description: tier.description,
        monthly_price: tier.monthly_price,
        max_boosts: tier.max_boosts,
        max_profile_views: tier.max_profile_views,
        priority_support: tier.priority_support,
        analytics: tier.analytics,
        features: tier.features,
      });
      setEditingId(tier.id);
    } else {
      setFormData({
        name: "",
        description: "",
        monthly_price: 0,
        max_boosts: 0,
        max_profile_views: 0,
        priority_support: false,
        analytics: false,
        features: {},
      });
      setEditingId(null);
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        const result = await updateTier(editingId, formData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Tier updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update tier",
            variant: "destructive",
          });
        }
      } else {
        const result = await createTier(formData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Tier created successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create tier",
            variant: "destructive",
          });
        }
      }
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this tier?")) {
      const result = await deleteTier(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Tier deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tier",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Premium Tiers</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Tier" : "Create New Tier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tier Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Silver, Gold, Platinum"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tier description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Monthly Price (coins)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_price: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Max Boosts</label>
                  <Input
                    type="number"
                    value={formData.max_boosts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_boosts: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Max Profile Views
                  </label>
                  <Input
                    type="number"
                    value={formData.max_profile_views}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_profile_views: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Features</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox
                      checked={formData.priority_support}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          priority_support: checked as boolean,
                        })
                      }
                    />
                    <label className="ml-2 text-sm">Priority Support</label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      checked={formData.analytics}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          analytics: checked as boolean,
                        })
                      }
                    />
                    <label className="ml-2 text-sm">Analytics Access</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="border rounded-lg p-6 space-y-4 bg-card"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold capitalize">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>
              <Badge variant={tier.is_active ? "default" : "secondary"}>
                {tier.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Monthly Price:</span>
                <span className="font-bold">{tier.monthly_price} coins</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Max Boosts:</span>
                <span className="font-bold">{tier.max_boosts}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Profile Views:</span>
                <span className="font-bold">{tier.max_profile_views}</span>
              </div>

              <div className="space-y-1 pt-2">
                {tier.priority_support && (
                  <div className="text-sm text-green-600">✓ Priority Support</div>
                )}
                {tier.analytics && (
                  <div className="text-sm text-green-600">✓ Analytics Access</div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(tier)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(tier.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {tiers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No premium tiers yet</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Tier
          </Button>
        </div>
      )}
    </div>
  );
}
