# Production Deployment Guide - Phase 10 🚀

## Pre-Deployment (Do This First)

### Step 1: Review Documentation
- [ ] Read [SESSION_COMPLETION_SUMMARY_PHASE_10.md](SESSION_COMPLETION_SUMMARY_PHASE_10.md)
- [ ] Check [PHASE_10_INDEX.md](PHASE_10_INDEX.md) for file locations
- [ ] Review [ERROR_FIXES_VALIDATION.md](ERROR_FIXES_VALIDATION.md) for error patterns

### Step 2: Code Review
- [ ] Review all 9 modified/new files
- [ ] Check type safety (no `any` types)
- [ ] Verify error handling in all APIs
- [ ] Confirm null safety in all modals

### Step 3: Environment Setup
```bash
# Set these variables in your production environment
PAYSTACK_PUBLIC_KEY=pk_live_your_key_here
PAYSTACK_SECRET_KEY=sk_live_your_secret_here
NEXTAUTH_SECRET=your_secret_here
DATABASE_URL=your_database_url

# Verify in .env.local
echo $PAYSTACK_PUBLIC_KEY  # Should output your key
echo $PAYSTACK_SECRET_KEY  # Should output your secret
```

### Step 4: Database Verification
```sql
-- Run these to verify tables exist and have correct structure

-- Check transactions table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'transactions' LIMIT 5;

-- Check event_registrations table exists
SELECT COUNT(*) FROM event_registrations;

-- Check events table has registered_count column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'registered_count';

-- Check users table has coins_balance column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'coins_balance';
```

---

## Deployment Steps

### Step 5: Build & Test Locally
```bash
# Clean install
rm -rf node_modules .next
npm install  # or pnpm install

# Build
npm run build

# Check for build errors
# Output should show "✓ build completed"
```

### Step 6: Commit Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Phase 10: Payment system, public features, currency fixes, error handling

- Implement Paystack payment system with USD→NGN conversion
- Add payment gates to marketplace and events
- Fix currency display (₦ vs $ symbols)
- Remove favorite icons from public pages
- Add coins navigation button in header
- Create product/event detail modals
- Fix null reference errors in modals and APIs
- Comprehensive error handling and validation"

# Push to remote
git push origin main
```

### Step 7: Deploy to Production
```bash
# For Vercel (most common)
vercel deploy --prod

# For other platforms, follow their deployment process
# Ensure environment variables are set before deploying
```

### Step 8: Verify Deployment
After deployment is live:

```bash
# 1. Check homepage loads
curl https://yourdomain.com

# 2. Check marketplace page
curl https://yourdomain.com/marketplace

# 3. Check events page
curl https://yourdomain.com/events

# 4. Test payment API (with test data)
curl -X POST https://yourdomain.com/api/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "currency": "NGN",
    "email": "test@example.com",
    "itemType": "product",
    "itemId": "test-123"
  }'
```

---

## Post-Deployment (Critical!)

### Step 9: Monitor for 1 Hour
Watch these metrics:

```
❌ Error Rate: Should be 0% for new features
✅ Payment Flow: Should complete without errors
✅ Database: Should record transactions correctly
✅ Coins Display: Should show in header
✅ Modals: Should open and load data
```

**Where to check:**
- Browser console (Dev Tools F12)
- Server logs (Vercel/production platform)
- Database logs
- Payment gateway dashboard (Paystack)

### Step 10: Run Smoke Tests

**Test 1: Product Payment Gate**
1. Go to /marketplace
2. Click "View Details" on any product
3. Verify product modal opens
4. Verify payment button shows "Pay ₦1,500"
5. Click payment button
6. Verify Paystack modal opens
7. ✅ Confirm payment modal appears

**Test 2: Event Registration Gate**
1. Go to /events
2. Click "View Details" on any event
3. Verify event modal opens
4. Verify payment button shows correct amount
5. Click payment button
6. Verify Paystack modal opens
7. ✅ Confirm payment modal appears

**Test 3: Coins Navigation**
1. Log in as any user
2. Look for coins button in header
3. Click coins button
4. Verify navigation to /dashboard/wallet
5. ✅ Confirm navigation works

**Test 4: Currency Display**
1. View marketplace (should show ₦ for NGN)
2. View events (should show ₦ for NGN or $ for USD)
3. Verify no mixed currency symbols (no "$5000 NGN")
4. ✅ Confirm all prices display correctly

**Test 5: Payment Success**
1. Go to /marketplace
2. Click "View Details"
3. Click "Pay ₦1,500"
4. Use Paystack test card: 4111 1111 1111 1111
5. Expiry: Any future date
6. CVV: Any 3 digits
7. ✅ Verify payment succeeds and seller info appears

### Step 11: Database Verification

```sql
-- Check transactions were recorded
SELECT COUNT(*) as new_transactions 
FROM transactions 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Should return > 0 if payment test successful

-- Check transaction details
SELECT id, amount, currency, type, status 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- Should show recent transactions with:
-- - amount: correct Kobo amount
-- - currency: 'NGN'
-- - type: 'product' or 'event'
-- - status: 'completed' for successful payments
```

### Step 12: Error Log Check

Look for these files/logs:
- Vercel Dashboard → Logs
- Application Error Logs
- Browser Console (F12 → Console tab)
- Network Errors (F12 → Network tab)

**Should NOT see:**
- ❌ "can't access property" errors
- ❌ ".single()" errors
- ❌ "undefined is not a function" errors
- ❌ 500 Internal Server Errors on payment APIs
- ❌ Payment initialization failures

**Should see:**
- ✅ Successful payment initializations
- ✅ Successful payment verifications
- ✅ Webhook signatures verified
- ✅ Transactions recorded in database
- ✅ Clean console (no errors)

---

## Rollback Plan (If Issues)

If something goes wrong, here's how to roll back:

```bash
# 1. Check git history
git log --oneline -10

# 2. Find last working commit
git show <commit-hash>  # Review the commit

# 3. Revert to previous version
git revert <current-commit-hash>
git push origin main

# 4. Re-deploy
vercel deploy --prod

# 5. Notify team of rollback
```

**Common Issues & Rollback:**
- Payment errors → Rollback (check Paystack keys)
- Null reference errors → Rollback (check code review)
- Database errors → Rollback (check schema)
- Performance issues → Optimize and redeploy

---

## Ongoing Monitoring

### Daily Checks (First Week)
```bash
# Check payment success rate
SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as success_rate
FROM transactions
WHERE created_at > NOW() - INTERVAL '24 hours';

# Should show success_rate > 95%

# Check for errors
SELECT COUNT(*) as error_count FROM error_logs WHERE level = 'error';

# Check API response times
SELECT AVG(response_time) as avg_response_ms 
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Weekly Review
- [ ] Payment success rate (target: >98%)
- [ ] Average response time (target: <200ms)
- [ ] Error rate (target: <0.1%)
- [ ] User feedback on payment flow
- [ ] Database performance
- [ ] Paystack dashboard for disputes

### Monthly Optimization
- [ ] Review slow queries
- [ ] Check for unused code
- [ ] Update dependencies
- [ ] Review payment disputes
- [ ] Plan future enhancements

---

## Paystack Dashboard Configuration

### In Paystack Dashboard (https://dashboard.paystack.co)

1. **Settings → Developer**
   - Copy Public Key: `pk_live_...`
   - Copy Secret Key: `sk_live_...`
   - Add to environment variables

2. **Settings → Webhook**
   - Add Webhook URL: `https://yourdomain.com/api/paystack/webhook`
   - Select event: `charge.success`
   - Save

3. **Transactions**
   - Monitor payment status
   - Review transaction details
   - Check for disputes

4. **Logs**
   - Review API requests/responses
   - Check webhook delivery

---

## Feature Verification Matrix

| Feature | Test | Expected Result | Status |
|---------|------|-----------------|--------|
| Product Modal | Click "View Details" | Modal opens with product info | ✅ |
| Event Modal | Click "View Details" | Modal opens with event info | ✅ |
| Payment Gate | Click "Pay ₦1,500" | Payment modal opens | ✅ |
| Currency Display | View prices | NGN shows ₦, USD shows $ | ✅ |
| Paystack Init | Submit payment form | Redirects to Paystack | ✅ |
| Paystack Verify | Complete payment | Payment verified, transaction recorded | ✅ |
| Webhook | Payment successful | Seller/organizer info shows | ✅ |
| Coins Button | Click coins | Navigates to /dashboard/wallet | ✅ |
| Favorites Removed | View marketplace | No heart icons visible | ✅ |
| Seller Info | After payment | Email/phone visible with copy buttons | ✅ |

---

## Success Criteria

### Must Have ✅
- [ ] All 10 features working in production
- [ ] No runtime errors in console
- [ ] Payments processing successfully
- [ ] Transactions recorded in database
- [ ] Currency displaying correctly
- [ ] Coins navigation working
- [ ] Modals opening without errors

### Should Have ✅
- [ ] Payment success rate > 95%
- [ ] API response times < 200ms
- [ ] No TypeScript errors
- [ ] Error handling working for edge cases
- [ ] Mobile responsive design working

### Nice to Have ✅
- [ ] Analytics dashboard updated
- [ ] Payment trends documented
- [ ] Performance optimized
- [ ] Documentation reviewed
- [ ] Team trained on new features

---

## Team Communication

### Deployment Announcement
```
🚀 Production Deployment - Phase 10 Complete

✅ Features Released:
- Paystack payment system with currency conversion
- Product & event detail modals with payment gates
- Fixed currency display (₦ vs $)
- Coins navigation in header
- Comprehensive error handling

📊 Testing Results:
- All 10 features verified working
- Payment flow tested end-to-end
- Error handling validated
- Mobile responsive confirmed

⚠️ Important Notes:
- Paystack test cards: 4111111111111111
- Payment amount: ₦1,500 (~$1 USD)
- Monitor payment success rate
- Check error logs hourly

📚 Documentation:
- See SESSION_COMPLETION_SUMMARY_PHASE_10.md
- See DEPLOYMENT_CHECKLIST.md
- See PHASE_10_INDEX.md for all guides
```

---

## Troubleshooting During Deployment

### Issue: "PAYSTACK_SECRET_KEY is not set"
**Solution:**
```bash
# 1. Verify environment variable is set
echo $PAYSTACK_SECRET_KEY

# 2. If empty, set it:
export PAYSTACK_SECRET_KEY=sk_live_your_key

# 3. Redeploy
vercel deploy --prod --env PAYSTACK_SECRET_KEY=sk_live_your_key
```

### Issue: Payment modal doesn't open
**Solution:**
```bash
# 1. Check browser console (F12) for errors
# 2. Check if PaystackPaymentModal component is imported
# 3. Check if modal state is updating correctly
# 4. Verify no TypeScript errors in build

# Run local test:
npm run dev
# Then test payment flow locally
```

### Issue: Transactions not recording
**Solution:**
```bash
# 1. Check database connection
# 2. Verify transactions table exists
# 3. Check RLS policies allow insert
# 4. Verify webhook signature verification

# Test webhook locally:
curl -X POST http://localhost:3000/api/paystack/webhook \
  -H "x-paystack-signature: test" \
  -H "Content-Type: application/json" \
  -d '{...webhook payload...}'
```

### Issue: Currency conversion not working
**Solution:**
```bash
# 1. Check conversion rate in initialize route
# 2. Verify amount calculation: amount * 1670 for USD
# 3. Check Kobo conversion: ngn_amount * 100

# Test locally:
const testAmount = 1;  // USD
const ngnAmount = testAmount * 1670;  // Should be 1670
const koboAmount = ngnAmount * 100;   // Should be 167000
```

---

## Post-Deployment Support

### Support Channels
- 📧 Email: support@yourdomain.com
- 💬 Chat: Internal team Slack/Discord
- 🐛 Bug Reports: GitHub Issues
- 📊 Metrics: Paystack Dashboard + Analytics

### Response Times
- Critical Errors: Immediate (< 30 min)
- Payment Issues: Urgent (< 2 hours)
- Feature Requests: Planned (next sprint)
- Documentation: As needed

---

## Checklist Summary

**Before Deploying:**
- [ ] Code reviewed
- [ ] Tests passed
- [ ] Environment variables set
- [ ] Database verified
- [ ] Documentation read

**During Deployment:**
- [ ] Build successful
- [ ] No errors in build output
- [ ] Environment variables confirmed
- [ ] Deployment completed
- [ ] Live site accessible

**After Deployment:**
- [ ] Smoke tests pass
- [ ] Payment flow works
- [ ] No console errors
- [ ] Database recording transactions
- [ ] Coins navigation works

**First 24 Hours:**
- [ ] Monitor error logs
- [ ] Check payment success rate
- [ ] Verify transaction recording
- [ ] Monitor API response times
- [ ] Collect user feedback

**First Week:**
- [ ] Review daily metrics
- [ ] Check for common errors
- [ ] Optimize if needed
- [ ] Document any issues
- [ ] Plan next features

---

**Status:** ✅ Ready for production deployment
**Last Updated:** Current
**Next Step:** Begin pre-deployment checklist above 🚀
