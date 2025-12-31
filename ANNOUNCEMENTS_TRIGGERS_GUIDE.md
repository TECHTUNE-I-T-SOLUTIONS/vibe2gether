# Announcement Triggers - User & Admin Notifications

## Overview

Three powerful SQL triggers have been added to automatically synchronize announcements with the notification system:

1. **User Announcement Notifications** - When an announcement is published, all users get a notification
2. **Admin Creation Alerts** - When an admin creates an announcement, all admins are notified
3. **Expiry Auto-Management** - When an announcement expires, its user notifications are auto-marked as read

---

## How It Works

### Trigger 1: User Announcements (announcement_user_notification_trigger)

**When:** An announcement is INSERT or UPDATE and `is_published` changes to TRUE

**What happens:**
```
✅ INSERT INTO notifications table
   - For EVERY user in the system
   - Type: "announcement"
   - Title: The announcement title
   - Message: The announcement message
   - Reference: Links back to announcement ID
   - Status: Marked as unread
```

**Example:**
```
Admin creates announcement: "New Feature: Marketplace Available!"
✓ 10,000 users get a notification automatically
✓ Shows in their /dashboard/notifications
✓ They can click to see the action_url (if provided)
```

---

### Trigger 2: Admin Notifications (announcement_admin_notification_trigger)

**When:** An announcement is INSERT (newly created)

**What happens:**
```
✅ INSERT INTO admin_notifications table
   - For EVERY admin in the system
   - Type: "announcement_created"
   - Title: "New Announcement: [Title]"
   - Message: "[Admin Name] created an announcement"
   - Reference: Links back to announcement ID
   - Status: Marked as unread
   - Action URL: Points to /admin/announcements
```

**Example:**
```
Admin "John Doe" creates announcement
✓ All 5 admins in system get admin notification
✓ They see: "New Announcement: Platform Maintenance - John Doe created..."
✓ Click to view all announcements in admin panel
```

---

### Trigger 3: Expiry Management (announcement_expiry_trigger)

**When:** An announcement UPDATE where `expires_at` is in the past

**What happens:**
```
✅ UPDATE notifications table
   - Finds all unread notifications for this announcement
   - Marks them as read
   - Automatically hides old announcements
```

**Example:**
```
Announcement created with expires_at = Dec 31, 2025
Jan 1, 2026: Announcement expires
✓ All user notifications for this announcement auto-marked as read
✓ No longer shows in unread count
✓ Users won't see it in new announcements
```

---

## SQL Functions Created

### 1. `create_announcement_user_notification()`

```sql
-- Inserts notification for ALL users when announcement is published
-- Used by: announcement_user_notification_trigger
-- Performance: Uses batch INSERT for efficiency
-- Returns: TRIGGER
```

**Logic:**
```
IF announcement.is_published changed from false/null to true:
  FOR EACH user in database:
    INSERT notification (
      user_id = user.id,
      type = 'announcement',
      title = announcement.title,
      message = announcement.message,
      reference_id = announcement.id,
      reference_type = 'announcement',
      action_url = announcement.action_url,
      is_read = FALSE
    )
```

---

### 2. `create_announcement_admin_notification()`

```sql
-- Inserts notification for ALL admins when announcement is created
-- Used by: announcement_admin_notification_trigger
-- Performance: Uses batch INSERT with JOIN for efficiency
-- Returns: TRIGGER
```

**Logic:**
```
WHEN announcement is created:
  FOR EACH admin in database:
    INSERT admin_notification (
      admin_id = admin.id,
      type = 'announcement_created',
      title = 'New Announcement: ' + announcement.title,
      message = '[Admin Name] created an announcement',
      related_id = announcement.id,
      related_type = 'announcement',
      action_url = '/admin/announcements',
      is_read = FALSE
    )
```

---

### 3. `mark_expired_announcements()`

```sql
-- Marks related user notifications as read when announcement expires
-- Used by: announcement_expiry_trigger
-- Performance: Indexes on user_id + is_read for fast queries
-- Returns: TRIGGER
```

**Logic:**
```
WHEN announcement.expires_at is in the past:
  UPDATE notifications
  SET is_read = TRUE
  WHERE reference_id = announcement.id
  AND reference_type = 'announcement'
  AND is_read = FALSE
```

---

## Database Flow Diagram

```
User Creates Announcement in Admin Panel
            ↓
    POST /api/admin/announcements
            ↓
    INSERT INTO announcements
            ↓
        TRIGGERS FIRE ↓↓↓
        
    ├─ announcement_user_notification_trigger
    │   └─ create_announcement_user_notification()
    │       └─ INSERT INTO notifications (ALL users)
    │           └─ 10,000 users get "announcement" notification
    │
    ├─ announcement_admin_notification_trigger
    │   └─ create_announcement_admin_notification()
    │       └─ INSERT INTO admin_notifications (ALL admins)
    │           └─ All admins get "announcement_created" notification
    │
    └─ announcement_expiry_trigger (waits for UPDATE)
        └─ When expires_at < NOW()
            └─ UPDATE notifications SET is_read = TRUE
                └─ Auto-hide old announcements

Users see in /dashboard/notifications ← ← ← ← ← 
Admins see in /admin/notifications ← ← ← ← ← 
```

---

## Performance Considerations

### Batch Inserts
- **Advantage:** Single INSERT statement for all users
- **Efficiency:** O(n) instead of O(n²)
- **Recommendation:** Fine for 50k-100k users

### For Larger Systems (100k+ users):
You may want to add a job queue:
```sql
-- Insert job instead of direct notification
INSERT INTO notification_jobs (
  announcement_id,
  status,
  created_at
) VALUES (NEW.id, 'pending', NOW());

-- Background job processes and creates batches of 1000 notifications
```

### Indexes Used
- `idx_announcements_admin_id` - Quick admin_id lookup
- `idx_announcements_is_published` - Quick published status check
- `idx_notifications_user_id` - Quick user notification lookup
- `idx_admin_notifications_admin_id` - Quick admin lookup

---

## Testing the Triggers

### Test #1: Publish Announcement
```sql
-- Create unpublished announcement
INSERT INTO announcements (
  admin_id,
  title,
  message,
  is_published
) VALUES (
  'YOUR_ADMIN_ID',
  'Test Announcement',
  'This is a test',
  FALSE  -- Not published yet
);

-- Then publish it
UPDATE announcements 
SET is_published = TRUE 
WHERE title = 'Test Announcement';

-- Check user notifications were created
SELECT COUNT(*) FROM notifications 
WHERE type = 'announcement' 
AND title = 'Test Announcement';
-- Should return count of all users
```

### Test #2: Check Admin Notifications
```sql
-- Admin should get notified when announcement is created
SELECT * FROM admin_notifications 
WHERE type = 'announcement_created'
ORDER BY created_at DESC
LIMIT 1;

-- Should show the announcement info
```

### Test #3: Test Expiry
```sql
-- Create announcement that expires immediately
INSERT INTO announcements (
  admin_id,
  title,
  message,
  is_published,
  expires_at
) VALUES (
  'YOUR_ADMIN_ID',
  'Expired Announcement',
  'This expires now',
  TRUE,
  NOW() - INTERVAL '1 minute'
);

-- Update it to trigger expiry logic
UPDATE announcements 
SET updated_at = NOW() 
WHERE title = 'Expired Announcement';

-- Check if notifications were marked as read
SELECT is_read FROM notifications 
WHERE reference_id = (
  SELECT id FROM announcements 
  WHERE title = 'Expired Announcement'
);
-- Should all be TRUE
```

---

## API Integration Points

### When User Views Announcements
```typescript
// GET /api/announcements
// Returns: All published, non-expired announcements
const announcements = await fetch('/api/announcements');

// Notifications were already created by trigger
// No need to create them in code
```

### When Admin Creates Announcement
```typescript
// POST /api/admin/announcements
// System automatically:
// 1. Creates admin_notification for all admins
// 2. Creates notifications for all users (if is_published=true)
// No extra code needed - triggers handle it
```

### When Admin Views Dashboard
```typescript
// GET /api/admin/notifications
// User sees all admin_notifications created by trigger
// Real-time count of unread admin notifications
```

---

## Frontend Integration

### User Dashboard - Show Announcements
```tsx
// This component should:
// 1. Fetch from /api/announcements (published only)
// 2. Display in scrolling banner or cards
// 3. Track clicks with POST /api/announcements/[id]/click
// 4. Track views with POST /api/announcements/[id]/view

// Notifications already exist in notifications table
// Fetch unread count: /api/notifications/unread
```

### Admin Dashboard - See Creation Alerts
```tsx
// This component should:
// 1. Fetch from /api/admin/notifications
// 2. Show "New Announcement Created" when type = 'announcement_created'
// 3. Allow quick navigation to /admin/announcements
// 4. Mark as read when admin clicks it
```

---

## Trigger Dependencies

These triggers require:
- ✅ `public.announcements` table (created in ANNOUNCEMENTS_SETUP_GUIDE.sql)
- ✅ `public.notifications` table (already exists)
- ✅ `public.admin_notifications` table (already exists)
- ✅ `public.admins` table (already exists)
- ✅ `public.users` table (already exists)

All dependencies already exist in your database!

---

## Disabling Triggers (If Needed)

### Temporarily Disable
```sql
-- Stop user notifications temporarily
ALTER TABLE announcements DISABLE TRIGGER announcement_user_notification_trigger;

-- Stop admin notifications temporarily
ALTER TABLE announcements DISABLE TRIGGER announcement_admin_notification_trigger;

-- Re-enable when needed
ALTER TABLE announcements ENABLE TRIGGER announcement_user_notification_trigger;
ALTER TABLE announcements ENABLE TRIGGER announcement_admin_notification_trigger;
```

### Remove Triggers Completely
```sql
DROP TRIGGER IF EXISTS announcement_user_notification_trigger ON public.announcements;
DROP TRIGGER IF EXISTS announcement_admin_notification_trigger ON public.announcements;
DROP TRIGGER IF EXISTS announcement_expiry_trigger ON public.announcements;

DROP FUNCTION IF EXISTS create_announcement_user_notification();
DROP FUNCTION IF EXISTS create_announcement_admin_notification();
DROP FUNCTION IF EXISTS mark_expired_announcements();
```

---

## What's Included in ANNOUNCEMENTS_SETUP_GUIDE.sql

✅ All 3 trigger functions
✅ All 3 trigger definitions
✅ Comments explaining each trigger
✅ Performance notes
✅ Security considerations

Just run the SQL file and triggers are automatically created!

---

## Next Steps

1. **Deploy the SQL**: Run ANNOUNCEMENTS_SETUP_GUIDE.sql in Supabase
2. **Create Admin CRUD**: Build `/admin/announcements/page.tsx`
3. **Create User Banner**: Add scrolling announcement banner to dashboard
4. **Create Notification Routes**: Add API endpoints for tracking views/clicks
5. **Test Notifications**: Verify triggers create notifications correctly

---

## Summary

| Trigger | When | What | Who |
|---------|------|------|-----|
| `announcement_user_notification_trigger` | Announcement published | Creates notification | All users |
| `announcement_admin_notification_trigger` | Announcement created | Creates admin notification | All admins |
| `announcement_expiry_trigger` | Announcement expires | Marks as read | Related users |

All 3 triggers are **automatic**, **secure**, and **performant**.

No manual code needed - just run the SQL and they work! 🚀
