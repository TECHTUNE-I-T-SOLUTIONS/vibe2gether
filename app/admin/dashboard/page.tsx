"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import { PremiumTiersManager } from "@/components/admin/premium-tiers-manager";
import { AdminUsersManager } from "@/components/admin/users-manager";
import { AdminTransactionsManager } from "@/components/admin/transactions-manager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Loader2 } from "lucide-react";

type TabValue = "tiers" | "users" | "transactions" | "products" | "events" | "blog" | "analytics";

export default function AdminDashboard() {
  const { admin, loading, isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("tiers");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {admin.fullName} ({admin.role})
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="tiers">Premium Tiers</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-6">
            <PremiumTiersManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsersManager />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <AdminTransactionsManager />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Product moderation coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Event management coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Blog management coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Analytics coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
