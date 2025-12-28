# Quick Action: Fix Post Counts NOW

## Step 1: Fix Database Triggers (2 minutes)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy entire content of `FIX_TRIGGERS.sql` from your project
4. Paste it into the SQL Editor
5. Click **"Run"** (⌘+Enter on Mac, Ctrl+Enter on Windows)
6. Wait for completion - should show ✅ on all commands
7. You should see: **4-5 rows** in the final verification query

## Step 2: Verify Triggers Created

In the same SQL Editor, run this:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trig_update%'
ORDER BY trigger_name;
```

Expected output:
```
trig_update_comments_count              comments
trig_update_comments_count_delete       comments
trig_update_likes_count                 likes
trig_update_saves_count                 saved_posts
trig_update_views_count                 post_views
```

## Step 3: Restart Dev Server

Terminal:
```bash
# Stop current server (Ctrl+C)

# Restart
npm run dev
# or
pnpm dev
```

## Step 4: Reset Count Data (Optional but Recommended)

Run this in Supabase SQL Editor:
```sql
UPDATE posts 
SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
  saves_count = (SELECT COUNT(*) FROM saved_posts WHERE saved_posts.post_id = posts.id),
  views_count = (SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.parent_id IS NULL);
```

## Step 5: Test in Browser

1. Open http://localhost:3000
2. Open DevTools: **F12** → **Console**
3. Go to **Feed** page
4. Look for log: `[GET /api/posts/get-feed] Post abc-123 - likes: X, saves: Y`
5. **Like a post** - You should see:
   ```
   [POST /api/posts/like] Adding like...
   [POST /api/posts/like] Waiting 500ms...
   [POST /api/posts/like] Like successful - new count: 1
   ```
6. Count should change from 0 to 1 ✅

## Done! 🎉

Your post counts are now working correctly!

### If Something Goes Wrong

**Counts still show 0?**
→ See `TROUBLESHOOT_COUNTS.md`

**Need more details?**
→ See `API_COUNTS_ARCHITECTURE.md`

**Want to understand the changes?**
→ See `POST_COUNTS_FIX_SUMMARY.md`

## Files That Changed

```
NEW:
├── /api/posts/get-feed/route.ts
├── /api/posts/get-post/[postId]/route.ts
├── FIX_TRIGGERS.sql
├── POST_COUNTS_FIX_SUMMARY.md
├── TROUBLESHOOT_COUNTS.md
├── API_COUNTS_ARCHITECTURE.md

UPDATED:
├── /api/posts/like/route.ts (wait time: 100→500ms)
├── /api/posts/save/route.ts (wait time: 100→500ms)
├── /dashboard/feed/page.tsx (uses new API route)
├── /post/[postId]/page.tsx (uses new API route)
└── /lib/supabase/queries.ts (added getPostById)
```

## What's Happening Behind the Scenes

```
User Likes Post
    ↓
Frontend: Optimistic UI update (show count +1 immediately)
    ↓
POST /api/posts/like → Insert into database
    ↓
Database: Trigger fires → Updates posts.likes_count += 1
    ↓
API: Waits 500ms → Fetches updated count
    ↓
API: Returns { liked: true, likesCount: 6 }
    ↓
Frontend: Updates UI with actual count from server
    ↓
User sees count: 6 ✅
```

## Performance Notes

- **500ms wait** ensures database trigger has time to execute
- If still seeing issues, increase to **1000ms** in API routes
- Counts are now fetched directly from database (no cache issues)
- Multiple likes/saves don't stack or duplicate

## Monitoring

Check these console logs after each action:

| Action | Expected Log |
|--------|--------------|
| Load Feed | `[GET /api/posts/get-feed] Post X - likes: Y, saves: Z` |
| Like Post | `[POST /api/posts/like] Like successful - new count: N` |
| Save Post | `[POST /api/posts/save] Save successful - new count: N` |
| View Post | `[GET /api/posts/get-post/ID] Post loaded` |

If you see these logs with correct numbers, everything is working! ✅

---

**Questions?** Check the documentation files listed above.
