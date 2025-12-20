# Complete Implementation Checklist & Instructions

## What's Been Completed ✅

### 1. **Database Tables** 
- All 11 new tables created and added to `current_tables.sql`
- Tables include: marketplace, events, blog, billing, settings, etc.

### 2. **Supabase Helpers**
- Created `/lib/supabase/queries.ts` with 40+ functions
- Created `/lib/supabase/storage.ts` for file uploads
- All database operations are ready to use

### 3. **Dashboard Features Implemented**
✅ Profile picture/cover upload with camera icons  
✅ Dashboard header notification icon links to notification page  
✅ Search box in header with user search functionality  
✅ Feeds page showing real posts from database  
✅ Saved posts page showing real saved posts  
✅ Mobile bottom navigation component  
✅ Profile page with editing and real data  

---

## Remaining Features to Implement

### CRITICAL - Must Do First

#### 1. Matches Page with Matching Algorithm
**File:** `/app/dashboard/matches/page.tsx`

```typescript
// Matching algorithm implementation:
function calculateCompatibility(user1, user2) {
  let score = 0
  
  // Age proximity
  const age1 = calculateAge(user1.date_of_birth)
  const age2 = calculateAge(user2.date_of_birth)
  const ageDiff = Math.abs(age1 - age2)
  
  if (ageDiff <= 5) score += 35
  else if (ageDiff <= 10) score += 20
  
  // Location match
  if (user1.country === user2.country) score += 25
  if (user1.city === user2.city) score += 15
  
  // Interests overlap
  const commonInterests = intersection(user1.interests, user2.interests)
  score += commonInterests.length * 5
  
  // Gender preference (looking_for field)
  if (user1.looking_for === user2.gender) score += 20
  if (user2.looking_for === user1.gender) score += 20
  
  return score
}
```

**Import functions needed:**
```typescript
import { getMatches, getMatchesWithPending, createMatch, updateMatchStatus } from "@/lib/supabase/queries"
```

---

#### 2. Marketplace - User View & Admin Management
**User Pages:**
- `/app/dashboard/marketplace/page.tsx` - Browse products
- `/app/dashboard/marketplace/create/page.tsx` - Create selling request
- `/app/dashboard/marketplace/[id]/page.tsx` - Product details

**Admin Pages:**
- `/app/admin/marketplace/page.tsx` - Admin dashboard
- `/app/admin/marketplace/[id]/edit/page.tsx` - Edit product
- `/app/admin/marketplace/requests/page.tsx` - Manage requests

**Import functions:**
```typescript
import { getMarketplaceProducts, createMarketplaceProduct } from "@/lib/supabase/queries"
import { uploadMarketplaceMedia } from "@/lib/supabase/storage"
```

---

#### 3. Events - User View & Admin Management
**User Pages:**
- `/app/dashboard/events/page.tsx` - Browse events
- `/app/dashboard/events/[id]/page.tsx` - Event details
- `/app/dashboard/events/registered/page.tsx` - My events

**Admin Pages:**
- `/app/admin/events/page.tsx` - Admin dashboard
- `/app/admin/events/create/page.tsx` - Create event
- `/app/admin/events/[id]/edit/page.tsx` - Edit event

**Import functions:**
```typescript
import { getEvents, registerForEvent, getUserEventRegistrations } from "@/lib/supabase/queries"
import { uploadEventMedia } from "@/lib/supabase/storage"
```

---

#### 4. Blog Pages  
**User Pages:**
- `/app/blog/page.tsx` - Blog listing
- `/app/blog/[slug]/page.tsx` - Blog post detail
- `/app/dashboard/blog/request/page.tsx` - Submit blog request

**Admin Pages:**
- `/app/admin/blog/page.tsx` - Admin dashboard
- `/app/admin/blog/create/page.tsx` - Create blog post
- `/app/admin/blog/[id]/edit/page.tsx` - Edit blog post
- `/app/admin/blog/requests/page.tsx` - Manage requests

**Import functions:**
```typescript
import { getBlogPosts, getBlogPost } from "@/lib/supabase/queries"
import { uploadBlogThumbnail } from "@/lib/supabase/storage"
```

---

#### 5. Settings Pages
Create all pages in `/app/dashboard/settings/`:

**Account Settings** (`account/page.tsx`)
- Display user information
- Allow editing profile details
- Update preferences

**Notifications** (`notifications/page.tsx`)
- Email notification preferences
- Push notification settings
- SMS settings
- Marketing emails toggle

**Privacy** (`privacy/page.tsx`)
- Profile visibility settings
- Allow friend requests
- Block list management
- Activity status visibility

**Security** (`security/page.tsx`)
- Two-factor authentication setup
- Active sessions management
- Login alerts
- Password change

**Billing** (`billing/page.tsx`)
- Current coin balance
- Topup options
- Transaction history
- Premium subscription status

**Import functions:**
```typescript
import {
  getUserPreferences,
  updateUserPreferences,
  getUserSecuritySettings,
  getUserPrivacySettings,
  getCoinsTransactions,
  createTopupRequest,
  createCoinTransaction,
} from "@/lib/supabase/queries"
```

---

#### 6. Premium Upgrade Page
**File:** `/app/dashboard/premium/page.tsx`

Features:
- Display premium benefits
- Show pricing (monthly)
- Process subscription (monthly renewal)
- Show current subscription status
- Display cancellation option

**Import functions:**
```typescript
import {
  createPremiumSubscription,
  getUserPremiumSubscription,
} from "@/lib/supabase/queries"
```

---

#### 7. Content Request System
**User Pages:**
- `/app/dashboard/requests/page.tsx` - View my requests

**Admin Pages:**
- `/app/admin/requests/page.tsx` - Manage all requests
- `/app/admin/requests/[id]/page.tsx` - Review request

Request types: `post`, `event`, `product`

**Import functions:**
```typescript
import {
  createContentRequest,
  getUserContentRequests,
} from "@/lib/supabase/queries"
```

---

### NICE TO HAVE - Secondary Features

#### Additional Pages to Create:
1. **Followers/Following Pages**
   - `/app/dashboard/followers/page.tsx`
   - `/app/dashboard/following/page.tsx`
   - Use: `getFollowers()`, `getFollowing()`

2. **User Profile Pages**
   - `/app/dashboard/user/[id]/page.tsx` - Public profile
   - Import: `getUserProfile()`, `followUser()`, `unfollowUser()`

3. **Post Detail Page**
   - `/app/dashboard/post/[id]/page.tsx` - Post with comments
   - Comments functionality needs additional API endpoints

---

## Database Storage Buckets to Create in Supabase

Create these public buckets in your Supabase project:

```sql
-- Storage buckets (create in Supabase UI or with SQL)
- profile-pictures (public)
- cover-pictures (public)
- post-media (public)
- marketplace-media (public)
- event-media (public)
- blog-thumbnails (public)
```

Set all buckets to public access for user-uploaded content.

---

## API Routes to Create

Create these API routes for backend operations:

```
/api/posts
  POST - Create post
  GET - Get all posts
  
/api/posts/[id]
  GET - Get post details
  
/api/posts/[id]/like
  POST - Like post
  DELETE - Unlike post
  
/api/posts/[id]/save
  POST - Save post
  DELETE - Unsave post
  
/api/matches
  GET - Get user matches
  POST - Create match
  
/api/matches/[id]
  PUT - Update match status
  DELETE - Remove match
  
/api/events
  GET - Get events
  POST - Create event (admin)
  
/api/events/[id]/register
  POST - Register for event
  DELETE - Cancel registration
  
/api/marketplace
  GET - Get products
  POST - Create listing request
  
/api/marketplace/[id]
  PUT - Update product (admin)
  DELETE - Delete product (admin)
  
/api/blog
  GET - Get blog posts
  POST - Create blog (admin)
  
/api/blog/[slug]
  GET - Get blog post
  
/api/users/[id]
  GET - Get user profile
  PUT - Update profile
  
/api/users/[id]/follow
  POST - Follow user
  DELETE - Unfollow user
  
/api/users/search
  GET - Search users (query param: q)
  
/api/notifications
  GET - Get notifications
  PUT - Mark as read
  
/api/billing
  POST /topup - Create topup
  GET /transactions - Get transaction history
  
/api/premium
  POST /subscribe - Create subscription
  GET /subscription - Get current subscription
  
/api/settings
  GET /preferences - Get user preferences
  PUT /preferences - Update preferences
  GET /privacy - Get privacy settings
  PUT /privacy - Update privacy settings
  GET /security - Get security settings
  PUT /security - Update security settings
```

---

## Implementation Priority Order

1. ✅ **Phase 1 - Database & Helpers** (DONE)
   - Create SQL tables
   - Create Supabase helper functions
   - Create storage functions

2. ✅ **Phase 2 - Core Dashboard** (DONE)
   - Profile with camera uploads
   - Feed with real posts
   - Saved posts
   - Notifications navigation
   - Search functionality

3. 🚀 **Phase 3 - Social Features** (NEXT)
   - Matches page with algorithm
   - Followers/Following pages
   - User profiles

4. 📱 **Phase 4 - Content Management**
   - Marketplace (user + admin)
   - Events (user + admin)
   - Blog (user + admin)

5. ⚙️ **Phase 5 - User Preferences**
   - Settings pages (all 5 types)
   - Preferences management

6. 💎 **Phase 6 - Premium & Billing**
   - Premium upgrade page
   - Billing management
   - Content requests system

7. 📱 **Phase 7 - Polish**
   - Mobile bottom navigation (DONE)
   - API error handling
   - Loading states
   - Toast notifications

---

## Code Templates for Common Pages

### Template: Admin CRUD Page
```typescript
"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function AdminPage() {
  const { user } = useUserProfile()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Check admin status
  useEffect(() => {
    if (user && !user.is_admin) {
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }
  }, [user])

  if (!user?.is_admin) {
    return <div className="p-8 text-center">Access Denied</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Items</h1>
        <Button className="gap-2 gradient-bg">
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{item.title}</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## Testing Checklist

- [ ] All database tables created and accessible
- [ ] File uploads work to all storage buckets
- [ ] Search functionality returns results
- [ ] Notifications page displays correctly
- [ ] Feed loads posts and infinite scroll works
- [ ] Saved posts can be added/removed
- [ ] Profile picture/cover uploads work
- [ ] Mobile bottom nav appears on mobile
- [ ] All links navigate correctly
- [ ] Authentication checks work (is_admin, user ownership)

---

## Notes & Tips

1. **Always check user authentication** - Use `useUserProfile()` hook
2. **Admin checks** - Add `if (!user?.is_admin) redirect("/dashboard")`
3. **Error handling** - Wrap Supabase calls in try-catch
4. **Loading states** - Show Loader2 icon while fetching
5. **User feedback** - Use toast notifications for actions
6. **Images** - Always use Next.js Image component with fill/object-cover
7. **Styling** - Follow existing patterns (Tailwind + gradient-bg class)
8. **TypeScript** - Keep proper typing for Supabase responses

---

## Quick Copy-Paste Imports

```typescript
// Always include these in new pages
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react" // Other icons as needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/use-user-profile"
import { cn } from "@/lib/utils"

// Import specific functions you need:
import { getMatches, getPosts, getEvents, getBlogPosts } from "@/lib/supabase/queries"
import { uploadProfilePicture, uploadMarketplaceMedia } from "@/lib/supabase/storage"
```

---

## Next Steps

1. Create `/app/dashboard/matches/page.tsx` with matching algorithm
2. Create marketplace pages (user view)
3. Create events pages (user view)
4. Create blog pages
5. Create all settings pages
6. Create premium page
7. Test all features end-to-end

---

**Last Updated:** December 20, 2025
**Status:** Database & Core Features Ready | Waiting for Page Implementations
