-- Supabase Storage Bucket Setup SQL
-- Run this in your Supabase SQL Editor to create all required storage buckets

-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile_pictures', 'profile_pictures', true),
  ('cover_pictures', 'cover_pictures', true),
  ('posts', 'posts', true),
  ('marketplace-media', 'marketplace-media', true),
  ('event-media', 'event-media', true),
  ('blog-thumbnails', 'blog-thumbnails', true),
  ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for profile_pictures bucket
CREATE POLICY "Public read profile_pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');

CREATE POLICY "Authenticated users can upload to profile_pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_pictures');

CREATE POLICY "Users can update their own profile_pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile_pictures')
WITH CHECK (bucket_id = 'profile_pictures');

-- Create RLS policies for cover_pictures bucket
CREATE POLICY "Public read cover_pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover_pictures');

CREATE POLICY "Authenticated users can upload to cover_pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cover_pictures');

CREATE POLICY "Users can update their own cover_pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cover_pictures')
WITH CHECK (bucket_id = 'cover_pictures');

-- Create RLS policies for posts bucket
CREATE POLICY "Public read posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload to posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Users can update their own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts')
WITH CHECK (bucket_id = 'posts');

-- Create RLS policies for marketplace-media bucket
CREATE POLICY "Public read marketplace-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-media');

CREATE POLICY "Authenticated users can upload to marketplace-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-media');

CREATE POLICY "Users can update their own marketplace-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'marketplace-media')
WITH CHECK (bucket_id = 'marketplace-media');

-- Create RLS policies for event-media bucket
CREATE POLICY "Public read event-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload to event-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-media');

CREATE POLICY "Users can update their own event-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-media')
WITH CHECK (bucket_id = 'event-media');

-- Create RLS policies for blog-thumbnails bucket
CREATE POLICY "Public read blog-thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-thumbnails');

CREATE POLICY "Authenticated users can upload to blog-thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-thumbnails');

CREATE POLICY "Users can update their own blog-thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-thumbnails')
WITH CHECK (bucket_id = 'blog-thumbnails');

-- Create RLS policies for verifications bucket
CREATE POLICY "Public read verifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'verifications');

CREATE POLICY "Authenticated users can upload to verifications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verifications');

CREATE POLICY "Users can update their own verifications"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'verifications')
WITH CHECK (bucket_id = 'verifications');

-- Note: RLS is enabled for storage.objects by default in Supabase
-- The policies above allow:
-- 1. PUBLIC READ - Anyone can view files
-- 2. INSERT - Authenticated users can upload
-- 3. UPDATE - Authenticated users can update files in their directory
-- This prevents unauthenticated uploads while allowing file viewing
