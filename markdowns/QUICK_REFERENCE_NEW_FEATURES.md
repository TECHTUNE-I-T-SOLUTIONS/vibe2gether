# Quick Reference - New Features

## 1. Random Feed Posts
**Why:** Different users see different posts each time
**How:** Posts are randomized after fetching from database
**File:** `app/api/posts/get-feed/route.ts` (line 48)
**User Impact:** Better content discovery, no repetitive feed

---

## 2. Monthly Message Limit (4 per month)
**Why:** Free users get 4 messages/month (not per day)
**How:** Count messages from start of calendar month
**Files:**
- `app/api/messages/count-today/route.ts` - Backend logic
- `app/dashboard/messages/page.tsx` - UI text

**User Impact:**
- Free: 4 messages/month, then upgrade prompt
- Premium: Unlimited messages

---

## 3. Testimonies System

### For Users
**Access:** Dashboard > Testimonies (in sidebar)
**Features:**
- ⭐ Submit testimony with 1-5 star rating
- 📝 Add title and content (0-1000 chars)
- 👁️ Track approval status
- ✅ Auto-approve shows on homepage
- ❌ Rejection shows reason

### For Admins
**Access:** Admin > Testimonies
**Features:**
- 📋 Review pending testimonies
- ✅ Approve (makes visible on homepage)
- ❌ Reject with reason (user sees it)
- 🗑️ Delete any time

### For Visitors
**See On:** Homepage - "Stories from Our Community"
- Shows user avatar
- Shows user name
- Shows user location
- Shows 1-5 star rating
- Shows testimony title & content
- Random selection (different each visit)

---

## Database

### Create Table
Run this SQL in Supabase:
```sql
-- Copy contents of TESTIMONIES_TABLE_SETUP.sql and run
```

### Table Structure
- `id` - UUID primary key
- `user_id` - NextAuth user identifier
- `user_name` - User's display name
- `user_location` - City/Country
- `user_avatar_url` - Profile picture URL
- `rating` - 1-5 stars
- `title` - Testimony title
- `content` - Testimony text (up to 1000 chars)
- `status` - pending/approved/rejected
- `approval_notes` - Why rejected (optional)
- `approved_by` - Admin email who approved
- `approved_at` - When approved
- `created_at` / `updated_at` - Timestamps

---

## API Endpoints

### GET `/api/testimonies?status=approved`
Returns all approved testimonies for public display

### GET `/api/testimonies?status=all`
Returns all testimonies (admin view)

### POST `/api/testimonies`
Submit new testimony (status: pending)
```json
{
  "user_id": "user-email",
  "user_name": "John Doe",
  "user_location": "Lagos, Nigeria",
  "user_avatar_url": "image-url",
  "rating": 5,
  "title": "Amazing App!",
  "content": "This app changed my life..."
}
```

### PATCH `/api/testimonies/[id]`
Approve or reject testimony
```json
{
  "status": "approved",
  "approved_by": "admin@example.com"
}
```

### DELETE `/api/testimonies/[id]`
Delete testimony (admin only)

---

## New Pages

### User Dashboard
- **Path:** `/dashboard/testimonies`
- **Shows:** User's testimonies with status
- **Action:** Submit new testimony

### Admin Dashboard
- **Path:** `/admin/testimonies`
- **Shows:** All pending/approved/rejected testimonies
- **Actions:** Approve, Reject, Delete

### Homepage
- **Path:** `/` (homepage)
- **Shows:** "Stories from Our Community" section
- **Content:** Approved testimonies with avatars & ratings

---

## Sidebar Navigation

### Desktop (`components/dashboard/sidebar.tsx`)
**Location:** Secondary items
**Icon:** Star (⭐)
**Label:** "testimonies"
**URL:** `/dashboard/testimonies`

### Mobile (`components/dashboard/mobile-sidebar.tsx`)
Same as desktop but in mobile menu

---

## Deployment Notes

1. **Run SQL Migration**
   ```sql
   -- Copy TESTIMONIES_TABLE_SETUP.sql
   -- Run in Supabase SQL Editor
   ```

2. **No Environment Changes Needed**
   - Uses existing NextAuth
   - Uses existing Supabase connection
   - No new secrets required

3. **Verify Features**
   - [ ] Submit testimony on dashboard
   - [ ] Admin approves in admin panel
   - [ ] Appears on homepage
   - [ ] Feed shows random posts
   - [ ] Messages limited to 4/month

---

## User Messaging

### Free Users
- **Limit:** 4 messages per month
- **Message:** "4 messages remaining this month"
- **After Limit:** "Monthly message limit reached"
- **CTA:** "Upgrade to Premium to send unlimited messages"

### Premium Users
- **Limit:** None (unlimited)
- **Message:** No warning shown
- **Can send:** Unlimited messages

---

## Testimonies Approval Workflow

```
┌─────────────────────────────────────────────────┐
│ User Submits Testimony                          │
│ - Dashboard > Testimonies > "Share Your Story"  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Status: PENDING                                 │
│ - Not visible on homepage yet                   │
│ - Admin can see in review queue                 │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │ APPROVED ✅  │          │ REJECTED ❌  │
   ├─────────────┤          ├──────────────┤
   │ Visible on  │          │ Not visible  │
   │ homepage    │          │ User gets    │
   │ Immediately │          │ reason why   │
   └─────────────┘          └──────────────┘
```

---

## Strings to Translate

If you have a translation system, add these:

```
testimonies: "Testimonies"
"Share Your Testimony"
"My Testimonies"
"Testimonies Management"
"Review and approve/reject user testimonies"
"Pending Review"
"Your Testimony"
"Rating"
"Your Message"
"Submit Testimony"
"Approve"
"Reject"
"Reason for Rejection"
"Testimony submitted for approval! Thank you for your feedback."
"Testimony approved!"
"Testimony rejected"
"Monthly message limit reached"
"4 messages per month"
"remaining this month"
```

---

## Troubleshooting

**Testimonies not showing on homepage?**
- Check status is "approved"
- Verify approved_at has a timestamp
- Check user_avatar_url is valid URL

**Messages not counting?**
- Clear browser cache
- Check message was actually created in database
- Verify user_id matches

**Admin page showing error?**
- Verify user has email (NextAuth)
- Check testimonies table exists
- Verify RLS policies allow access

---

## Performance Notes

- **Feed:** Randomization is client-side (minimal impact)
- **Messages:** Query uses index on sender_id + created_at
- **Testimonies:** Indexes on status, rating, created_at for fast queries
- **Homepage:** Only fetches approved testimonies (filtered at API)

---

## Next Steps (Optional Enhancements)

1. **Testimonies Moderation**
   - Flag inappropriate content
   - Auto-detect spam

2. **Testimonies Sorting**
   - By rating (highest first)
   - By date (newest first)
   - By popularity

3. **Testimonies Filtering**
   - By rating on homepage
   - By date range in admin

4. **Notifications**
   - Email user when approved/rejected
   - Notify admin of new submissions

5. **Badges**
   - "Verified User" badge on testimonies
   - "Premium Member" indicator
