# Coin Features Implementation Guide

## 1. Withdrawal Settlement Logic

### Overview
When an admin settles a withdrawal request, the system automatically deducts the equivalent coins from the user's wallet and records the transaction.

### Implementation Details

**File:** `app/api/admin/withdrawals/[id]/route.ts`

#### Features:
- ✅ Deducts coins from user wallet when withdrawal status is set to "settled"
- ✅ Records coin transaction in `coin_transactions` table with type `withdrawal_settled`
- ✅ Maintains transaction audit trail with reference to withdrawal request
- ✅ Sends notification to user with updated balance info
- ✅ Handles rollback if any step fails

#### How It Works:
1. Admin sets withdrawal request status to "settled"
2. System fetches withdrawal request details including `requested_coins`
3. System gets user's current `coins_balance`
4. Coins are deducted: `new_balance = current_balance - requested_coins`
5. User's `coins_balance` is updated in database
6. Transaction record is created in `coin_transactions` table
7. User receives notification with transaction details

#### API Endpoint:
```
PATCH /api/admin/withdrawals/{withdrawal_id}

Request Body:
{
  "status": "settled",
  "notes": "Payment sent via bank transfer",
  "processed_by": "admin_id_uuid"
}

Response:
{
  "success": true,
  "withdrawal": {
    "id": "...",
    "user_id": "...",
    "amount": 50,
    "requested_coins": 72500,
    "status": "settled",
    "processed_at": "2024-01-31T10:00:00Z"
  }
}
```

#### Database Changes:
- **users table:** `coins_balance` is decremented
- **coin_transactions table:** New entry with:
  - `transaction_type`: "withdrawal_settled"
  - `amount`: negative (coins deducted)
  - `reference_type`: "withdrawal_request"
  - `reference_id`: withdrawal_request_id

---

## 2. Coin Transfer Feature

### Overview
Users can now transfer coins to other users as a gift. The system deducts coins from sender and credits to recipient, with full transaction tracking.

### Implementation Details

**File:** `app/api/wallet/transfer-coins/route.ts`

#### Features:
- ✅ User-to-user coin transfers
- ✅ Full transaction validation and error handling
- ✅ Automatic balance updates for both parties
- ✅ Comprehensive audit trail in `coin_transactions` table
- ✅ Notifications sent to recipient
- ✅ Rollback capability if any step fails
- ✅ Prevents self-transfers
- ✅ Minimum 1 coin transfer

#### How It Works:
1. User initiates transfer with recipient ID and coin amount
2. System validates:
   - User is authenticated
   - Recipient exists
   - Sender has sufficient balance
   - Transfer amount is valid (> 0)
   - Sender ≠ Recipient
3. Sender's balance is decremented
4. Recipient's balance is incremented
5. Two transaction records are created:
   - One for sender (type: "transfer_sent")
   - One for recipient (type: "transfer_received")
6. Notification sent to recipient
7. If any step fails, previous steps are rolled back

#### API Endpoint:
```
POST /api/wallet/transfer-coins

Request Headers:
Authorization: Bearer {session_token}

Request Body:
{
  "recipientId": "uuid",
  "coins": 100,
  "message": "Gift for completing milestone"  // optional
}

Response:
{
  "success": true,
  "message": "Transfer completed successfully",
  "transfer": {
    "id": "transaction_id",
    "sender_id": "sender_uuid",
    "recipient_id": "recipient_uuid",
    "coins": 100,
    "sender_new_balance": 450,
    "recipient_new_balance": 550,
    "timestamp": "2024-01-31T10:00:00Z"
  }
}
```

#### Error Handling:
```
Error Cases:
1. "Unauthorized" (401) - User not authenticated
2. "Missing required fields" (400) - recipientId or coins not provided
3. "Coins must be a positive number" (400) - Invalid amount
4. "Minimum transfer is 1 coin" (400) - Amount too low
5. "You cannot transfer coins to yourself" (400) - Self-transfer attempted
6. "Failed to fetch sender balance" (500) - Database error
7. "Insufficient balance. You have X coins." (400) - Not enough coins
8. "Recipient not found" (404) - Invalid recipient ID
9. "Failed to process transfer" (500) - Balance update failed
10. "Failed to record transaction" (500) - Transaction record creation failed
```

#### Database Changes:
- **users table:**
  - Sender: `coins_balance` decremented
  - Recipient: `coins_balance` incremented

- **coin_transactions table:** Two entries created:
  1. Sender transaction:
     - `transaction_type`: "transfer_sent"
     - `amount`: negative (coins sent)
     - `reference_type`: "user_transfer"
     - `reference_id`: recipient_id
  
  2. Recipient transaction:
     - `transaction_type`: "transfer_received"
     - `amount`: positive (coins received)
     - `reference_type`: "user_transfer"
     - `reference_id`: sender_id

- **notifications table:**
  - Type: "coin_transfer"
  - Sent to recipient with sender info

---

## Testing Checklist

### Withdrawal Settlement Tests:
- [ ] Admin can settle withdrawal and coins are deducted
- [ ] Coin transaction is recorded correctly
- [ ] User receives notification with correct details
- [ ] Balance updates reflect accurately
- [ ] If admin rejects withdrawal, coins remain unchanged
- [ ] Rollback occurs if any step fails
- [ ] Transaction history shows withdrawal settlement

### Coin Transfer Tests:
- [ ] User can transfer coins to another user
- [ ] Sender balance decreases by transfer amount
- [ ] Recipient balance increases by transfer amount
- [ ] Both transaction records are created
- [ ] Recipient receives notification
- [ ] Cannot transfer to self (error)
- [ ] Cannot transfer more than available (error)
- [ ] Cannot transfer 0 or negative coins (error)
- [ ] Transaction history shows both sides correctly
- [ ] Optional message is included in transaction
- [ ] Rollback works if any step fails

---

## Usage Examples

### Admin Settling Withdrawal:
```bash
curl -X PATCH http://localhost:3000/api/admin/withdrawals/withdrawal-id-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=jwt_token" \
  -d '{
    "status": "settled",
    "notes": "Payment sent",
    "processed_by": "admin-uuid"
  }'
```

### User Transferring Coins:
```bash
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "user-uuid-123",
    "coins": 50,
    "message": "Great work!"
  }'
```

---

## Security Considerations

1. **Authentication:** Both endpoints require valid authentication
2. **Authorization:** Admin endpoint requires JWT token with admin rights
3. **Validation:** All inputs are validated before processing
4. **Transaction Safety:** Database operations are atomic with rollback capability
5. **Audit Trail:** All transactions are recorded with user references
6. **Balance Integrity:** Balances are updated in controlled manner
7. **Notification Privacy:** User info is limited in notifications

---

## Future Enhancements

- [ ] Rate limiting on coin transfers
- [ ] Daily transfer limits
- [ ] Batch transfers
- [ ] Transfer scheduling
- [ ] Coin transfer history view for users
- [ ] Analytics dashboard for admins
- [ ] Export transaction reports
- [ ] Coin transfer fees (if applicable)
- [ ] Recurring transfers
- [ ] Transfer templates
