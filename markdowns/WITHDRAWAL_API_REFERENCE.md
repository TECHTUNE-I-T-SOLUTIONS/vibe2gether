# Withdrawal System API Reference

## User-Facing APIs

### Get Withdrawal Requests
Fetch all withdrawal requests for the authenticated user.

**Endpoint**: `GET /api/wallet/withdrawal-requests`

**Headers**:
- Authorization: Bearer token (via NextAuth session)

**Response**:
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 100,
      "requested_coins": 145000,
      "bank_code": "044",
      "bank_name": "Access Bank",
      "account_number": "0123456789",
      "account_name": "John Doe",
      "status": "pending",
      "notes": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized (not logged in)
- 500: Server error

---

## Admin APIs

### List All Withdrawal Requests
Fetch all withdrawal requests with user details (admin only).

**Endpoint**: `GET /api/admin/withdrawals`

**Headers**:
- Authorization: Bearer token (via NextAuth session)

**Requirements**:
- User must have role = "admin"

**Response**:
```json
{
  "success": true,
  "withdrawals": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 100,
      "requested_coins": 145000,
      "bank_code": "044",
      "bank_name": "Access Bank",
      "account_number": "0123456789",
      "account_name": "John Doe",
      "status": "pending",
      "notes": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "user": {
        "id": "uuid",
        "display_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized (not logged in)
- 403: Forbidden (not an admin)
- 500: Server error

---

### Update Withdrawal Request Status
Approve, reject, or mark withdrawal as settled (admin only).

**Endpoint**: `PATCH /api/admin/withdrawals/[id]`

**Headers**:
- Authorization: Bearer token (via NextAuth session)
- Content-Type: application/json

**Path Parameters**:
- `id`: Withdrawal request ID (UUID)

**Request Body**:
```json
{
  "status": "approved",
  "notes": "Processing payment"
}
```

**Valid Status Values**:
- `approved`: Approve the withdrawal request
- `rejected`: Reject the withdrawal request
- `settled`: Mark as settled (payout complete)
- `pending`: Revert to pending (optional)

**Response**:
```json
{
  "success": true,
  "withdrawal": {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 100,
    "requested_coins": 145000,
    "bank_code": "044",
    "bank_name": "Access Bank",
    "account_number": "0123456789",
    "account_name": "John Doe",
    "status": "approved",
    "notes": "Processing payment",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z",
    "user": {
      "id": "uuid",
      "display_name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Status Codes**:
- 200: Success
- 400: Invalid status value
- 401: Unauthorized (not logged in)
- 403: Forbidden (not an admin)
- 500: Server error

**Side Effects**:
- Updates withdrawal request status and timestamp
- Creates notification for user with status change message
- Notification title and message vary based on status:
  - Approved: "Withdrawal Approved - Your withdrawal request of $100 has been approved..."
  - Rejected: "Withdrawal Rejected - Your withdrawal request of $100 has been rejected..."
  - Settled: "Withdrawal Completed - Your withdrawal of $100 has been processed..."

---

## Related APIs

### Submit Withdrawal Request
(Already implemented)
**Endpoint**: `POST /api/wallet/withdrawal-request`

### Get Paystack Banks
**Endpoint**: `GET /api/payments/paystack/banks`

### Verify Bank Account
**Endpoint**: `POST /api/payments/paystack/verify-account`

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message here"
}
```

Common errors:
- `"Unauthorized"` - User not logged in
- `"Forbidden"` - User doesn't have required permissions
- `"Invalid status"` - Status value not in valid list
- `"Failed to fetch withdrawal requests"` - Database error
- `"Internal server error"` - Unexpected server error

---

## Withdrawal Request Status Flow

```
pending → approved → settled
      ↓
    rejected
```

- **pending**: Initial state when user submits request
- **approved**: Admin approves the request after review
- **settled**: Admin marks as complete after payout
- **rejected**: Admin rejects the request (terminal state)

---

## Data Type Reference

### Withdrawal Request Object
```typescript
{
  id: string;                    // UUID
  user_id: string;               // UUID
  amount: number;                // USD amount (e.g., 100.50)
  requested_coins: number;       // Coins converted (e.g., 145725)
  bank_code: string;             // Paystack bank code (e.g., "044")
  bank_name: string;             // Bank name (e.g., "Access Bank")
  account_number: string;        // Bank account number
  account_name: string;          // Verified account holder name
  status: "pending" | "approved" | "rejected" | "settled";
  notes?: string;                // Optional admin notes
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  user?: {
    id: string;                  // User ID
    display_name: string;        // User's display name
    email: string;               // User's email
  };
}
```

---

## Usage Examples

### JavaScript/TypeScript Client

```typescript
// Fetch user's withdrawal requests
async function fetchMyWithdrawals() {
  const response = await fetch('/api/wallet/withdrawal-requests');
  const data = await response.json();
  
  if (data.success) {
    console.log(data.requests);
  }
}

// Admin: Approve a withdrawal
async function approveWithdrawal(id: string, notes: string) {
  const response = await fetch(`/api/admin/withdrawals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'approved',
      notes: notes
    })
  });
  
  const data = await response.json();
  return data;
}

// Admin: Reject a withdrawal
async function rejectWithdrawal(id: string, notes: string) {
  const response = await fetch(`/api/admin/withdrawals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'rejected',
      notes: notes
    })
  });
  
  const data = await response.json();
  return data;
}

// Admin: Mark withdrawal as settled
async function settleWithdrawal(id: string, notes: string) {
  const response = await fetch(`/api/admin/withdrawals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'settled',
      notes: notes
    })
  });
  
  const data = await response.json();
  return data;
}
```

---

## Rate Limiting
Currently no rate limiting implemented. Consider adding:
- Limit withdrawal requests per user per day
- Limit admin actions per admin per hour
- Implement exponential backoff for retries

---

## Security Considerations

1. **Authentication**: All endpoints require NextAuth session
2. **Authorization**: Admin endpoints check user role
3. **Validation**: Status values are validated server-side
4. **Audit Trail**: All changes logged via updated_at timestamp
5. **User Isolation**: Users can only see their own withdrawal requests
6. **CSRF Protection**: Handled by NextAuth middleware

---

## Testing Endpoints

Use Postman/curl with the following:

```bash
# Get user's withdrawals
curl -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/wallet/withdrawal-requests

# Admin: Get all withdrawals
curl -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/admin/withdrawals

# Admin: Approve withdrawal
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","notes":"Processing"}' \
  https://yourdomain.com/api/admin/withdrawals/REQUEST_ID
```
