# Paystack Integration - Setup Guide

## Overview

This guide covers the complete Paystack payment integration for products and events in Vibe2Gether. Users can pay ₦1,500 (approximately $10 USD) to create marketplace products or events.

---

## Environment Setup

### 1. Get Paystack API Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up or log in
3. Go to Settings → API Keys & Webhooks
4. Copy your keys:
   - **Test Keys** (for development)
   - **Live Keys** (for production)

### 2. Add Environment Variables

Update `.env.local`:

```bash
# Paystack Integration
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key_here

# Use Live keys for production:
# PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
# PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
```

### 3. Deploy Database Schema

Run in Supabase SQL Editor:

```sql
-- Copy entire contents of PAYSTACK_SCHEMA.sql
-- Paste in Supabase SQL Editor
-- Click "Run"
```

This creates:
- ✅ `payments` table
- ✅ 6 performance indexes
- ✅ RLS policies
- ✅ Helper functions
- ✅ Reporting views

---

## How It Works

### Payment Flow

```
User Creates Product/Event
         ↓
Shows PaystackPaymentModal
         ↓
User enters email & name
         ↓
Clicks "Pay ₦1,500"
         ↓
POST /api/paystack/initialize
         ↓
Paystack redirects to payment page
         ↓
User completes payment
         ↓
Paystack redirects back with reference
         ↓
GET /api/paystack/verify/[reference]
         ↓
Payment verified in database
         ↓
Product/Event marked as "payment_completed"
         ↓
Notification sent to user
```

---

## Components & APIs

### 1. PaystackPaymentModal Component

**Location:** `components/paystack-payment-modal.tsx`

**Props:**
```typescript
interface PaystackPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number                           // Amount in main currency (USD, NGN, etc)
  currency?: string                        // Default: "NGN"
  itemType: "product" | "event"
  itemData: {
    title: string
    id?: string
  }
  onPaymentSuccess?: (reference: string) => void
}
```

**Usage:**
```tsx
const [showPayment, setShowPayment] = useState(false)

<PaystackPaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  amount={10}  // $10 USD
  currency="NGN"
  itemType="product"
  itemData={{
    title: "My Product",
    id: productId
  }}
  onPaymentSuccess={(reference) => {
    console.log("Payment successful:", reference)
    // Refresh product list
  }}
/>

<Button onClick={() => setShowPayment(true)}>Create Product</Button>
```

---

### 2. API Endpoints

#### POST `/api/paystack/initialize`

Initialize a new payment.

**Request:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "amount": 150000,
  "currency": "NGN",
  "itemType": "product",
  "itemData": {
    "title": "My Product",
    "id": "product-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "ref_xyz123",
  "accessCode": "access_code_xyz"
}
```

**Error Response:**
```json
{
  "error": "Missing required fields"
}
```

---

#### GET `/api/paystack/verify/[reference]`

Verify payment status and update product/event.

**Example:**
```
GET /api/paystack/verify/ref_xyz123
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "reference": "ref_xyz123",
    "amount": 15000,
    "currency": "NGN",
    "status": "success",
    "itemType": "product",
    "itemId": "prod-123"
  }
}
```

---

#### POST `/api/paystack/webhook`

Webhook endpoint for Paystack notifications (async).

**Configure in Paystack Dashboard:**
1. Settings → API Keys & Webhooks
2. Webhook URL: `https://yourdomain.com/api/paystack/webhook`
3. Select events: `charge.success`

---

## Amounts & Pricing

### Conversion Table

| Currency | Amount   | Notes |
|----------|----------|-------|
| NGN      | 1,500    | Nigerian Naira |
| USD      | ~10      | ~1.5 USD |
| GBP      | ~7.5     | ~6 GBP |
| EUR      | ~9       | ~7.50 EUR |

**Automatic Conversion:**
```typescript
// In component
const amountInNGN = Math.round(amount * 1.67) // USD to NGN
// Displays: "₦1,500"

// In API
const amountInKobo = Math.round(amount * 100) // Convert to Kobo (smallest unit)
```

---

## Integration Steps

### Step 1: Add Modal to Product Creation

Update `app/dashboard/marketplace/manage/page.tsx`:

```tsx
"use client"
import { PaystackPaymentModal } from "@/components/paystack-payment-modal"

export default function DashboardMarketplaceManagePage() {
  const [showPayment, setShowPayment] = useState(false)
  const [newProductData, setNewProductData] = useState<any>(null)

  const handleCreateProduct = async (formData) => {
    // First create product
    const product = await createProduct(formData)
    
    // Then show payment
    setNewProductData({
      title: product.title,
      id: product.id
    })
    setShowPayment(true)
  }

  return (
    <>
      {/* Existing UI */}
      
      <PaystackPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={10}
        currency="NGN"
        itemType="product"
        itemData={newProductData || { title: "", id: "" }}
        onPaymentSuccess={() => {
          setShowPayment(false)
          // Refresh products
          fetchProducts()
        }}
      />
    </>
  )
}
```

### Step 2: Add Modal to Event Creation

Update `app/events/create/page.tsx` or similar:

```tsx
<PaystackPaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  amount={10}
  currency="NGN"
  itemType="event"
  itemData={newEventData}
  onPaymentSuccess={() => {
    // Refresh events
    router.refresh()
  }}
/>
```

### Step 3: Configure Webhook in Paystack Dashboard

1. Log in to Paystack Dashboard
2. Navigate to Settings → API Keys & Webhooks
3. Scroll to "Webhooks" section
4. Enter URL: `https://yourdomain.com/api/paystack/webhook`
5. Select events: `charge.success`
6. Save

### Step 4: Test Payment

**Using Test Keys:**
```
Card: 4084084084084081
CVV: 408
Expiry: Any future date
```

---

## Database Schema

### `payments` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who made payment |
| reference | VARCHAR | Unique Paystack reference |
| amount | DECIMAL | Amount paid |
| currency | VARCHAR | Currency (NGN, USD, etc) |
| status | VARCHAR | pending/success/failed |
| provider | VARCHAR | Always "paystack" |
| item_type | VARCHAR | product/event |
| item_id | UUID | Product or Event ID |
| payment_method | VARCHAR | card/bank/ussd/etc |
| customer_email | VARCHAR | Payer email |
| metadata | JSONB | Full payment details |
| created_at | TIMESTAMP | When payment was made |

### Updated Tables

**marketplace_products:**
- `payment_status` - pending/completed
- `payment_reference` - Link to payment

**events:**
- `payment_status` - pending/completed
- `payment_reference` - Link to payment

---

## Payment Statuses

| Status | Meaning | Action |
|--------|---------|--------|
| pending | Payment initialized | Waiting for user |
| success | Payment successful | Product/event created |
| failed | Payment failed | Show error to user |

---

## Error Handling

### Common Errors

**"Payment service not configured"**
- ✅ Add `PAYSTACK_SECRET_KEY` to `.env.local`

**"Missing required fields"**
- ✅ Ensure email, fullName, amount provided

**"Invalid signature"**
- ✅ Check webhook URL and signature header

**"Payment verification failed"**
- ✅ Check network connectivity
- ✅ Verify Paystack is operational

---

## Security Best Practices

✅ **Environment Variables**
- Store keys in `.env.local` (never commit)
- Use different keys for test/production

✅ **Webhook Verification**
- Always verify webhook signature
- Log all webhook events

✅ **Payment Verification**
- Always verify payment on server-side
- Don't trust client-side payment status

✅ **User Validation**
- Verify user ID in session
- Check product/event belongs to user

✅ **RLS Policies**
- Users can only see their own payments
- Service role bypasses for webhook

---

## Monitoring & Analytics

### Check Payment Status

```sql
-- All payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- User payments
SELECT * FROM payments WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- By status
SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status;

-- Revenue summary
SELECT * FROM payment_summary;
```

### Payment Statistics Function

```sql
SELECT * FROM get_payment_statistics('user-id-here');
```

Returns:
- Total payments
- Total amount paid
- Successful/pending/failed counts

---

## Testing Checklist

- [ ] Deploy `PAYSTACK_SCHEMA.sql` to database
- [ ] Add environment variables to `.env.local`
- [ ] Component imports without errors
- [ ] Modal opens on button click
- [ ] Form validation works (email required)
- [ ] Payment initialization works
- [ ] Redirects to Paystack page
- [ ] Test payment succeeds
- [ ] Payment recorded in database
- [ ] Product/event marked as paid
- [ ] User gets notification
- [ ] Webhook receives notification
- [ ] Live keys work in production

---

## Troubleshooting

### Payment Not Recording

1. Check `/api/paystack/verify/[reference]` response
2. Verify `payments` table has correct RLS policies
3. Check browser console for errors
4. View Supabase logs for database errors

### Webhook Not Working

1. Verify webhook URL is correct in Paystack Dashboard
2. Check webhook URL is publicly accessible
3. Test with Paystack webhook tester
4. Check server logs for errors

### User Not Receiving Notification

1. Check `notifications` table
2. Verify notification creation in API
3. Check `/dashboard/notifications` page loads notifications
4. Test notification query directly

---

## Production Checklist

Before going live:

- [ ] Switch to Live API keys in Paystack Dashboard
- [ ] Update `.env` variables to live keys
- [ ] Test with real payments
- [ ] Configure production webhook URL
- [ ] Monitor payment success rate
- [ ] Set up payment failure alerts
- [ ] Document payment process for users
- [ ] Test refund process (if needed)
- [ ] Monitor fraud/chargebacks
- [ ] Set up daily revenue reports

---

## Paystack Documentation

- [Paystack API Docs](https://paystack.com/docs/api/)
- [Paystack Libraries](https://paystack.com/docs/libraries-and-plugins/)
- [Webhook Events](https://paystack.com/docs/webhooks/events/)
- [Test Cards](https://paystack.com/docs/test-cards/)

---

## File References

| File | Purpose |
|------|---------|
| `components/paystack-payment-modal.tsx` | Payment modal UI |
| `app/api/paystack/initialize/route.ts` | Initialize payment |
| `app/api/paystack/verify/[reference]/route.ts` | Verify payment |
| `app/api/paystack/webhook/route.ts` | Webhook handler |
| `PAYSTACK_SCHEMA.sql` | Database schema |

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Deploy database schema
3. ✅ Test with test keys
4. ✅ Integrate into product/event creation
5. ✅ Configure webhook in Paystack
6. ✅ Test end-to-end flow
7. ✅ Switch to live keys
8. ✅ Monitor in production

---

**Status:** ✅ Ready to Deploy
**Last Updated:** December 2024
**Version:** 1.0
