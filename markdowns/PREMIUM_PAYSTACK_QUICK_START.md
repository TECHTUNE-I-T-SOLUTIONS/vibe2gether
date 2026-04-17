# Premium Paystack Integration - Quick Start Guide

## What Changed

### User Experience
- `/premium` page now redirects to `/dashboard/premium`
- Premium upgrade happens through Paystack checkout (secure, no manual card entry)
- Three payment plans available: Monthly (₦14.99), 6 Months (₦79.99), Yearly (₦149.99)
- Instant subscription activation after successful payment

### Payment Flow (User Perspective)
1. User clicks "Upgrade Now" on any plan
2. System initializes Paystack payment
3. User completes payment on secure Paystack page
4. Auto-redirects back to dashboard
5. Subscription instantly activated
6. Premium features unlocked

## How to Test

### Prerequisites
1. Ensure PAYSTACK credentials are in `.env.local`:
   ```
   PAYSTACK_SECRET_KEY=sk_live_...
   PAYSTACK_PUBLIC_KEY=pk_live_...
   APP_BASE_URL=http://localhost:3000
   ```

2. User must be logged in
3. Must not have active premium subscription

### Test Steps
1. Navigate to `/premium` → Should redirect to `/dashboard/premium`
2. See three plan cards with proper pricing
3. Click "Upgrade Now" on any plan
4. Paystack checkout page should load
5. Complete with test card (Paystack provides test cards)
6. Should redirect back with success message
7. Subscription should show as "Active"
8. User profile should have `is_premium: true`

### Paystack Test Cards
- Visa: 4084084084084081
- Mastercard: 5061461967422493
- Amount: Any amount
- Expiry: 01/32 (month/year)
- CVV: 000

## Files Changed

| File | Changes |
|------|---------|
| `app/premium/page.tsx` | Changed to redirect component |
| `app/dashboard/premium/page.tsx` | Complete Paystack integration |
| `app/api/premium/subscribe/route.ts` | Plan-based initialization |
| `app/api/payments/verify/route.ts` | Premium activation logic |

## Key Features Implemented

### 1. Redirect from /premium
```typescript
useEffect(() => {
  router.replace("/dashboard/premium")
}, [router])
```

### 2. Paystack Payment Initialization
```typescript
const response = await fetch("/api/premium/subscribe", {
  method: "POST",
  body: JSON.stringify({ tierName: plan.name })
})
// Receives authorization_url from Paystack
window.location.href = result.authorization_url
```

### 3. Payment Verification Callback
```typescript
const reference = searchParams.get("reference")
if (reference) {
  verifyPaymentCallback(reference)
}
```

### 4. Subscription Activation
When payment verified:
- `premium_subscriptions.status` → "active"
- `users.is_premium` → true
- `users.premium_plan` → plan name
- Notification created

## Database Schema

### premium_subscriptions
```sql
- id (uuid)
- user_id (uuid)
- plan (text) - "Monthly", "6 Months", "Yearly"
- status (text) - "pending", "active", "expired", "cancelled"
- expiry_date (timestamp)
- activated_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### users (additions)
```sql
- is_premium (boolean) - default false
- premium_plan (text) - plan name
- premium_activated_at (timestamp)
```

## Pricing Configuration

All prices stored in kobo (kobo = NGN / 100):

| Plan | Price (Kobo) | Display |
|------|-------------|---------|
| Monthly | 1499 | ₦14.99 |
| 6 Months | 7999 | ₦79.99 |
| Yearly | 14999 | ₦149.99 |

Savings calculated:
- 6 Months: 11% savings
- Yearly: 17% savings

## State Management

The dashboard premium page manages:
- Subscription data (fetch on load)
- Loading states (user, data loading)
- Payment flow (processing state)
- Errors and success messages
- Payment callback verification

## Error Scenarios

| Scenario | Handling |
|----------|----------|
| User not logged in | "Unauthorized" error |
| Invalid plan | "Invalid plan name" error |
| Paystack timeout | Shows error, can retry |
| Payment failed | Transaction marked failed, user notified |
| Already has subscription | Can switch plans |
| Verification fails | Shows error, displays transaction id |

## Important Notes

⚠️ **Critical Points:**
1. User MUST be authenticated before accessing `/dashboard/premium`
2. Paystack secret key must be in server-side environment only
3. Payment verification must happen server-side
4. Subscription expiry should trigger renewal/cancellation flow (not yet implemented)
5. Callback URL uses `reference` query param for verification

✅ **Best Practices Implemented:**
1. Secure payment processing via Paystack
2. No sensitive card data on frontend
3. Automatic user profile updates
4. Notification system integration
5. Error handling and logging
6. Transaction audit trail

## Monitoring & Logs

Check server logs for:
```
[POST /api/premium/subscribe] User X subscribing to Monthly
[Premium] Payment initialized, redirecting to Paystack
[Verify Payment] Processing verification for reference: X
[Verify Payment] Premium subscription activated successfully
```

## Troubleshooting

### Payment not initializing
- Check PAYSTACK_SECRET_KEY in `.env.local`
- Check network tab for `/api/premium/subscribe` request
- Look for error in server logs

### Payment verified but subscription not activated
- Check if `premium_subscriptions` table exists
- Verify user has row in `users` table
- Check server logs for SQL errors

### Redirect not working
- Clear browser cache
- Check `/premium` route exists
- Verify `useRouter` is imported correctly

### Paystack checkout blank
- Check PAYSTACK_PUBLIC_KEY is correct
- Verify APP_BASE_URL in environment
- Check browser console for JS errors

## Next Steps

1. Test payment flow with real Paystack account
2. Verify email notifications are sent
3. Implement subscription renewal logic
4. Add subscription management (cancel, pause, upgrade)
5. Add invoice generation
6. Set up webhook for Paystack events

