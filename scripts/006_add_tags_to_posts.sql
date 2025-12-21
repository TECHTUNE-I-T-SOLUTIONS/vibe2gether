-- Add tags column to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tags text[] NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING gin (tags) TABLESPACE pg_default;
