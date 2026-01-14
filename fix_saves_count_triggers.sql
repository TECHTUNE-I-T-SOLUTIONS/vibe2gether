-- Fix for saves_count column name mismatch in database triggers
-- Run this script to fix the post saving functionality

-- Drop existing triggers that reference the wrong column name
DROP TRIGGER IF EXISTS trigger_update_saved_count_on_save ON public.saved_posts;
DROP TRIGGER IF EXISTS trigger_update_saved_count_on_unsave ON public.saved_posts;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_saved_count_on_save();
DROP FUNCTION IF EXISTS public.update_saved_count_on_unsave();

-- Create corrected functions that use the correct column name 'saves_count'
CREATE OR REPLACE FUNCTION public.update_saves_count_on_save()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saves_count = (
    SELECT COUNT(*) FROM public.saved_posts WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_saves_count_on_unsave()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saves_count = (
    SELECT COUNT(*) FROM public.saved_posts WHERE post_id = OLD.post_id
  )
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create corrected triggers
CREATE TRIGGER trigger_update_saves_count_on_save
AFTER INSERT ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_saves_count_on_save();

CREATE TRIGGER trigger_update_saves_count_on_unsave
AFTER DELETE ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_saves_count_on_unsave();

-- Update existing posts to have correct saves_count
UPDATE public.posts
SET saves_count = (
  SELECT COUNT(*) FROM public.saved_posts WHERE post_id = posts.id
);

-- Verify the fix
SELECT 'Database triggers fixed successfully' as status;