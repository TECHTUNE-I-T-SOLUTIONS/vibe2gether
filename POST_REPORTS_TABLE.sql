-- Post Reports Table with Notifications Triggers
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- Create post_reports table
CREATE TABLE public.post_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason character varying NOT NULL,
  description text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  priority character varying DEFAULT 'medium'::character varying,
  handled_by uuid,
  action_taken character varying,
  admin_notes text,
  handled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  CONSTRAINT post_reports_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.admins(id),
  CONSTRAINT post_reports_unique_report UNIQUE (post_id, reporter_id)
);

-- Create index for faster queries
CREATE INDEX idx_post_reports_status ON public.post_reports(status);
CREATE INDEX idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX idx_post_reports_reporter_id ON public.post_reports(reporter_id);
CREATE INDEX idx_post_reports_created_at ON public.post_reports(created_at DESC);
CREATE INDEX idx_post_reports_priority ON public.post_reports(priority);

-- Trigger Function: Insert notification when post is reported
CREATE OR REPLACE FUNCTION insert_post_report_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
  admin_id uuid;
  admin_exists boolean;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

  -- Insert notification for post author (don't reveal reporter)
  IF post_author_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      action_url,
      created_at
    ) VALUES (
      post_author_id,
      'post_reported',
      'Your post was reported',
      'Someone reported your post. We will review it shortly.',
      NEW.post_id,
      'post',
      '/dashboard/feed',
      now()
    );
  END IF;

  -- Insert notification for reporter (confirmation)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    action_url,
    created_at
  ) VALUES (
    NEW.reporter_id,
    'report_submitted',
    'Report submitted',
    'Thank you for reporting. We will review this post and take appropriate action.',
    NEW.post_id,
    'post',
    '/dashboard/feed',
    now()
  );

  -- Insert notification for all admins
  FOR admin_id IN 
    SELECT id FROM public.admins WHERE is_active = true
  LOOP
    INSERT INTO public.admin_notifications (
      admin_id,
      type,
      title,
      message,
      related_type,
      related_id,
      action_url,
      created_at
    ) VALUES (
      admin_id,
      'post_report',
      'New post report',
      'A new post has been reported for: ' || NEW.reason,
      'post',
      NEW.post_id,
      '/admin/reports?tab=post',
      now()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insert
CREATE TRIGGER post_report_created_trigger
AFTER INSERT ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION insert_post_report_notification();

-- Trigger Function: Update priority when report count increases
CREATE OR REPLACE FUNCTION update_post_report_priority()
RETURNS TRIGGER AS $$
DECLARE
  report_count integer;
BEGIN
  -- Count total reports for this post
  SELECT COUNT(*) INTO report_count FROM public.post_reports WHERE post_id = NEW.post_id AND status = 'pending';

  -- Update priority based on count
  IF report_count >= 5 THEN
    NEW.priority := 'high';
  ELSIF report_count >= 3 THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for priority update before insert
CREATE TRIGGER post_report_priority_trigger
BEFORE INSERT ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION update_post_report_priority();

-- Trigger Function: Notify when report is resolved
CREATE OR REPLACE FUNCTION notify_report_resolution()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
BEGIN
  -- Only notify if status changed to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    -- Get the post author
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

    -- Notify post author about resolution
    IF post_author_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        action_url,
        created_at
      ) VALUES (
        post_author_id,
        'report_resolved',
        'Report reviewed',
        'A report against your post has been reviewed. Action: ' || COALESCE(NEW.action_taken, 'No action required'),
        NEW.post_id,
        'post',
        '/dashboard/feed',
        now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for report resolution
CREATE TRIGGER post_report_resolved_trigger
AFTER UPDATE ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION notify_report_resolution();

-- Add column to track reports in posts table (optional, for denormalization)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reports_count integer DEFAULT 0;

-- Trigger Function: Update post reports count
CREATE OR REPLACE FUNCTION update_post_reports_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reports_count = reports_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reports_count = GREATEST(reports_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating count
CREATE TRIGGER post_reports_count_trigger
AFTER INSERT OR DELETE ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION update_post_reports_count();
