-- Admin Messaging System Tables

-- Create admin_messages_conversations table
CREATE TABLE IF NOT EXISTS public.admin_messages_conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, admin_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_conversations_user_id 
  ON public.admin_messages_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_messages_conversations_admin_id 
  ON public.admin_messages_conversations(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_messages_conversations_resolved 
  ON public.admin_messages_conversations(is_resolved);

CREATE INDEX IF NOT EXISTS idx_admin_messages_conversations_last_message_time 
  ON public.admin_messages_conversations(last_message_time DESC);

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.admin_messages_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'admin')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_conversation_id 
  ON public.admin_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_admin_messages_sender_id 
  ON public.admin_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at 
  ON public.admin_messages(created_at DESC);

-- Create Storage Buckets for Admin Resources

-- Blog posts images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Event images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Marketplace products images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Message attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Admin resources bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-resources', 'admin-resources', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- Note: Auth checks are handled at the application layer
-- via /app/api/admin/* routes with custom JWT verification
-- These policies allow public access to image buckets
-- ============================================================

-- Set Storage Policies for Blog Images
CREATE POLICY "Public blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Admin can update blog images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can delete blog images" ON storage.objects
  FOR DELETE USING (bucket_id = 'blog-images');

-- Set Storage Policies for Event Images
CREATE POLICY "Public event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Admin can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Admin can update event images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-images');

CREATE POLICY "Admin can delete event images" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images');

-- Set Storage Policies for Marketplace Images
CREATE POLICY "Public marketplace images" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace-images');

CREATE POLICY "Users and admins can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketplace-images');

CREATE POLICY "Users and admins can update marketplace images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'marketplace-images');

CREATE POLICY "Users and admins can delete marketplace images" ON storage.objects
  FOR DELETE USING (bucket_id = 'marketplace-images');

-- Set Storage Policies for Message Attachments
CREATE POLICY "Users can view their message attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their message attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments');

-- Set Storage Policies for Admin Resources
CREATE POLICY "Admin resources are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'admin-resources');

CREATE POLICY "Admin can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'admin-resources');

CREATE POLICY "Admin can update resources" ON storage.objects
  FOR UPDATE USING (bucket_id = 'admin-resources');

CREATE POLICY "Admin can delete resources" ON storage.objects
  FOR DELETE USING (bucket_id = 'admin-resources');
