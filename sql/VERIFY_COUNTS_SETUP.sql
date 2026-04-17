-- ============================================================
-- VERIFICATION SCRIPT FOR POSTS COUNTS
-- Run this in your Supabase SQL Editor to verify setup
-- ============================================================

-- 1. Verify posts table has count columns
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('likes_count', 'comments_count', 'saves_count', 'views_count')
ORDER BY column_name;

-- Expected output: 4 rows showing all count columns exist

-- 2. Verify triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trig_update_likes_count',
  'trig_update_comments_count',
  'trig_update_saves_count',
  'trig_update_views_count'
)
ORDER BY trigger_name;

-- Expected output: 4-6 rows (some triggers have INSERT and DELETE)

-- 3. Check current counts on posts
SELECT 
  id,
  content,
  likes_count,
  comments_count,
  saves_count,
  views_count,
  created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;

-- This shows your recent posts with their current counts

-- 4. Verify functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'update_likes_count',
  'update_comments_count',
  'update_saves_count',
  'update_views_count'
)
ORDER BY routine_name;

-- Expected output: 4 rows showing all trigger functions exist

-- ============================================================
-- OPTIONAL: Reset counts if they seem incorrect
-- ============================================================

-- Run this ONLY if you want to recalculate all counts from scratch
-- WARNING: This will update all posts

-- Recalculate likes_count
-- UPDATE posts p
-- SET likes_count = (
--   SELECT COUNT(*) 
--   FROM likes l 
--   WHERE l.post_id = p.id
-- );

-- Recalculate comments_count (only top-level comments)
-- UPDATE posts p
-- SET comments_count = (
--   SELECT COUNT(*) 
--   FROM comments c 
--   WHERE c.post_id = p.id 
--     AND c.parent_id IS NULL
-- );

-- Recalculate saves_count
-- UPDATE posts p
-- SET saves_count = (
--   SELECT COUNT(*) 
--   FROM saved_posts sp 
--   WHERE sp.post_id = p.id
-- );

-- Recalculate views_count
-- UPDATE posts p
-- SET views_count = (
--   SELECT COUNT(*) 
--   FROM post_views pv 
--   WHERE pv.post_id = p.id
-- );

-- ============================================================
-- TEST: Add a like and verify count updates
-- ============================================================

-- Replace USER_ID and POST_ID with actual values from your database
-- DO $$
-- DECLARE
--   test_user_id uuid := 'YOUR_USER_ID_HERE';
--   test_post_id uuid := 'YOUR_POST_ID_HERE';
--   before_count integer;
--   after_count integer;
-- BEGIN
--   -- Get count before
--   SELECT likes_count INTO before_count FROM posts WHERE id = test_post_id;
--   
--   -- Add a like
--   INSERT INTO likes (user_id, post_id) 
--   VALUES (test_user_id, test_post_id)
--   ON CONFLICT (user_id, post_id) DO NOTHING;
--   
--   -- Wait a moment for trigger
--   PERFORM pg_sleep(0.1);
--   
--   -- Get count after
--   SELECT likes_count INTO after_count FROM posts WHERE id = test_post_id;
--   
--   -- Show results
--   RAISE NOTICE 'Before: %, After: %', before_count, after_count;
--   
--   -- Cleanup
--   DELETE FROM likes WHERE user_id = test_user_id AND post_id = test_post_id;
-- END $$;
