-- CREATE BLOG LIKES AND COMMENT LIKES TABLES
-- These tables track likes on blog posts and comments

-- Blog Likes Table
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT blog_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts (id) ON DELETE CASCADE,
  CONSTRAINT blog_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT blog_likes_post_id_user_id_key UNIQUE (post_id, user_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON public.blog_likes USING btree (post_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON public.blog_likes USING btree (user_id) TABLESPACE pg_default;

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT blog_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES blog_comments (id) ON DELETE CASCADE,
  CONSTRAINT blog_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT blog_comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment_id ON public.blog_comment_likes USING btree (comment_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user_id ON public.blog_comment_likes USING btree (user_id) TABLESPACE pg_default;

-- =====================================================
-- NOTIFICATION TRIGGERS FOR BLOG SYSTEM
-- =====================================================

-- 1. Trigger: Notify admin when a new comment is added to their blog post
CREATE OR REPLACE FUNCTION notify_on_blog_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_post_title VARCHAR(255);
BEGIN
  -- Get the post author and title
  SELECT user_id, title INTO v_post_author_id, v_post_title
  FROM blog_posts
  WHERE id = NEW.post_id;

  -- Notify the admin (post author) about the new comment
  -- Only if the new comment is a top-level comment (no parent_id) or first reply
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url,
    is_read
  ) VALUES (
    v_post_author_id,
    'blog_comment',
    'New Comment on Your Blog Post',
    (SELECT display_name FROM users WHERE id = NEW.user_id) || ' commented on "' || v_post_title || '"',
    NEW.user_id,
    NEW.id,
    'blog_comment',
    '/blog/' || (SELECT slug FROM blog_posts WHERE id = NEW.post_id),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_notify_on_blog_comment ON blog_comments;
CREATE TRIGGER trig_notify_on_blog_comment
AFTER INSERT ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_blog_comment();

-- 2. Trigger: Notify comment author when someone replies to their comment
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_author_id UUID;
  v_post_title VARCHAR(255);
  v_post_slug VARCHAR(255);
BEGIN
  -- Only process if this is a reply (has parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment author
    SELECT user_id INTO v_parent_author_id
    FROM blog_comments
    WHERE id = NEW.parent_id;

    -- Get post info
    SELECT title, slug INTO v_post_title, v_post_slug
    FROM blog_posts
    WHERE id = NEW.post_id;

    -- Notify the parent comment author about the reply
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_id,
      reference_id,
      reference_type,
      action_url,
      is_read
    ) VALUES (
      v_parent_author_id,
      'comment_reply',
      'Someone Replied to Your Comment',
      (SELECT display_name FROM users WHERE id = NEW.user_id) || ' replied to your comment on "' || v_post_title || '"',
      NEW.user_id,
      NEW.parent_id,
      'blog_comment',
      '/blog/' || v_post_slug,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_notify_on_comment_reply ON blog_comments;
CREATE TRIGGER trig_notify_on_comment_reply
AFTER INSERT ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment_reply();

-- 3. Trigger: Notify comment author when someone likes their comment
CREATE OR REPLACE FUNCTION notify_on_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author_id UUID;
  v_post_title VARCHAR(255);
  v_post_slug VARCHAR(255);
BEGIN
  -- Get the comment author
  SELECT bc.user_id, bp.title, bp.slug
  INTO v_comment_author_id, v_post_title, v_post_slug
  FROM blog_comments bc
  JOIN blog_posts bp ON bc.post_id = bp.id
  WHERE bc.id = NEW.comment_id;

  -- Notify the comment author about the like
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url,
    is_read
  ) VALUES (
    v_comment_author_id,
    'comment_like',
    'Someone Liked Your Comment',
    (SELECT display_name FROM users WHERE id = NEW.user_id) || ' liked your comment',
    NEW.user_id,
    NEW.comment_id,
    'blog_comment',
    '/blog/' || v_post_slug,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_notify_on_comment_like ON blog_comment_likes;
CREATE TRIGGER trig_notify_on_comment_like
AFTER INSERT ON blog_comment_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment_like();

-- 4. Trigger: Notify blog post author when someone likes their post
CREATE OR REPLACE FUNCTION notify_on_blog_post_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_post_title VARCHAR(255);
  v_post_slug VARCHAR(255);
BEGIN
  -- Get the post author and title
  SELECT user_id, title, slug INTO v_post_author_id, v_post_title, v_post_slug
  FROM blog_posts
  WHERE id = NEW.post_id;

  -- Notify the post author about the like
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url,
    is_read
  ) VALUES (
    v_post_author_id,
    'post_like',
    'Someone Liked Your Blog Post',
    (SELECT display_name FROM users WHERE id = NEW.user_id) || ' liked your post "' || v_post_title || '"',
    NEW.user_id,
    NEW.post_id,
    'blog_post',
    '/blog/' || v_post_slug,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_notify_on_blog_post_like ON blog_likes;
CREATE TRIGGER trig_notify_on_blog_post_like
AFTER INSERT ON blog_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_blog_post_like();

-- 5. Trigger: Update blog_comments likes_count when a like is added
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_comments
    SET likes_count = (SELECT COUNT(*) FROM blog_comment_likes WHERE comment_id = NEW.comment_id)
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_comments
    SET likes_count = (SELECT COUNT(*) FROM blog_comment_likes WHERE comment_id = OLD.comment_id)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_update_comment_likes_count ON blog_comment_likes;
CREATE TRIGGER trig_update_comment_likes_count
AFTER INSERT OR DELETE ON blog_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- 6. Trigger: Update blog_posts likes_count when a like is added
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts
    SET likes_count = (SELECT COUNT(*) FROM blog_likes WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts
    SET likes_count = (SELECT COUNT(*) FROM blog_likes WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_update_post_likes_count ON blog_likes;
CREATE TRIGGER trig_update_post_likes_count
AFTER INSERT OR DELETE ON blog_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();
