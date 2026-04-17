# Quick Start: Blog Image Upload - After Implementing Fix

## What Changed
You can now upload blog post images when creating or editing posts. The upload uses a secure backend API instead of direct client-side upload.

## What You Need to Do

### 1. Add Service Role Key to Environment
Update your `.env.local` file with:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

To get this key:
1. Go to Supabase Dashboard
2. Navigate to: Settings → API
3. Under "Project API Keys", copy the "Service Role Key" (Secret key)
4. ⚠️ NEVER commit this to git or expose to frontend

### 2. Ensure blog-thumbnails Bucket Exists
In Supabase:
1. Go to Storage → Buckets
2. Check if "blog-thumbnails" bucket exists
3. If not, create it:
   - Name: `blog-thumbnails`
   - Make it Public (for public URLs)
4. If it has RLS policies, they don't matter anymore (service role bypasses them)

### 3. Test It
1. Go to Admin → Blog Management
2. Click "Create Post"
3. Fill in title and content
4. Select a thumbnail image
5. Click "Create Post"
6. If successful:
   - ✅ No 403 error
   - ✅ Post appears in list
   - ✅ Thumbnail displays

## Files Changed

### New Files
- `app/api/admin/upload-blog-image/route.ts` - Upload endpoint

### Modified Files
- `lib/supabase/server.ts` - Added service role client
- `app/admin/blog/page.tsx` - Uses API instead of direct upload

## How It Works (Technical)

1. **Frontend**: User selects image, clicks Create/Edit
2. **API Call**: Browser POSTs file to `/api/admin/upload-blog-image`
3. **Backend**: Verifies admin JWT token, uses service role key to upload
4. **Upload**: File stored in Supabase with RLS bypassed
5. **Response**: Public URL returned to frontend
6. **Save**: Post created/updated with thumbnail URL

## Error Messages

If you see errors:

**"Unauthorized - No token"**
- Make sure you're logged in as admin

**"Unauthorized - Invalid token"**
- Admin token expired, log in again

**"No file provided"**
- Bug: file wasn't sent, try again

**"Upload failed" (with message)**
- File might be too large or wrong format
- Check file size and type

**"StorageError: bucket not found"**
- `blog-thumbnails` bucket doesn't exist
- Create it in Supabase Storage

## Environment Variables Checklist

```
✅ NEXT_PUBLIC_SUPABASE_URL        (public - in repo)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY   (public - in repo)
✅ SUPABASE_SERVICE_ROLE_KEY       (SECRET - .env.local only!)
✅ JWT_SECRET                       (SECRET - should already exist)
```

If uploads still fail after this, double-check:
1. Service role key is set correctly
2. Key was added before restarting dev server
3. Key is valid and hasn't been regenerated

## Support

If you still have issues:
1. Check browser console (F12) for detailed errors
2. Check server logs in terminal
3. Verify all environment variables are set
4. Verify bucket exists and is public
5. Try a different image file
