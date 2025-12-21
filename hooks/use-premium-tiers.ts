import { useEffect, useState } from "react";

export interface PremiumTier {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  features: Record<string, any>;
  max_boosts: number;
  max_profile_views: number;
  priority_support: boolean;
  analytics: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePremiumTiers() {
  const [tiers, setTiers] = useState<PremiumTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/premium-tiers");
      if (response.ok) {
        const data = await response.json();
        setTiers(data);
      } else {
        setError("Failed to fetch tiers");
      }
    } catch (err) {
      setError("Error fetching tiers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTier = async (tierData: Omit<PremiumTier, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch("/api/admin/premium-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tierData.name,
          description: tierData.description,
          monthlyPrice: tierData.monthly_price,
          features: tierData.features,
          maxBoosts: tierData.max_boosts,
          maxProfileViews: tierData.max_profile_views,
          prioritySupport: tierData.priority_support,
          analytics: tierData.analytics,
        }),
      });

      if (response.ok) {
        const newTier = await response.json();
        setTiers([...tiers, newTier]);
        return { success: true, tier: newTier };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (err) {
      return { success: false, error: "Failed to create tier" };
    }
  };

  const updateTier = async (
    id: string,
    tierData: Partial<PremiumTier>
  ) => {
    try {
      const response = await fetch(`/api/admin/premium-tiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tierData.name,
          description: tierData.description,
          monthlyPrice: tierData.monthly_price,
          features: tierData.features,
          maxBoosts: tierData.max_boosts,
          maxProfileViews: tierData.max_profile_views,
          prioritySupport: tierData.priority_support,
          analytics: tierData.analytics,
          isActive: tierData.is_active,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTiers(tiers.map((t) => (t.id === id ? updated : t)));
        return { success: true, tier: updated };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (err) {
      return { success: false, error: "Failed to update tier" };
    }
  };

  const deleteTier = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/premium-tiers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTiers(tiers.filter((t) => t.id !== id));
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (err) {
      return { success: false, error: "Failed to delete tier" };
    }
  };

  return {
    tiers,
    loading,
    error,
    fetchTiers,
    createTier,
    updateTier,
    deleteTier,
  };
}
