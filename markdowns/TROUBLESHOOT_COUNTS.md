# Troubleshooting: Post Counts Not Updating

## Issue
Likes, saves, views, and comments counts show 0 or negative values even after interactions.

## Root Causes

### 1. **Database Triggers Not Firing** (Most Common)
The triggers that update post counts may not be executing properly.

**Symptoms:**
- Like count shows 0 after liking (should be > 0)
- Save count shows negative numbers after unsaving
- View count stays at 0

**Solution:**

Run the `FIX_TRIGGERS.sql` script in your Supabase SQL Editor:

```sql
-- This will recreate all triggers with proper error handling
-- See: FIX_TRIGGERS.sql
```

Steps:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `FIX_TRIGGERS.sql`
3. Paste and execute
4. Verify all 5 triggers are created

### 2. **Trigger Wait Time Too Short**
Triggers take time to execute. The original 100ms wait was insufficient.

**Solution:**
- Wait time increased to **500ms** in all API routes
- If counts still show incorrect, increase to **1000ms**

**To increase wait time:**

In `/api/posts/like/route.ts` and `/api/posts/save/route.ts`:
```typescript
// Increase from 500 to 1000
await new Promise(resolve => setTimeout(resolve, 1000))
```

### 3. **Row Level Security (RLS) Blocking Updates**
RLS policies may prevent triggers from executing.

**Check RLS Status:**
```sql
-- In Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('posts', 'likes', 'saved_posts', 'post_views', 'comments');
```

**If RLS is enabled on posts table:**
- Triggers should still work, but verify with test
- If not working, temporarily disable RLS on posts:

```sql
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```

### 4. **NULL Values Not Handled**
If `likes_count` is NULL instead of 0, incrementing fails.

**Check and Fix:**
```sql
-- In Supabase SQL Editor

-- Check for NULL counts
SELECT id, likes_count, saves_count, views_count, comments_count
FROM posts
WHERE likes_count IS NULL OR saves_count IS NULL;

-- Fix NULL values
UPDATE posts 
SET 
  likes_count = COALESCE(likes_count, 0),
  saves_count = COALESCE(saves_count, 0),
  views_count = COALESCE(views_count, 0),
  comments_count = COALESCE(comments_count, 0)
WHERE likes_count IS NULL OR saves_count IS NULL OR views_count IS NULL OR comments_count IS NULL;
```

### 5. **Corrupted Count Data**
Previous likes/saves may not have triggered count updates.

**Reset All Counts:**
```sql
-- In Supabase SQL Editor

-- Recalculate all counts from scratch
BEGIN;

UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id
);

UPDATE posts 
SET saves_count = (
  SELECT COUNT(*) FROM saved_posts WHERE saved_posts.post_id = posts.id
);

UPDATE posts 
SET views_count = (
  SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id
);

UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) FROM comments 
  WHERE comments.post_id = posts.id 
  AND comments.parent_id IS NULL
);

COMMIT;
```

## Debugging Steps

### Step 1: Check Trigger Creation
```sql
-- In Supabase SQL Editor
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trig_update_likes_count',
  'trig_update_saves_count',
  'trig_update_views_count',
  'trig_update_comments_count'
);

-- Should return 4-5 rows
```

### Step 2: Test Trigger Manually
```sql
-- In Supabase SQL Editor

-- 1. Check a post's current count
SELECT id, likes_count FROM posts LIMIT 1;

-- 2. Insert a test like
INSERT INTO likes (user_id, post_id) 
VALUES ('test-user-id', 'test-post-id');

-- 3. Wait 500ms

-- 4. Check count again - should have increased by 1
SELECT id, likes_count FROM posts WHERE id = 'test-post-id';

-- 5. Clean up test data
DELETE FROM likes WHERE user_id = 'test-user-id';
```

### Step 3: Check Browser Console
Open DevTools (F12) → Console and look for messages:

**Good signs:**
```
[GET /api/posts/get-feed] Post abc-123 - likes: 5, saves: 1, views: 15
[POST /api/posts/like] Adding like for user xyz-789 on post abc-123
[POST /api/posts/like] Waiting 500ms for trigger to execute...
[POST /api/posts/like] Like successful - new count: 6
```

**Bad signs:**
```
[POST /api/posts/like] Like successful - new count: 0
[POST /api/posts/like] Like successful - new count: -1
[POST /api/posts/like] ERROR: Post not found
```

### Step 4: Check API Logs
In Supabase Dashboard → Logs, search for:
- `trig_update_likes_count` - Should appear when liking
- `trig_update_saves_count` - Should appear when saving
- Error messages if trigger fails

## Complete Fix Process

### If Everything Fails:

1. **Stop the dev server** (Ctrl+C)

2. **Run the fix script:**
   - Go to Supabase Dashboard → SQL Editor
   - Open `FIX_TRIGGERS.sql`
   - Execute all commands
   - Verify all triggers created

3. **Reset count data:**
   ```sql
   UPDATE posts 
   SET 
     likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
     saves_count = (SELECT COUNT(*) FROM saved_posts WHERE saved_posts.post_id = posts.id),
     views_count = (SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id),
     comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.parent_id IS NULL);
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Test:**
   - Like a post → Check count increases
   - Save a post → Check count increases
   - Unlike → Check count decreases

## Performance Notes

- **500ms wait time** balances trigger execution time with user experience
- Can be increased to 1000ms if reliability needed more than speed
- If wait time becomes >1000ms, trigger latency issue likely exists

## Prevention

1. Always use the API routes (`/api/posts/like`, `/api/posts/save`)
2. Never manually insert into `likes` or `saved_posts` without testing triggers
3. Regularly verify count accuracy with SQL script
4. Monitor console logs for warnings

## Still Not Working?

If counts still show 0 after all fixes:

1. **Check Database Connection**
   - Verify Supabase credentials in `.env`
   - Test Supabase query directly

2. **Check Trigger Logs**
   - Enable function logging: `SET log_statement = 'all';`
   - Check Supabase logs for trigger execution

3. **Contact Support**
   - Include console logs
   - Include SQL verification results
   - Include trigger recreation attempt results
