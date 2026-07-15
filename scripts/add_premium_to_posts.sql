-- Add is_premium column to posts table
-- This migration adds the ability to mark posts as premium content
-- Premium posts are only visible to premium users

ALTER TABLE public.posts 
ADD COLUMN is_premium boolean DEFAULT false;

-- Add index for better query performance on premium posts
CREATE INDEX idx_posts_is_premium ON public.posts(is_premium);

-- Add comment to document the column
COMMENT ON COLUMN public.posts.is_premium IS 'Indicates if this post is premium content (only visible to premium users)';
