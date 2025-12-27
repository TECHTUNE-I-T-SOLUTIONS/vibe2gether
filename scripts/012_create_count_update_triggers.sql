-- ============================================================
-- TRIGGERS TO UPDATE POST COUNTS
-- ============================================================

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes table
DROP TRIGGER IF EXISTS trig_update_likes_count ON likes;
CREATE TRIGGER trig_update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments table (only count top-level comments, not replies)
DROP TRIGGER IF EXISTS trig_update_comments_count ON comments;
CREATE TRIGGER trig_update_comments_count
AFTER INSERT ON comments
FOR EACH ROW
WHEN (NEW.parent_id IS NULL)
EXECUTE FUNCTION update_comments_count();

-- Trigger for comments delete (only count top-level comments, not replies)
DROP TRIGGER IF EXISTS trig_update_comments_count_delete ON comments;
CREATE TRIGGER trig_update_comments_count_delete
AFTER DELETE ON comments
FOR EACH ROW
WHEN (OLD.parent_id IS NULL)
EXECUTE FUNCTION update_comments_count();

-- Function to update saves count
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = saves_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for saved_posts table
DROP TRIGGER IF EXISTS trig_update_saves_count ON saved_posts;
CREATE TRIGGER trig_update_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION update_saves_count();

-- Function to update views count
CREATE OR REPLACE FUNCTION update_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post_views table
DROP TRIGGER IF EXISTS trig_update_views_count ON post_views;
CREATE TRIGGER trig_update_views_count
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION update_views_count();
