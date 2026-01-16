# Blog Posts System - Complete Admin Panel Fixes

## Issues Fixed

### 1. Edit Modal Not Prefilling Blog Post Details
**Problem**: When clicking edit on a blog post, the modal didn't show the current post content, excerpt, tags, etc.

**Root Causes**:
- `getBlogPosts()` query was missing the `content` field - only returned `excerpt`
- Field name mismatch: database uses `thumbnail` but code was checking `thumbnail_url`
- `status` field concept vs actual `is_published` boolean in database
- Missing `is_published` and `is_featured` fields in query result

**Solutions Implemented**:
1. **Updated `getBlogPosts()` query** in `lib/supabase/queries.ts`:
   - Added `content` field (was missing - this was the main issue!)
   - Added `is_published` field
   - Added `is_featured` field
   - Added `updated_at` field
   - Now returns all necessary fields for editing

2. **Fixed thumbnail field handling** in edit modal:
   - Changed from checking only `thumbnail_url` to checking both `thumbnail_url || thumbnail`
   - This handles both old and new field names
   - Properly displays current thumbnail

3. **Fixed status field mapping**:
   - Database has `is_published` boolean (not `status` string)
   - Edit modal now properly converts between `is_published` boolean and UI `status` string
   - When editing, reads from `is_published` and saves back to `is_published`

4. **Fixed table display**:
   - Status badge now shows correct value based on `is_published`
   - Displays "Published" or "Draft" appropriately

### 2. React 19 Params Warning (Previous Fix)
- Updated blog detail page to properly unwrap params Promise with `React.use()`
- Fixed dependency array

### 3. Tags Support in Edit Modal
- Added tags input field to edit dialog
- Tags display as comma-separated text
- Properly converted back to array format before saving

## Files Updated

1. **lib/supabase/queries.ts**
   - Enhanced `getBlogPosts()` to return all fields needed for editing

2. **app/admin/blog/page.tsx**
   - Fixed thumbnail field handling to use both `thumbnail` and `thumbnail_url`
   - Fixed status field to properly map to `is_published`
   - Updated table display to show correct status
   - Added tags field to edit dialog
   - Fixed edit form prefilling logic

## How It Works Now

### Create Blog Post Flow:
1. Admin fills in: title, content, excerpt, category, tags, status, featured flag
2. Optionally selects and auto-uploads image
3. Post created with:
   - `is_published: true/false` (based on status)
   - `thumbnail: <image_url>`
   - `tags: [array]`
   - Auto-generated slug

### Edit Blog Post Flow:
1. Admin clicks Edit button on a post
2. Modal opens and automatically populates all fields:
   - Title, Content (now included!), Excerpt
   - Category, Tags, Status (from is_published)
   - Current thumbnail preview
   - Featured checkbox
3. Admin can update any field
4. Changes saved back to database

## Testing
To verify the fix:
1. Create a blog post with content and tags
2. Click Edit on any post
3. Verify all fields are prefilled:
   - Title ✓
   - Content ✓ (was missing before)
   - Excerpt ✓
   - Category ✓
   - Tags ✓
   - Thumbnail preview ✓
   - Status (Published/Draft) ✓
   - Featured checkbox ✓
4. Make changes and save
5. Edit again to verify changes persist
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
