-- Add cover_image field to admins table (if not already exists)
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS cover_image character varying(500) null;

-- Add comment for documentation
COMMENT ON COLUMN public.admins.profile_picture IS 'URL to the admin profile picture in profile_pictures storage bucket';
COMMENT ON COLUMN public.admins.cover_image IS 'URL to the admin cover image in cover_images storage bucket';
COMMENT ON COLUMN public.admins.google_id IS 'Google OAuth ID for authentication';
