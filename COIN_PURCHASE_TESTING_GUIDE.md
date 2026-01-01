# Coin Purchase System - Testing Guide

## Issue Summary
Fixed three critical issues with the coin purchase system:
1. **Duplicate coin additions** - Coins being added twice (now prevented with `coins_added` flag)
2. **Trigger function error** - Database error when saving to coin_transactions table
3. **Missing daily goals endpoint** - Now properly implemented (was returning 404)

## Quick Test Checklist

### Before Testing
- [ ] Apply the database migration (see DATABASE_MIGRATION_TRIGGER_FIX.md)
- [ ] Ensure both webhook and verify endpoints have been updated
- [ ] Clear browser cache/cookies

### Test 1: Single Coin Purchase ✅
**Expected:** User should receive coins exactly once

1. Note current coin balance (e.g., 50)
2. Open Buy Coins modal
3. Enter ₦8,500
4. See 2931 coins equivalent displayed
5. Click "Pay ₦8,500"
6. Complete payment on Paystack
7. Wait for redirect back to app
8. **Expected final balance: 50 + 2931 = 2981 coins**

**Check:**
- [ ] Balance increased by exactly 2931 coins
- [ ] No error message shown
- [ ] One record in coin_transactions table
- [ ] Modal shows success message
- [ ] Recent Transactions shows the purchase

### Test 2: Prevent Double Addition ✅
**Expected:** Coins should only be added once even if verify is called multiple times

1. After Test 1 completes, refresh the page
2. Check wallet balance (should still be 2981)
3. Look at browser console/network tab - verify endpoint might be called on page load
4. **Balance should NOT change after refresh**

**Check:**
- [ ] Balance remains at 2981 (no additional coins added)
- [ ] Check transaction record has `metadata.coins_added = true`
- [ ] Only ONE record in coin_transactions table for this reference
- [ ] Console shows "Coins already added" message if verify runs again

### Test 3: Daily Goals Endpoint ✅
**Expected:** Daily goals should load without 404 error

1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to Wallet page
4. Look for `GET /api/wallet/daily-goals`
5. **Should show Status: 200**

**Check:**
- [ ] No 404 errors in console
- [ ] Daily goals section loads
- [ ] Shows available daily goals (login, post, interact, etc.)
- [ ] Completion status shows correctly

### Test 4: Multiple Purchases ✅
**Expected:** Each purchase should create separate transactions and coin additions

1. After Test 1, buy coins again
2. Enter ₦5,000 (should be ~1724 coins)
3. Complete payment
4. **Expected balance: 2981 + 1724 = 4705 coins**

**Check:**
- [ ] Balance increases by exactly 1724 coins
- [ ] Two separate records in coin_transactions table
- [ ] Each has correct reference_id pointing to transaction
- [ ] Both show correct balance_after values (2981, then 4705)

### Test 5: Error Handling ✅
**Expected:** System should handle errors gracefully

1. Try payment with minimum amount (₦1,500)
2. Check if it processes correctly
3. Try opening modal multiple times
4. Try refreshing during payment process

**Check:**
- [ ] No duplicate coins even if page refreshed during payment
- [ ] Error messages display correctly for validation failures
- [ ] User can retry payment without issues

## Database Verification

### Check Coin Balance
```sql
SELECT id, email, coins_balance, updated_at
FROM users
WHERE email = 'test-user@example.com';
```

### Check Transaction History
```sql
SELECT 
  id,
  payment_reference,
  status,
  amount,
  metadata->>'coins_added' as coins_added,
  metadata->>'coinsAmount' as coins_amount,
  created_at
FROM transactions
WHERE type = 'coin_purchase'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Coin Transactions
```sql
SELECT 
  id,
  user_id,
  amount as coins,
  transaction_type,
  description,
  balance_after,
  created_at
FROM coin_transactions
ORDER BY created_at DESC
LIMIT 10;
```

## Expected Logs

After payment completes, you should see:

✅ **Webhook logs:**
```
[Paystack] Processing successful payment: ws87ei6zpe
[Paystack] Processing coin purchase - Adding 2931 coins to user {user_id}
[Paystack] Successfully added 2931 coins to user {user_id}, new balance: 2981
[Paystack] Saved coin transaction for user {user_id}
```

✅ **Verify endpoint logs (if called):**
```
[PAYSTACK] Verifying payment reference: ws87ei6zpe
[PAYSTACK] Transaction found with status: completed
[PAYSTACK] Coins already added for transaction {transaction_id}
```

❌ **Should NOT see:**
```
[PAYSTACK] Failed to save coin transaction: record "new" has no field "status"
[PAYSTACK] Added 2931 coins to user, new balance: 2985  (twice)
```

## Troubleshooting

### Issue: Still getting duplicate coins
- [ ] Verify webhook signature is correct
- [ ] Check that both webhook and verify updates are deployed
- [ ] Check logs for "coins_added" flag being set properly

### Issue: Getting trigger error still
- [ ] Run the database migration from DATABASE_MIGRATION_TRIGGER_FIX.md
- [ ] Verify the function and trigger were created with the queries provided
- [ ] Check Supabase Logs tab for any remaining errors

### Issue: Daily goals showing 404
- [ ] Clear browser cache
- [ ] Check that /api/wallet/daily-goals endpoint exists
- [ ] Review server logs for errors in the endpoint

## Success Criteria

✅ All tests pass when:
1. User buys coins → coins added exactly once
2. Balance calculation is correct (no double additions)
3. Database records are created properly
4. No 404 errors for daily goals
5. No trigger function errors
6. All endpoints return proper status codes

## Performance Notes

Expected times:
- Payment initialization: < 1s
- Webhook processing: < 3s
- Verify endpoint: < 2s
- Page reload after payment: < 2s
- Daily goals fetch: < 2s

If any endpoint takes significantly longer, check:
- Supabase connection
- Network latency
- Database query performance
