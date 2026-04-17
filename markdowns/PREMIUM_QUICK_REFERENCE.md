# Premium Features Quick Reference

## What Changed

### 1. Feed Page - "See Likes"
- Users can't like posts unless premium
- Like button shows lock icon when not premium
- Clicking like redirects non-premium to premium page

### 2. Messages Page - "Send First Message"
- Users can't send first message unless premium
- Existing conversations are accessible to all
- Attempting first message redirects non-premium to premium page

### 3. Matches Page - "View Potential Matches"
- Non-premium users can see "Active Matches" tab only
- Potential Matches tab is locked for non-premium
- Clicking Potential Matches tab redirects to premium page
- Premium users see full potential matches grid

## Hook Usage

```typescript
import { usePremiumCheck } from "@/hooks/use-premium-check"

const { checkPremium, isPremium } = usePremiumCheck()

// Before action:
if (!checkPremium("Feature Name")) {
  return // Automatically redirects if not premium
}

// For conditional rendering:
{!isPremium && <Lock className="w-4 h-4" />}
```

## Testing Premium Features

### Non-Premium User Journey:
1. Click "Like" on feed post → Redirected to `/dashboard/premium?feature=See+Likes`
2. Click "Potential Matches" tab → Redirected to `/dashboard/premium?feature=View+Matches`
3. Click "Message" on first conversation → Redirected to `/dashboard/premium?feature=Send+First+Message`

### Premium User Journey:
1. Click "Like" on feed post → Likes post normally
2. Click "Potential Matches" tab → Shows potential matches grid
3. Click "Message" to new user → Sends message normally

## Implementation Details

**usePremiumCheck Hook:**
- Returns: `{ checkPremium: function, isPremium: boolean }`
- `checkPremium()` checks session for `user.isPremium`
- Redirects to `/dashboard/premium?feature=X` if not premium
- Returns `false` if redirected, `true` if allowed

**Visual Indicators:**
- Lock icons appear on restricted features
- Premium-only sections show crown icon
- Feature names included in redirect URLs for context

## To Add Premium Check to New Feature:

1. Import hook: `import { usePremiumCheck } from "@/hooks/use-premium-check"`
2. Initialize in component: `const { checkPremium } = usePremiumCheck()`
3. Check before action:
   ```typescript
   if (!checkPremium("Feature Name")) return
   ```
4. Optional: Show lock icon for non-premium users
5. Test with both premium and non-premium accounts

## Database Fields Used

- Session user object: `session.user.isPremium` (boolean)
- Checked on every call to `checkPremium()`
- Updated by premium payment/subscription system

## Files Changed

1. `app/dashboard/feed/page.tsx` - Added See Likes check
2. `app/dashboard/messages/page.tsx` - Added First Message check (already done)
3. `app/dashboard/matches/page.tsx` - Added View Matches check
4. `hooks/use-premium-check.ts` - Central premium check hook
5. `app/dashboard/premium/page.tsx` - Premium feature list (already done)
