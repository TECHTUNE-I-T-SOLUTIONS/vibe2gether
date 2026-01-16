# Blog Posts System - Admin Author Fix

## Problem
Admins were unable to create blog posts because:
1. The `blog_posts` table had a foreign key constraint `author_id` → `users(id)`
2. Admin IDs come from the `admins` table, not the `users` table
3. This caused a foreign key violation when trying to insert blog posts

## Solution

### 1. Database Schema Update (SQL Migration)
**File:** `sql/fix_blog_posts_foreign_key.sql`

```sql
-- Drop the old foreign key constraint
ALTER TABLE public.blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Add the new foreign key constraint referencing admins table
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.admins (id) 
ON DELETE CASCADE;
```

### 2. Code Changes

#### A. Blog Admin Page (`app/admin/blog/page.tsx`)
- **Removed:** User validation check that was looking for admin ID in `users` table
- **Updated:** `handleCreatePost()` to:
  - Get admin ID directly from session via `/api/admin/auth/me`
  - Pass admin ID as `author_id` to blog_posts table
  - Handle null values for optional fields (excerpt, thumbnail)
  - Use `.single()` to ensure we get the created post

#### B. Blog Queries (`lib/supabase/queries.ts`)
- **Updated:** `getBlogPosts()` function
  - Changed join from `users` to `admins` table
  - Now selects admin fields: `id`, `full_name`, `profile_picture`, `email`
  
- **Updated:** `getBlogPost()` function
  - Changed join from `users` to `admins` table
  - Now selects admin fields: `id`, `full_name`, `profile_picture`, `email`

## Files Modified
1. `app/admin/blog/page.tsx` - Removed user validation, fixed post creation
2. `lib/supabase/queries.ts` - Updated blog post queries to reference admins table
3. `sql/fix_blog_posts_foreign_key.sql` - Database migration file (NEW)

## Steps to Deploy
1. Run the SQL migration file in your Supabase database
2. Deploy the code changes
3. Admins can now create blog posts successfully

## Result
✅ Admins can create blog posts using their admin ID
✅ Blog posts are correctly linked to admin authors
✅ Author information is fetched from the admins table
✅ Full cascade delete support (deleting an admin deletes their posts)
