# Payment & Withdrawal System - Complete Implementation Guide

## Database Changes Applied
All changes have been compiled in: `DATABASE_COMPLETE_PAYMENT_SYSTEM.sql`

### Tables Created/Modified:
1. **withdraw_requests** - Track user withdrawal requests with bank details
2. **marketplace_message_payments** - Track payments for messaging sellers
3. **event_registrations** - Updated with payment fields (payment_status, transaction_id, amount_paid, etc.)
4. **events** - Updated with currency field (currency, is_paid, ticket_price_ngn, ticket_price_usd)

### Triggers & Functions Created:
1. **insert_notification_on_payment()** - Auto-creates notifications on transaction completion
2. **insert_admin_notification_on_withdrawal()** - Alerts admins of new withdrawal requests
3. **insert_notifications_on_marketplace_purchase()** - Notifications for buyer & seller
4. **insert_notifications_on_event_registration()** - Notifications for attendee & organizer
5. **insert_notifications_on_message_payment()** - Notifications for message access
6. **update_seller_wallet_on_product_purchase()** - Credits coins to seller
7. **update_organizer_wallet_on_event_registration()** - Credits coins to organizer

---

## API Endpoints

### 1. Withdraw Money System

#### Verify Bank Account (POST)
**Endpoint:** `/api/paystack/verify-bank`
```json
{
  "bankCode": "005", // Paystack bank code
  "accountNumber": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "accountName": "John Doe",
  "accountNumber": "1234567890",
  "bankCode": "005"
}
```

#### Create Withdrawal Request (POST)
**Endpoint:** `/api/withdraw/request`
```json
{
  "amount": 15,
  "currency": "USD",
  "bankCode": "005",
  "bankName": "GTBank",
  "accountNumber": "1234567890",
  "accountName": "John Doe",
  "accountType": "individual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "withdrawalRequest": {
    "id": "uuid",
    "amount": 15,
    "currency": "USD",
    "status": "pending",
    "requestedCoins": 7500
  }
}
```

**Validations:**
- Minimum withdrawal: $15 USD
- User must have enough coins (1 coin = $0.002 = 0.003 NGN)
- Bank account must be verified first

#### Get User's Withdrawal Requests (GET)
**Endpoint:** `/api/withdraw/request`

**Response:**
```json
{
  "success": true,
  "withdrawRequests": [
    {
      "id": "uuid",
      "amount": 15,
      "currency": "USD",
      "status": "pending|approved|rejected",
      "requested_coins": 7500,
      "created_at": "2024-12-31T10:00:00Z"
    }
  ]
}
```

#### Admin: Get All Withdrawal Requests (GET)
**Endpoint:** `/api/admin/withdraw-requests?status=pending`

**Response includes:** User details, bank info, current balance, requested amount

#### Admin: Approve/Reject Withdrawal (PATCH)
**Endpoint:** `/api/admin/withdraw-requests`
```json
{
  "withdrawalRequestId": "uuid",
  "action": "approve|reject",
  "notes": "Processed",
  "rejectionReason": "Account not verified"
}
```

---

### 2. Payment Status Checks

#### Check Payment Status (POST)
**Endpoint:** `/api/payment/check-status`

**For Product Purchase:**
```json
{
  "productId": "uuid",
  "checkType": "product"
}
```

**For Message Access:**
```json
{
  "productId": "uuid",
  "checkType": "message"
}
```

**For Event Registration:**
```json
{
  "productId": "eventId",
  "checkType": "event"
}
```

**Response:**
```json
{
  "success": true,
  "hasPaid": true|false,
  "purchaseId|messagePaymentId|registrationId": "uuid"
}
```

---

### 3. Event Payment Handling

#### Get Event Details with Currency Info (GET)
**Endpoint:** `/api/events/details?id=eventId`

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "Event Title",
    "ticket_price": 5000, // In original currency
    "currency": "NGN", // Stored currency
    "ticketPriceUSD": 3.45, // Converted to USD
    "ticketPriceNGN": 5000, // For display
    "isFree": false,
    "is_paid": true,
    "organizer": {
      "id": "uuid",
      "display_name": "Organizer Name"
    }
  }
}
```

#### Initialize Event Payment (POST)
**Endpoint:** `/api/events/initialize-payment`
```json
{
  "email": "user@example.com",
  "fullName": "User Name",
  "eventId": "uuid",
  "itemData": {
    "title": "Event Title"
  }
}
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "abc123def456",
  "amountInNGN": 5000,
  "amountInUSD": 3.45
}
```

---

### 4. Marketplace Message Payments

#### Create Message Payment (POST)
**Endpoint:** `/api/marketplace/initialize-payment`
```json
{
  "email": "buyer@example.com",
  "fullName": "Buyer Name",
  "productId": "uuid",
  "paymentType": "message",
  "amount": 10, // USD amount to message seller
  "itemData": {
    "title": "Product Title",
    "sellerId": "uuid"
  }
}
```

---

## Frontend Implementation

### Withdraw Modal Component
```typescript
interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  userBalance: number
}

// Key features:
// 1. Input bank details
// 2. Verify account with Paystack API
// 3. Show verified account name
// 4. Input amount (minimum $15)
// 5. Show coins equivalent
// 6. Submit withdrawal request
// 7. Show success/error message
```

### Payment Check on Page Load
```typescript
useEffect(() => {
  const checkPaymentStatus = async () => {
    const response = await fetch('/api/payment/check-status', {
      method: 'POST',
      body: JSON.stringify({
        productId: id,
        checkType: 'product' // or 'message' or 'event'
      })
    })
    const data = await response.json()
    setHasPaid(data.hasPaid)
  }
  checkPaymentStatus()
}, [id])
```

### Event Currency Display
```typescript
// When fetching event:
const eventRes = await fetch(`/api/events/details?id=${eventId}`)
const { event } = await eventRes.json()

// Display:
// - Price: {event.ticketPriceNGN.toLocaleString()} NGN
// - Or: ${event.ticketPriceUSD.toFixed(2)} USD
// - Convert to coins: event.ticketPriceUSD * 500
```

---

## Fixes Applied

### 1. Duplicate Coin Transactions ✅
**Problem:** Both webhook and verify endpoint were inserting coin_transactions records
**Fix:** Added check to see if record already exists before inserting
**Location:** 
- `app/api/webhooks/paystack/route.ts`
- `app/api/paystack/verify/route.ts`

### 2. Event Currency Display ✅
**Problem:** Events showing dollar amounts as naira
**Fix:** 
- Added currency field to events table
- Created `/api/events/details` endpoint to return proper currency conversions
- Updated initialize-payment to handle currency correctly

### 3. Payment Tracking ✅
**Problem:** No way to check if user already paid for product/event/message
**Fix:** Created `/api/payment/check-status` endpoint

### 4. Wallet Credits for Sellers/Organizers ✅
**Problem:** No automatic coin credits when someone buys product or registers for event
**Fix:** Added trigger functions to automatically:
- Add coins to seller wallet when product is purchased (10% of sale amount)
- Add coins to organizer wallet when event is registered (100% of ticket price)

---

## Database Execution

Run this SQL in Supabase:
```sql
-- Copy entire contents of: DATABASE_COMPLETE_PAYMENT_SYSTEM.sql
-- Execute in Supabase SQL Editor
```

---

## Testing Checklist

### Withdraw Functionality
- [ ] User can enter bank details
- [ ] Bank account verification works with Paystack
- [ ] Account name displays correctly
- [ ] Amount input validates minimum ($15)
- [ ] Coins calculation is correct
- [ ] Withdrawal request is created
- [ ] Admin sees request in dashboard
- [ ] Admin can approve/reject
- [ ] Coins are deducted on approval
- [ ] User receives notification

### Marketplace Purchases
- [ ] Payment check works on page load
- [ ] User cannot pay twice for same product
- [ ] Seller receives coin credit
- [ ] Notification sent to buyer & seller
- [ ] Seller can see who purchased

### Events
- [ ] Free events show "Register" button
- [ ] Paid events show correct price and currency
- [ ] Currency conversion is accurate
- [ ] Payment works for events
- [ ] Organizer receives coin credit
- [ ] Attendee can register
- [ ] Organizer can see registrations
- [ ] Refund logic works if needed

### Message Payments
- [ ] User must pay to message seller
- [ ] Payment status is checked on load
- [ ] User cannot message without payment
- [ ] Seller gets notification
- [ ] Message history is preserved

---

## Coin Conversion Rates
- 500 coins = 1 USD
- 1 USD = 1450 NGN
- Therefore: 1 coin = 0.002 USD = 2.9 NGN

---

## Admin Dashboard Features

### Withdrawal Requests Tab
- View all withdrawal requests (pending/approved/rejected)
- Filter by status
- View user details, bank info, amount
- Approve with notes or reject with reason
- Process payment (manual or via Paystack Transfers API)

### Sales/Registration Reports
- See who purchased products
- See who registered for events
- View payment details
- Contact information for follow-up

---

## Error Handling

### Common Errors
1. **Insufficient coins:** User doesn't have enough coins for withdrawal
2. **Invalid account:** Bank details don't verify with Paystack
3. **Duplicate payment:** User already paid for this product/event
4. **Currency mismatch:** Event currency doesn't match transaction currency
5. **Free event:** User trying to pay for free event

All errors return proper status codes and messages for frontend handling.

---

## Notes

- All times are stored in UTC
- Coin balances are checked before allowing any deductions
- Notifications are automatically created by triggers
- Admin notifications are sent to all admins
- Bank details are stored securely in database
- Payment references link transactions across systems
