# Blog System - Quick Start Guide

## For Users

### Reading Blog Posts
1. Go to `/blog` to see all blog posts
2. Click on any post to read it
3. Your view is automatically counted
4. To like a post: Click the heart button (login required)
5. To comment: Write in the comment box and click "Post Comment" (login required)

### What Happens If You're Not Logged In
- **Like button**: Shows alert "Please log in to like this post" with option to login
- **Comment button**: Shows alert "Please log in to comment on this post" with option to login

---

## For Admins

### Creating a Blog Post

**URL**: `/admin/blog` → Click "+ Create Post"

**Fields to fill**:
- **Title** (required) - Post headline
- **Category** - Choose from: Technology, Lifestyle, Business, Entertainment, Other
- **Tags** - Enter as comma-separated values (e.g., "react, javascript, web")
- **Excerpt** - Short summary of the post
- **Content** (required) - Full article text
- **Thumbnail Image** - Click to upload an image
- **Status** - Choose Draft or Published
- **Featured** - Check to feature on homepage

**Process**:
1. Fill in all required fields
2. Select thumbnail image (auto-uploads)
3. Click "Create Post"
4. Post is created and visible if set to "Published"

### Editing a Blog Post

**URL**: `/admin/blog` → Click pencil icon on a post

**What auto-populates**:
- All fields are pre-filled from the database
- Tags display as comma-separated text (easy to edit)
- Current thumbnail shows with option to change

**Editing process**:
1. Change any fields you want
2. If changing tags: Enter as comma-separated values
3. If changing image: Click "Change Thumbnail" to upload new one
4. Click "Save Changes"

### What Gets Saved

When you create/update a post, the system saves:
- ✅ Title, content, excerpt
- ✅ Category
- ✅ Tags (as array in database)
- ✅ Thumbnail image (uploaded to Supabase storage)
- ✅ Published status
- ✅ Featured status
- ✅ Author (automatically set to logged-in admin)
- ✅ Creation/update timestamps
- ✅ Auto-generated slug for URL

---

## Tracking & Analytics

### View Counts
- Automatic: Increments when user opens the blog detail page
- Displayed: On blog listing and detail page
- How it works: Non-blocking update to database

### Like Counts
- Manual: User clicks heart button to like
- Stored in: `blog_likes` table (one entry per user per post)
- Displayed: Heart button shows total count
- Features:
  - Visual feedback (heart fills when liked)
  - One like per user per post
  - User can unlike by clicking again

### Comment Counts
- Manual: User submits comment form
- Stored in: `blog_comments` table
- Displayed: Comment button shows total count
- Features:
  - Comments auto-approved
  - Shows user profile picture and name
  - Shows comment timestamp
  - Displayed in reverse chronological order (newest first)

---

## Common Issues & Solutions

### Tags Not Saving
✅ FIXED - Now saves correctly as array
- Make sure to separate tags with commas: `tag1, tag2, tag3`
- No commas at the beginning or end

### Image Not Uploading
✅ FIXED - Now uses service role key
- Make sure file size is reasonable
- Supported formats: jpg, png, gif, webp
- If it fails, error alert will show

### Post Not Appearing When Published
- Check that status is set to "Published" (not Draft)
- Verify it appears in `/admin/blog` list
- Go to `/blog` public page to see if it shows

### Comments Not Showing
- Comments must be `is_approved = true` (they auto-approve)
- Refresh the page to see newest comments
- Comments show in reverse chronological order (newest first)

### Likes Not Working
- User must be logged in
- If not logged in, alert will prompt to login
- After login, like should work
- Can unlike by clicking heart again

---

## API Endpoints (For Developers)

### Upload Blog Image
```
POST /api/admin/upload-blog-image
- Requires: admin_token cookie (JWT)
- Body: FormData with 'file' field
- Returns: { success: true, url: string, fileName: string }
```

### Blog Operations
```
- CREATE: Direct Supabase insert from admin page
- READ: GET /blog (public), /admin/blog (admin)
- UPDATE: Direct Supabase update from edit modal
- DELETE: Direct Supabase delete with confirm
```

### View Tracking
```
- Automatic: PATCH /blog_posts when detail page loads
- Increments: views_count by 1
```

### Likes & Comments
```
- Create like: INSERT into blog_likes
- Delete like: DELETE from blog_likes
- Create comment: INSERT into blog_comments (auto-approved)
- Update counts: PATCH blog_posts likes_count and comments_count
```

---

## Data Relationships

```
admins (author) -------- blog_posts (content)
                             ↓
                        blog_likes (likes)
                             ↓
                        blog_comments (comments)
                             ↓
                           users (commenters)
```

All relationships use foreign keys with CASCADE delete for data integrity.
