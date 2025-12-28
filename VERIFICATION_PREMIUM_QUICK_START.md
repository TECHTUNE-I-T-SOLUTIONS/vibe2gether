# Quick Setup: Verification & Premium System

## Files Created
1. ✅ `/app/api/user/verification-status/route.ts` - Check verification status
2. ✅ `/app/api/user/premium-status/route.ts` - Check premium subscription
3. ✅ `/app/api/user/submit-verification/route.ts` - Submit verification documents
4. ✅ `/app/api/premium/tiers/route.ts` - Get available premium tiers
5. ✅ `/components/verification-modal.tsx` - Verification UI component

## Files Updated
1. ✅ `/app/user/[userId]/page.tsx` - Added verification & premium badges, Get Premium button
2. ✅ `/app/dashboard/page.tsx` - Added verification modal, status checks, premium alert card

## How It Works

### For Users
1. **On Dashboard Load**: 
   - System checks if user is verified
   - If not verified → Shows verification modal with form
   - If verified → Shows checkmark badge on profile

2. **Verification Process**:
   - Upload ID document (passport, driver's license, etc.)
   - Upload selfie with ID for liveness check
   - Status shows as "Pending" while under review
   - Once approved → Gets verified badge

3. **Premium Subscription**:
   - Click "Get Premium" button anywhere
   - Navigate to premium page to select tier
   - After purchase → Premium badge appears
   - Dashboard shows days until expiry

### For Developers

**Check if user is verified**:
```javascript
const response = await fetch("/api/user/verification-status")
const { verified, verification } = await response.json()
```

**Check if user has premium**:
```javascript
const response = await fetch("/api/user/premium-status")
const { hasPremium, subscription } = await response.json()
```

**Get premium tiers**:
```javascript
const response = await fetch("/api/premium/tiers")
const { tiers } = await response.json()
```

**Submit verification**:
```javascript
const formData = new FormData()
formData.append("idType", "passport")
formData.append("idNumber", "ABC123456")
formData.append("idDocument", idFile)
formData.append("selfie", selfieFile)

const response = await fetch("/api/user/submit-verification", {
  method: "POST",
  body: formData
})
```

## Console Debugging
When testing, open browser DevTools Console to see:
- Verification status checks
- Premium status checks
- File upload progress
- Database operations
- Errors and warnings

## Database Requirements
These tables must exist (provided in user's request):
- ✅ `user_verifications` - Identity verification records
- ✅ `premium_subscriptions` - Premium subscription data
- ✅ `premium_tiers` - Available subscription tiers

## Storage Requirements
Supabase storage bucket needed:
- Bucket name: `user-documents`
- For storing ID documents and selfies
- Should have proper RLS policies

## What's NOT Included (Next Steps)
1. **Premium Tier Selection Page** - `/app/premium` page with tier cards
2. **Payment Processing** - Stripe/PayPal integration
3. **Admin Verification Dashboard** - For admins to approve/reject verifications
4. **Feature Restrictions** - Logic to enforce tier limits (boosts, views, etc.)
5. **Renewal Reminders** - Email/notification for expiring subscriptions

## Testing the System

### Test Verification
1. Go to dashboard
2. See verification modal if not verified
3. Upload test images (any JPG/PNG < 5MB)
4. See "Verification submitted" toast
5. Check database: `SELECT * FROM user_verifications WHERE user_id = '<your-id>'`
6. Status should be "pending"

### Test Premium
1. Admin: Insert record in `premium_subscriptions` table:
```sql
INSERT INTO premium_subscriptions (user_id, plan, amount, expires_at, status)
VALUES ('<your-id>', 'Pro', 9.99, NOW() + INTERVAL '30 days', 'active');
```
2. Refresh dashboard → Premium badge appears
3. Check console logs for premium status fetch

### Check Console Logs
All routes log their operations:
```
[GET /api/user/verification-status] Checking verification for user {id}
[GET /api/user/premium-status] Checking premium status for user {id}
[Dashboard] Checking verification status
```

## Troubleshooting

**Verification modal doesn't appear**
- Check console for API errors
- Verify user_verifications table exists
- Check that user is authenticated

**Premium badge doesn't show**
- Verify premium_subscriptions record exists
- Check subscription status = 'active'
- Verify expires_at is in future
- Check console logs for API response

**File uploads fail**
- Check storage bucket exists: `user-documents`
- Verify file is actual image (not renamed file)
- Check file size < 5MB
- Check RLS policies allow uploads

## Environment Variables (if needed)
None required - uses Supabase server-side client

## Next: Create Premium Page
To complete the flow, create `/app/premium/page.tsx`:
1. Fetch tiers from `/api/premium/tiers`
2. Display tier cards with features
3. Integrate payment processor
4. On payment success → Create premium_subscriptions record
5. Show success message

## Support
All code is logged to console with [ENDPOINT] prefixes for easy debugging.
