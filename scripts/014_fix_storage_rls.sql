-- Fix Storage RLS Policy
-- Run this in your Supabase SQL Editor to allow public uploads without authentication

-- Disable RLS on storage.objects to allow completely public access
-- Since you're not using Supabase Auth, this is the simplest solution
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- If you want to re-enable RLS later with public policies, use these instead:
-- 
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Public uploads" ON storage.objects;
-- DROP POLICY IF EXISTS "Public reads" ON storage.objects;
-- 
-- -- Allow anyone to upload
-- CREATE POLICY "Public uploads" ON storage.objects
-- FOR INSERT WITH CHECK (true);
-- 
-- -- Allow anyone to read
-- CREATE POLICY "Public reads" ON storage.objects
-- FOR SELECT USING (true);
-- 
-- -- Allow anyone to update their own files
-- CREATE POLICY "Public updates" ON storage.objects
-- FOR UPDATE WITH CHECK (true);
-- 
-- -- Allow anyone to delete their own files
-- CREATE POLICY "Public deletes" ON storage.objects
-- FOR DELETE USING (true);
