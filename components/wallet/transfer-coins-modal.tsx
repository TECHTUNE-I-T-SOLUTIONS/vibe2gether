"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Coins, Search, AlertCircle, Check } from "lucide-react"

interface User {
  id: string
  email: string
  display_name: string
  profile_picture: string | null
}

interface TransferCoinsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userBalance: number
  onTransferSuccess: () => void
}

export function TransferCoinsModal({
  open,
  onOpenChange,
  userBalance,
  onTransferSuccess,
}: TransferCoinsModalProps) {
  const [step, setStep] = useState<"search" | "confirm">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [coinsAmount, setCoinsAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const { toast } = useToast()

  // Search for users
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setStep("confirm")
  }

  const handleTransfer = async () => {
    // Validation
    if (!selectedUser) {
      toast({
        title: "Select Recipient",
        description: "Please select a recipient user.",
        variant: "destructive",
      })
      return
    }

    const coins = parseInt(coinsAmount, 10)
    if (!coinsAmount.trim() || isNaN(coins) || coins <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid coin amount.",
        variant: "destructive",
      })
      return
    }

    if (coins > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You have ${userBalance} coins but trying to send ${coins}.`,
        variant: "destructive",
      })
      return
    }

    try {
      setTransferring(true)

      const response = await fetch("/api/wallet/transfer-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          coins,
          message: message || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Transfer failed")
      }

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${coins} coins to ${selectedUser.display_name}`,
      })

      // Reset form
      setSearchQuery("")
      setSearchResults([])
      setSelectedUser(null)
      setCoinsAmount("")
      setMessage("")
      setStep("search")
      onOpenChange(false)
      onTransferSuccess()
    } catch (error) {
      console.error("Transfer error:", error)
      toast({
        title: "Transfer Failed",
        description:
          error instanceof Error ? error.message : "Failed to transfer coins",
        variant: "destructive",
      })
    } finally {
      setTransferring(false)
    }
  }

  const handleClose = () => {
    if (step === "confirm") {
      setStep("search")
      setSelectedUser(null)
      setCoinsAmount("")
      setMessage("")
    } else {
      setSearchQuery("")
      setSearchResults([])
      setSelectedUser(null)
      setCoinsAmount("")
      setMessage("")
      setStep("search")
      onOpenChange(false)
    }
  }

  const coins = parseInt(coinsAmount, 10) || 0
  const canTransfer = selectedUser && coins > 0 && coins <= userBalance && !transferring

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Coins</DialogTitle>
          <DialogDescription>
            Send coins to another user as a gift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Search and Select Recipient */}
          {step === "search" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="border border-border/50 rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 border-b border-border/30 last:border-0 text-left transition-colors"
                    >
                      <img
                        src={user.profile_picture || "/default-avatar.png"}
                        alt={user.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Step 2: Confirm Transfer */}
          {step === "confirm" && selectedUser && (
            <div className="space-y-4">
              {/* Selected User Card */}
              <Card className="p-4 border-border/50">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
                  <img
                    src={selectedUser.profile_picture || "/default-avatar.png"}
                    alt={selectedUser.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedUser.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* Coins Amount */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="amount">Amount (coins)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="Enter coin amount"
                    value={coinsAmount}
                    onChange={(e) => setCoinsAmount(e.target.value)}
                    disabled={transferring}
                  />
                  {coinsAmount && (
                    <p className="text-xs text-muted-foreground">
                      You have {userBalance} coins available
                    </p>
                  )}
                </div>

                {/* Message (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={transferring}
                  />
                </div>
              </Card>

              {/* Transfer Summary */}
              {coins > 0 && (
                <Card className="p-4 bg-muted/30 border-border/50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Recipient
                      </span>
                      <span className="font-medium">
                        {selectedUser.display_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Amount
                      </span>
                      <span className="font-medium flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {coins.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-border/50 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Your balance after
                      </span>
                      <span className="font-semibold text-lg">
                        {(userBalance - coins).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {coins > userBalance && (
                <div className="flex gap-2 p-3 bg-red-500/10 text-red-700 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Insufficient balance. You need {coins - userBalance} more
                    coins.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "confirm" && (
            <Button
              variant="outline"
              onClick={() => {
                setStep("search")
                setCoinsAmount("")
                setMessage("")
              }}
              disabled={transferring}
            >
              Back
            </Button>
          )}
          <Button
            onClick={step === "search" ? () => setStep("confirm") : handleTransfer}
            disabled={
              step === "search"
                ? !selectedUser || !coinsAmount
                : !canTransfer
            }
            className="gap-2"
          >
            {transferring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transferring...
              </>
            ) : step === "search" ? (
              <>
                <Check className="w-4 h-4" />
                Continue
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                Send {coins.toLocaleString()} Coins
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
