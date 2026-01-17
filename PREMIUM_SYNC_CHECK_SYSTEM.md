# Premium Status Sync & Check System

## Overview

The premium system now uses a **two-endpoint approach** to ensure data consistency and provide accurate premium status:

1. **`/api/premium/check`** - For feature access (more permissive)
2. **`/api/premium/sync`** - For data synchronization (strict)

---

## Endpoint 1: `/api/premium/check` (Feature Access)

**Purpose:** Determine if user can access premium features

**Subscription Status Checked:**
- ✅ **'active'** - Fully confirmed subscription
- ✅ **'pending'** - Recently purchased, awaiting payment confirmation
- ❌ **'expired'** - Excluded
- ❌ **'cancelled'** - Excluded

**Usage:**
```typescript
// Called by usePremiumCheck() hook
const response = await fetch("/api/premium/check")
const { isPremium, subscription } = await response.json()

// isPremium = true if user has 'active' OR 'pending' subscription
// This is PERMISSIVE - users get immediate access
```

**Why Include Pending?**
- Better UX: Users don't wait for payment confirmation to use premium features
- Reduces friction: Creates good customer experience
- Reverses if payment fails: If payment is rejected, subscription moves to 'failed' status
- Business logic: Users paid, they should get access immediately

**Response:**
```json
{
  "isPremium": true,
  "subscription": {
    "plan": "Monthly",
    "expiresAt": "2026-02-16",
    "status": "pending",
    "daysRemaining": 31
  }
}
```

---

## Endpoint 2: `/api/premium/sync` (Data Consistency)

**Purpose:** Sync premium status between `premium_subscriptions` and `users` tables

**Subscription Status Checked:**
- ✅ **'active'** - Only fully confirmed subscriptions count
- ❌ **'pending'** - Excluded from sync (users table update)
- ❌ **'expired'** - Excluded
- ❌ **'cancelled'** - Excluded

**Operations:**
```
1. Check premium_subscriptions table for 'active' subscriptions
2. Compare with users.is_premium flag
3. Update users.is_premium if different
4. Return current status and whether update was made
```

**Usage:**
```typescript
// Called to sync data (explicit)
const response = await fetch("/api/premium/sync", { method: "POST" })
const { isPremium, wasUpdated, shouldBe } = await response.json()

// isPremium = true ONLY if user has 'active' subscription
// wasUpdated = true if users table was updated
```

**Why Exclude Pending from Sync?**
- Keep users table as "confirmed premium" flag
- Pending subscriptions are temporary states
- Sync only updates when payment is confirmed ('active')
- Prevents false positives in bulk queries

**Response:**
```json
{
  "isPremium": true,
  "currentStatus": false,
  "shouldBe": true,
  "wasUpdated": true,
  "subscription": {
    "plan": "Monthly",
    "expiresAt": "2026-02-16",
    "daysRemaining": 31
  },
  "message": "Premium status synced: false → true"
}
```

---

## How They Work Together

```
User Flow:
┌─────────────────────────────────────────────┐
│ User purchases premium subscription         │
│ status = 'pending' in premium_subscriptions │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ User tries to access premium feature        │
│ usePremiumCheck() calls /api/premium/check  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ /api/premium/check finds 'pending' sub      │
│ Returns { isPremium: true }                 │
│ User can access feature IMMEDIATELY         │
└─────────────────────────────────────────────┘
                    ↓
              (Later...)
              
┌─────────────────────────────────────────────┐
│ Payment confirmed by payment processor      │
│ status changed: 'pending' → 'active'        │
│ Webhook updates database                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ /api/premium/sync called (periodic)         │
│ Finds 'active' subscription                 │
│ Updates: users.is_premium = true            │
│ Syncs confirmation to users table           │
└─────────────────────────────────────────────┘
```

---

## API Endpoints

### GET `/api/premium/check`
**Check if user can access premium features (read-only)**

Request:
```bash
GET /api/premium/check
```

Response:
```json
{
  "isPremium": true,
  "subscription": {
    "plan": "Monthly",
    "expiresAt": "2026-02-16",
    "daysRemaining": 31
  }
}
```

---

### POST `/api/premium/sync`
**Sync premium status and update users table**

Request:
```bash
POST /api/premium/sync
```

Response:
```json
{
  "isPremium": true,
  "currentStatus": false,
  "shouldBe": true,
  "wasUpdated": true,
  "subscription": { ... },
  "message": "Premium status synced: false → true"
}
```

### GET `/api/premium/sync`
**Check sync status without making changes**

Request:
```bash
GET /api/premium/sync
```

Response:
```json
{
  "isPremium": true,
  "currentStatus": false,
  "shouldBe": true,
  "needsSync": true,
  "activeSubscriptionCount": 1,
  "message": "Sync needed: is_premium is false but should be true"
}
```

---

## Utility Functions

**File:** `lib/premium-utils.ts`

### `syncUserPremiumStatus(userId)`
Sync a specific user's premium status

```typescript
import { syncUserPremiumStatus } from "@/lib/premium-utils"

// In your API route or server action
const isPremium = await syncUserPremiumStatus(userId)
// Returns: boolean indicating if user is premium
```

### `hasActivePremiumSubscription(userId)`
Quick check for 'active' OR 'pending' subscriptions

```typescript
import { hasActivePremiumSubscription } from "@/lib/premium-utils"

const canAccessFeature = await hasActivePremiumSubscription(userId)
```

### `getUserSubscriptionDetails(userId)`
Get detailed subscription information

```typescript
import { getUserSubscriptionDetails } from "@/lib/premium-utils"

const details = await getUserSubscriptionDetails(userId)
// Returns: { plan, expiresAt, daysRemaining, paymentMethod, autoRenew }
```

---

## When to Use Each

| Scenario | Endpoint | Note |
|----------|----------|------|
| User accessing premium feature | `/api/premium/check` | Immediate access for better UX |
| After payment confirmation | `/api/premium/sync` POST | Update users table when 'active' |
| Periodic data cleanup | `/api/premium/sync` POST | Ensure tables stay in sync |
| Debugging sync issues | `/api/premium/sync` GET | Check what needs updating |
| Background job | `syncUserPremiumStatus()` | Bulk sync during off-hours |

---

## Current User Status

**Your Test User:** `41c53e3c-1581-44d7-b9fb-239923b8a411`
- ✅ `is_premium = true` in users table (already set)
- ✅ Has active subscription in premium_subscriptions
- ✅ Can access all premium features

**Status:** Data is already in sync! Everything is working correctly.

---

## Data Consistency Rules

### Rule 1: Feature Access
When user clicks a premium feature:
```
Use /api/premium/check
If isPremium = true (has 'active' OR 'pending') → Allow access
If isPremium = false → Redirect to premium page
```

### Rule 2: Permanent Records
When recording premium status in users table:
```
Use /api/premium/sync
Only update if user has 'active' subscription (not 'pending')
This ensures users table = confirmed premium flag
```

### Rule 3: Session Updates
When user logs in:
```
1. Get basic session data
2. Later, fetch actual premium status from /api/premium/check
3. Use that status for permission checks (not session flag)
```

---

## Monitoring & Debugging

### Check if sync is needed:
```bash
curl -X GET http://localhost:3000/api/premium/sync
# Shows: needsSync=true/false
```

### Manually sync a user:
```bash
curl -X POST http://localhost:3000/api/premium/sync
# Shows: wasUpdated=true/false
```

### View subscription details:
```typescript
import { getUserSubscriptionDetails } from "@/lib/premium-utils"
const details = await getUserSubscriptionDetails(userId)
console.log(details)
```

---

## Summary

✅ **Two-Endpoint System:**
- `check` = Permissive (includes pending) for feature access
- `sync` = Strict (active only) for data consistency

✅ **Your current status:** All good! Data is synced and you can access premium features.

✅ **Future-proof:** Sync endpoint ensures tables stay consistent even if manual updates happen.

✅ **Better UX:** Users with pending subscriptions get immediate access while payment processes.
