# Notification System Documentation

## Overview
Vibe2Gether uses a comprehensive automatic notification system with database triggers that create notifications for all user interactions.

## Database Triggers

The system includes 8 automatic triggers that create notifications when:

### 1. **Like Notifications** (`like_notification_trigger`)
- **Triggered:** When a user likes a post
- **Notification Type:** `like`
- **Recipients:** Post owner (if not their own post)
- **Action URL:** Links to the liked post

### 2. **Follow Notifications** (`follow_notification_trigger`)
- **Triggered:** When a user follows another user
- **Notification Type:** `follow`
- **Recipients:** User being followed
- **Action URL:** Links to follower's profile

### 3. **Comment Notifications** (`comment_notification_trigger`)
- **Triggered:** When a user comments on a post
- **Notification Type:** `comment`
- **Recipients:** Post owner (if not their own post)
- **Action URL:** Links to the post with comment

### 4. **View Notifications** (`view_notification_trigger`)
- **Triggered:** When a user views a post (first view only)
- **Notification Type:** `view`
- **Recipients:** Post owner
- **Action URL:** Links to the viewed post

### 5. **Match Notifications** (`match_notification_trigger`)
- **Triggered:** When a new match is created with status 'matched'
- **Notification Type:** `match`
- **Recipients:** Both users in the match
- **Action URL:** Links to the match conversation

### 6. **Match Status Update Notifications** (`match_status_notification_trigger`)
- **Triggered:** When match status changes to 'matched'
- **Notification Type:** `match`
- **Recipients:** Both users in the match
- **Action URL:** Links to the match conversation

### 7. **Message Notifications** (`message_notification_trigger`)
- **Triggered:** When a new message is sent
- **Notification Type:** `message`
- **Recipients:** The other user in the conversation
- **Content:** Message preview
- **Action URL:** Links to the conversation

### 8. **Save Notifications** (`save_notification_trigger`)
- **Triggered:** When a user saves a post
- **Notification Type:** `save`
- **Recipients:** Post owner (if not their own post)
- **Action URL:** Links to the saved post

## Notification Table Schema

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,           -- User receiving the notification
  type varchar(50) NOT NULL,       -- Type of notification
  title varchar(255) NOT NULL,     -- Notification title
  message text,                    -- Notification message/content
  actor_id uuid,                   -- User who triggered the notification
  reference_id uuid,               -- ID of the referenced object (post, user, etc.)
  reference_type varchar(50),      -- Type of referenced object
  is_read boolean DEFAULT false,   -- Read status
  read_at timestamp,               -- When notification was read
  action_url varchar(500),         -- URL to navigate to
  created_at timestamp DEFAULT now()
)
```

## API Endpoints

### 1. Get Notifications
**Endpoint:** `GET /api/notifications`

**Response:**
```json
{
  "unreadCount": 5,
  "notifications": [
    {
      "id": "uuid",
      "type": "like",
      "title": "John liked your post",
      "message": "Your post got a new like",
      "isRead": false,
      "createdAt": "2025-12-15T10:30:00Z",
      "actionUrl": "/dashboard/feed/post-id",
      "actor": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ]
}
```

### 2. Mark Notifications as Read
**Endpoint:** `POST /api/notifications`

**Request Body:**
```json
{
  "notificationIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Get Messages (All Conversations)
**Endpoint:** `GET /api/messages`

**Response:**
```json
{
  "conversations": [
    {
      "id": "match-id",
      "otherUser": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar": "https://..."
      },
      "lastMessage": {
        "content": "Hey, how are you?",
        "senderId": "uuid",
        "createdAt": "2025-12-15T10:30:00Z"
      },
      "unreadCount": 2,
      "compatibilityScore": 87
    }
  ],
  "total": 3
}
```

### 4. Get Messages for Specific Match
**Endpoint:** `GET /api/messages?matchId=match-uuid`

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "matchId": "match-id",
      "senderId": "uuid",
      "content": "Hey, how are you?",
      "messageType": "text",
      "mediaUrl": null,
      "isRead": true,
      "createdAt": "2025-12-15T10:30:00Z",
      "sender": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar": "https://..."
      }
    }
  ],
  "total": 15
}
```

### 5. Send Message
**Endpoint:** `POST /api/messages`

**Request Body:**
```json
{
  "matchId": "match-uuid",
  "content": "Hey, how are you?",
  "messageType": "text",
  "mediaUrl": null
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "match_id": "match-uuid",
    "sender_id": "uuid",
    "content": "Hey, how are you?",
    "created_at": "2025-12-15T10:30:00Z"
  }
}
```

## Key Features

✅ **Automatic:** All notifications are created automatically via database triggers
✅ **Real-time:** Triggers fire instantly when actions occur
✅ **No Duplicates:** Proper foreign key constraints prevent orphaned notifications
✅ **Indexed:** Optimized queries with indexes on user_id, type, is_read, and created_at
✅ **Cascading Deletes:** Notifications are deleted if referenced objects are deleted
✅ **Actor Tracking:** All notifications track who triggered them (actor_id)
✅ **Read Status:** Notifications can be marked as read with timestamps

## Usage Examples

### Fetch Dashboard Notifications
```typescript
const response = await fetch('/api/notifications')
const { unreadCount, notifications } = await response.json()

// Display notifications with unread badge
notifications.forEach(notif => {
  console.log(`${notif.actor.name} ${notif.title}`)
  if (!notif.isRead) {
    // Show as unread
  }
})
```

### Send a Message
```typescript
const response = await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchId: 'match-uuid',
    content: 'Hello!',
    messageType: 'text'
  })
})
const { success } = await response.json()
```

### Mark Notifications as Read
```typescript
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notificationIds: ['notif1', 'notif2']
  })
})
const { success } = await response.json()
```

## Performance Considerations

- **Indexes:** All frequently queried columns are indexed
- **Limits:** Dashboard shows max 10 latest notifications, 100 messages per conversation
- **Lazy Loading:** Messages are fetched on demand
- **Batch Updates:** Multiple notifications can be marked as read in one query
- **Trigger Optimization:** Triggers use efficient SQL with minimal joins

## Security

✅ User can only see their own notifications
✅ Users can only send/receive messages with matched users
✅ Notifications are automatically cleaned up if referenced objects are deleted
✅ All operations require authentication (via NextAuth.js)
✅ Service role key used for server-side operations only

## Setup Instructions

1. Run the SQL script to create triggers:
   ```bash
   # In Supabase SQL Editor, run:
   # scripts/012_create_notification_triggers.sql
   ```

2. Verify triggers are created:
   ```sql
   SELECT trigger_name, trigger_schema 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public'
   ```

3. Test the system:
   - Create a post
   - Another user likes the post
   - Check notifications table for new notification
   - Verify trigger executed successfully

