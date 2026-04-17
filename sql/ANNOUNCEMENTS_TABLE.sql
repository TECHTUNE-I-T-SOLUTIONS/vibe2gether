-- Create announcements table for admin-created notifications/announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id UUID NOT NULL,
  title CHARACTER VARYING(255) NOT NULL,
  message TEXT NOT NULL,
  description TEXT NULL,
  type CHARACTER VARYING(50) NOT NULL DEFAULT 'general'::CHARACTER VARYING,
  priority CHARACTER VARYING(20) NOT NULL DEFAULT 'normal'::CHARACTER VARYING,
  background_color CHARACTER VARYING(20) NULL DEFAULT '#6366f1'::CHARACTER VARYING,
  text_color CHARACTER VARYING(20) NULL DEFAULT '#ffffff'::CHARACTER VARYING,
  icon CHARACTER VARYING(100) NULL,
  image_url CHARACTER VARYING(500) NULL,
  action_url CHARACTER VARYING(500) NULL,
  action_label CHARACTER VARYING(100) NULL,
  is_active BOOLEAN NULL DEFAULT true,
  is_published BOOLEAN NULL DEFAULT true,
  scheduled_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  views_count INTEGER NULL DEFAULT 0,
  clicks_count INTEGER NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for announcements table
CREATE INDEX IF NOT EXISTS idx_announcements_admin_id ON public.announcements USING btree (admin_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements USING btree (is_published) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements USING btree (priority) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements USING btree (type) TABLESPACE pg_default;

-- Add policy for announcements table (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all announcements
CREATE POLICY announcements_select_policy ON public.announcements FOR SELECT
  USING (true);

-- Policy: Only the admin who created can update/delete
CREATE POLICY announcements_update_policy ON public.announcements FOR UPDATE
  USING (admin_id = (SELECT id FROM admins WHERE id = auth.uid()))
  WITH CHECK (admin_id = (SELECT id FROM admins WHERE id = auth.uid()));

CREATE POLICY announcements_delete_policy ON public.announcements FOR DELETE
  USING (admin_id = (SELECT id FROM admins WHERE id = auth.uid()));

-- Policy: Only admins can insert
CREATE POLICY announcements_insert_policy ON public.announcements FOR INSERT
  WITH CHECK ((SELECT role FROM admins WHERE id = auth.uid()) IS NOT NULL);
