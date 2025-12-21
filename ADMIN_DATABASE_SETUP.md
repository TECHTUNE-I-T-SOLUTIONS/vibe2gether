# Database Setup - Admin Features

This guide explains the database tables needed for admin panel features.

## Required Tables and Setup

You need to create two new tables in your Supabase database:

### 1. Featured Requests Table

This table stores feature requests from users for products/services/events.

Run this SQL in your Supabase SQL Editor:

```sql
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

CREATE INDEX IF NOT EXISTS idx_featured_requests_user_id ON public.featured_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON public.featured_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_featured_requests_created_at ON public.featured_requests USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_requests_type ON public.featured_requests USING btree (type);
```

**Columns:**
- `id` - UUID primary key
- `title` - Request title (255 chars)
- `description` - Full description
- `type` - Type of request: 'Product', 'Service', or 'Event'
- `image_url` - URL to request image/preview
- `status` - Status: 'pending', 'approved', or 'rejected'
- `user_id` - ID of user who made the request
- `views` - Number of views (integer)
- `rejection_reason` - Reason if rejected
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

### 2. Admin Notifications Table

This table stores notifications specific to admins (separate from user notifications).

```sql
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

CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id_is_read ON public.admin_notifications USING btree (admin_id, is_read);
```

**Columns:**
- `id` - UUID primary key
- `admin_id` - ID of admin who receives the notification
- `type` - Type: 'info', 'warning', 'success', or 'error'
- `title` - Notification title (255 chars)
- `message` - Full message text
- `related_type` - Type of related item: 'post', 'report', 'user', 'featured_request'
- `related_id` - ID of the related item
- `action_url` - URL to navigate to when clicking notification
- `is_read` - Whether the notification has been read
- `read_at` - Timestamp when read
- `created_at` - Timestamp of creation

## RLS (Row Level Security) - Optional

For security, you may want to add RLS policies:

```sql
-- Featured Requests RLS
ALTER TABLE public.featured_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all featured requests"
ON public.featured_requests
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Admin Notifications RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view only their notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (admin_id = (SELECT id FROM public.admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can update only their notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (admin_id = (SELECT id FROM public.admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can delete only their notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (admin_id = (SELECT id FROM public.admins WHERE auth_user_id = auth.uid()));
```

## Verification

After running the SQL, verify the tables exist:

```sql
-- Check featured_requests table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'featured_requests';

-- Check admin_notifications table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_notifications';
```

Both should return one row each if successful.

## API Endpoints

After setup, these endpoints will work:

- `GET /api/admin/featured-requests` - List all featured requests
- `PUT /api/admin/featured-requests/:id` - Update featured request status
- `DELETE /api/admin/featured-requests/:id` - Delete featured request

- `GET /api/admin/notifications` - List admin notifications
- `PUT /api/admin/notifications/:id` - Mark notification as read
- `POST /api/admin/notifications` - Create notification
- `DELETE /api/admin/notifications/:id` - Delete notification

## Troubleshooting

**Error: "Unknown table featured_requests"**
- Table hasn't been created yet, run the SQL from section 1

**Error: "Unknown table admin_notifications"**
- Table hasn't been created yet, run the SQL from section 2

**Notifications not showing**
- Ensure `admin_id` in admin_notifications matches your admin's ID from admins table
- Check that JWT token is valid and includes the correct admin ID
