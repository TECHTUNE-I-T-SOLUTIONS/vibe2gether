# Complete Payment System - Marketplace Purchase Flow

## Overview
Full end-to-end payment system for marketplace product purchases using Paystack payment processor with automatic verification and purchase status tracking.

## System Architecture

### Payment Flow Diagram
```
User clicks "Buy Product"
    ↓
PaystackPaymentModal opens
    ↓
User enters payment details (email, name, amount)
    ↓
User clicks "Pay ₦XXXX"
    ↓
Redirects to Paystack payment page
    ↓
User completes/fails payment on Paystack
    ↓
Paystack redirects to callback URL with reference
    ↓
/marketplace/payment-callback page
    ↓
Redirects to /marketplace?reference={REFERENCE}
    ↓
Marketplace page detects reference param
    ↓
Payment verification modal auto-opens
    ↓
Verifies payment with Paystack API
    ↓
Creates marketplace_purchases record
    ↓
Shows success message + auto-redirects (2 seconds)
    ↓
Product details modal refreshes (shows "✓ Paid" badge)
```

## API Endpoints

### 1. POST `/api/marketplace/purchase`
**Purpose**: Initialize Paystack payment

**Request**:
```json
{
  "productId": "uuid",
  "amount": 50000,
  "email": "user@example.com",
  "fullName": "User Name"
}
```

**Response**:
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "access_code_123",
  "reference": "ref_xyz123",
  "transactionId": "transaction_id_uuid"
}
```

**Flow**:
1. Authenticates user via NextAuth
2. Queries product details
3. Creates transaction record (status: "pending")
4. Calls Paystack API with callback URL
5. Returns authorization_url for payment page

**Callback URL Format**:
```
https://yourdomain.com/marketplace/payment-callback?reference=${reference}
```

---

### 2. GET `/api/marketplace/check-purchase?productId={PRODUCT_ID}`
**Purpose**: Check if user has purchased a specific product

**Response**:
```json
{
  "purchased": true,
  "status": "completed"
}
```

**Query Logic**:
```sql
SELECT * FROM marketplace_purchases
WHERE product_id = $1 
  AND buyer_id = $2
  AND status = 'completed'
LIMIT 1
```

**Returns**:
- `purchased`: true/false
- `status`: "completed" or null

---

### 3. GET `/api/paystack/verify?reference={REFERENCE}`
**Purpose**: Verify payment with Paystack and create purchase record

**Response**:
```json
{
  "success": true,
  "status": "completed",
  "amount": 50000,
  "type": "marketplace",
  "coinsAdded": null
}
```

**Verification Steps**:
1. Calls Paystack API with reference
2. Checks if status is "success"
3. Updates transaction status to "completed"
4. **For Marketplace Purchases**:
   - Extracts productId from metadata
   - Creates marketplace_purchases record:
     ```sql
     INSERT INTO marketplace_purchases (
       product_id, buyer_id, seller_id, 
       status, delivery_status, transaction_id, total_amount
     ) VALUES ($1, $2, $3, 'completed', 'pending', $4, $5)
     ```
5. Returns success response with details

---

## Component Implementation

### 1. PaystackPaymentModal (`/components/paystack-payment-modal.tsx`)

**State Management**:
- `email`: User email
- `fullName`: User full name
- `paymentAmount`: Amount in kobo
- `paymentStatus`: "idle" | "processing" | "success" | "error"
- `paymentReference`: Paystack reference for payment
- `errorMessage`: Error description
- `isProcessing`: Processing state
- `isLoading`: Loading state

**Key Features**:
1. **Payment Reference Tracking**:
   - Detects from URL params: `?reference=XXX`
   - Falls back to localStorage: `localStorage.getItem("paystack_reference")`
   - Stores in localStorage on payment init: `localStorage.setItem("paystack_reference", ref)`

2. **Polling Mechanism**:
   - Runs every 2 seconds while payment pending
   - Calls `verifyPayment()` to check status
   - Stops when payment completes
   - Automatically detects completed payments

3. **Auto-Redirect**:
   - For products: Redirects after 2 seconds
   - For coins: Auto-closes after 3 seconds
   - Clears localStorage on success

4. **Button States**:
   - **Idle**: "Pay ₦XXXX" (primary button)
   - **Processing**: "Processing..." or verification button
   - **Success**: 
     - Products: "✓ Return to Marketplace" (large, gradient)
     - Coins: "Done" (large, gradient)
   - **Error**: "Cancel" + "Try Again"

**Code Structure**:
```typescript
// Reference detection and fallback
const urlReference = searchParams.get("reference")
const reference = urlReference || localStorage.getItem("paystack_reference")

// Payment initialization
localStorage.setItem("paystack_reference", reference)
window.location.href = authUrl

// Polling for payment status
useEffect(() => {
  if (!paymentReference || paymentStatus === "success") return
  const interval = setInterval(() => {
    verifyPayment(paymentReference)
  }, 2000)
  return () => clearInterval(interval)
}, [paymentReference, paymentStatus])

// On success
setPaymentStatus("success")
localStorage.removeItem("paystack_reference")
setTimeout(() => {
  window.location.href = `/marketplace/payment-callback?reference=${reference}`
}, 2000)
```

---

### 2. ProductDetailsModal (`/components/product-details-modal.tsx`)

**Purchase Status Integration**:
1. Checks purchase status when modal opens
2. Uses `useEffect` to trigger on `isOpen` change
3. Calls `/api/marketplace/check-purchase` endpoint
4. Updates `hasPurchased` state

**Button Logic**:
```typescript
if (!session?.user?.id) {
  // Not logged in
  <Button>Login to Buy</Button>
}
else if (isOwnProduct) {
  // Owner viewing own product
  <div>This is your product</div>
}
else if (hasPurchased) {
  // User already purchased
  <>
    <Badge>✓ Paid</Badge>
    <Button onClick={handleMessageSeller}>Message Seller</Button>
  </>
}
else {
  // Not purchased yet
  <Button onClick={handleBuyProduct}>Buy ₦{price}</Button>
}
```

**Features**:
- Auto-refresh on modal reopen
- Integrates with PaystackPaymentModal
- Success callback updates hasPurchased state
- Routes to messages: `/dashboard/messages?userId=${seller.id}`

---

### 3. PaymentVerificationModal (`/components/payment-verification-modal.tsx`)

**States**:
- `verifying`: Checking with Paystack
- `success`: Payment verified
- `error`: Verification failed

**Features**:
1. Auto-verifies on mount
2. Shows loading spinner while verifying
3. Shows success message with checkmark
4. Shows error with "Try Again" button
5. Auto-closes after 3 seconds on success

**Code**:
```typescript
useEffect(() => {
  if (!isOpen || !reference) return
  verifyPaymentNow()
}, [isOpen, reference])

const verifyPaymentNow = async () => {
  const response = await fetch(`/api/paystack/verify?reference=${reference}`)
  const result = await response.json()
  
  if (result.success && result.status === "completed") {
    setStatus("success")
    setTimeout(() => onClose(), 3000)
  } else {
    setStatus("error")
  }
}
```

---

### 4. Marketplace Page (`/app/marketplace/page.tsx`)

**Payment Detection**:
```typescript
const searchParams = useSearchParams()
const paymentReference = searchParams.get("reference")

// Show verification modal when reference detected
useEffect(() => {
  if (paymentReference) {
    setShowPaymentVerification(true)
  }
}, [paymentReference])
```

**Modal Integration**:
```typescript
<PaymentVerificationModal
  isOpen={showPaymentVerification}
  reference={paymentReference}
  onClose={() => {
    setShowPaymentVerification(false)
    window.history.replaceState({}, document.title, "/marketplace")
    
    // Refresh product details if open
    if (detailsModalOpen && selectedProduct) {
      setDetailsModalOpen(false)
      setTimeout(() => setDetailsModalOpen(true), 500)
    }
  }}
/>
```

**Features**:
- Detects payment reference from URL
- Opens verification modal automatically
- Cleans up URL after verification
- Refreshes product details to show updated purchase status

---

### 5. Payment Callback Page (`/app/marketplace/payment-callback/page.tsx`)

**Purpose**: Temporary redirect handler from Paystack

**Flow**:
```typescript
const reference = searchParams.get("reference")

useEffect(() => {
  if (reference) {
    router.push(`/marketplace?reference=${reference}`)
  } else {
    router.push("/marketplace")
  }
}, [reference, router])
```

**UI**: Loading message while redirecting

---

## Database Schema

### marketplace_purchases Table
```sql
CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'delivered', 'returned'
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### transactions Table (Existing)
```sql
-- Extended with marketplace support
ALTER TABLE transactions ADD COLUMN metadata JSONB DEFAULT '{}';
-- metadata contains: { productId, productTitle, sellerId, type: 'marketplace' }
```

---

## Error Handling & Recovery

### Scenario 1: Paystack Doesn't Redirect
**Problem**: User completes payment but Paystack doesn't redirect

**Solution**:
1. localStorage caches reference: `localStorage.setItem("paystack_reference", ref)`
2. Polling detects completion every 2 seconds
3. User manually clicks "Return to Marketplace" button

**Code**:
```typescript
// Polling fallback
useEffect(() => {
  if (!paymentReference) return
  const interval = setInterval(() => verifyPayment(), 2000)
  return () => clearInterval(interval)
}, [paymentReference])

// Manual button
<Button onClick={() => {
  window.location.href = `/marketplace/payment-callback?reference=${reference}`
}}>
  Return to Marketplace
</Button>
```

### Scenario 2: Verification Fails
**Solution**: "Try Again" button in verification modal

```typescript
{status === "error" && (
  <Button onClick={verifyPaymentNow}>Try Again</Button>
)}
```

### Scenario 3: Network Error During Payment
**Solution**: 
1. Reference stored in localStorage
2. User can refresh page
3. Payment status continues to be checked via polling

---

## Testing Checklist

- [ ] User clicks "Buy Product" button
- [ ] Payment modal opens with correct amount
- [ ] Paystack page loads on payment
- [ ] User completes payment on Paystack
- [ ] Callback redirects to marketplace with reference
- [ ] Payment verification modal auto-opens
- [ ] Payment verification succeeds
- [ ] Product details modal shows "✓ Paid" badge
- [ ] "Message Seller" button appears
- [ ] Auto-redirect happens after 2 seconds
- [ ] URL is cleaned up (no reference param)
- [ ] localStorage is cleared on success
- [ ] "Try Again" works if verification fails
- [ ] Manual button works if redirect fails
- [ ] Polling detects payment within 2-4 seconds
- [ ] Error messages are clear and helpful

---

## Paystack Integration Details

**Configuration Required**:
```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
```

**Payment Amount Format**: 
- Amounts stored in kobo (100 kobo = 1 NGN)
- Display as: `₦${amount / 100}`
- Example: 50000 kobo = ₦500

**Reference Format**:
- Auto-generated by Paystack
- Used for verification and tracking
- Stored in localStorage as fallback

---

## Success Metrics

1. ✅ Payment initiated successfully
2. ✅ Paystack page displays correctly
3. ✅ Payment verified after completion
4. ✅ marketplace_purchases record created
5. ✅ User sees "✓ Paid" badge on product
6. ✅ User can message seller
7. ✅ No payment gets stuck
8. ✅ All error scenarios have recovery paths

---

## Notes

- All monetary amounts are in kobo (divide by 100 for display)
- Currency support added (NGN, USD, etc.)
- Purchase status persists in database
- Payment references tracked for reconciliation
- Error messages provide clear guidance
- Mobile-responsive design maintained
