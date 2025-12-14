-- RPC functions for incrementing/decrementing counts atomically

-- Increment views
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET views_count = views_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment likes
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement likes
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comments
CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comments
CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment followers
CREATE OR REPLACE FUNCTION increment_followers(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement followers
CREATE OR REPLACE FUNCTION decrement_followers(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Increment following
CREATE OR REPLACE FUNCTION increment_following(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement following
CREATE OR REPLACE FUNCTION decrement_following(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Increment shares
CREATE OR REPLACE FUNCTION increment_shares(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET shares_count = shares_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment saves
CREATE OR REPLACE FUNCTION increment_saves(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET saves_count = saves_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement saves
CREATE OR REPLACE FUNCTION decrement_saves(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
