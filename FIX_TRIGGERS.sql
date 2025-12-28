-- ============================================================
-- FIX: Ensure All Triggers Are Properly Created and Enabled
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Recreate update_likes_count function with better safety
DROP FUNCTION IF EXISTS update_likes_count() CASCADE;

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RAISE NOTICE 'Like added for post %. New count: %', NEW.post_id, (SELECT likes_count FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.post_id;
    RAISE NOTICE 'Like removed for post %. New count: %', OLD.post_id, (SELECT likes_count FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trig_update_likes_count ON likes;
CREATE TRIGGER trig_update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_likes_count();

-- ============================================================

-- 2. Recreate update_saves_count function with better safety
DROP FUNCTION IF EXISTS update_saves_count() CASCADE;

CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = COALESCE(saves_count, 0) + 1 WHERE id = NEW.post_id;
    RAISE NOTICE 'Save added for post %. New count: %', NEW.post_id, (SELECT saves_count FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = GREATEST(0, COALESCE(saves_count, 0) - 1) WHERE id = OLD.post_id;
    RAISE NOTICE 'Save removed for post %. New count: %', OLD.post_id, (SELECT saves_count FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trig_update_saves_count ON saved_posts;
CREATE TRIGGER trig_update_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION update_saves_count();

-- ============================================================

-- 3. Recreate update_views_count function with better safety
DROP FUNCTION IF EXISTS update_views_count() CASCADE;

CREATE OR REPLACE FUNCTION update_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = NEW.post_id;
    RAISE NOTICE 'View added for post %. New count: %', NEW.post_id, (SELECT views_count FROM posts WHERE id = NEW.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trig_update_views_count ON post_views;
CREATE TRIGGER trig_update_views_count
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION update_views_count();

-- ============================================================

-- 4. Recreate update_comments_count function with better safety
DROP FUNCTION IF EXISTS update_comments_count() CASCADE;

CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RAISE NOTICE 'Comment added for post %. New count: %', NEW.post_id, (SELECT comments_count FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) WHERE id = OLD.post_id;
    RAISE NOTICE 'Comment removed for post %. New count: %', OLD.post_id, (SELECT comments_count FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for both insert and delete
DROP TRIGGER IF EXISTS trig_update_comments_count ON comments;
CREATE TRIGGER trig_update_comments_count
AFTER INSERT ON comments
FOR EACH ROW
WHEN (NEW.parent_id IS NULL)
EXECUTE FUNCTION update_comments_count();

DROP TRIGGER IF EXISTS trig_update_comments_count_delete ON comments;
CREATE TRIGGER trig_update_comments_count_delete
AFTER DELETE ON comments
FOR EACH ROW
WHEN (OLD.parent_id IS NULL)
EXECUTE FUNCTION update_comments_count();

-- ============================================================

-- 5. RESET ALL COUNTS TO 0 (Optional - if counts are corrupted)
-- Uncomment to use:
-- UPDATE posts SET likes_count = 0, saves_count = 0, views_count = 0, comments_count = 0;

-- ============================================================

-- 6. Verify triggers are created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trig_update_likes_count',
  'trig_update_saves_count',
  'trig_update_views_count',
  'trig_update_comments_count',
  'trig_update_comments_count_delete'
)
ORDER BY trigger_name;

-- Should show 5 rows if all triggers are created successfully
