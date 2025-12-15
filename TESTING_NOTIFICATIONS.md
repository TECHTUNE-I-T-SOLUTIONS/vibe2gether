# Testing the Notification & Message System

## Quick Test Plan

### Prerequisites
- Make sure you have 2+ test users created
- Run the trigger setup script (scripts/012_create_notification_triggers.sql)
- Have the app running locally

## Test Scenarios

### Test 1: Like Notification

**Steps:**
1. User A posts content
2. User B goes to the feed and likes User A's post
3. Check User A's notifications

**Expected Result:**
- Notification appears in `notifications` table with type='like'
- Dashboard shows the notification
- `/api/notifications` endpoint returns the notification

**SQL Check:**
```sql
SELECT * FROM notifications 
WHERE type = 'like' 
ORDER BY created_at DESC LIMIT 5;
```

### Test 2: Follow Notification

**Steps:**
1. User B follows User A
2. Check User A's notifications

**Expected Result:**
- Notification with type='follow' appears
- Shows "User B started following you"
- Notification title and message populated correctly

**SQL Check:**
```sql
SELECT * FROM notifications 
WHERE type = 'follow' 
ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Comment Notification

**Steps:**
1. User A has a post
2. User B comments on that post
3. Check User A's notifications

**Expected Result:**
- Notification with type='comment'
- Shows "User B commented on your post"
- action_url links to the post

### Test 4: Message Notification

**Steps:**
1. User A and User B are matched
2. User B sends a message to User A
3. Check User A's notifications

**Expected Result:**
- Notification with type='message'
- Message preview shown
- Both users show unread count in messages list

**Test via API:**
```bash
curl -X GET http://localhost:3000/api/messages
# Should show conversations with unreadCount

curl -X GET http://localhost:3000/api/messages?matchId=match-uuid
# Should show all messages in conversation
```

### Test 5: Match Notification

**Steps:**
1. Create a match with status='matched'
2. Check both users' notifications

**Expected Result:**
- Both users receive notification
- type='match'
- Shows "You have a new match!"

## API Testing

### 1. Get All Notifications
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Cookie: [your-session-cookie]"

# Expected:
# {
#   "unreadCount": 3,
#   "notifications": [...]
# }
```

### 2. Mark Notifications as Read
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"notificationIds":["notif-uuid1","notif-uuid2"]}'

# Expected:
# {"success": true}
```

### 3. Get All Conversations
```bash
curl -X GET http://localhost:3000/api/messages \
  -H "Cookie: [your-session-cookie]"

# Expected:
# {
#   "conversations": [
#     {
#       "id": "match-uuid",
#       "otherUser": {...},
#       "lastMessage": {...},
#       "unreadCount": 2
#     }
#   ],
#   "total": 1
# }
```

### 4. Get Messages in a Match
```bash
curl -X GET "http://localhost:3000/api/messages?matchId=match-uuid" \
  -H "Cookie: [your-session-cookie]"

# Expected:
# {
#   "messages": [
#     {
#       "id": "msg-uuid",
#       "matchId": "match-uuid",
#       "senderId": "user-uuid",
#       "content": "Hello!",
#       "createdAt": "2025-12-15T10:30:00Z",
#       "sender": {...}
#     }
#   ],
#   "total": 15
# }
```

### 5. Send a Message
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{
    "matchId": "match-uuid",
    "content": "Hello! How are you?",
    "messageType": "text"
  }'

# Expected:
# {
#   "success": true,
#   "message": {
#     "id": "msg-uuid",
#     "match_id": "match-uuid",
#     "sender_id": "user-uuid",
#     "content": "Hello! How are you?"
#   }
# }
```

## Database Inspection

### View All Triggers
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

### Check Notification Growth
```sql
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as latest_notification
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Result should show growth in notification types:
-- like, follow, comment, view, message, match, save
```

### Check Unread Notifications
```sql
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id
ORDER BY unread_count DESC;
```

### Check Message Activity
```sql
SELECT 
  match_id,
  COUNT(*) as message_count,
  MAX(created_at) as latest_message
FROM messages
GROUP BY match_id
ORDER BY MAX(created_at) DESC;
```

## Debugging

### If Notifications Not Creating

1. **Check if trigger exists:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%';
```

2. **Check if function exists:**
```sql
SELECT proname, prosrc 
FROM pg_catalog.pg_proc 
WHERE proname LIKE '%notification%';
```

3. **Manual test of trigger function:**
```sql
-- Test like trigger
INSERT INTO likes (user_id, post_id) 
VALUES ('user1-id', 'post-uuid');

-- Check if notification created
SELECT * FROM notifications 
WHERE type = 'like' 
AND created_at > NOW() - INTERVAL '10 seconds';
```

4. **Enable debug logging:**
```sql
-- Check trigger execution
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

### If API Returns Errors

1. **Check API logs:**
```bash
# In terminal where app is running, look for error messages
```

2. **Test authentication:**
```bash
curl -X GET http://localhost:3000/api/notifications \
  # Should return 401 if not authenticated
```

3. **Check Supabase connection:**
```bash
# Verify environment variables are set:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

## Performance Testing

### Load Test - Create Many Notifications
```sql
-- Create 1000 likes quickly
DO $$
DECLARE
  i INT := 0;
BEGIN
  FOR i IN 1..1000 LOOP
    INSERT INTO likes (user_id, post_id) 
    VALUES ('test-user-id', 'test-post-id-' || i);
  END LOOP;
END $$;

-- Check performance
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT AVG(created_at) as avg_creation_time FROM notifications;
```

### Check Index Performance
```sql
-- View index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('notifications', 'messages')
ORDER BY idx_scan DESC;
```

## Success Checklist

✅ Triggers are created successfully
✅ Notifications appear when expected
✅ Messages are sent and received
✅ Unread counts are accurate
✅ Mark as read functionality works
✅ API endpoints return correct data
✅ Dashboard shows real notifications
✅ No SQL errors in logs
✅ Performance is acceptable
✅ All 8 triggers are active

## Next Steps

Once all tests pass:

1. Deploy to production
2. Monitor notification creation rate
3. Monitor database performance
4. Set up alerts for trigger failures
5. Regular backup of notifications table

