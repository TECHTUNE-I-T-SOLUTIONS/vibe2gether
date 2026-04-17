-- ============================================
-- ADMIN PANEL DATABASE SETUP - COPY & PASTE
-- ============================================
-- 
-- Run this SQL in Supabase SQL Editor to create the required tables
-- for admin featured requests and notifications
--
-- Steps:
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "+ New Query"
-- 4. Copy and paste the SQL below
-- 5. Click "Run" button
--
-- ============================================

-- ============================================
-- TABLE 1: FEATURED REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.featured_requests (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title character varying(255) NOT NULL,
  description text NOT NULL,
  type character varying(50) NOT NULL,
  image_url character varying(500),
  status character varying(50) NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL,
  views integer DEFAULT 0,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT featured_requests_pkey PRIMARY KEY (id),
  CONSTRAINT featured_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_requests_user_id ON public.featured_requests USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON public.featured_requests USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_featured_requests_created_at ON public.featured_requests USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_featured_requests_type ON public.featured_requests USING btree (type) TABLESPACE pg_default;

-- ============================================
-- TABLE 2: ADMIN NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NOT NULL,
  type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  message text,
  related_type character varying(50),
  related_id uuid,
  action_url character varying(500),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT admin_notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications USING btree (admin_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications USING btree (is_read) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id_is_read ON public.admin_notifications USING btree (admin_id, is_read) TABLESPACE pg_default;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after to verify tables were created:

-- SELECT * FROM public.featured_requests LIMIT 1;
-- SELECT * FROM public.admin_notifications LIMIT 1;

-- ============================================
-- OPTIONAL: ENABLE ROW LEVEL SECURITY
-- ============================================
-- Uncomment to enable RLS (recommended for production):

-- ALTER TABLE public.featured_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
