# Implementation Guide for Vibe2Gether Features

## Overview of Tasks Completed and Remaining

This document outlines all the features requested and their implementation status/requirements.

---

## COMPLETED TASKS ✅

### 1. SQL Tables Creation
- Created comprehensive SQL file with all new tables
- Tables created:
  - `marketplace_products` - Store products
  - `marketplace_inquiries` - Track buyer inquiries
  - `events` - Create and manage events
  - `event_registrations` - User event registrations
  - `blog_posts` - Blog articles
  - `blog_comments` - Blog comments
  - `account_topups` - Coin purchase requests
  - `premium_subscriptions` - Premium membership tracking
  - `content_requests` - User requests for content posting
  - `user_preferences` - Notification and display settings
  - `user_security_settings` - 2FA and security options
  - `privacy_settings` - Privacy controls

File location: `/scripts/013_new_tables_marketplace_events_blog.sql`
Current tables updated: `/scripts/current tables in the database/current_tables.sql`

### 2. Supabase Helper Functions
- Created comprehensive query functions in `/lib/supabase/queries.ts`
- Created storage functions in `/lib/supabase/storage.ts`
- Functions include:
  - Posts operations (create, fetch, save)
  - Matches operations (get matches, create, update)
  - Events operations (get, register)
  - Blog operations (fetch, get single)
  - Marketplace operations (products, inquiries)
  - User operations (profile, search, follow/unfollow)
  - Notifications operations
  - Billing & wallet operations
  - Premium subscriptions
  - Content requests
  - User preferences & settings

### 3. Profile Page Enhancement
- Added camera upload functionality for:
  - Profile picture
  - Cover picture
- Added profile editing with real database updates
- Added followers/following links
- Integrated with Supabase storage

---

## REMAINING TASKS - DETAILED IMPLEMENTATION GUIDE

### TASK 4: Dashboard Notification Icon & Page Navigation
**Files to create/modify:**
- `/app/dashboard/notifications/page.tsx` - Notification display page
- `/components/dashboard/header.tsx` - Add click handler to notification icon

**Implementation Steps:**
```tsx
// In notifications/page.tsx:
// 1. Fetch user's notifications using getNotifications()
// 2. Display unread notifications with mark-as-read functionality
// 3. Add filters for notification types
// 4. Implement pagination for notification history

// In header.tsx:
// 1. Add onClick handler to Bell icon that navigates to /dashboard/notifications
// 2. Display unread count badge
// 3. Add real-time notification updates if possible
```

---

### TASK 5: Dashboard Search for Users
**Files to modify:**
- `/components/dashboard/header.tsx`

**Implementation Steps:**
```tsx
// 1. Convert search input to controlled component
// 2. Add debounced search using searchUsers() function
// 3. Display search results in dropdown
// 4. Navigate to user profile on selection
// 5. Add keyboard shortcuts (enter to search)
```

---

### TASK 6: Feeds Page (Real Data from Posts)
**Files to create/modify:**
- `/app/dashboard/feed/page.tsx` - Main feed page

**Implementation Steps:**
```tsx
// 1. Use getPosts() to fetch public posts
// 2. Display with user avatar, post content, media
// 3. Add like/comment/save functionality
// 4. Implement infinite scroll or pagination
// 5. Add real-time post creation using create-post component
// 6. Display timestamps and location if available
```

**Database Integration:**
- Uses: `posts`, `users`, `likes`, `comments`, `saved_posts` tables

---

### TASK 7: Matches Page (Real Data with Matching Algorithm)
**Files to create/modify:**
- `/app/dashboard/matches/page.tsx`

**Implementation Steps:**
```tsx
// 1. Create matching algorithm function:
//    - Calculate compatibility score based on:
//      * Gender preferences (looking_for field)
//      * Age proximity (date_of_birth)
//      * Location (country/city)
//      * Shared interests
// 2. Fetch all potential matches using getMatches()
// 3. Display matches with compatibility scores
// 4. Add accept/decline functionality
// 5. Show active matches separately
```

**Matching Algorithm Pseudocode:**
```typescript
function calculateCompatibility(user1, user2): number {
  let score = 0
  
  // Age compatibility (within 5 years)
  const ageDiff = Math.abs(calculateAge(user1) - calculateAge(user2))
  if (ageDiff <= 5) score += 30
  else if (ageDiff <= 10) score += 15
  
  // Location match
  if (user1.country === user2.country) score += 25
  if (user1.city === user2.city) score += 15
  
  // Interests overlap
  const commonInterests = intersection(user1.interests, user2.interests)
  score += commonInterests.length * 5
  
  return score
}
```

**Database Integration:**
- Uses: `matches`, `users` tables

---

### TASK 8: Marketplace (Admin & User Features)
**Files to create:**
- `/app/dashboard/marketplace/page.tsx` - User view
- `/app/admin/marketplace/page.tsx` - Admin management
- `/app/dashboard/marketplace/create/page.tsx` - Create product request

**Implementation Steps:**

**User Features:**
```tsx
// 1. List marketplace products
// 2. Create marketplace inquiry/request
// 3. Filter by category
// 4. Search products
// 5. View seller profile
```

**Admin Features:**
```tsx
// 1. View all products
// 2. Edit/Delete products
// 3. View marketplace inquiries
// 4. Approve/Reject requests from users
// 5. Manage categories
// 6. Feature products
```

**Database Integration:**
- Uses: `marketplace_products`, `marketplace_inquiries`, `content_requests` tables

---

### TASK 9: Events Page (Real Data & Admin Management)
**Files to create:**
- `/app/dashboard/events/page.tsx` - User view
- `/app/admin/events/page.tsx` - Admin management
- `/app/dashboard/events/[id]/page.tsx` - Event details

**Implementation Steps:**

**User Features:**
```tsx
// 1. List upcoming events
// 2. Filter by category, date, location
// 3. Register for events
// 4. View registered events
// 5. View event details
```

**Admin Features:**
```tsx
// 1. Create/Edit events
// 2. Delete events
// 3. View registrations
// 4. Feature events
// 5. Manage event categories
```

**Database Integration:**
- Uses: `events`, `event_registrations`, `content_requests` tables

---

### TASK 10: Saved Posts Page (Real Data)
**Files to modify:**
- `/app/dashboard/saved/page.tsx`

**Implementation Steps:**
```tsx
// 1. Use getSavedPosts() to fetch user's saved posts
// 2. Display saved posts in grid or list
// 3. Add unsave functionality
// 4. Implement filtering/sorting
// 5. Show save count
```

**Database Integration:**
- Uses: `saved_posts`, `posts`, `users` tables

---

### TASK 11: Dashboard Settings Pages
**Files to create:**
- `/app/dashboard/settings/account/page.tsx` - Account settings
- `/app/dashboard/settings/notifications/page.tsx` - Notification preferences
- `/app/dashboard/settings/privacy/page.tsx` - Privacy controls
- `/app/dashboard/settings/security/page.tsx` - Security settings
- `/app/dashboard/settings/billing/page.tsx` - Wallet/Billing

**Settings Card Links (in settings layout):**
```tsx
// Update to actual page links:
Account Card → /dashboard/settings/account
Notifications Card → /dashboard/settings/notifications
Privacy Card → /dashboard/settings/privacy
Security Card → /dashboard/settings/security
Billing Card → /dashboard/settings/billing
```

**Billing Page Features:**
```tsx
// 1. Display current coin balance
// 2. Show topup options (purchase coins)
// 3. Display transaction history
// 4. Process topup requests
// 5. Show premium subscription status
```

**Database Integration:**
- Uses: `user_preferences`, `user_security_settings`, `privacy_settings`, `account_topups`, `coin_transactions`, `premium_subscriptions` tables

---

### TASK 12: Blog Page (Real Data & Admin Management)
**Files to create:**
- `/app/blog/page.tsx` - Main blog page
- `/app/blog/[slug]/page.tsx` - Blog post details
- `/app/admin/blog/page.tsx` - Admin blog management
- `/app/dashboard/blog/request/page.tsx` - User blog request form

**Implementation Steps:**

**User Features:**
```tsx
// 1. List published blog posts
// 2. Filter by category
// 3. Search posts
// 4. View post details with comments
// 5. Submit blog request to admin
```

**Admin Features:**
```tsx
// 1. Create/Edit blog posts
// 2. Publish/Unpublish posts
// 3. Manage comments
// 4. View user requests
// 5. Approve/Reject blog requests
```

**Database Integration:**
- Uses: `blog_posts`, `blog_comments`, `content_requests` tables

---

### TASK 13: Premium Upgrade Page
**Files to create:**
- `/app/dashboard/premium/page.tsx`

**Features:**
```tsx
// 1. Show premium benefits
// 2. Display pricing plans (monthly)
// 3. Process premium upgrade
// 4. Show current subscription status
// 5. Auto-renewal toggle
// 6. Implement payment processing
```

**Database Integration:**
- Uses: `premium_subscriptions` table
- Updates: `users.is_premium` field

---

### TASK 14: Content Request System
**Files to create:**
- `/app/dashboard/requests/page.tsx` - View user's requests
- `/app/admin/requests/page.tsx` - Admin management

**Request Types:**
- `post` - User wants to post content
- `event` - User wants to create event
- `product` - User wants to list product

**Features:**
```tsx
// 1. Create content requests
// 2. Track request status
// 3. View admin feedback
// 4. Admin approval/rejection system
// 5. Notifications on status change
```

**Database Integration:**
- Uses: `content_requests` table

---

### TASK 15: Mobile Bottom Navigation (Dashboard)
**Files to modify:**
- Create: `/components/dashboard/mobile-bottom-nav.tsx`
- Modify: `/app/dashboard/layout.tsx`

**Navigation Items:**
```
Home → /dashboard
Feed → /dashboard/feed
Matches → /dashboard/matches
Notifications → /dashboard/notifications
Messages → /dashboard/messages
Profile → /dashboard/profile
```

**Implementation:**
```tsx
// 1. Create fixed bottom nav (mobile only, hidden on md+)
// 2. Add icons for each main page
// 3. Highlight active route
// 4. Show notification badge on icon
```

---

## API Endpoints to Create

```
POST /api/posts - Create post
GET /api/posts - Get all posts
GET /api/posts/saved - Get saved posts
POST /api/posts/:id/like - Like post
POST /api/posts/:id/save - Save post

GET /api/matches - Get user matches
POST /api/matches - Create match
PUT /api/matches/:id - Update match status

GET /api/events - Get all events
POST /api/events/:id/register - Register for event

GET /api/marketplace - Get products
POST /api/marketplace - Create product
POST /api/marketplace/:id/inquire - Create inquiry

GET /api/blog - Get blog posts
GET /api/blog/:slug - Get blog post

POST /api/billing/topup - Create topup request
GET /api/billing/transactions - Get transaction history

POST /api/premium/subscribe - Create premium subscription

POST /api/requests - Create content request
GET /api/requests - Get user requests

GET /api/notifications - Get notifications
PUT /api/notifications/:id/read - Mark as read

GET /api/search/users - Search users
POST /api/users/:id/follow - Follow user
POST /api/users/:id/unfollow - Unfollow user
```

---

## Storage Buckets to Create (Supabase)

```
- profile-pictures (public)
- cover-pictures (public)
- post-media (public)
- marketplace-media (public)
- event-media (public)
- blog-thumbnails (public)
```

---

## Next Steps for Implementation

1. **Run SQL migration** - Execute `013_new_tables_marketplace_events_blog.sql` in Supabase
2. **Create storage buckets** - Set up all storage buckets in Supabase
3. **Implement notifications feature** - Create notification pages and navigation
4. **Implement search** - Add user search functionality  
5. **Create feeds page** - Show real posts from database
6. **Create matches page** - Implement matching algorithm
7. **Create marketplace** - User and admin features
8. **Create events** - User and admin features
9. **Create blog** - User and admin features
10. **Create settings pages** - All preference pages
11. **Create premium page** - Subscription management
12. **Add mobile nav** - Bottom navigation
13. **Create content requests** - User request system
14. **Test all features** - End-to-end testing

---

## Notes

- All functions are exported from `/lib/supabase/queries.ts`
- Storage functions available from `/lib/supabase/storage.ts`
- Use existing UI components from `/components/ui/`
- Follow existing styling patterns (Tailwind + custom gradient-bg)
- Ensure all pages have proper loading and error states
- Add proper TypeScript types
- Implement proper error handling and user feedback
