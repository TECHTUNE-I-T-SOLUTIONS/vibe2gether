# Quick Start - Copy & Paste into Supabase

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Sign in to your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

## Step 2: Copy Everything Below

Copy the entire SQL script below and paste it into the Supabase SQL Editor:

---

## 🚀 RUN THIS SQL SCRIPT

```sql
-- ============================================================================
-- NOTIFICATION TRIGGERS FOR VIBE2GETHER
-- Automatically creates notifications for all user interactions
-- ============================================================================

-- 1. LIKE NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'like',
    u.display_name || ' liked your post',
    'Your post got a new like from ' || COALESCE(u.display_name, u.full_name),
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS like_notification_trigger ON likes;
CREATE TRIGGER like_notification_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

-- 2. FOLLOW NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    NEW.following_id,
    'follow',
    u.display_name || ' started following you',
    COALESCE(u.display_name, u.full_name) || ' started following you',
    NEW.follower_id,
    NEW.follower_id,
    'user',
    '/profile/' || NEW.follower_id
  FROM users u
  WHERE u.id = NEW.follower_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
CREATE TRIGGER follow_notification_trigger
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- 3. COMMENT NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'comment',
    u.display_name || ' commented on your post',
    'Your post got a new comment from ' || COALESCE(u.display_name, u.full_name),
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
CREATE TRIGGER comment_notification_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- 4. VIEW NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_view_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'view',
    'Your post got a new view',
    'Someone viewed your post',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id
  AND (SELECT COUNT(*) FROM post_views WHERE post_id = NEW.post_id AND user_id = NEW.user_id) = 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS view_notification_trigger ON post_views;
CREATE TRIGGER view_notification_trigger
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION create_view_notification();

-- 5. MATCH NOTIFICATIONS (on insert)
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'matched' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_id,
      reference_id,
      reference_type,
      action_url
    )
    VALUES
      (NEW.user2_id, 'match', 'You have a new match!', 'You matched with someone! Start the conversation.', NEW.user1_id, NEW.id, 'match', '/dashboard/matches/' || NEW.id),
      (NEW.user1_id, 'match', 'You have a new match!', 'You matched with someone! Start the conversation.', NEW.user2_id, NEW.id, 'match', '/dashboard/matches/' || NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_notification_trigger ON matches;
CREATE TRIGGER match_notification_trigger
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_notification();

-- 6. MATCH STATUS UPDATE NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_match_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'matched' AND OLD.status != 'matched' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_id,
      reference_id,
      reference_type,
      action_url
    )
    VALUES
      (NEW.user2_id, 'match', 'You have a new match!', 'You matched with someone! Start the conversation.', NEW.user1_id, NEW.id, 'match', '/dashboard/matches/' || NEW.id),
      (NEW.user1_id, 'match', 'You have a new match!', 'You matched with someone! Start the conversation.', NEW.user2_id, NEW.id, 'match', '/dashboard/matches/' || NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_status_notification_trigger ON matches;
CREATE TRIGGER match_status_notification_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_status_notification();

-- 7. MESSAGE NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  receiver_id uuid;
  sender_name varchar;
BEGIN
  SELECT CASE 
    WHEN m.user1_id = NEW.sender_id THEN m.user2_id
    ELSE m.user1_id
  END INTO receiver_id
  FROM matches m
  WHERE m.id = NEW.match_id;

  SELECT COALESCE(display_name, full_name) INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  VALUES (
    receiver_id,
    'message',
    sender_name || ' sent you a message',
    NEW.content,
    NEW.sender_id,
    NEW.match_id,
    'match',
    '/dashboard/messages/' || NEW.match_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- 8. SAVE NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_save_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'save',
    u.display_name || ' saved your post',
    COALESCE(u.display_name, u.full_name) || ' saved your post',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS save_notification_trigger ON saved_posts;
CREATE TRIGGER save_notification_trigger
AFTER INSERT ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION create_save_notification();

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
```

---

## Step 3: Click RUN ✅

Click the **RUN** button in Supabase SQL Editor.

You should see:
```
Query executed successfully
```

## Step 4: Verify Triggers Created

Run this query to verify all triggers are created:

```sql
SELECT 
  trigger_name,
  event_object_table,
  trigger_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Expected Result:** You should see 8 triggers:
- `like_notification_trigger` on `likes` table
- `follow_notification_trigger` on `follows` table
- `comment_notification_trigger` on `comments` table
- `view_notification_trigger` on `post_views` table
- `match_notification_trigger` on `matches` table
- `match_status_notification_trigger` on `matches` table
- `message_notification_trigger` on `messages` table
- `save_notification_trigger` on `saved_posts` table

## ✅ DONE!

Your notification system is now active. Every time a user:
- ❤️ Likes a post → Notification created
- 👥 Follows someone → Notification created
- 💬 Comments on a post → Notification created
- 👀 Views a post → Notification created
- ✨ Matches with someone → Notification created
- 💌 Sends a message → Notification created
- 🔖 Saves a post → Notification created

## 🧪 Quick Test

To test that it's working:

1. Go to your app: http://localhost:3000/dashboard
2. Have another user like your post
3. Go to http://localhost:3000/api/notifications
4. You should see the notification in the JSON response

## 📖 Full Documentation

See these files for more details:
- `IMPLEMENTATION_SUMMARY.md` - Overview of everything implemented
- `NOTIFICATIONS_SYSTEM.md` - Complete API & trigger documentation
- `TESTING_NOTIFICATIONS.md` - Detailed testing guide
- `TRIGGERS_SETUP_GUIDE.md` - Setup & troubleshooting

## ❓ Questions?

If triggers aren't working:
1. Check that all tables exist (users, posts, likes, follows, matches, messages, etc.)
2. Verify notifications table has correct schema
3. Check Supabase logs for trigger errors
4. Re-run the SQL script (it's safe to run multiple times)

That's it! 🚀

