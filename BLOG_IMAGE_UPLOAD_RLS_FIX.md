# Blog Image Upload Fix - RLS Policy Issue Resolution

## Problem
When trying to upload blog post images (thumbnails), users got:
```
StorageApiError: new row violates row-level security policy
statusCode: "403"
error: "Unauthorized"
```

This happened during both **create** and **edit** operations.

## Root Cause
The frontend was directly uploading to Supabase Storage using the **anon key** (client-side). Supabase has Row Level Security (RLS) policies that restrict who can upload files. The anon key doesn't have sufficient permissions, hence the 403 error.

## Solution
Use the **service role key** on the backend to bypass RLS policies. The service role key should NEVER be exposed to the client.

### Architecture
```
Frontend (blog admin page)
    ↓
POST /api/admin/upload-blog-image (backend API route)
    ↓
Supabase Storage (using service role key - bypasses RLS)
    ↓
Returns public URL back to frontend
```

## Implementation

### 1. Created Service Role Client Function
**File**: `lib/supabase/server.ts`

Added `createServiceRoleClient()` that uses the `SUPABASE_SERVICE_ROLE_KEY`:
```typescript
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← Uses service role key (server-side only)
  )
}
```

### 2. Created Upload API Route
**File**: `app/api/admin/upload-blog-image/route.ts`

New POST endpoint that:
- ✅ Verifies admin authentication (checks JWT token)
- ✅ Receives file from FormData
- ✅ Uses service role client to upload (bypasses RLS)
- ✅ Returns public URL to frontend
- ✅ Handles errors gracefully

```typescript
export async function POST(request: NextRequest) {
  // 1. Verify admin token
  const token = cookieStore.get('admin_token')?.value
  // 2. Validate JWT
  // 3. Get file from FormData
  // 4. Upload using service role client (RLS bypassed)
  // 5. Return public URL
}
```

### 3. Updated Admin Blog Page
**File**: `app/admin/blog/page.tsx`

Changed upload functions to call the new API instead of uploading directly:

**Before** (client-side, fails with 403):
```typescript
const { data, error } = await supabase.storage
  .from("blog-thumbnails")
  .upload(fileName, selectedImage, { cacheControl: "3600", upsert: true })
```

**After** (backend API, uses service role):
```typescript
const formData = new FormData()
formData.append('file', selectedImage)

const response = await fetch('/api/admin/upload-blog-image', {
  method: 'POST',
  body: formData,
})

const data = await response.json()
// data.url contains the public URL
```

Updated both:
- `uploadImage()` - for create operation
- `handleEditPost()` - for edit operation with new thumbnail

## Configuration Required

Make sure your environment variables include:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  (public, for client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      (SECRET, server-side only!)
```

**IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` should ONLY be in:
- `.env.local` (never commit)
- Server environment variables (Vercel, etc.)
- NEVER exposed to the client

## Files Modified

1. ✅ `lib/supabase/server.ts` - Added `createServiceRoleClient()` function
2. ✅ `app/admin/blog/page.tsx` - Updated `uploadImage()` and `handleEditPost()` to use API
3. ✅ `app/api/admin/upload-blog-image/route.ts` - NEW - Backend upload endpoint

## How It Works Now

### Create Blog Post with Image:
1. Admin selects image file
2. Clicks "Create Post"
3. Frontend calls `/api/admin/upload-blog-image` with file
4. Backend authenticates admin and uploads using service role key
5. Returns public URL
6. Post created with thumbnail_url

### Edit Blog Post with New Image:
1. Admin clicks Edit
2. Selects new image (optional)
3. Clicks Save
4. Frontend calls `/api/admin/upload-blog-image` with new image
5. Backend authenticates and uploads
6. Returns public URL
7. Post updated with new thumbnail

## Security

✅ **Secure because:**
- API endpoint verifies JWT token (only authenticated admins)
- Service role key never exposed to frontend
- File upload still goes through authentication layer
- RLS bypassed intentionally on backend (safe because of prior auth check)

❌ **Would be insecure if:**
- We exposed service role key to frontend (we don't!)
- We allowed uploads without authentication (we verify JWT)
- We uploaded user files with service role (we only do admin uploads)

## Testing

To verify the fix:
1. Go to Admin → Blog Management
2. Create a new post with an image:
   - [ ] Fill in title, content
   - [ ] Select thumbnail image
   - [ ] Click Create Post
   - [ ] Verify image uploaded successfully (no 403 error)
   - [ ] Verify post appears in list with thumbnail
3. Edit the post with a new image:
   - [ ] Click Edit on the post
   - [ ] Select different thumbnail
   - [ ] Click Save
   - [ ] Verify new image uploaded (no 403 error)
   - [ ] Verify thumbnail updated in list

## Troubleshooting

**Still getting 403 error?**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in your server environment
- Restart your dev server after adding the env var
- Check browser console for actual error message

**Upload endpoint returns 401?**
- Verify admin is logged in
- Check that `admin_token` cookie is set
- Verify JWT token is valid

**File uploads but doesn't appear?**
- Check that `blog-thumbnails` bucket exists in Supabase
- Verify bucket is public (for getting public URLs)
- Check bucket RLS policies don't block service role access

## Summary
✅ Image uploads now work via backend API using service role key
✅ RLS policies bypassed safely on backend
✅ Frontend still properly authenticated
✅ Public URLs returned and stored in database
