# API-Based Post Counts Architecture

## Overview

The application now uses dedicated API routes to fetch and manage all post-related data, including likes, saves, views, and comments counts. This approach provides:

- **Full visibility** through console logs for debugging and monitoring
- **Centralized logic** for all interactions
- **Real-time accuracy** by fetching counts directly from the database
- **Better error handling** at the API layer

## API Routes

### 1. Get Feed Posts
**Endpoint:** `GET /api/posts/get-feed?page=1&limit=20`

**Purpose:** Fetch public posts with engagement counts and user interaction status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "content": "Post content",
      "likes_count": 5,
      "comments_count": 2,
      "saves_count": 1,
      "views_count": 15,
      "userLiked": false,
      "userSaved": false,
      "user": {
        "id": "user-uuid",
        "display_name": "John Doe",
        "profile_picture": "url",
        "bio": "Bio text"
      },
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Features:**
- Returns posts with all engagement counts
- Includes user interaction status (liked, saved)
- Pagination support
- Console logs for debugging

### 2. Get Single Post
**Endpoint:** `GET /api/posts/get-post/[postId]`

**Purpose:** Fetch a single post with full details and engagement counts

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "content": "Post content",
    "likes_count": 5,
    "comments_count": 2,
    "saves_count": 1,
    "views_count": 15,
    "userLiked": false,
    "userSaved": false,
    ...
  }
}
```

**Features:**
- Fetches complete post details
- Returns user interaction status
- Includes all engagement metrics
- Console logs for debugging

### 3. Toggle Like
**Endpoint:** `POST /api/posts/like`

**Request Body:**
```json
{
  "postId": "post-uuid"
}
```

**Response:**
```json
{
  "liked": true,
  "likesCount": 6
}
```

**Features:**
- Toggles like status on/off
- Returns updated likes count from database
- Waits for database trigger to update count
- Console logs for monitoring

### 4. Toggle Save
**Endpoint:** `POST /api/posts/save`

**Request Body:**
```json
{
  "postId": "post-uuid"
}
```

**Response:**
```json
{
  "saved": true,
  "savesCount": 2
}
```

**Features:**
- Toggles save status on/off
- Returns updated saves count from database
- Waits for database trigger to update count
- Console logs for monitoring

## Console Logs for Debugging

All API routes include detailed console logs prefixed with the endpoint name:

### Feed API Logs
```
[GET /api/posts/get-feed] Fetching feed - page: 1, limit: 20, offset: 0
[GET /api/posts/get-feed] Fetched 20 posts
[GET /api/posts/get-feed] Checking interactions for user user-uuid
[GET /api/posts/get-feed] Post post-id - likes: 5, saves: 1, views: 15
[GET /api/posts/get-feed] User interactions found: 20
```

### Like API Logs
```
[POST /api/posts/like] User user-id toggling like on post post-id
[POST /api/posts/like] Adding like for user user-id on post post-id
[POST /api/posts/like] Like successful - new count: 6
```

### Save API Logs
```
[POST /api/posts/save] User user-id toggling save on post post-id
[POST /api/posts/save] Adding save for user user-id on post post-id
[POST /api/posts/save] Save successful - new count: 2
```

### Post Detail Page Logs
```
[Post Detail] Fetching post post-id
[Post Detail] Post loaded - likes: 5, saves: 1, views: 15
[Post Detail] Recording view for user user-id
[Post Detail] Toggling like for post post-id
[Post Detail] Like toggled - liked: true, count: 6
```

### Feed Page Logs
```
[Feed] Fetching posts - page: 1
[Feed] Fetched 20 posts with counts
[Feed] Post post-id - likes: 5, saves: 1, views: 15
[Feed] Toggling like for post post-id
[Feed] Like toggled - liked: true, count: 6
```

## Database Triggers

The counts are automatically updated by database triggers:

### update_likes_count()
- Fires after INSERT or DELETE on likes table
- Updates posts.likes_count

### update_comments_count()
- Fires after INSERT or DELETE on comments table
- Updates posts.comments_count (only for top-level comments)

### update_saves_count()
- Fires after INSERT or DELETE on saved_posts table
- Updates posts.saves_count

### update_views_count()
- Fires after INSERT on post_views table
- Updates posts.views_count

## Data Flow

### Fetching Posts with Counts
```
Feed Page → GET /api/posts/get-feed → Supabase
→ Returns posts with likes_count, comments_count, saves_count, views_count
→ Returns userLiked, userSaved for current user
→ Feed Page displays counts
```

### Liking a Post
```
User clicks Like → Feed/Post Detail Page
→ Optimistic UI update
→ POST /api/posts/like → Supabase
→ Delete from likes table → Database trigger fires
→ Trigger updates posts.likes_count
→ API waits 100ms and fetches updated count
→ API returns updated count
→ UI updates with actual count from server
```

### Saving a Post
```
User clicks Save → Feed/Post Detail Page
→ Optimistic UI update
→ POST /api/posts/save → Supabase
→ Insert/Delete from saved_posts table → Database trigger fires
→ Trigger updates posts.saves_count
→ API waits 100ms and fetches updated count
→ API returns updated count
→ UI updates with actual count from server
```

## Error Handling

All API routes include proper error handling:

1. **Authentication Check** - Returns 401 if user not logged in
2. **Validation** - Returns 400 if required parameters missing
3. **Database Errors** - Returns 500 with error details
4. **Console Logging** - All errors logged with context

Frontend handles errors by:
1. Reverting optimistic UI update
2. Showing user-friendly toast message
3. Logging error details to console

## Frontend Implementation

### Feed Page (`app/dashboard/feed/page.tsx`)
- Fetches posts using `/api/posts/get-feed`
- Updates like/save counts from API response
- Shows likes, saves, views, and comments counts
- Pagination support for infinite scroll

### Post Detail Page (`app/post/[postId]/page.tsx`)
- Fetches single post using `/api/posts/get-post/[postId]`
- Shows all engagement counts
- Records view when post is loaded
- Updates counts on like/save actions

## Testing

To verify the counts are updating correctly:

1. **Open Browser DevTools Console** (F12)
2. **Filter logs by `[GET /api/posts` or `[POST /api/posts`
3. **Watch the console as you:**
   - Load the feed (should see fetch logs)
   - Like a post (should see like count update)
   - Save a post (should see save count update)
   - View a single post (should see view count logged)

Example test sequence:
```
[GET /api/posts/get-feed] Fetching feed - page: 1, limit: 20, offset: 0
[GET /api/posts/get-feed] Fetched 20 posts
[GET /api/posts/get-feed] Post abc-123 - likes: 5, saves: 1, views: 15
[Feed] Fetching posts - page: 1
[Feed] Fetched 20 posts with counts
[Feed] Post abc-123 - likes: 5, saves: 1, views: 15
→ User clicks Like
[POST /api/posts/like] User xyz-789 toggling like on post abc-123
[POST /api/posts/like] Adding like for user xyz-789 on post abc-123
[POST /api/posts/like] Like successful - new count: 6
[Feed] Toggling like for post abc-123
[Feed] Like toggled - liked: true, count: 6
```

## Performance Considerations

1. **100ms Delay for Count Updates**
   - Database triggers update counts asynchronously
   - API waits 100ms to ensure trigger has fired
   - May increase to 150-200ms if counts appear incorrect

2. **Batch Interaction Checks**
   - `/api/posts/get-feed` gets all user interactions in one query
   - Reduces number of individual API calls

3. **Pagination**
   - Supports efficient infinite scroll
   - Configurable limit (default 20 posts per page)

## Future Improvements

1. **Real-time Updates**
   - Use Supabase RealtimeListener for live count updates
   - Push notification when post is liked/saved

2. **Caching**
   - Cache user's interaction status
   - Reduce database queries on subsequent loads

3. **Count Accuracy**
   - Monitor trigger latency
   - Implement retry logic if counts diverge

4. **Analytics**
   - Track engagement metrics
   - Monitor API performance
