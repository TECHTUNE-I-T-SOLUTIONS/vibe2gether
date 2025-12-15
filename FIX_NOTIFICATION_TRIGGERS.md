# Fix Notification Triggers - Setup Guide

## Problem Summary

The previous notification trigger setup had issues:
1. API returned nested `actor` object instead of flattened `actor_name` and `actor_image`
2. Welcome notification wasn't being created on user signup (trigger was missing)
3. System notifications (like welcome) have `actor_id` as NULL, causing runtime errors
4. Missing notifications for new posts and marketplace product approvals
5. Missing notifications for marketplace product purchases

## Solution

Two steps are required:

### Step 1: Update the Notification API ✅
The API (`/app/api/notifications/route.ts`) has been updated to:
- Flatten the actor information from nested objects
- Handle null actor_id by defaulting to "System" with logo
- Return `actor_name` and `actor_image` at the root level (as expected by frontend)

### Step 2: Run the New Comprehensive SQL Triggers

Run this SQL file in your Supabase SQL Editor:
```
scripts/013_comprehensive_notification_triggers.sql
```

**Important**: This file will:
- Drop all existing triggers (if they exist)
- Recreate them with proper handling
- Add new triggers for system notifications, posts, and marketplace products
- Add de-duplication logic to prevent spam notifications

## What This Fixes

### Fixed Issues:
1. ✅ Welcome notification now automatically created on user signup
2. ✅ System notifications properly handled (actor_id = NULL shows "System" with logo)
3. ✅ Runtime error fixed - frontend receives proper `actor_name` and `actor_image`
4. ✅ No more undefined errors in notifications

### New Features:
1. ✅ Welcome notification on signup
2. ✅ New post notifications to followers
3. ✅ Product approval notifications to sellers
4. ✅ Product purchase notifications to sellers
5. ✅ Smart de-duplication to prevent spam

## Notification Types Supported

| Type | Trigger | Details |
|------|---------|---------|
| `system` | User signup | Welcome message sent automatically |
| `like` | Post liked | Notifies post author |
| `follow` | User followed | Notifies followed user |
| `comment` | Post commented | Notifies post author |
| `view` | Profile viewed | Notifies viewed user (first view only) |
| `match` | New match | Notifies both matched users |
| `message` | Message sent | Notifies message receiver |
| `save` | Post saved | Notifies post author |
| `new_post` | Post published | Notifies all followers |
| `product_approved` | Product status updated to approved | Notifies seller |
| `product_purchased` | Order created | Notifies product seller |

## How to Test

### Test Welcome Notification:
1. Create a new user account
2. Check the notifications table - should have a 'system' type notification
3. Visit dashboard - should see welcome notification

### Test Other Notifications:
- **Like**: Like a post → post author gets 'like' notification
- **Follow**: Follow someone → they get 'follow' notification
- **Post**: Make a post → all followers get 'new_post' notification
- **Product Approval**: Approve a marketplace product → seller gets notification
- **Product Purchase**: Purchase a product → seller gets notification

## Frontend Updates

The frontend components have been updated to:
- Handle notifications with `actor_name` and `actor_image` properties
- Show "System" for notifications without an actor
- Display proper loading states and empty states
- Show real data from database instead of hardcoded values

## Database Tables Required

The triggers assume these tables exist:
- `users` - User accounts
- `posts` - User posts/threads
- `likes` - Post likes
- `follows` - User follows
- `comments` - Post comments
- `profile_views` - Profile view tracking
- `matches` - User matches
- `messages` - Direct messages
- `saved_posts` - Saved posts
- `marketplace_products` - Marketplace products
- `marketplace_orders` - Marketplace orders
- `notifications` - Notifications (auto-populated by triggers)

If any table is missing, the trigger for that action will be created but won't fire until the table exists.

## Debugging

If notifications aren't being created:

1. Check PostgreSQL trigger function logs:
```sql
-- View all triggers
SELECT tgname, tgrelname FROM pg_trigger;

-- Check trigger status
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

2. Check if the action table exists and has data:
```sql
-- Example: check if likes table has data
SELECT COUNT(*) FROM likes;
SELECT COUNT(*) FROM notifications WHERE type = 'like';
```

3. Check for errors in the logs (Supabase Dashboard → Logs)

## FAQ

**Q: Why is the welcome notification not created?**
A: Make sure you're inserting into the `users` table, not `auth.users`. The trigger is on the `public.users` table.

**Q: Why are duplicate notifications appearing?**
A: The new triggers include de-duplication logic (within 1 hour for likes/saves, 1 day for follows/views). Check if the time window is appropriate.

**Q: How do I test without real actions?**
A: You can manually insert test notifications:
```sql
INSERT INTO notifications (
  user_id, type, title, message, actor_id, action_url, is_read
) VALUES (
  'user-uuid-here',
  'test',
  'Test Notification',
  'This is a test',
  NULL,
  '/dashboard',
  false
);
```

**Q: Can I customize notification messages?**
A: Yes! Edit the trigger functions in the SQL file. Change the `title` and `message` fields in the INSERT statements.

## Success Indicators

After running the triggers:
1. Creating a new user shows welcome notification
2. Liking a post creates a 'like' notification for post author
3. Following someone creates a 'follow' notification for them
4. Making a post notifies all followers with 'new_post'
5. Approving a product notifies the seller with 'product_approved'
6. Purchasing a product notifies the seller with 'product_purchased'

All without any code changes - just database triggers! 🎉
