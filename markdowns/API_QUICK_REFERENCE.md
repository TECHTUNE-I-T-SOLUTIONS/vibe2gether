# API Endpoints Quick Reference

## 🚀 Quick Access Guide

All endpoints require authentication (NextAuth session) unless specified.

---

## Users & Social

### Explore Users
```
GET /api/users/all?page=1&limit=10&search=john&country=USA&gender=m
```
Returns: List of users with following status

### Follow/Unfollow
```
POST /api/users/follow
Body: { "userId": "target-user-id" }
```
Returns: { success, following: boolean }

---

## Verification & Premium

### Check Verification Status
```
GET /api/user/verification-status
```
Returns: { success, verification: { id, status, document_type, submitted_at } }

### Submit Verification (FormData)
```
POST /api/user/submit-verification
Body: FormData with document_selfie, document_id, document_type
```
Returns: { success, verification: { id, status } }

### Check Premium Status
```
GET /api/user/premium-status
```
Returns: { success, subscription, tier }

### Get Premium Tiers
```
GET /api/premium/tiers
```
Returns: { success, tiers: [] }

---

## Messaging

### Get Conversations
```
GET /api/messaging/conversations?page=1&limit=10
```
Returns: { success, conversations: [], total }

### Send Message
```
POST /api/messaging/send
Body: { "matchId": "match-id", "content": "message text" }
```
Returns: { success, message: { id, matchId, senderId, content, createdAt } }

---

## Matches

### Like/Accept Match
```
POST /api/matches/like
Body: { "matchId": "match-id" }
```
Returns: { success, status: "active", otherUserId }

---

## Events

### List Events
```
GET /api/events/list?page=1&limit=10&category=music&city=NYC&upcoming=true
```
Returns: { success, events: [], pagination }

### Get Event Details
```
GET /api/events/[eventId]
```
Returns: { success, event: { ...details, isRegistered, attendees } }

### Register for Event
```
POST /api/events/register
Body: { "eventId": "event-id" }
```
Returns: { success, registration: { id, eventId, status, registeredAt } }

---

## Marketplace

### Browse Products
```
GET /api/marketplace?page=1&limit=12&search=phone&minPrice=100&maxPrice=500&condition=like-new
```
Returns: { success, products: [], pagination }

### Get Product Details
```
GET /api/marketplace/[productId]
```
Returns: { success, product: { ...details, seller, sellerOtherProducts, isSaved } }

### Purchase Product
```
POST /api/marketplace/purchase
Body: { "productId": "product-id", "paymentMethod": "stripe" }
```
Returns: { success, transaction: { id, productId, amount, status } }

### Download Purchase Ticket
```
GET /api/marketplace/ticket?productId=id&transactionId=id
```
Returns: Ticket file as text download

---

## Posts & Engagement

### Get Feed
```
GET /api/posts/get-feed?page=1&limit=10
```
Returns: { success, posts: [] }

### Like Post
```
POST /api/posts/like
Body: { "postId": "post-id" }
```
Returns: { success, liked: boolean }

### Save Post
```
POST /api/posts/save
Body: { "postId": "post-id" }
```
Returns: { success, saved: boolean }

---

## Wallet

### Get Wallet Info
```
GET /api/wallet
```
Returns: { success, wallet: { balance, transactions, referrals, pending } }

---

## Testing Commands

### cURL Examples

```bash
# Test user list
curl -X GET "http://localhost:3000/api/users/all?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test verification status
curl -X GET "http://localhost:3000/api/user/verification-status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test send message
curl -X POST "http://localhost:3000/api/messaging/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"matchId":"match-id","content":"Hello!"}'
```

### JavaScript Examples

```javascript
// Fetch users
async function getUsers() {
  const res = await fetch('/api/users/all?page=1&limit=10')
  const data = await res.json()
  console.log(data)
}

// Send message
async function sendMessage(matchId, content) {
  const res = await fetch('/api/messaging/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, content })
  })
  const data = await res.json()
  console.log(data)
}

// Get wallet
async function getWallet() {
  const res = await fetch('/api/wallet')
  const data = await res.json()
  console.log(data)
}
```

---

## Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | `{ success: true, data: {...} }` |
| 400 | Bad Request | Missing required parameters |
| 401 | Unauthorized | Not authenticated |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Common Patterns

### Pagination
```
GET /api/endpoint?page=1&limit=10

Returns:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

### Filtering
```
GET /api/endpoint?search=query&filter=value&sort=field

Parameters vary by endpoint
```

### Toggle Operations
```
POST /api/endpoint/toggle
Body: { "id": "item-id" }

Returns: { success: true, active: boolean }
```

---

## Debugging

### Console Logging Format
All API routes log with pattern: `[METHOD /api/endpoint] message`

### View Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[GET...` or `[POST...` messages
4. Each shows operation flow

### Test in Console
```javascript
// Simple fetch test
fetch('/api/users/all')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## Environment Variables Required

```
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment (Optional - for payment integration)
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your-public-key
```

---

## Rate Limiting

**Recommended Implementation**:
- 100 requests per minute per user
- 1000 requests per minute per IP
- Slower endpoints (search, export): 10 requests per minute

**Status**: Not yet implemented - add as needed

---

## Caching Strategy

**Recommended**:
- User list: Cache 5 minutes
- Product list: Cache 10 minutes
- Event list: Cache 5 minutes
- User profile: Cache 10 minutes

**Status**: Not yet implemented - add as needed

---

## Webhooks (Payment Processor)

**Stripe Webhook Endpoint** (to be created):
```
POST /api/webhooks/stripe
```

**Event Handlers**:
- `payment_intent.succeeded` - Update transaction status
- `payment_intent.payment_failed` - Handle failed payments
- `subscription.updated` - Update subscription status

---

## File Upload Endpoints

### Upload Profile Picture
```
POST /api/upload
Body: FormData with file
```

### Upload Verification Documents
```
POST /api/user/submit-verification
Body: FormData with document_selfie, document_id
```

### Upload Product Images
```
POST /api/upload
Body: FormData with files
```

---

## Batch Operations (Future)

**Planned but not yet implemented**:
```
POST /api/batch
Body: { operations: [...] }
```

---

## GraphQL (Future Alternative)

**Planned but not yet implemented**:
```
POST /api/graphql
Body: { query: "...", variables: {} }
```

---

## Documentation Links

- **Full API Reference**: `API_ROUTES_COMPLETE.md`
- **Implementation Guide**: `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- **UI Components**: `UI_COMPONENTS_IMPLEMENTATION_GUIDE.md`
- **Database Fixes**: `FIX_DATABASE_ISSUES.sql`

---

## Status Summary

✅ All major endpoints operational
✅ Authentication working
✅ Error handling in place
✅ Logging enabled
⏳ Payment integration (TODO)
⏳ Rate limiting (TODO)
⏳ Caching (TODO)
⏳ Webhooks (TODO)

---

**Last Updated**: January 2024
**API Version**: 1.0
**Status**: Production Ready
