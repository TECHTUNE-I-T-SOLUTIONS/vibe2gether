# Premium Paystack Integration - Technical Specifications

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌────────────────────┐          ┌──────────────────────┐       │
│  │ /premium           │          │ /dashboard/premium   │       │
│  │ (Redirect Page)    │ ──────→  │ (Main Flow)          │       │
│  └────────────────────┘          └──────────────────────┘       │
│                                           │                      │
│                                  ┌────────▼────────┐             │
│                                  │ Plan Selection  │             │
│                                  │ (3 Plans)       │             │
│                                  └────────┬────────┘             │
│                                           │                      │
│                                  ┌────────▼──────────┐           │
│                                  │ Upgrade Handler   │           │
│                                  │ (POST Request)    │           │
│                                  └────────┬──────────┘           │
└────────────────────────────────────────────┼──────────────────────┘
                                             │
┌────────────────────────────────────────────┼──────────────────────┐
│                    Backend API Layer                              │
│         ┌──────────────────────────────┬───────────────┐         │
│         │ /api/premium/subscribe       │ Handles:     │         │
│         │ (POST)                       │ - Plan Type  │         │
│         │                              │ - User Auth  │         │
│         │ Responsibilities:            │ - DB Updates │         │
│         │ 1. Validate user session     │ - Paystack   │         │
│         │ 2. Check plan validity       │   Init       │         │
│         │ 3. Create pending sub        │              │         │
│         │ 4. Create transaction        │              │         │
│         │ 5. Call Paystack API         │              │         │
│         │ 6. Return auth URL           │              │         │
│         └──────────────────────────────┴───────────────┘         │
│                                                                   │
│         ┌──────────────────────────────┬───────────────┐         │
│         │ /api/payments/verify         │ Handles:     │         │
│         │ (POST/GET)                   │ - Paystack   │         │
│         │                              │   Verify     │         │
│         │ Responsibilities:            │ - DB Updates │         │
│         │ 1. Get reference from req    │ - User Prof  │         │
│         │ 2. Call Paystack verify      │ - Notif      │         │
│         │ 3. Update transaction        │              │         │
│         │ 4. Activate subscription     │              │         │
│         │ 5. Update user profile       │              │         │
│         │ 6. Create notification       │              │         │
│         └──────────────────────────────┴───────────────┘         │
└────────────────────────────────────────────┬──────────────────────┘
                                             │
┌────────────────────────────────────────────┼──────────────────────┐
│                  External Services Layer                          │
│         ┌──────────────────────────────┐                         │
│         │ Paystack Payment Gateway     │                         │
│         │ - Initialize Transaction     │                         │
│         │ - Verify Transaction         │                         │
│         │ - Handle User Redirect       │                         │
│         └──────────────────────────────┘                         │
│                                                                   │
│         ┌──────────────────────────────┐                         │
│         │ Supabase                     │                         │
│         │ - PostgreSQL Database        │                         │
│         │ - Real-time Subscriptions    │                         │
│         │ - Authentication             │                         │
│         └──────────────────────────────┘                         │
└────────────────────────────────────────────────────────────────────┘
```

## Request/Response Specifications

### 1. Premium Subscribe Request

**Endpoint**: `POST /api/premium/subscribe`

**Authentication**: Required (NextAuth session)

**Request Body**:
```typescript
interface SubscribeRequest {
  tierName: "Monthly" | "6 Months" | "Yearly"
}
```

**Response Success (200)**:
```typescript
interface SubscribeResponse {
  success: true
  authorization_url: string  // Paystack checkout URL
  access_code: string        // Paystack access code
  reference: string          // Unique Paystack reference
  subscriptionId: string     // Subscription UUID
  transactionId: string      // Transaction UUID
}
```

**Response Error (400)**:
```typescript
interface ErrorResponse {
  error: string
  success: false
}
```

**Error Cases**:
- 401: Not authenticated
- 400: Invalid/missing tierName
- 404: User email not found
- 500: Server error

---

### 2. Payment Verification Request

**Endpoint**: `POST /api/payments/verify`

**Authentication**: Not required (but reference must be valid)

**Request Body**:
```typescript
interface VerifyRequest {
  reference: string  // Paystack reference ID
}
```

**Response Success (200)**:
```typescript
interface VerifyResponse {
  success: true
  status: "completed" | "failed"
  reference: string
  data: {
    status: "completed" | "failed"
    transactionId: string
    subscriptionId?: string
    message: string
  }
}
```

**Response Error (400)**:
```typescript
interface ErrorResponse {
  error: string
  success: false
}
```

---

## Database Schema Specifications

### premium_subscriptions Table

```sql
CREATE TABLE premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('Monthly', '6 Months', 'Yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  expiry_date TIMESTAMP NOT NULL,
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE(user_id, status) FILTER (WHERE status = 'active'),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date)
);
```

### users Table Modifications

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan TEXT CHECK (premium_plan IN ('Monthly', '6 Months', 'Yearly'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_activated_at TIMESTAMP;

CREATE INDEX idx_is_premium ON users(is_premium);
```

### transactions Table (Enhanced)

```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Example metadata structure for premium subscription
/*
{
  "planName": "Monthly",
  "subscriptionId": "sub-uuid",
  "reference": "1234567-abc",
  "paystack_payment_id": 123456789,
  "paid_at": "2024-12-28T10:29:00Z"
}
*/
```

### notifications Table (Enhanced)

```sql
-- New notification types
INSERT INTO notification_types (type, description) VALUES
('premium_activated', 'Premium subscription activated'),
('premium_renewed', 'Premium subscription renewed'),
('premium_expiring', 'Premium subscription expiring soon'),
('premium_expired', 'Premium subscription expired');
```

---

## State Management Specifications

### Frontend State (Dashboard Premium Page)

```typescript
// Component State
const [subscription, setSubscription] = useState<PremiumSubscription | null>(null)
const [loadingData, setLoadingData] = useState<boolean>(true)
const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
const [processing, setProcessing] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState<string | null>(null)

// Router & URL State
const router = useRouter()
const searchParams = useSearchParams()

// Data Fetching
const supabase = createClient()

// User Info
const { user, loading: userLoading, refetch: refetchUser } = useUserProfile()

// Hooks
useEffect(() => {
  if (user?.id) {
    fetchSubscription()
    verifyPaymentIfCallback()
  }
}, [user?.id, searchParams])
```

---

## Payment Flow State Transitions

```
User State Progression:
┌─────────────────┐
│  NO SUBSCRIPTION│
└────────┬────────┘
         │ Click Upgrade
         ▼
┌─────────────────────────┐
│ LOADING (processing=T)  │
│ API: /premium/subscribe │
└────────┬────────────────┘
         │ Get auth_url
         ▼
┌──────────────────────┐
│ PAYSTACK CHECKOUT    │
│ (External)           │
└────────┬─────────────┘
         │ User completes
         ▼
┌────────────────────────────┐
│ VERIFYING (processing=T)   │
│ API: /payments/verify      │
└────────┬───────────────────┘
         │
         ├─ Success ──→ ┌──────────────┐
         │              │ ACTIVE       │
         │              │ subscription │
         │              └──────────────┘
         │
         └─ Failure ──→ ┌──────────────┐
                        │ ERROR        │
                        │ (Can retry)  │
                        └──────────────┘
```

---

## Paystack API Integration

### Initialize Transaction

**Endpoint**: `POST https://api.paystack.co/transaction/initialize`

**Headers**:
```
Authorization: Bearer {PAYSTACK_SECRET_KEY}
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "amount": 1499,
  "reference": "1234567-abc123",
  "metadata": {
    "userId": "user-uuid",
    "planName": "Monthly",
    "subscriptionId": "sub-uuid",
    "type": "premium_subscription"
  },
  "callback_url": "https://app.com/dashboard/premium"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "1234567-abc123"
  }
}
```

---

### Verify Transaction

**Endpoint**: `GET https://api.paystack.co/transaction/verify/{reference}`

**Headers**:
```
Authorization: Bearer {PAYSTACK_SECRET_KEY}
```

**Response Success**:
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "id": 123456789,
    "reference": "1234567-abc123",
    "amount": 1499,
    "paid_at": "2024-12-28T10:29:00.000Z",
    "customer": {
      "id": 987654321,
      "email": "user@example.com"
    },
    "status": "success"
  }
}
```

---

## Error Handling Specifications

### Frontend Error Handling

```typescript
// Error types and messages
const ERRORS = {
  NOT_AUTHENTICATED: "You must be logged in to upgrade",
  INVALID_PLAN: "Invalid plan selected",
  PAYMENT_INIT_FAILED: "Failed to initiate payment",
  NO_AUTH_URL: "Failed to get payment authorization URL",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  PAYMENT_NOT_FOUND: "Payment not found",
  NETWORK_ERROR: "Network error. Please check your connection",
  UNKNOWN: "An unexpected error occurred"
}

// Recovery strategies
- Auto-retry on network timeout
- Allow manual verification via URL parameter
- Provide transaction ID for support
- Show clear error messages to user
```

### Backend Error Handling

```typescript
// Error logging
console.log("[POST /api/premium/subscribe] User ${userId} subscribing to ${tierName}")
console.error("[POST /api/premium/subscribe] Error creating subscription:", error)

// Error responses with HTTP status codes
401: Not authenticated
400: Invalid request (missing fields, validation failure)
404: Not found (user, transaction, etc)
500: Server error (unexpected exceptions)

// Error details in response
{
  error: "Human-readable error message",
  success: false,
  details?: "Technical details for debugging" // Only in dev
}
```

---

## Security Specifications

### Authentication & Authorization

```typescript
// All endpoints require NextAuth session
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// User ID extracted from session
const userId = session.user.id

// All data operations scoped to authenticated user
.eq("user_id", userId)
```

### Data Validation

```typescript
// Plan validation
const VALID_PLANS = ["Monthly", "6 Months", "Yearly"]
if (!VALID_PLANS.includes(tierName)) {
  return error
}

// Price integrity (hardcoded on backend, not from client)
const PLAN_PRICES = {
  "Monthly": 1499,
  "6 Months": 7999,
  "Yearly": 14999
}

// Reference validation
if (!reference || typeof reference !== "string") {
  return error
}
```

### Payment Security

```typescript
// Paystack signature verification (for webhooks)
const hash = crypto
  .createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(body))
  .digest("hex")

if (hash !== signature) {
  // Reject webhook
}

// No sensitive data in metadata
✅ Include: userId, planName, subscriptionId, reference
❌ Exclude: Card numbers, passwords, API keys
```

---

## Performance Specifications

### Database Query Optimization

```typescript
// Indexed queries
.eq("user_id", userId)        // Fast with index
.eq("status", "active")       // Fast with index
.single()                      // Implicit limit 1

// Avoid N+1 queries
.select("*")  // Single query, not multiple

// Connection pooling
createClient() // Reuses connection pool
```

### Response Times

```
Target Response Times:
- /api/premium/subscribe: < 2 seconds
- /api/payments/verify: < 3 seconds
- Paystack API calls: < 5 seconds

Optimization strategies:
- Database indexes on foreign keys
- Parallel API calls where possible
- Caching user data locally
- Timeout after 10 seconds with user notification
```

---

## Monitoring & Logging

### Key Metrics to Monitor

```
1. Payment Success Rate
   - Successful / Total payments
   - Target: > 98%

2. Payment Verification Rate
   - Verified / Completed payments
   - Target: 100%

3. Subscription Activation Rate
   - Activated / Verified
   - Target: 100%

4. Error Rates
   - API errors / Total requests
   - Target: < 1%

5. Response Times
   - P50, P95, P99 latency
   - Alert if P95 > 5 seconds
```

### Logging Format

```
[CONTEXT] [TIMESTAMP] [LEVEL] Message

Examples:
[POST /api/premium/subscribe] User user-123 subscribing to Monthly
[Verify Payment] Activating premium subscription successfully
[Error] Failed to update user profile: column not found
```

---

## Migration Checklist

- [ ] Add premium_subscriptions table
- [ ] Add is_premium, premium_plan, premium_activated_at to users
- [ ] Add payment_method, metadata to transactions
- [ ] Add notification types
- [ ] Create indexes
- [ ] Update environment variables
- [ ] Deploy backend API changes
- [ ] Deploy frontend changes
- [ ] Test payment flow end-to-end
- [ ] Monitor logs for errors
- [ ] Create admin dashboard for management
- [ ] Document support procedures

---

**Document Version**: 1.0
**Last Updated**: December 28, 2024
**Status**: ✅ Production Ready

