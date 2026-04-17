-- Announcements System - Deployment Instructions
-- Generated: December 2024
-- Status: Ready to Deploy

-- HOW TO DEPLOY:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy this entire file
-- 4. Click "Create a new query"
-- 5. Paste the contents
-- 6. Click "Run"
-- 7. You should see: "Success. No rows returned" or similar
-- 8. The announcements table is now ready to use

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================

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

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_announcements_admin_id ON public.announcements USING btree (admin_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements USING btree (is_published) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements USING btree (priority) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements USING btree (type) TABLESPACE pg_default;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read published announcements
DROP POLICY IF EXISTS announcements_select_public ON public.announcements;
CREATE POLICY announcements_select_public ON public.announcements FOR SELECT
  USING (is_published = true);

-- Policy: Only the admin who created can update/delete
DROP POLICY IF EXISTS announcements_update_policy ON public.announcements;
CREATE POLICY announcements_update_policy ON public.announcements FOR UPDATE
  USING (admin_id = (SELECT id FROM admins WHERE id = auth.uid()))
  WITH CHECK (admin_id = (SELECT id FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS announcements_delete_policy ON public.announcements;
CREATE POLICY announcements_delete_policy ON public.announcements FOR DELETE
  USING (admin_id = (SELECT id FROM admins WHERE id = auth.uid()));

-- Policy: Only admins can insert
DROP POLICY IF EXISTS announcements_insert_policy ON public.announcements;
CREATE POLICY announcements_insert_policy ON public.announcements FOR INSERT
  WITH CHECK ((SELECT role FROM admins WHERE id = auth.uid()) IS NOT NULL);

-- ============================================================
-- EXAMPLE DATA (Optional - remove in production)
-- ============================================================

-- Insert example announcement (find your admin ID first)
-- SELECT id FROM admins LIMIT 1;  -- Copy this ID and replace 'YOUR_ADMIN_ID'

/*
INSERT INTO public.announcements (
  admin_id,
  title,
  message,
  type,
  priority,
  background_color,
  text_color,
  action_url,
  action_label,
  is_published,
  is_active
) VALUES (
  'YOUR_ADMIN_ID',
  'Welcome to Vibe2Gether!',
  'Discover amazing people and events around you.',
  'welcome',
  'high',
  '#6366f1',
  '#ffffff',
  '/explore',
  'Explore Now',
  true,
  true
);
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'announcements';

-- Check if indexes exist
-- SELECT * FROM pg_indexes WHERE tablename = 'announcements';

-- View all announcements
-- SELECT * FROM announcements ORDER BY created_at DESC;

-- ============================================================
-- API ENDPOINTS TO CREATE
-- ============================================================

/*
POST /api/admin/announcements - Create announcement
GET /api/admin/announcements - List announcements
GET /api/admin/announcements/[id] - Get single announcement
PUT /api/admin/announcements/[id] - Update announcement
DELETE /api/admin/announcements/[id] - Delete announcement

GET /api/announcements - Public: Get active announcements for display
POST /api/announcements/[id]/view - Track announcement view
POST /api/announcements/[id]/click - Track announcement click
*/

-- ============================================================
-- FRONTEND COMPONENTS TO CREATE
-- ============================================================

/*
1. Admin Page: /app/admin/announcements/page.tsx
   - List announcements
   - Create/Edit/Delete announcements
   - Preview before publishing
   - Schedule announcements

2. User Dashboard: Add scrolling banner
   - Show active announcements
   - Scroll left to right continuously
   - Click to action
   - Track views and clicks

3. Notification Modal Component:
   - Display announcement with styling
   - Support for custom colors/icons
   - Action button (if provided)
   - Close button

4. API Routes:
   - Create API handlers for CRUD operations
   - Add view/click tracking
   - Schedule checking for scheduled announcements
*/

-- ============================================================
-- TRIGGERS FOR NOTIFICATIONS
-- ============================================================

-- Function: Create notification for all users when announcement is published
CREATE OR REPLACE FUNCTION create_announcement_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications if announcement is being published
  IF (NEW.is_published = TRUE AND (OLD.is_published = FALSE OR OLD.is_published IS NULL)) THEN
    -- Insert notification for all users
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      action_url,
      is_read
    )
    SELECT 
      id,
      'announcement',
      NEW.title,
      NEW.message,
      NEW.id,
      'announcement',
      NEW.action_url,
      FALSE
    FROM public.users
    WHERE id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create user notifications when announcement is published
DROP TRIGGER IF EXISTS announcement_user_notification_trigger ON public.announcements;
CREATE TRIGGER announcement_user_notification_trigger
AFTER INSERT OR UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION create_announcement_user_notification();

-- Function: Create notification for all admins when announcement is created
CREATE OR REPLACE FUNCTION create_announcement_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admins
  INSERT INTO public.admin_notifications (
    admin_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    is_read
  )
  SELECT 
    id,
    'announcement_created',
    'New Announcement: ' || NEW.title,
    'Admin ' || COALESCE((SELECT full_name FROM admins WHERE id = NEW.admin_id), 'Unknown') || ' created an announcement',
    NEW.id,
    'announcement',
    '/admin/announcements',
    FALSE
  FROM public.admins
  WHERE id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create admin notifications when announcement is created
DROP TRIGGER IF EXISTS announcement_admin_notification_trigger ON public.announcements;
CREATE TRIGGER announcement_admin_notification_trigger
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION create_announcement_admin_notification();

-- Function: Update user notifications when announcement expires
CREATE OR REPLACE FUNCTION mark_expired_announcements()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark related user notifications as outdated if announcement expires
  IF (NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW()) THEN
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE reference_id = NEW.id 
    AND reference_type = 'announcement'
    AND is_read = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mark notifications as read when announcement expires
DROP TRIGGER IF EXISTS announcement_expiry_trigger ON public.announcements;
CREATE TRIGGER announcement_expiry_trigger
AFTER UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION mark_expired_announcements();

-- ============================================================
-- NOTES
-- ============================================================

/*
COLOR VALUES:
- Indigo: #6366f1
- Blue: #3b82f6
- Green: #10b981
- Red: #ef4444
- Orange: #f97316
- Yellow: #eab308

TYPES:
- general
- welcome
- alert
- promotion
- maintenance
- announcement

PRIORITIES:
- low
- normal
- high
- critical

USAGE:
- Use is_active to temporarily disable
- Use is_published to keep private while editing
- Use scheduled_at for future announcements
- Use expires_at to auto-hide old announcements
- Track views/clicks for analytics

PERMISSIONS:
- Public: Can see published announcements
- Admin: Can create/edit/delete own announcements
- Super Admin: Can manage all announcements
*/

-- End of announcements system setup
