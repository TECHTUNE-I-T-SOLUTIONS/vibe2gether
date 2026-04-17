# Supabase Storage Setup

Since we're using Supabase only for file storage (not authentication), we need to configure the storage buckets to allow public uploads without RLS restrictions.

## Storage Bucket Configuration

### 1. Create Public Buckets

In Supabase Dashboard, create these public buckets:
- `profile_pictures` - For user profile pictures
- `cover_pictures` - For user cover/banner pictures
- `posts` - For user post images/videos
- `verifications` - For storing uploaded ID documents and selfies (used by the verification workflow)

### 2. Disable or Configure RLS Policies

**Option A: Disable RLS (Easiest for public storage)**

1. Go to Supabase Dashboard → Storage → Buckets
2. For each bucket (`profile_pictures`, `cover_pictures`, `posts`):
   - Click the bucket settings
   - Find "RLS" toggle and **disable it**
   - This allows public uploads without authentication

**Option B: Set Public Policy (More Secure)**

If you want to keep RLS enabled, add this policy in SQL Editor:

```sql
-- Allow public uploads to profile_pictures bucket
CREATE POLICY "Public uploads to profile_pictures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile_pictures');

-- Allow public reads from profile_pictures bucket
CREATE POLICY "Public read profile_pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile_pictures');

-- Similar policies for other buckets
CREATE POLICY "Public uploads to cover_pictures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cover_pictures');

CREATE POLICY "Public read cover_pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cover_pictures');

CREATE POLICY "Public uploads to posts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Public read posts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');
```

## Environment Variables

Set these in your `.env.local`:

```env
# Supabase (Storage only, no auth)
NEXT_PUBLIC_SUPABASE_URL="https://[your-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Database Connection
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## File Upload Endpoints

All file uploads use the **Supabase Anon Key** (public access):

- `POST /api/auth/register` - Handles profile picture uploads during signup
- `POST /api/auth/complete-profile` - Handles profile picture uploads during Google signup flow
- `POST /api/upload` - General file upload endpoint (create if needed)

## Bucket Access URLs

After uploading, files are accessible at:

```
https://[your-project].supabase.co/storage/v1/object/public/profile_pictures/[filename]
```

Example file structure:
```
profile_pictures/
  ├── user-123-profile.jpg
  ├── user-124-profile.jpg
  └── ...

cover_pictures/
  ├── user-123-cover.jpg
  ├── user-124-cover.jpg
  └── ...

posts/
  ├── post-123-image-1.jpg
  ├── post-123-image-2.jpg
  └── ...
```

## Troubleshooting

### Error: "row violates row-level security policy"

**Solution:** Disable RLS on the storage bucket (Option A above)

### Error: "Invalid API Key"

**Solution:** Make sure you're using `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not the service role key for client-side uploads

### Error: "Bucket not found"

**Solution:** Verify the bucket name exists and matches exactly (case-sensitive) in your code

### Files not accessible

**Solution:** 
1. Verify bucket is set to "public" in Supabase Dashboard
2. Check file URL format is correct
3. Ensure file was uploaded successfully (check response)

## Best Practices

1. **Use anon key for public uploads** - This is intentionally limited to prevent abuse
2. **Validate file types** - Check MIME type before uploading
3. **Limit file size** - Enforce size limits on frontend and backend
4. **Use unique filenames** - Include user ID and timestamp to avoid conflicts
5. **Implement rate limiting** - Prevent upload spam
6. **Add virus scanning** - Consider using a service like ClamAV for security

## File Upload Example

```typescript
// Client-side upload
const { data, error } = await supabaseClient
  .storage
  .from('profile_pictures')
  .upload(`user-${userId}-profile-${Date.now()}.jpg`, file, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error)
} else {
  const publicURL = `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.path}`
}
```

---

For more info: https://supabase.com/docs/guides/storage
