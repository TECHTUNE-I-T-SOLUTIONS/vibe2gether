# Coin Features - Frontend Integration Guide

## Overview
This guide provides instructions for integrating the coin transfer and withdrawal settlement features into your frontend application.

---

## 1. Coin Transfer Feature - Frontend Integration

### Component Location
Create a new component: `components/wallet/transfer-coins-modal.tsx`

### Basic Component Structure
```tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface TransferCoinsModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onTransferSuccess: () => void
}

export function TransferCoinsModal({
  isOpen,
  onClose,
  currentBalance,
  onTransferSuccess
}: TransferCoinsModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [recipientId, setRecipientId] = useState('')
  const [coins, setCoins] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTransfer = async () => {
    // Reset error
    setError('')

    // Validate inputs
    if (!recipientId.trim()) {
      setError('Please enter recipient ID or select a recipient')
      return
    }

    const coinsAmount = parseInt(coins)
    if (!coins || coinsAmount <= 0) {
      setError('Please enter a valid number of coins')
      return
    }

    if (coinsAmount > currentBalance) {
      setError(`Insufficient balance. You have ${currentBalance} coins.`)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/wallet/transfer-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          coins: coinsAmount,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed')
      }

      toast({
        title: 'Transfer Successful',
        description: `You sent ${coinsAmount} coins!`,
      })

      // Reset form
      setRecipientId('')
      setCoins('')
      setMessage('')
      
      // Call success callback
      onTransferSuccess()
      
      // Close modal
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer failed'
      setError(message)
      toast({
        title: 'Transfer Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Coins</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium">Recipient ID</label>
            <Input
              placeholder="Enter recipient user ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Coins ({currentBalance} available)
            </label>
            <Input
              type="number"
              placeholder="Enter number of coins"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              disabled={isLoading}
              min="1"
              max={currentBalance}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/200
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTransfer}
              disabled={isLoading || !recipientId || !coins}
              className="flex-1"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Transferring...' : 'Send Coins'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Integration in Wallet Page
```tsx
import { TransferCoinsModal } from '@/components/wallet/transfer-coins-modal'

export function WalletPage() {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [balance, setBalance] = useState(0)

  const handleTransferSuccess = () => {
    // Refresh wallet data
    fetchWalletData()
  }

  return (
    <div>
      {/* Wallet Balance Display */}
      <div className="card p-4">
        <p className="text-sm text-gray-600">Coin Balance</p>
        <p className="text-3xl font-bold">{balance}</p>
        
        <Button 
          onClick={() => setIsTransferModalOpen(true)}
          className="mt-4"
        >
          Transfer Coins
        </Button>
      </div>

      {/* Transfer Modal */}
      <TransferCoinsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentBalance={balance}
        onTransferSuccess={handleTransferSuccess}
      />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  )
}
```

---

## 2. User Search Component (For Transfer Recipient)

### Create: `components/user-search-select.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  display_name: string
  profile_picture?: string
}

interface UserSearchSelectProps {
  onSelect: (user: User) => void
  currentUserId?: string
}

export function UserSearchSelect({ onSelect, currentUserId }: UserSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setUsers([])
      return
    }

    setIsLoading(true)
    
    fetch(`/api/users/search?q=${search}`)
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(err => console.error('Search failed:', err))
      .finally(() => setIsLoading(false))
  }, [search])

  const selectedUser = users.find(u => u.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? selectedUser.display_name : 'Select user...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          
          {isLoading && (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          )}
          
          {!isLoading && users.length === 0 && search.length >= 2 && (
            <CommandEmpty>No users found</CommandEmpty>
          )}
          
          {users.length > 0 && (
            <CommandGroup>
              {users
                .filter(u => u.id !== currentUserId)
                .map(user => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={(id) => {
                      setValue(id === value ? '' : id)
                      const selected = users.find(u => u.id === id)
                      if (selected) onSelect(selected)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === user.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {user.profile_picture && (
                      <img
                        src={user.profile_picture}
                        alt={user.display_name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    {user.display_name}
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

---

## 3. Transaction History Component

### Create: `components/coin-transaction-history.tsx`
```tsx
'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, ArrowDown, ArrowUp } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  transaction_type: string
  description: string
  balance_after: number
  created_at: string
}

export function CoinTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/wallet/transactions')
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'transfer_sent': 'Coins Sent',
      'transfer_received': 'Coins Received',
      'withdrawal_settled': 'Withdrawal Settled',
      'redeem_coins': 'Coins Redeemed',
      'earn_coins': 'Coins Earned',
    }
    return labels[type] || type
  }

  const getTransactionColor = (type: string) => {
    if (type.includes('received') || type.includes('earn')) return 'bg-green-50'
    if (type.includes('sent') || type.includes('redeem') || type.includes('withdrawal')) return 'bg-red-50'
    return 'bg-gray-50'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        No transactions yet
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className={`p-4 ${getTransactionColor(transaction.transaction_type)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${transaction.amount > 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                {transaction.amount > 0 ? (
                  <ArrowDown className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{getTransactionLabel(transaction.transaction_type)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {transaction.transaction_type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {transaction.description}
                </p>
              </div>
            </div>

            <div className="text-right ml-4">
              <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Balance after: {transaction.balance_after} coins
          </p>
        </Card>
      ))}
    </div>
  )
}
```

---

## 4. Withdrawal Settlement Admin Panel

### Create: `components/admin/withdrawal-settlement.tsx`
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'

interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  requested_coins: number
  status: string
  user: {
    display_name: string
    email: string
  }
}

interface WithdrawalSettlementProps {
  withdrawal: WithdrawalRequest
  onSettled: () => void
  adminId: string
}

export function WithdrawalSettlement({
  withdrawal,
  onSettled,
  adminId
}: WithdrawalSettlementProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSettle = async () => {
    if (!notes.trim()) {
      setError('Please add settlement notes')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'settled',
          notes: notes.trim(),
          processed_by: adminId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Settlement failed')
      }

      toast({
        title: 'Withdrawal Settled',
        description: `${withdrawal.requested_coins} coins deducted from user's wallet`,
      })

      onSettled()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Settlement failed'
      setError(message)
      toast({
        title: 'Settlement Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2">Withdrawal Details</h3>
        <div className="space-y-1 text-sm">
          <p><strong>User:</strong> {withdrawal.user.display_name} ({withdrawal.user.email})</p>
          <p><strong>Amount:</strong> ${withdrawal.amount}</p>
          <p><strong>Coins to Deduct:</strong> {withdrawal.requested_coins}</p>
          <p><strong>Status:</strong> <Badge>{withdrawal.status}</Badge></p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <label className="text-sm font-medium">Settlement Notes</label>
        <Textarea
          placeholder="Add notes about this settlement (e.g., bank transfer reference, date, etc.)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSettle}
          disabled={isLoading || !notes.trim()}
          className="flex-1"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Settling...' : 'Settle Withdrawal'}
        </Button>
      </div>
    </div>
  )
}
```

---

## 5. API Integration Helper

### Create: `lib/wallet-api.ts`
```typescript
// API helper functions for wallet operations

export async function transferCoins(
  recipientId: string,
  coins: number,
  message?: string
) {
  const response = await fetch('/api/wallet/transfer-coins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientId,
      coins,
      message,
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}

export async function getWalletInfo() {
  const response = await fetch('/api/wallet')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}

export async function getTransactionHistory(limit = 50) {
  const response = await fetch(`/api/wallet/transactions?limit=${limit}`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}

export async function settleWithdrawal(
  withdrawalId: string,
  notes: string,
  adminId: string
) {
  const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'settled',
      notes,
      processed_by: adminId,
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}
```

---

## 6. Hook for Wallet Management

### Create: `hooks/use-wallet.ts`
```typescript
import { useCallback, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import * as walletApi from '@/lib/wallet-api'

interface WalletData {
  coins_balance: number
  total_coins_earned: number
}

export function useWallet() {
  const { data: session } = useSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWallet = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await walletApi.getWalletInfo()
      setWallet(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  const transferCoins = useCallback(
    async (recipientId: string, coins: number, message?: string) => {
      try {
        const result = await walletApi.transferCoins(recipientId, coins, message)
        // Refresh wallet data
        await fetchWallet()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transfer failed'
        setError(message)
        throw err
      }
    },
    [fetchWallet]
  )

  return {
    wallet,
    isLoading,
    error,
    transferCoins,
    refreshWallet: fetchWallet,
  }
}
```

---

## Integration Checklist

- [ ] Create transfer modal component
- [ ] Create user search component
- [ ] Create transaction history component
- [ ] Create withdrawal settlement admin component
- [ ] Create wallet API helper functions
- [ ] Create useWallet hook
- [ ] Add components to relevant pages
- [ ] Update wallet page with transfer button
- [ ] Add transaction history to wallet page
- [ ] Add withdrawal settlement to admin dashboard
- [ ] Test coin transfer flow
- [ ] Test withdrawal settlement flow
- [ ] Update navigation/menu if needed
- [ ] Add notifications UI for received coins
- [ ] Style components to match app theme
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add confirmation dialogs where appropriate
- [ ] Test with multiple users
- [ ] Test edge cases (insufficient balance, etc.)

---

## Notes

1. Components use existing UI library components (adjust imports as needed)
2. All API calls require proper authentication
3. Error messages are user-friendly and informative
4. Loading states provide feedback to users
5. Transaction history should refresh after successful transfers
6. Admin settlement should require 2FA or additional confirmation
7. Consider adding confirmation dialogs for large transfers
8. Add analytics tracking for transfer metrics
9. Consider rate limiting on frontend to prevent accidental spam
10. Test thoroughly before deploying to production
