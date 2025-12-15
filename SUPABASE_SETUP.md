# Supabase Setup Guide

This guide will help you set up Supabase for Vibe2Gether.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Wait for the project to initialize

## Environment Variables

Create a `.env.local` file in the root directory with these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Where to get these values:

1. **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
   - Go to Supabase Project Settings → API
   - Copy the Project URL and Anon Key

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Same location as above, scroll down to find Service Role Key
   - ⚠️ Keep this secret! Never commit it to git

3. **NEXTAUTH_SECRET**:
   - Generate with: `openssl rand -base64 32`

4. **Google OAuth**:
   - Go to https://console.cloud.google.com/
   - Create a new OAuth 2.0 credential
   - Set authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`

## Database Setup

1. Go to your Supabase project → SQL Editor
2. Run the SQL script to create all tables (see `/scripts/` directory)
3. Execute the SQL in this order:
   - `001_create_users_table.sql`
   - `002_create_posts_table.sql`
   - `003_create_engagement_tables.sql`
   - `004_create_follows_table.sql`
   - `005_create_coins_transactions.sql`
   - `006_create_matches_table.sql`
   - `007_create_messages_table.sql`
   - `008_create_notifications_table.sql`
   - `009_create_sessions_table.sql`
   - `010_create_reports_table.sql`
   - `011_create_rpc_functions.sql`

## Storage Bucket Setup

### Create `profile_pictures` Bucket

1. Go to Supabase Project → Storage
2. Create a new bucket named `profile_pictures`
3. Set it to **Public** (make it accessible without authentication)

### Set Up RLS Policies

The application uses the **Service Role Key** for file uploads (which bypasses RLS), so you can keep simple policies. Here's the recommended setup:

1. Go to Storage → Policies
2. For the `profile_pictures` bucket, add these policies:

**Allow public SELECT (Read)**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');
```

**Allow service role INSERT**
```sql
CREATE POLICY "Service role insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_pictures');
```

**Allow service role UPDATE**
```sql
CREATE POLICY "Service role update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile_pictures')
WITH CHECK (bucket_id = 'profile_pictures');
```

## Authentication Setup

### Enable Google OAuth

1. Go to Supabase Project → Authentication → Providers
2. Enable "Google"
3. Enter your Google Client ID and Client Secret
4. Add redirect URL: `http://localhost:3000/api/auth/callback/google`

## Running the Application

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual values

# Run development server
pnpm dev
```

Visit `http://localhost:3000` and test the signup flow.

## Troubleshooting

### "row violates row-level security policy"
- Make sure you've created the `profile_pictures` bucket
- Verify RLS policies are set up correctly
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### "Invalid source map"
- This is a warning and can be ignored
- The app will still work correctly

### "getaddrinfo ENOTFOUND supabase.co"
- Check your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Make sure you have internet connectivity
- Verify the Supabase project is active

### Google OAuth not working
- Verify the OAuth app is set up correctly in Google Cloud Console
- Check the redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Ensure Client ID and Secret are correct in `.env.local`

## Next Steps

1. Create user profiles
2. Test sign up with both credentials and Google OAuth
3. Upload profile pictures to verify storage works
4. Explore dashboard and other features
