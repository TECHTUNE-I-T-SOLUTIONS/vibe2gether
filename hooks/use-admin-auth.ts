import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "moderator" | "analyst";
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (redirect = false) => {
    try {
      const response = await fetch("/api/admin/auth/me");
      if (response.ok) {
        const data = await response.json();
        // Handle both flat and nested response structures
        const adminInfo = data.admin || data;
        setAdmin({
          id: adminInfo.id,
          email: adminInfo.email,
          fullName: adminInfo.full_name || adminInfo.fullName,
          role: adminInfo.role || "moderator",
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (redirect) {
          router.push("/auth/login");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      if (redirect) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both flat and nested response structures
        const adminInfo = data.admin || data;
        setAdmin({
          id: adminInfo.id,
          email: adminInfo.email,
          fullName: adminInfo.full_name || adminInfo.fullName,
          role: adminInfo.role || "moderator",
        });
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      setAdmin(null);
      setIsAuthenticated(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    admin,
    loading,
    isAuthenticated,
    login,
    logout,
  };
}
