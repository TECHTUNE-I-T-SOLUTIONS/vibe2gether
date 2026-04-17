# Paystack Integration - Quick Start Testing Guide

## ✅ What Was Completed

### 1. Payment System Integration ✅
- Paystack credentials added to `.env.local`
- Paystack service library created (`lib/paystack.ts`)
- All three payment types integrated:
  - Marketplace purchases
  - Event registrations (paid)
  - Premium subscriptions

### 2. Admin Dashboard ✅
- Transactions Manager component (displays all transactions)
- Users Manager component (displays all users with stats)
- Both components properly connected to APIs

### 3. Database Triggers ✅
- 12 SQL triggers added for automatic count updates
- Followers, following, engagement, attendees, coins balance

### 4. Webhook Handler ✅
- Secure webhook signature verification
- Automatic transaction status updates
- Notification creation on payment success/failure

---

## 🧪 How to Test (Local Dev)

### Test 1: Marketplace Purchase

**Step 1: Go to Marketplace**
```
http://localhost:3000/dashboard/marketplace
```

**Step 2: Click on a product → "Purchase"**
- Should redirect to Paystack payment page
- Look for authorization URL in browser console

**Step 3: Use Test Card**
```
Card: 4084084084084081
Expiry: Any future date
CVV: Any 3 digits
Email: test@example.com
Name: Test User
```

**Step 4: Verify Success**
- Page redirects back
- Transaction appears in admin dashboard
- Seller receives notification

**Step 5: Check Admin Dashboard**
```
http://localhost:3000/admin/dashboard
```
- Click "Transactions" tab
- Should see new transaction with status "completed"
- Amount shown in Naira (₦)

---

### Test 2: Event Registration (Free)

**Step 1: Create Free Event**
```
http://localhost:3000/events
```
- Create event with ticket_price = 0 or NULL

**Step 2: Register for Event**
- Click "Register"
- Should register immediately (no payment)
- No Paystack redirect

**Step 3: Verify**
- Registration status shows "registered"
- User gets notification

---

### Test 3: Event Registration (Paid)

**Step 1: Create Paid Event**
```
http://localhost:3000/events
```
- Create event with ticket_price = 5000 (or any amount)

**Step 2: Register for Event**
- Click "Register"
- Should redirect to Paystack payment page

**Step 3: Complete Payment**
- Use test card (see above)
- Paystack shows payment success

**Step 4: Verify**
- Transaction created in admin dashboard
- Event registration status updated to "confirmed"
- Event attendee count increased by 1

---

### Test 4: Premium Subscription

**Step 1: Go to Premium Page**
```
http://localhost:3000/dashboard/premium
```

**Step 2: Select Tier**
- Click "Subscribe" on any tier
- Should redirect to Paystack

**Step 3: Complete Payment**
- Use test card
- Paystack redirects back

**Step 4: Verify**
- User is_premium flag set to true
- Premium subscription status: "active"
- Expiry date calculated (monthly/yearly)
- Transaction shows "completed"

---

### Test 5: Admin Dashboard

**Step 1: Go to Admin Dashboard**
```
http://localhost:3000/admin/dashboard
```

**Step 2: Check Transactions Tab**
- Should show all transactions
- Filter by status (completed, pending, failed)
- Check stats: total revenue, pending amount

**Step 3: Check Users Tab**
- Should show all users
- Stats: total, active, premium, verified
- Search functionality working
- Ban/Verify buttons available

---

## 🔍 Debugging

### Check Paystack Logs

**In Browser Console:**
```javascript
// Search for [Paystack] messages
// Should see: [Paystack] Received webhook event: charge.success
```

**In Server Logs:**
```
[POST /api/marketplace/purchase] Payment initialized for product XXX
[Paystack] Processing successful payment: reference_code
[POST /api/webhooks/paystack] Webhook processing
```

### Verify Transaction in Database

```sql
-- Check transactions
SELECT id, type, status, amount, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- Check premium subscriptions
SELECT id, user_id, status, plan, expires_at 
FROM premium_subscriptions 
WHERE status = 'active';

-- Check event registrations
SELECT id, event_id, user_id, status, payment_status 
FROM event_registrations 
WHERE status = 'confirmed';
```

### Verify Notifications

```sql
-- Check notifications created
SELECT id, user_id, type, title, is_read, created_at 
FROM notifications 
WHERE type IN ('payment', 'error') 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚀 Common Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. Create/list product
2. Click purchase
3. Fill Paystack form
4. Payment succeeds
5. Transaction in admin dashboard
6. Seller gets notification

### Scenario 2: Multiple Registrations Same Event
1. Create paid event
2. First user registers → pays
3. Second user registers → pays
4. Event attendee count = 2
5. Both transactions in admin

### Scenario 3: Premium Then Marketplace
1. User upgrades to premium
2. User buys marketplace product
3. Both transactions in admin
4. User is marked is_premium = true
5. Both types shown in transactions

### Scenario 4: Filter by Status
1. Create multiple transactions (completed, pending, failed)
2. Go to admin transactions
3. Filter by status
4. Should show correct results

---

## ✅ Success Checklist

After testing, verify these are working:

### Payment Flow
- [ ] Payment initialization redirects to Paystack
- [ ] Test card accepted
- [ ] Payment marked as completed
- [ ] Transaction in database with correct amount
- [ ] Metadata stored correctly

### Notifications
- [ ] User receives payment success notification
- [ ] Seller receives purchase notification (marketplace)
- [ ] Event organizer receives registration notification
- [ ] Notifications appear in user inbox

### Admin Dashboard
- [ ] Transactions show correct status colors
- [ ] Amount formatted as Naira (₦X,XXX.XX)
- [ ] Filter by status works
- [ ] Statistics calculated correctly
- [ ] Pagination working

### Database
- [ ] Transactions table has correct records
- [ ] Metadata stored as valid JSON
- [ ] Premium subscriptions active with expiry date
- [ ] Event registrations updated to confirmed
- [ ] Trigger counts updating automatically

### Event System
- [ ] Free events don't require payment
- [ ] Paid events redirect to Paystack
- [ ] Event attendee count increases on payment
- [ ] Duplicate registrations prevented

---

## 🐛 Troubleshooting

### Payment not going through
- Check Paystack credentials in `.env.local`
- Use test card: 4084084084084081
- Check browser console for errors
- Look for [Paystack] messages in logs

### Transaction not appearing in admin
- Refresh the page
- Check if you're logged in as admin
- Verify transaction was actually created
- Check browser network tab for API errors

### Webhook not working
- In development, webhook won't work (localhost not accessible)
- Use manual verification: `/api/payments/verify?reference=xxx`
- In production, ensure webhook URL is set in Paystack dashboard

### Notification not showing
- Check notifications table
- Verify user_id is correct
- Check if notification_preferences allows the type
- Check if notification is being created in webhook

### Amount formatting wrong
- Check if amount is in kobo (×100)
- Verify formatCurrency function
- Look for division by 100 in components

---

## 📊 Test Data

### Test Products
```
Title: Test Laptop
Price: 50,000 (₦)
Category: Electronics
```

### Test Events
- Free: Title: Free Conference, Price: 0
- Paid: Title: Workshop, Price: 2,500 (₦)

### Test Tiers
- Premium: ₦5,000/month
- Gold: ₦10,000/month
- Platinum: ₦15,000/month

---

## 📝 Test Results Template

Use this to document your testing:

```
Date: ____
Tester: ____

TEST 1: Marketplace Purchase
- Payment initiated: ✅ / ❌
- Paystack form shown: ✅ / ❌
- Payment successful: ✅ / ❌
- Transaction in admin: ✅ / ❌
- Notification created: ✅ / ❌
Notes: ________________

TEST 2: Event Registration (Paid)
- Payment initiated: ✅ / ❌
- Registration confirmed: ✅ / ❌
- Attendee count +1: ✅ / ❌
Notes: ________________

TEST 3: Premium Subscription
- Payment initiated: ✅ / ❌
- Subscription activated: ✅ / ❌
- is_premium flag set: ✅ / ❌
Notes: ________________

TEST 4: Admin Dashboard
- Transactions showing: ✅ / ❌
- Statistics correct: ✅ / ❌
- Filter working: ✅ / ❌
Notes: ________________

Overall Status: PASS / FAIL
Issues Found: ________________
```

---

## 🎯 Next After Testing

Once all tests pass:

1. **Setup Webhook in Production**
   - Go to Paystack Dashboard
   - Set webhook URL to your domain
   - Use live credentials

2. **Deploy to Staging**
   - Update `.env.local` with staging credentials
   - Test with real Paystack sandbox
   - Verify webhook delivery

3. **Go Live**
   - Switch to live Paystack credentials
   - Monitor webhook delivery
   - Track transactions

4. **Monitor**
   - Check transaction logs daily
   - Monitor notification delivery
   - Watch for failed payments

---

**Happy Testing! 🎉**

Questions? Check `PAYSTACK_INTEGRATION_COMPLETE.md` for detailed documentation.
