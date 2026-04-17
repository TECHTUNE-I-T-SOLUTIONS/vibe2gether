# Blog Image Upload - RLS Policy Fix - Complete Summary

## The Problem (403 Unauthorized)
```
StorageApiError: new row violates row-level security policy
statusCode: "403"
error: "Unauthorized"
```

This occurred when trying to upload blog post thumbnails during create or edit operations.

## Why It Happened

### Supabase RLS (Row Level Security)
- Supabase protects Storage with RLS policies
- Only authorized users/roles can upload files
- The **anon key** (public) has limited permissions
- File uploads need special permissions

### What Was Wrong
```typescript
// ❌ OLD CODE - Frontend uploading directly
const supabase = createClient()  // Uses anon key
const { data, error } = await supabase.storage
  .from("blog-thumbnails")
  .upload(fileName, file, { upsert: true })  // ← RLS blocks this
```

The frontend was using the **anon key** which doesn't have permission to upload files, even though the user is an authenticated admin.

## The Solution

### Service Role Key = Bypass RLS
```typescript
// ✅ NEW CODE - Backend using service role
const supabase = createServiceRoleClient()  // Uses service role key
const { data, error } = await supabase.storage
  .from("blog-thumbnails")
  .upload(fileName, buffer, { ... })  // ← RLS bypassed, works!
```

The **service role key** is like a master key - it bypasses RLS policies.

### Why It's Secure
```
User is authenticated (verified JWT token)
    ↓
API endpoint checks JWT before uploading
    ↓
Only admins can reach this endpoint
    ↓
Use service role key to upload (safe because auth already verified)
    ↓
Result: Secure upload without exposing service role to frontend
```

## Implementation Details

### 1. Backend Service Role Client
**File**: `lib/supabase/server.ts`
```typescript
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← SECRET KEY
  )
}
```

Key points:
- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` from environment
- ✅ Only available on server (not exposed to browser)
- ✅ Creates a Supabase client with elevated permissions

### 2. Backend Upload Endpoint
**File**: `app/api/admin/upload-blog-image/route.ts`

Handles:
1. Authentication verification (checks JWT token)
2. File extraction from FormData
3. Upload using service role client
4. Returns public URL

```typescript
POST /api/admin/upload-blog-image
├─ Verify admin_token (JWT)
├─ Get file from FormData
├─ Upload with service role client
├─ Get public URL
└─ Return { success, url, fileName }
```

### 3. Frontend Updates
**File**: `app/admin/blog/page.tsx`

Changed upload functions:
```typescript
// uploadImage() - for create
const response = await fetch('/api/admin/upload-blog-image', {
  method: 'POST',
  body: formData  // Contains file
})

// handleEditPost() - for edit
// Same pattern for uploading new thumbnail
```

## Data Flow Diagram

### Create Blog Post
```
Admin selects image + fills form
         ↓
    Click "Create"
         ↓
  Upload image via API
         ↓
 /api/admin/upload-blog-image
  └─ Verify JWT token
  └─ Upload with service role
  └─ Return public URL
         ↓
   Create post in DB
   with thumbnail URL
         ↓
   Post appears in list
      with image
```

### Edit Blog Post
```
Admin selects new image
         ↓
   Click "Save"
         ↓
Upload image via API
         ↓
 /api/admin/upload-blog-image
  └─ Verify JWT token
  └─ Upload with service role
  └─ Return public URL
         ↓
   Update post in DB
   with new thumbnail URL
         ↓
    Thumbnail updated
```

## Security Model

### Before (Unsafe)
```
Frontend + Anon Key
    ↓
Upload directly to storage
    ↓
RLS blocks (403 error)
❌ Doesn't work + security risk if it did
```

### After (Secure)
```
Frontend
    ↓
POST to API with JWT
    ↓
API verifies JWT (only admins can upload)
    ↓
API uses Service Role Key to upload
    ↓
Service Role Key NEVER sent to browser
✅ Works + secure + RLS policies make sense
```

## Environment Configuration

Required environment variables:
```env
# Public (safe to commit)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# SECRET (DO NOT COMMIT - .env.local only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=your-jwt-secret
```

**Critical**: `SUPABASE_SERVICE_ROLE_KEY` must be in:
- `.env.local` (local development)
- Server environment variables (Vercel, etc.)
- ❌ NEVER in git
- ❌ NEVER in .env.example
- ❌ NEVER in browser console

## Testing Checklist

- [ ] Service role key added to `.env.local`
- [ ] Dev server restarted after adding env var
- [ ] `blog-thumbnails` bucket exists in Supabase
- [ ] Bucket is set to Public
- [ ] Logged in as admin
- [ ] Create blog post with image
  - [ ] No 403 error in console
  - [ ] Image uploads successfully
  - [ ] Thumbnail appears in post list
- [ ] Edit blog post with new image
  - [ ] No 403 error
  - [ ] New image uploads
  - [ ] Thumbnail updates in list
- [ ] Try with different image sizes
- [ ] Try with different formats (jpg, png, etc)

## Files Changed

### New Files Created
```
app/api/admin/upload-blog-image/route.ts  (NEW - Backend upload endpoint)
```

### Modified Files
```
lib/supabase/server.ts                     (Added createServiceRoleClient)
app/admin/blog/page.tsx                    (Updated uploadImage & handleEditPost)
```

### Documentation Files
```
BLOG_IMAGE_UPLOAD_RLS_FIX.md               (Detailed technical explanation)
BLOG_UPLOAD_SETUP_GUIDE.md                 (Quick setup guide)
ADMIN_BLOG_EDIT_FIX_SUMMARY.md             (Previous edit modal fix)
```

## Verification

Once implemented, verify with:

1. **Check API exists**
   ```bash
   curl -X POST http://localhost:3000/api/admin/upload-blog-image \
     -H "Cookie: admin_token=your-jwt" \
     -F "file=@image.jpg"
   ```

2. **Check environment variable**
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY  # Should show value, not empty
   ```

3. **Check client function exists**
   ```bash
   grep -r "createServiceRoleClient" lib/supabase/server.ts
   ```

4. **Check API is being called**
   - Open browser DevTools (F12)
   - Network tab
   - Upload image
   - Should see request to `/api/admin/upload-blog-image`
   - Response should include `url` field

## What to Tell Users

> "Blog post image uploads now work! When creating or editing a blog post, you can upload a thumbnail image. The upload happens securely through our backend using an admin API key."

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 403 Unauthorized | Service role key not set | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart |
| 401 Unauthorized | Not logged in or token invalid | Log in again as admin |
| File not found | Wrong file path | Check file exists before uploading |
| Bucket not found | `blog-thumbnails` bucket missing | Create bucket in Supabase Storage |
| No URL returned | Upload succeeded but URL generation failed | Check bucket is set to Public |
| Large file fails | File too large | Check Supabase file size limits |

## Summary

✅ **Implemented**: Secure backend upload using service role key
✅ **Fixed**: 403 RLS policy error
✅ **Created**: New API endpoint `/api/admin/upload-blog-image`
✅ **Updated**: Frontend to use API instead of direct storage
✅ **Documented**: Setup and troubleshooting guides
✅ **Secured**: Service role key stays on server only
