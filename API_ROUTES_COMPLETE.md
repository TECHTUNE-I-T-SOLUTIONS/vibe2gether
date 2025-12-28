# API Routes Complete Reference

## Authentication
All API routes require NextAuth session with `session.user.id`. Returns 401 if not authenticated.

---

## User APIs

### GET `/api/users/all`
**Purpose**: Fetch all users with filtering and pagination for explore feature

**Query Parameters**:
- `page` (number, default: 1) - Pagination page
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search by name/email
- `country` (string) - Filter by country
- `gender` (string) - Filter by gender (m/f/other)

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "display_name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "url",
      "followers_count": 10,
      "isFollowing": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### POST `/api/users/follow`
**Purpose**: Follow or unfollow a user

**Request Body**:
```json
{
  "userId": "target-user-id"
}
```

**Response**:
```json
{
  "success": true,
  "following": true,
  "message": "User followed"
}
```

---

## Verification & Premium APIs

### GET `/api/user/verification-status`
**Purpose**: Get user's verification status

**Response**:
```json
{
  "success": true,
  "verification": {
    "id": "uuid",
    "status": "pending|approved|rejected",
    "document_type": "id_card|passport",
    "submitted_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/user/submit-verification`
**Purpose**: Submit identity verification documents

**Request Body** (FormData):
```
- document_selfie: File
- document_id: File
- document_type: "id_card"|"passport"
```

**Response**:
```json
{
  "success": true,
  "verification": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### GET `/api/user/premium-status`
**Purpose**: Get user's active premium subscription status

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "plan": "basic|pro|elite",
    "status": "active|expired",
    "expiry_date": "2024-12-31T00:00:00Z"
  },
  "tier": {
    "name": "pro",
    "price": 9.99,
    "features": ["feature1", "feature2"]
  }
}
```

### GET `/api/premium/tiers`
**Purpose**: Get all available premium tiers

**Response**:
```json
{
  "success": true,
  "tiers": [
    {
      "id": "uuid",
      "name": "basic",
      "price": 4.99,
      "billing_cycle": "monthly",
      "features": ["feature1", "feature2"]
    }
  ]
}
```

---

## Matches APIs

### POST `/api/matches/like`
**Purpose**: Accept/like a match

**Request Body**:
```json
{
  "matchId": "match-id"
}
```

**Response**:
```json
{
  "success": true,
  "status": "active",
  "otherUserId": "user-id"
}
```

---

## Messaging APIs

### GET `/api/messaging/conversations`
**Purpose**: Get all user's message conversations

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "matchId": "uuid",
      "otherUser": {
        "id": "uuid",
        "display_name": "Jane",
        "profile_picture": "url"
      },
      "status": "active",
      "lastMessage": "Hey there!",
      "lastMessageTime": "2024-01-01T00:00:00Z",
      "unreadCount": 3
    }
  ],
  "total": 5
}
```

### POST `/api/messaging/send`
**Purpose**: Send a message to a matched user

**Request Body**:
```json
{
  "matchId": "match-id",
  "content": "Message content here"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "matchId": "uuid",
    "senderId": "uuid",
    "content": "Message content here",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Posts APIs

### GET `/api/posts/get-feed`
**Purpose**: Get feed posts with pagination

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response**:
```json
{
  "success": true,
  "posts": [
    {
      "id": "uuid",
      "content": "Post content",
      "likes_count": 5,
      "comments_count": 2,
      "isLiked": false,
      "isSaved": false
    }
  ]
}
```

### POST `/api/posts/like`
**Purpose**: Like or unlike a post

**Request Body**:
```json
{
  "postId": "post-id"
}
```

**Response**:
```json
{
  "success": true,
  "liked": true,
  "message": "Post liked"
}
```

### POST `/api/posts/save`
**Purpose**: Save or unsave a post

**Request Body**:
```json
{
  "postId": "post-id"
}
```

**Response**:
```json
{
  "success": true,
  "saved": true,
  "message": "Post saved successfully"
}
```

---

## Events APIs

### GET `/api/events/list`
**Purpose**: Get all events with filtering and pagination

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string) - Filter by event category
- `city` (string) - Filter by city
- `country` (string) - Filter by country
- `upcoming` (boolean) - Only upcoming events

**Response**:
```json
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "title": "Event Title",
      "description": "Event description",
      "event_date": "2024-06-01",
      "ticket_price": 25.00,
      "current_attendees": 15,
      "max_tickets": 100,
      "isRegistered": false,
      "users": {
        "id": "uuid",
        "display_name": "Event Creator"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET `/api/events/[eventId]`
**Purpose**: Get single event details

**Response**:
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "Event Title",
    "description": "Event description",
    "event_date": "2024-06-01",
    "event_time": "18:00",
    "location": "Address",
    "ticket_price": 25.00,
    "current_attendees": 15,
    "attendees": [
      {
        "id": "uuid",
        "display_name": "Attendee",
        "profile_picture": "url"
      }
    ],
    "isRegistered": false
  }
}
```

### POST `/api/events/register`
**Purpose**: Register/book an event

**Request Body**:
```json
{
  "eventId": "event-id"
}
```

**Response**:
```json
{
  "success": true,
  "registration": {
    "id": "uuid",
    "eventId": "uuid",
    "status": "registered",
    "registeredAt": "2024-01-01T00:00:00Z"
  },
  "message": "Registered for event"
}
```

---

## Marketplace APIs

### GET `/api/marketplace`
**Purpose**: Get all marketplace products with filtering

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `category` (string)
- `search` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `condition` (string) - new, like-new, good, fair

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "title": "Product Title",
      "description": "Description",
      "price": 99.99,
      "category": "electronics",
      "condition": "like-new",
      "image_urls": ["url1", "url2"],
      "is_available": true,
      "seller": {
        "id": "uuid",
        "display_name": "Seller Name"
      },
      "isSaved": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

### GET `/api/marketplace/[productId]`
**Purpose**: Get single product details

**Response**:
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "title": "Product Title",
    "description": "Description",
    "price": 99.99,
    "condition": "like-new",
    "image_urls": ["url1", "url2"],
    "delivery_instructions": "Instructions",
    "seller": {
      "id": "uuid",
      "display_name": "Seller Name",
      "followers_count": 50
    },
    "sellerOtherProducts": [
      {
        "id": "uuid",
        "title": "Other Product",
        "price": 49.99
      }
    ],
    "isSaved": false
  }
}
```

### POST `/api/marketplace/purchase`
**Purpose**: Purchase a product

**Request Body**:
```json
{
  "productId": "product-id",
  "paymentMethod": "stripe|paypal"
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "productId": "uuid",
    "amount": 99.99,
    "status": "pending",
    "transactionId": "uuid"
  },
  "message": "Payment processing. You will receive a ticket shortly."
}
```

### GET `/api/marketplace/ticket`
**Purpose**: Download purchase ticket

**Query Parameters**:
- `productId` (string)
- `transactionId` (string)

**Response**: Returns ticket file as text download

---

## Wallet APIs

### GET `/api/wallet`
**Purpose**: Get user's wallet info, balance, and transaction history

**Response**:
```json
{
  "success": true,
  "wallet": {
    "balance": {
      "coins": 1000,
      "coinsEarned": 5000,
      "coinsSpent": 4000
    },
    "transactions": [
      {
        "id": "uuid",
        "type": "purchase",
        "amount": 100,
        "status": "completed",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "referrals": {
      "total": 5,
      "earned": 3,
      "pending": 2,
      "list": [
        {
          "id": "uuid",
          "userId": "uuid",
          "userName": "John Doe",
          "amount": 100,
          "claimed": true,
          "date": "2024-01-01T00:00:00Z"
        }
      ]
    },
    "pending": {
      "total": 1,
      "transactions": [
        {
          "id": "uuid",
          "type": "premium_subscription",
          "amount": 9.99,
          "status": "pending",
          "date": "2024-01-01T00:00:00Z"
        }
      ]
    }
  }
}
```

---

## Error Responses

All API errors follow this format:

```json
{
  "error": "Error message"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `404`: Not found (resource doesn't exist)
- `500`: Internal server error

---

## Console Logging

All API routes include detailed logging with format: `[METHOD /api/endpoint] Message`

Examples:
```
[GET /api/users/all] Fetching users - page: 1, limit: 10
[POST /api/messaging/send] User abc123 sending message to match xyz789
[GET /api/events/[eventId]] Event loaded - Event Name, attendees: 25
```

---

## Features Completed

✅ User Discovery & Following
✅ Verification & Premium System
✅ Matching & Messages
✅ Posts (Feed, Like, Save)
✅ Events (List, Details, Register)
✅ Marketplace (List, Details, Purchase)
✅ Wallet & Referrals
✅ Authentication & Authorization

---

## Features in Development

⏳ Payment Processor Integration (Stripe/PayPal)
⏳ Event Ticket PDF Generation
⏳ Admin Notifications
⏳ Advanced Search & Filtering
⏳ Real-time Messaging (WebSocket)

---

## Testing Endpoints

You can test these endpoints using:

1. **Postman**: Import the API collection
2. **cURL**: `curl -H "Authorization: Bearer token" https://yoursite/api/endpoint`
3. **Browser Console**: 
```javascript
fetch('/api/users/all?page=1&limit=10')
  .then(r => r.json())
  .then(data => console.log(data))
```

---

## Database Fixes Applied

✅ `is_verified` default changed to `false`
✅ All users set to `is_verified = false`
✅ Followers/Following counts recalculated
✅ Referral bonus counts updated
✅ User preferences initialized
✅ Privacy settings initialized
✅ Security settings initialized
✅ Duplicate follows removed
✅ Coins balance synchronized

---

Generated: January 2024
