-- ============================================================================
-- BLOG NOTIFICATION TRIGGERS - FIXED VERSION
-- ============================================================================
-- This file contains all triggers to automatically create notifications for:
-- 1. New blog comments (notify post author)
-- 2. Comment replies (notify parent comment author)
-- 3. Blog post likes (notify post author)
-- 4. Blog comment likes (notify comment author)
-- ============================================================================

-- Drop all existing triggers related to blog notifications
DROP TRIGGER IF EXISTS trigger_notify_on_blog_comment ON public.blog_comments;
DROP TRIGGER IF EXISTS trigger_notify_on_comment_reply ON public.blog_comments;
DROP TRIGGER IF EXISTS trigger_notify_on_blog_like ON public.blog_likes;
DROP TRIGGER IF EXISTS trigger_notify_on_blog_comment_like ON public.blog_comment_likes;

-- Drop all existing functions
DROP FUNCTION IF EXISTS notify_on_blog_comment();
DROP FUNCTION IF EXISTS notify_on_comment_reply();
DROP FUNCTION IF EXISTS notify_on_blog_like();
DROP FUNCTION IF EXISTS notify_on_blog_comment_like();

-- Create blog_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT blog_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT blog_likes_unique UNIQUE(post_id, user_id)
);

-- Create blog_comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  CONSTRAINT blog_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT blog_comment_likes_unique UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- TRIGGER 1: Notify post author when a new comment is added to a blog post
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_blog_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
  v_commenter_name varchar;
  v_post_title varchar;
BEGIN
  -- Only process direct comments, not replies (parent_id should be NULL)
  IF NEW.parent_id IS NULL THEN
    -- Get post author ID and title
    SELECT author_id, title INTO v_post_author_id, v_post_title
    FROM public.blog_posts
    WHERE id = NEW.post_id;

    -- Get commenter name
    SELECT full_name INTO v_commenter_name
    FROM public.users
    WHERE id = NEW.user_id;

    -- Notify post author only if they didn't comment themselves
    IF v_post_author_id IS NOT NULL 
       AND NEW.user_id != v_post_author_id 
       AND v_post_author_id IN (SELECT id FROM public.users) THEN
      INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type, created_at)
      VALUES (
        v_post_author_id,
        'blog_comment',
        'New comment on your blog post',
        COALESCE(v_commenter_name, 'Someone') || ' commented on "' || v_post_title || '"',
        NEW.user_id,
        NEW.post_id,
        'blog_post',
        now()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN foreign_key_violation THEN
  -- If notification fails due to foreign key, just continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_blog_comment ON public.blog_comments;
CREATE TRIGGER trigger_notify_on_blog_comment
AFTER INSERT ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_blog_comment();

-- ============================================================================
-- TRIGGER 2: Notify parent comment author when someone replies to their comment
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_comment_author_id uuid;
  v_replier_name varchar;
BEGIN
  -- Only process if this is a reply (parent_id is not null)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get parent comment author ID
    SELECT user_id INTO v_parent_comment_author_id
    FROM public.blog_comments
    WHERE id = NEW.parent_id;

    -- Get replier name
    SELECT full_name INTO v_replier_name
    FROM public.users
    WHERE id = NEW.user_id;

    -- Notify parent comment author only if they didn't reply themselves
    IF v_parent_comment_author_id IS NOT NULL 
       AND NEW.user_id != v_parent_comment_author_id
       AND v_parent_comment_author_id IN (SELECT id FROM public.users) THEN
      INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type, created_at)
      VALUES (
        v_parent_comment_author_id,
        'blog_comment_reply',
        'New reply to your comment',
        COALESCE(v_replier_name, 'Someone') || ' replied to your comment',
        NEW.user_id,
        NEW.parent_id,
        'blog_comment',
        now()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN foreign_key_violation THEN
  -- If notification fails due to foreign key, just continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_comment_reply ON public.blog_comments;
CREATE TRIGGER trigger_notify_on_comment_reply
AFTER INSERT ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment_reply();

-- ============================================================================
-- TRIGGER 3: Notify post author when someone likes their blog post
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_blog_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
  v_liker_name varchar;
  v_post_title varchar;
BEGIN
  -- Get post author ID and title
  SELECT author_id, title INTO v_post_author_id, v_post_title
  FROM public.blog_posts
  WHERE id = NEW.post_id;

  -- Get liker name
  SELECT full_name INTO v_liker_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify post author only if they didn't like their own post
  IF v_post_author_id IS NOT NULL 
     AND NEW.user_id != v_post_author_id
     AND v_post_author_id IN (SELECT id FROM public.users) THEN
    INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type, created_at)
    VALUES (
      v_post_author_id,
      'blog_post_like',
      'Someone liked your blog post',
      COALESCE(v_liker_name, 'Someone') || ' liked "' || v_post_title || '"',
      NEW.user_id,
      NEW.post_id,
      'blog_post',
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN foreign_key_violation THEN
  -- If notification fails due to foreign key, just continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_blog_like ON public.blog_likes;
CREATE TRIGGER trigger_notify_on_blog_like
AFTER INSERT ON public.blog_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_blog_like();

-- ============================================================================
-- TRIGGER 4: Notify comment author when someone likes their comment
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_blog_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author_id uuid;
  v_liker_name varchar;
BEGIN
  -- Get comment author ID
  SELECT user_id INTO v_comment_author_id
  FROM public.blog_comments
  WHERE id = NEW.comment_id;

  -- Get liker name
  SELECT full_name INTO v_liker_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify comment author only if they didn't like their own comment
  IF v_comment_author_id IS NOT NULL 
     AND NEW.user_id != v_comment_author_id
     AND v_comment_author_id IN (SELECT id FROM public.users) THEN
    INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type, created_at)
    VALUES (
      v_comment_author_id,
      'blog_comment_like',
      'Someone liked your comment',
      COALESCE(v_liker_name, 'Someone') || ' liked your comment',
      NEW.user_id,
      NEW.comment_id,
      'blog_comment',
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN foreign_key_violation THEN
  -- If notification fails due to foreign key, just continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_blog_comment_like ON public.blog_comment_likes;
CREATE TRIGGER trigger_notify_on_blog_comment_like
AFTER INSERT ON public.blog_comment_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_blog_comment_like();

-- ============================================================================
-- INDEXES for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON public.blog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON public.blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user_id ON public.blog_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment_id ON public.blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
