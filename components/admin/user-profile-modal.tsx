"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCheck, Shield, UserX, Ban, MoreHorizontal, Calendar, MapPin, Mail, Phone, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  full_name?: string
  display_name?: string
  date_of_birth?: string
  gender?: string
  bio?: string
  profile_picture?: string
  country?: string
  city?: string
  mobile_number?: string
  is_verified?: boolean
  is_premium?: boolean
  is_active?: boolean
  coins_balance?: number
  created_at?: string
  last_login_at?: string
  followers_count?: number
  following_count?: number
  interests?: string[]
  verification_status?: string | null
}

interface UserProfileModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function UserProfileModal({ user, open, onOpenChange, onRefresh }: UserProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: "verify" | "makeAdmin" | "suspend" | "ban" | null
  }>({
    open: false,
    action: null,
  })
  const [verificationUpdate, setVerificationUpdate] = useState<{
    status: string
    reason: string
    loading: boolean
  }>({
    status: "",
    reason: "",
    loading: false,
  })

  if (!user) return null

  const handleVerifyUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: "POST",
      })
      if (response.ok) {
        onRefresh?.()
        setConfirmDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error("Failed to verify user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVerification = async () => {
    if (!verificationUpdate.status) return

    setVerificationUpdate(prev => ({ ...prev, loading: true }))
    try {
      const response = await fetch("/api/admin/update-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: verificationUpdate.status,
          decisionReason: verificationUpdate.reason || null,
        }),
      })

      if (response.ok) {
        // Reset form
        setVerificationUpdate({ status: "", reason: "", loading: false })
        onRefresh?.()
      } else {
        const error = await response.json()
        console.error("Failed to update verification:", error)
      }
    } catch (error) {
      console.error("Failed to update verification:", error)
    } finally {
      setVerificationUpdate(prev => ({ ...prev, loading: false }))
    }
  }

  const handleMakeAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/make-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "moderator" }),
      })
      if (response.ok) {
        onRefresh?.()
        setConfirmDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error("Failed to make admin:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
      })
      if (response.ok) {
        onRefresh?.()
        setConfirmDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error("Failed to suspend user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
      })
      if (response.ok) {
        onRefresh?.()
        onOpenChange(false)
        setConfirmDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error("Failed to ban user:", error)
    } finally {
      setLoading(false)
    }
  }

  const canVerify = user.verification_status === "pending" || user.verification_status === null ? false : !user.is_verified
  const canMakeAdmin = user.is_verified === true

  const actionText = {
    verify: `Are you sure you want to verify ${user.full_name}?`,
    makeAdmin: `Are you sure you want to make ${user.full_name} an admin?`,
    suspend: `This will suspend ${user.full_name}'s account. They won't be able to access the platform.`,
    ban: `This will permanently ban ${user.full_name}. This action cannot be undone.`,
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg mb-6 -m-6 mb-6 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.profile_picture} alt={user.full_name} />
                    <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                      <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{user.full_name}</h2>
                      {user.is_verified && (
                        <Badge className="bg-blue-500 text-white">Verified</Badge>
                      )}
                      {user.verification_status === "pending" && (
                        <Badge className="bg-yellow-500 text-white">Pending Verification</Badge>
                      )}
                      {user.is_premium && (
                        <Badge className="bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {canVerify && (
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog({ open: true, action: "verify" })}
                        className="cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 mr-2 text-green-500" />
                        Verify User
                      </DropdownMenuItem>
                    )}
                    {!canVerify && user.verification_status === "pending" && (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Verification Pending
                      </DropdownMenuItem>
                    )}
                    {!canVerify && !user.is_verified && user.verification_status === null && (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        <UserCheck className="w-4 h-4 mr-2" />
                        No Documents Submitted
                      </DropdownMenuItem>
                    )}
                    {canMakeAdmin && (
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog({ open: true, action: "makeAdmin" })}
                        className="cursor-pointer"
                      >
                        <Shield className="w-4 h-4 mr-2 text-blue-500" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {user.is_active && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setConfirmDialog({ open: true, action: "suspend" })}
                          className="cursor-pointer text-orange-500"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setConfirmDialog({ open: true, action: "ban" })}
                      className="cursor-pointer text-destructive"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Display Name</p>
                      <p className="font-medium">{user.display_name || "Not set"}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge
                        className={cn(
                          user.is_active ? "bg-green-500" : "bg-red-500"
                        )}
                      >
                        {user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Followers</p>
                      <p className="font-medium text-lg">{user.followers_count || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Following</p>
                      <p className="font-medium text-lg">{user.following_count || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Coins Balance</p>
                      <p className="font-medium text-lg">{user.coins_balance || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                      <p className="font-medium text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {user.bio && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Bio</p>
                      <p className="text-sm">{user.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {user.interests && user.interests.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest, i) => (
                          <Badge key={i} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    {user.mobile_number && (
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{user.mobile_number}</p>
                        </div>
                      </div>
                    )}

                    {user.date_of_birth && (
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">
                            {new Date(user.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {user.gender && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{user.gender}</p>
                      </div>
                    )}

                    {(user.city || user.country) && (
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">
                            {user.city}, {user.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Active</p>
                      <p className="font-medium">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Account Created</p>
                      <p className="font-medium">
                        {user.created_at ? new Date(user.created_at).toLocaleString() : "Unknown"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Tab */}
              <TabsContent value="verification" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Verification Status</p>
                        <Badge
                          className={cn(
                            user.is_verified ? "bg-green-500" : user.verification_status === "pending" ? "bg-yellow-500" : "bg-gray-500"
                          )}
                        >
                          {user.is_verified ? "Approved" : user.verification_status === "pending" ? "Pending Review" : "No Submission"}
                        </Badge>
                      </div>

                      {user.verification_status === "pending" && (
                        <div className="pt-4 border-t space-y-4">
                          <p className="text-sm font-medium text-muted-foreground">Update Verification Status</p>
                          <div className="space-y-3">
                            <Select
                              value={verificationUpdate.status}
                              onValueChange={(value) => setVerificationUpdate(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approved">✅ Approve Verification</SelectItem>
                                <SelectItem value="rejected">❌ Reject Verification</SelectItem>
                                <SelectItem value="pending">⏳ Keep Pending</SelectItem>
                              </SelectContent>
                            </Select>

                            {(verificationUpdate.status === "rejected" || verificationUpdate.status === "approved") && (
                              <Textarea
                                placeholder={verificationUpdate.status === "rejected" ? "Reason for rejection (optional)" : "Additional notes (optional)"}
                                value={verificationUpdate.reason}
                                onChange={(e) => setVerificationUpdate(prev => ({ ...prev, reason: e.target.value }))}
                                rows={3}
                              />
                            )}

                            <Button
                              onClick={handleUpdateVerification}
                              disabled={!verificationUpdate.status || verificationUpdate.loading}
                              className="w-full"
                              variant={verificationUpdate.status === "approved" ? "default" : verificationUpdate.status === "rejected" ? "destructive" : "secondary"}
                            >
                              {verificationUpdate.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {verificationUpdate.status === "approved" && "Approve Verification"}
                              {verificationUpdate.status === "rejected" && "Reject Verification"}
                              {verificationUpdate.status === "pending" && "Update Status"}
                              {!verificationUpdate.status && "Update Status"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {(user.verification_status === "pending" || user.is_verified) && (
                        <>
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">ID Type</p>
                            <p className="font-medium">Passport / National ID</p>
                          </div>
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">ID Number</p>
                            <p className="font-medium">••••••••</p>
                          </div>
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">Documents Submitted</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                ID Document ✓
                              </Badge>
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                Selfie ✓
                              </Badge>
                            </div>
                          </div>
                          {user.is_verified && (
                            <div className="pt-4 border-t">
                              <p className="text-sm text-muted-foreground mb-1">Approved By</p>
                              <p className="font-medium text-sm">Admin</p>
                            </div>
                          )}
                        </>
                      )}

                      {!user.verification_status && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">User has not submitted verification documents yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "verify" && "Verify User?"}
              {confirmDialog.action === "makeAdmin" && "Make User Admin?"}
              {confirmDialog.action === "suspend" && "Suspend User?"}
              {confirmDialog.action === "ban" && "Ban User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action && actionText[confirmDialog.action]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.action === "verify") handleVerifyUser()
                else if (confirmDialog.action === "makeAdmin") handleMakeAdmin()
                else if (confirmDialog.action === "suspend") handleSuspendUser()
                else if (confirmDialog.action === "ban") handleBanUser()
              }}
              disabled={loading}
              className={cn(
                confirmDialog.action === "ban" && "bg-destructive hover:bg-destructive/90",
                confirmDialog.action === "suspend" && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmDialog.action === "verify" && "Verify"}
              {confirmDialog.action === "makeAdmin" && "Make Admin"}
              {confirmDialog.action === "suspend" && "Suspend"}
              {confirmDialog.action === "ban" && "Ban User"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
