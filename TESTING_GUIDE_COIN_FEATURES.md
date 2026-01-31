# Coin Features Testing Guide

## Prerequisites
- User authentication with valid session
- Admin authentication with JWT token
- Access to Supabase/PostgreSQL database
- Postman, curl, or similar API testing tool

---

## 1. WITHDRAWAL SETTLEMENT TESTING

### Test Case 1: Successful Withdrawal Settlement

**Setup:**
1. Create a withdrawal request with status "pending"
2. Note the `requested_coins` and `user_id`
3. Record the user's current `coins_balance`

**Test Steps:**
```bash
# Step 1: Check user's initial balance
SELECT coins_balance FROM users WHERE id = 'user-id-uuid';
# Expected: e.g., 100000

# Step 2: Admin settles the withdrawal
curl -X PATCH http://localhost:3000/api/admin/withdrawals/withdrawal-id-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=your_jwt_token" \
  -d '{
    "status": "settled",
    "notes": "Payment sent via bank transfer",
    "processed_by": "admin-uuid"
  }'

# Expected Response:
{
  "success": true,
  "withdrawal": {
    "id": "withdrawal-id",
    "user_id": "user-id",
    "amount": 50,
    "requested_coins": 72500,
    "status": "settled",
    "processed_at": "2024-01-31T10:00:00Z"
  }
}

# Step 3: Verify coins were deducted
SELECT coins_balance FROM users WHERE id = 'user-id-uuid';
# Expected: 100000 - 72500 = 27500

# Step 4: Verify transaction was recorded
SELECT * FROM coin_transactions 
WHERE user_id = 'user-id-uuid' 
AND transaction_type = 'withdrawal_settled' 
ORDER BY created_at DESC LIMIT 1;

# Expected:
{
  "id": "transaction-id",
  "user_id": "user-id",
  "amount": -72500,
  "transaction_type": "withdrawal_settled",
  "description": "Withdrawal settlement - $50 USD",
  "reference_id": "withdrawal-id",
  "reference_type": "withdrawal_request",
  "balance_after": 27500,
  "created_at": "2024-01-31T10:00:00Z"
}

# Step 5: Verify notification was sent
SELECT * FROM notifications 
WHERE user_id = 'user-id-uuid' 
AND type = 'withdrawal' 
ORDER BY created_at DESC LIMIT 1;

# Expected notification with title "Withdrawal Completed"
```

**Assertions:**
- ✅ `coins_balance` decreased by `requested_coins`
- ✅ Transaction record created with type "withdrawal_settled"
- ✅ Transaction amount is negative
- ✅ `balance_after` matches new user balance
- ✅ Reference fields point to withdrawal request
- ✅ Notification created with "Withdrawal Completed" title
- ✅ Notification includes coin deduction info

---

### Test Case 2: Withdrawal Rejection (No Coin Deduction)

**Test Steps:**
```bash
# Step 1: Record initial balance
SELECT coins_balance FROM users WHERE id = 'user-id-uuid';
# Expected: e.g., 100000

# Step 2: Reject the withdrawal
curl -X PATCH http://localhost:3000/api/admin/withdrawals/withdrawal-id-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=your_jwt_token" \
  -d '{
    "status": "rejected",
    "notes": "Account verification failed"
  }'

# Expected Response: success: true, status: rejected

# Step 3: Verify balance remained unchanged
SELECT coins_balance FROM users WHERE id = 'user-id-uuid';
# Expected: 100000 (SAME as before)

# Step 4: Verify NO withdrawal_settled transaction
SELECT * FROM coin_transactions 
WHERE user_id = 'user-id-uuid' 
AND transaction_type = 'withdrawal_settled';
# Expected: Empty result set

# Step 5: Verify rejection notification
SELECT * FROM notifications 
WHERE user_id = 'user-id-uuid' 
AND type = 'withdrawal' 
ORDER BY created_at DESC LIMIT 1;
# Expected: title = "Withdrawal Rejected"
```

**Assertions:**
- ✅ Coins balance NOT changed
- ✅ No transaction record created
- ✅ Notification sent with rejection message

---

### Test Case 3: Insufficient Balance (Edge Case)

**Scenario:** User's current balance is less than requested_coins

**Expected Behavior:**
The withdrawal settlement should still proceed (coins were already reserved at request time).
However, the new balance will become negative if user spent coins after withdrawal request.

**Mitigation:** This is why `user_coin_balance_at_request` is stored separately.

---

## 2. COIN TRANSFER TESTING

### Test Case 1: Successful Coin Transfer

**Setup:**
1. User A (Sender): 500 coins
2. User B (Recipient): 200 coins
3. Both users should exist

**Test Steps:**
```bash
# Step 1: Record initial balances
SELECT id, display_name, coins_balance FROM users 
WHERE id IN ('sender-uuid', 'recipient-uuid');
# Expected: Sender: 500, Recipient: 200

# Step 2: Sender initiates transfer
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_session_token" \
  -d '{
    "recipientId": "recipient-uuid",
    "coins": 100,
    "message": "Great achievement!"
  }'

# Expected Response:
{
  "success": true,
  "message": "Transfer completed successfully",
  "transfer": {
    "sender_id": "sender-uuid",
    "recipient_id": "recipient-uuid",
    "coins": 100,
    "sender_new_balance": 400,
    "recipient_new_balance": 300,
    "timestamp": "2024-01-31T10:00:00Z"
  }
}

# Step 3: Verify sender balance
SELECT coins_balance FROM users WHERE id = 'sender-uuid';
# Expected: 400

# Step 4: Verify recipient balance
SELECT coins_balance FROM users WHERE id = 'recipient-uuid';
# Expected: 300

# Step 5: Verify sender transaction
SELECT * FROM coin_transactions 
WHERE user_id = 'sender-uuid' 
AND transaction_type = 'transfer_sent' 
ORDER BY created_at DESC LIMIT 1;

# Expected:
{
  "user_id": "sender-uuid",
  "amount": -100,
  "transaction_type": "transfer_sent",
  "description": "Transferred 100 coins to User B - Great achievement!",
  "reference_id": "recipient-uuid",
  "reference_type": "user_transfer",
  "balance_after": 400
}

# Step 6: Verify recipient transaction
SELECT * FROM coin_transactions 
WHERE user_id = 'recipient-uuid' 
AND transaction_type = 'transfer_received' 
ORDER BY created_at DESC LIMIT 1;

# Expected:
{
  "user_id": "recipient-uuid",
  "amount": 100,
  "transaction_type": "transfer_received",
  "description": "Received 100 coins from Sender - Great achievement!",
  "reference_id": "sender-uuid",
  "reference_type": "user_transfer",
  "balance_after": 300
}

# Step 7: Verify recipient notification
SELECT * FROM notifications 
WHERE user_id = 'recipient-uuid' 
AND type = 'coin_transfer' 
ORDER BY created_at DESC LIMIT 1;

# Expected:
{
  "type": "coin_transfer",
  "title": "Coins Received",
  "message": "You received 100 coins from [Sender Name]! Message: Great achievement!",
  "actor_id": "sender-uuid",
  "is_read": false
}
```

**Assertions:**
- ✅ Sender balance: 500 → 400
- ✅ Recipient balance: 200 → 300
- ✅ Sender transaction created with type "transfer_sent", amount -100
- ✅ Recipient transaction created with type "transfer_received", amount 100
- ✅ Both transactions have correct `balance_after`
- ✅ Reference IDs point to each other
- ✅ Notification sent to recipient with correct amount and message
- ✅ Actor ID in notification is sender's ID

---

### Test Case 2: Self-Transfer Prevention

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "same-user-uuid",
    "coins": 100
  }'

# Expected Response (400):
{
  "error": "You cannot transfer coins to yourself"
}
```

**Assertions:**
- ✅ Transfer rejected
- ✅ Balances unchanged
- ✅ No transaction created

---

### Test Case 3: Insufficient Balance

**Setup:**
- Sender has 50 coins
- Attempts to transfer 100 coins

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "recipient-uuid",
    "coins": 100
  }'

# Expected Response (400):
{
  "error": "Insufficient balance. You have 50 coins."
}
```

**Assertions:**
- ✅ Transfer rejected with balance info
- ✅ Balances unchanged
- ✅ No transaction created

---

### Test Case 4: Invalid Recipient

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "non-existent-uuid",
    "coins": 50
  }'

# Expected Response (404):
{
  "error": "Recipient not found"
}
```

**Assertions:**
- ✅ Transfer rejected
- ✅ Sender balance unchanged
- ✅ No transaction created

---

### Test Case 5: Invalid Amount

**Test Steps:**
```bash
# Test 1: Zero coins
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "recipient-uuid",
    "coins": 0
  }'
# Expected: "Coins must be a positive number" (400)

# Test 2: Negative coins
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "recipient-uuid",
    "coins": -50
  }'
# Expected: "Coins must be a positive number" (400)

# Test 3: Float coins (edge case)
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_token" \
  -d '{
    "recipientId": "recipient-uuid",
    "coins": 50.5
  }'
# May succeed if system accepts, or fail depending on validation
```

**Assertions:**
- ✅ All invalid amounts rejected
- ✅ Appropriate error messages
- ✅ Balances unchanged
- ✅ No transactions created

---

### Test Case 6: Multiple Sequential Transfers

**Setup:**
- Sender: 1000 coins
- Recipient 1: 100 coins
- Recipient 2: 100 coins

**Test Steps:**
```bash
# Transfer 1: Send 200 to Recipient 1
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sender_token" \
  -d '{
    "recipientId": "recipient1-uuid",
    "coins": 200
  }'
# Expected: Sender: 800, Recipient 1: 300

# Transfer 2: Send 150 to Recipient 2
curl -X POST http://localhost:3000/api/wallet/transfer-coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sender_token" \
  -d '{
    "recipientId": "recipient2-uuid",
    "coins": 150
  }'
# Expected: Sender: 650, Recipient 2: 250

# Verify all transactions
SELECT * FROM coin_transactions 
WHERE reference_type = 'user_transfer' 
ORDER BY created_at;
# Expected: 4 transactions (2 sent, 2 received)
```

**Assertions:**
- ✅ All transfers successful
- ✅ Running balance correct after each transfer
- ✅ All transaction records created
- ✅ All notifications sent

---

## 3. ERROR RECOVERY TESTING

### Test Case: Rollback on Failure

**Scenario:** Simulate a failure after sender balance is updated

**Note:** This would require database-level testing or code modification.

**Assertions:**
- ✅ If any step fails, previous updates are rolled back
- ✅ No orphaned transactions
- ✅ Balances remain consistent

---

## 4. CONCURRENT TRANSFER TESTING

**Scenario:** Multiple simultaneous transfers from same sender

**Test Steps:**
```bash
# Send 3 requests simultaneously
Request 1: Transfer 100 coins
Request 2: Transfer 100 coins  
Request 3: Transfer 100 coins

# With 250 coins, all should succeed
# Final balance: -50 (if system allows) OR last 2 rejected
```

**Assertions:**
- ✅ Race conditions handled properly
- ✅ Balance never goes negative (if enforced)
- ✅ No duplicate transactions
- ✅ Clear error messages for rejected transfers

---

## SQL Query Verification Commands

```sql
-- Check all coin transfers for a user
SELECT * FROM coin_transactions 
WHERE transaction_type IN ('transfer_sent', 'transfer_received')
AND (user_id = 'user-uuid' OR reference_id = 'user-uuid')
ORDER BY created_at DESC;

-- Check withdrawal settlement history
SELECT * FROM coin_transactions 
WHERE transaction_type = 'withdrawal_settled'
ORDER BY created_at DESC;

-- Check user balance history
SELECT u.id, u.display_name, u.coins_balance,
  (SELECT SUM(amount) FROM coin_transactions WHERE user_id = u.id) as total_transactions
FROM users u
WHERE u.id = 'user-uuid';

-- Verify transaction integrity
SELECT user_id, SUM(amount) as net_coins FROM coin_transactions 
GROUP BY user_id;

-- Check for orphaned transactions
SELECT * FROM coin_transactions 
WHERE reference_id IS NOT NULL 
AND reference_type NOT IN ('withdrawal_request', 'user_transfer');
```

---

## Performance Testing

```bash
# Load test: 100 simultaneous transfers
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/wallet/transfer-coins \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer session_token" \
    -d "{\"recipientId\": \"recipient-$i\", \"coins\": 1}" &
done
wait
```

**Metrics to Track:**
- Average response time
- Success rate
- Database query performance
- Memory usage

---

## Checklist for Full Validation

### Withdrawal Settlement
- [ ] Coins deducted correctly
- [ ] Transaction recorded with correct type
- [ ] Balance_after matches actual balance
- [ ] Notification sent
- [ ] Rejection doesn't affect balance
- [ ] Rollback works on failure
- [ ] Admin audit trail created

### Coin Transfer
- [ ] Both balances updated correctly
- [ ] Two transactions created (sent and received)
- [ ] Transaction amounts correct (negative for sender, positive for recipient)
- [ ] Reference IDs point correctly
- [ ] Recipient notified
- [ ] Self-transfer prevented
- [ ] Insufficient balance rejected
- [ ] Invalid recipient rejected
- [ ] Invalid amounts rejected
- [ ] Concurrent transfers handled
- [ ] Rollback works on failure

### Data Integrity
- [ ] No duplicate transactions
- [ ] All transactions reference valid users
- [ ] Balance audit passes
- [ ] No orphaned records
- [ ] Timestamps are accurate

---

## Notes

1. All timestamps should use ISO 8601 format
2. Amounts are integers (whole coins only)
3. USD amounts in withdrawals should be numeric
4. Database operations are atomic (all or nothing)
5. Notifications are non-critical (failures won't block transfers)
6. Keep detailed logs for debugging
