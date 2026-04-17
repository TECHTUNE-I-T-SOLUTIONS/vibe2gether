# Setting Up Notification Triggers

## Step-by-Step Setup

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com
2. Log in to your Vibe2Gether project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Copy and Run the Trigger Script

1. Copy all the content from `scripts/012_create_notification_triggers.sql`
2. Paste it into the SQL Editor
3. Click **Run** button

**Note:** The script is safe to run multiple times as it uses `DROP TRIGGER IF EXISTS` and `CREATE OR REPLACE FUNCTION` which won't cause errors if triggers already exist.

### 3. Verify Triggers Are Created

Run this query in the SQL Editor to verify all triggers are created:

```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

You should see 8 triggers:
- `like_notification_trigger` on `likes`
- `follow_notification_trigger` on `follows`
- `comment_notification_trigger` on `comments`
- `view_notification_trigger` on `post_views`
- `match_notification_trigger` on `matches`
- `match_status_notification_trigger` on `matches`
- `message_notification_trigger` on `messages`
- `save_notification_trigger` on `saved_posts`

### 4. Test the Triggers

#### Test Like Notification
```sql
-- As user 1, like a post by user 2
INSERT INTO likes (user_id, post_id) 
VALUES ('user1-uuid', 'post-uuid-by-user2');

-- Check notifications for user 2
SELECT * FROM notifications 
WHERE user_id = 'user2-uuid' 
AND type = 'like'
ORDER BY created_at DESC 
LIMIT 1;
```

#### Test Follow Notification
```sql
-- User 1 follows user 2
INSERT INTO follows (follower_id, following_id) 
VALUES ('user1-uuid', 'user2-uuid');

-- Check notifications for user 2
SELECT * FROM notifications 
WHERE user_id = 'user2-uuid' 
AND type = 'follow'
ORDER BY created_at DESC 
LIMIT 1;
```

#### Test Message Notification
```sql
-- User 1 sends message to user 2 (must have a match first)
INSERT INTO messages (match_id, sender_id, content) 
VALUES ('match-uuid', 'user1-uuid', 'Hello!');

-- Check notifications for user 2
SELECT * FROM notifications 
WHERE user_id = 'user2-uuid' 
AND type = 'message'
ORDER BY created_at DESC 
LIMIT 1;
```

## Troubleshooting

### Error: "Function already exists"
**Solution:** The `CREATE OR REPLACE FUNCTION` handles this automatically. Just run the script again.

### Error: "Relation does not exist"
**Solution:** Make sure all tables exist:
```sql
-- Check if tables exist
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows');
```

### Notifications not creating
**Check:**
1. Are the triggers enabled?
```sql
-- Check trigger status
SELECT trigger_name, is_enable 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

2. Are there any errors in the trigger?
```sql
-- Check for trigger errors (in Supabase logs)
-- Go to: Database → Logs → Postgres Logs
```

3. Verify the action completed:
```sql
-- Check if notification was created after insert
SELECT * FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';
```

## API Integration

Once triggers are set up, the API endpoints automatically use the notifications:

### 1. Dashboard Notifications
```typescript
// /app/api/dashboard/stats/route.ts automatically fetches
// real notifications from the database

const { data: activities } = await supabase
  .from("notifications")
  .select(`...`)
  .eq("user_id", user.id)
```

### 2. Notifications Page
```typescript
// /app/api/notifications/route.ts
// GET - Fetch all unread notifications
// POST - Mark notifications as read
```

### 3. Messages Page
```typescript
// /app/api/messages/route.ts
// GET - Fetch conversations or specific match messages
// POST - Send new message (which triggers message notification)
```

## Performance Tips

1. **Indexes:** The script creates indexes on frequently queried columns
2. **Limits:** Dashboard limits to 10 notifications, messages to 100
3. **Batch Operations:** Mark multiple notifications as read at once
4. **Lazy Loading:** Messages load on demand

## Monitoring

Check trigger performance:
```sql
-- View all recent notifications
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notifications
GROUP BY type
ORDER BY MAX(created_at) DESC;

-- Check for notifications from last hour
SELECT 
  type,
  COUNT(*) as count
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY type;
```

## Next Steps

1. ✅ Run the SQL script in Supabase
2. ✅ Verify triggers with the query above
3. ✅ Test with sample data
4. ✅ Monitor notifications table growth
5. ✅ The API endpoints are already integrated and ready to use!

