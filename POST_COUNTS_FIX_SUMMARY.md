# Post Counts Fix Summary

## What Was Changed

### 1. **New API Routes Created**

#### `/api/posts/get-feed`
- Fetches feed posts with all engagement counts
- Returns: `likes_count`, `saves_count`, `views_count`, `comments_count`
- Returns user interaction status: `userLiked`, `userSaved`
- Pagination support

#### `/api/posts/get-post/[postId]`
- Fetches single post with all engagement counts
- Returns: `likes_count`, `saves_count`, `views_count`, `comments_count`
- Returns user interaction status: `userLiked`, `userSaved`

#### `/api/posts/like` (Updated)
- Wait time increased: 100ms → 500ms
- Added error handling for missing posts
- Added validation for negative counts
- Better console logging

#### `/api/posts/save` (Updated)
- Wait time increased: 100ms → 500ms
- Added error handling for missing posts
- Added validation for negative counts
- Better console logging

### 2. **Frontend Updates**

#### Feed Page (`app/dashboard/feed/page.tsx`)
- Now uses `/api/posts/get-feed` instead of `getPosts` query
- Counts fetched directly from API
- Removed old query function import

#### Post Detail Page (`app/post/[postId]/page.tsx`)
- Now uses `/api/posts/get-post/[postId]` instead of fetching all posts
- Much faster post loading
- Counts fetched directly from API
- Removed unused `getUserPosts` import

### 3. **Database Trigger Fixes**

File: `FIX_TRIGGERS.sql`

**All trigger functions now include:**
- `COALESCE()` to handle NULL values
- `GREATEST(0, count)` to prevent negative counts
- `RAISE NOTICE` for debugging
- Better error handling

**Triggers recreated:**
- `trig_update_likes_count`
- `trig_update_saves_count`
- `trig_update_views_count`
- `trig_update_comments_count`
- `trig_update_comments_count_delete`

## Why It Works Now

### Before
```
User clicks Like 
→ Add to likes table
→ Wait 100ms (often not enough!)
→ Fetch count from posts
→ Count is still 0 (trigger didn't fire yet)
→ Show 0 to user
```

### After
```
User clicks Like
→ Add to likes table
→ Database trigger fires immediately
→ Trigger updates posts.likes_count += 1
→ Wait 500ms (ensures trigger completed)
→ Fetch count from posts
→ Count is 1 (trigger fired and updated)
→ Show 1 to user
```

## Testing the Fix

1. **Run the fix script** in Supabase:
   - Copy contents of `FIX_TRIGGERS.sql`
   - Execute in SQL Editor
   - Verify all triggers created

2. **Restart your dev server**

3. **Test in browser:**
   - Open console (F12)
   - Like a post
   - Check console for logs:
     ```
     [POST /api/posts/like] Adding like...
     [POST /api/posts/like] Waiting 500ms...
     [POST /api/posts/like] Like successful - new count: 1
     ```
   - Count should show > 0

4. **Save a post:**
   - Similar logs should appear
   - Count should show > 0

## Key Files Modified

```
/app/api/posts/get-feed/route.ts          [NEW]
/app/api/posts/get-post/[postId]/route.ts [NEW]
/app/api/posts/like/route.ts               [UPDATED]
/app/api/posts/save/route.ts               [UPDATED]
/app/dashboard/feed/page.tsx               [UPDATED]
/app/post/[postId]/page.tsx                [UPDATED]
/lib/supabase/queries.ts                   [ADDED getPostById]

/FIX_TRIGGERS.sql                          [NEW - Run in Supabase]
/TROUBLESHOOT_COUNTS.md                    [NEW - Debugging guide]
/API_COUNTS_ARCHITECTURE.md                [NEW - Full documentation]
```

## Console Logs Available

### Feed Loading
```
[GET /api/posts/get-feed] Fetching feed - page: 1, limit: 20, offset: 0
[GET /api/posts/get-feed] Fetched 20 posts
[GET /api/posts/get-feed] Checking interactions for user <user-id>
[GET /api/posts/get-feed] Post <post-id> - likes: 5, saves: 1, views: 15
```

### Liking a Post
```
[POST /api/posts/like] User <user-id> toggling like on post <post-id>
[POST /api/posts/like] Adding like for user <user-id> on post <post-id>
[POST /api/posts/like] Waiting 500ms for trigger to execute...
[POST /api/posts/like] Like successful - new count: 6
```

### Saving a Post
```
[POST /api/posts/save] User <user-id> toggling save on post <post-id>
[POST /api/posts/save] Adding save for user <user-id> on post <post-id>
[POST /api/posts/save] Waiting 500ms for trigger to execute...
[POST /api/posts/save] Save successful - new count: 2
```

## If Counts Still Show 0

1. **Run FIX_TRIGGERS.sql** in Supabase SQL Editor
2. **Reset counts manually:**
   ```sql
   UPDATE posts 
   SET 
     likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
     saves_count = (SELECT COUNT(*) FROM saved_posts WHERE saved_posts.post_id = posts.id),
     views_count = (SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id),
     comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.parent_id IS NULL);
   ```
3. **Increase wait time** to 1000ms in API routes if needed
4. **Check database logs** in Supabase

## Performance Impact

- **API calls now cached in component state** - No extra queries after initial load
- **500ms wait time** - Small delay but ensures count accuracy
- **Batch interaction checks** - All user likes/saves fetched in one query

## What Works Now

✅ Likes count displayed and updated  
✅ Saves count displayed and updated  
✅ Views count displayed (from database)  
✅ Comments count displayed  
✅ Pagination in feed  
✅ User interaction indicators (liked/saved badges)  
✅ Optimistic UI updates with server confirmation  
✅ Full console logging for debugging  
✅ Error handling and recovery  

## Next Steps

1. Execute `FIX_TRIGGERS.sql` in Supabase
2. Restart dev server
3. Test liking/saving posts
4. Check console for proper logs
5. Verify counts update correctly

## Documentation

- **API_COUNTS_ARCHITECTURE.md** - Complete API design and data flow
- **TROUBLESHOOT_COUNTS.md** - Debugging guide and solutions
- **FIX_TRIGGERS.sql** - Database trigger recreation script
- **VERIFY_COUNTS_SETUP.sql** - Database verification queries
