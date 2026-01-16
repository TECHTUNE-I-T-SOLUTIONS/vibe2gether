-- Fix blog_posts table to reference admins table instead of users table
-- This allows admins to create blog posts without needing a users table entry

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Step 2: Add the new foreign key constraint referencing admins table
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.admins (id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraint
-- SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
-- FROM information_schema.key_column_usage
-- WHERE table_name = 'blog_posts' AND column_name = 'author_id';

-- Migration complete! The blog_posts table now correctly references the admins table.
-- Admins can now create blog posts using their admin ID from the session.
