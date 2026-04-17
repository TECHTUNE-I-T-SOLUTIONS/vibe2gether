-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================
--
-- This file contains database triggers that automatically
-- create notifications in both user_notifications and admin_notifications
-- tables when certain database events occur.
--
-- Copy and paste into Supabase SQL Editor to activate
--

-- ============================================
-- HELPER FUNCTION: Generate User Notifications
-- ============================================

CREATE OR REPLACE FUNCTION generate_user_notification(
  p_user_id uuid,
  p_type varchar,
  p_title varchar,
  p_message text,
  p_actor_id uuid DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type varchar DEFAULT NULL,
  p_action_url varchar DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_actor_id,
    p_reference_id,
    p_reference_type,
    p_action_url,
    false,
    now()
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Generate Admin Notifications
-- ============================================

CREATE OR REPLACE FUNCTION generate_admin_notification(
  p_admin_id uuid,
  p_type varchar,
  p_title varchar,
  p_message text DEFAULT NULL,
  p_related_type varchar DEFAULT NULL,
  p_related_id uuid DEFAULT NULL,
  p_action_url varchar DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    admin_id,
    type,
    title,
    message,
    related_type,
    related_id,
    action_url,
    is_read,
    created_at
  ) VALUES (
    p_admin_id,
    p_type,
    p_title,
    p_message,
    p_related_type,
    p_related_id,
    p_action_url,
    false,
    now()
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Notify All Admins
-- ============================================

CREATE OR REPLACE FUNCTION notify_all_admins(
  p_type varchar,
  p_title varchar,
  p_message text DEFAULT NULL,
  p_related_type varchar DEFAULT NULL,
  p_related_id uuid DEFAULT NULL,
  p_action_url varchar DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_admin record;
BEGIN
  FOR v_admin IN SELECT id FROM public.admins LOOP
    PERFORM generate_admin_notification(
      v_admin.id,
      p_type,
      p_title,
      p_message,
      p_related_type,
      p_related_id,
      p_action_url
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: New User Signup
-- ============================================

CREATE OR REPLACE FUNCTION trigger_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify admins of new user signup
  PERFORM notify_all_admins(
    'info',
    'New User Signup',
    'A new user has signed up: ' || COALESCE(NEW.email, 'Unknown'),
    'user',
    NEW.id,
    '/admin/users?id=' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_new_user_signup ON public.users;
CREATE TRIGGER trig_new_user_signup
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_user_signup();

-- ============================================
-- TRIGGER: User Status Changed
-- ============================================

CREATE OR REPLACE FUNCTION trigger_user_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    PERFORM notify_all_admins(
      CASE WHEN NEW.is_active THEN 'success' ELSE 'warning' END,
      CASE WHEN NEW.is_active THEN 'User Activated' ELSE 'User Deactivated' END,
      'User ' || COALESCE(NEW.email, 'Unknown') || ' has been ' || (CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END),
      'user',
      NEW.id,
      '/admin/users?id=' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_user_status_changed ON public.users;
CREATE TRIGGER trig_user_status_changed
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_user_status_changed();

-- ============================================
-- TRIGGER: New Post Created
-- ============================================

CREATE OR REPLACE FUNCTION trigger_new_post_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email varchar;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM public.users WHERE id = NEW.user_id LIMIT 1;
  
  -- Notify admins of new post
  PERFORM notify_all_admins(
    'info',
    'New Post Created',
    'A new post was created by ' || COALESCE(v_user_email, 'Unknown user'),
    'post',
    NEW.id,
    '/admin/posts?id=' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_new_post_created ON public.posts;
CREATE TRIGGER trig_new_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_post_created();

-- ============================================
-- TRIGGER: Post Flagged
-- ============================================

CREATE OR REPLACE FUNCTION trigger_post_flagged()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_flagged IS DISTINCT FROM NEW.is_flagged AND NEW.is_flagged = true THEN
    PERFORM notify_all_admins(
      'warning',
      'Post Flagged',
      'A post has been flagged as inappropriate',
      'post',
      NEW.id,
      '/admin/posts?id=' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_post_flagged ON public.posts;
CREATE TRIGGER trig_post_flagged
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_post_flagged();

-- ============================================
-- TRIGGER: New Report Created
-- ============================================

CREATE OR REPLACE FUNCTION trigger_new_report_created()
RETURNS TRIGGER AS $$
DECLARE
  v_reporter_email varchar;
BEGIN
  -- Get reporter email
  SELECT email INTO v_reporter_email FROM public.users WHERE id = NEW.reporter_id LIMIT 1;
  
  -- Notify admins of new report
  PERFORM notify_all_admins(
    'warning',
    'New Report Submitted',
    'A new ' || NEW.reported_type || ' report has been submitted by ' || COALESCE(v_reporter_email, 'Unknown'),
    'report',
    NEW.id,
    '/admin/reports?id=' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_new_report_created ON public.reports;
CREATE TRIGGER trig_new_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_report_created();

-- ============================================
-- TRIGGER: New Featured Request
-- ============================================

CREATE OR REPLACE FUNCTION trigger_new_featured_request()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email varchar;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM public.users WHERE id = NEW.user_id LIMIT 1;
  
  -- Notify admins of new featured request
  PERFORM notify_all_admins(
    'info',
    'New Featured Request',
    'A new ' || NEW.type || ' featured request: ' || NEW.title,
    'featured_request',
    NEW.id,
    '/admin/featured?id=' || NEW.id
  );
  
  -- Notify user their request was received
  PERFORM generate_user_notification(
    NEW.user_id,
    'info',
    'Featured Request Received',
    'Your featured request "' || NEW.title || '" has been received and is under review.',
    NULL,
    NEW.id,
    'featured_request',
    '/dashboard/featured?id=' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_new_featured_request ON public.featured_requests;
CREATE TRIGGER trig_new_featured_request
  AFTER INSERT ON public.featured_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_featured_request();

-- ============================================
-- TRIGGER: Featured Request Status Changed
-- ============================================

CREATE OR REPLACE FUNCTION trigger_featured_request_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify admins
    PERFORM notify_all_admins(
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      'Featured Request ' || UPPER(NEW.status),
      'Featured request "' || NEW.title || '" has been ' || NEW.status,
      'featured_request',
      NEW.id,
      '/admin/featured?id=' || NEW.id
    );
    
    -- Notify user
    PERFORM generate_user_notification(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      'Featured Request ' || UPPER(NEW.status),
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your featured request "' || NEW.title || '" has been approved!'
        WHEN NEW.status = 'rejected' THEN 'Your featured request "' || NEW.title || '" was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided')
        ELSE 'Your featured request "' || NEW.title || '" status has been updated.'
      END,
      NULL,
      NEW.id,
      'featured_request',
      '/dashboard/featured?id=' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_featured_request_status_changed ON public.featured_requests;
CREATE TRIGGER trig_featured_request_status_changed
  AFTER UPDATE ON public.featured_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_featured_request_status_changed();

-- ============================================
-- TRIGGER: Premium Subscription Created
-- ============================================

CREATE OR REPLACE FUNCTION trigger_premium_subscription_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email varchar;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM public.users WHERE id = NEW.user_id LIMIT 1;
  
  -- Notify admins
  PERFORM notify_all_admins(
    'success',
    'New Premium Subscription',
    'User ' || COALESCE(v_user_email, 'Unknown') || ' has purchased a premium subscription',
    'subscription',
    NEW.id,
    '/admin/users?id=' || NEW.user_id
  );
  
  -- Notify user
  PERFORM generate_user_notification(
    NEW.user_id,
    'success',
    'Premium Subscription Activated',
    'Welcome to Premium! You now have access to exclusive features.',
    NULL,
    NEW.id,
    'subscription',
    '/dashboard/premium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_premium_subscription_created ON public.premium_subscriptions;
CREATE TRIGGER trig_premium_subscription_created
  AFTER INSERT ON public.premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_premium_subscription_created();

-- ============================================
-- TRIGGER: Premium Subscription Cancelled
-- ============================================

CREATE OR REPLACE FUNCTION trigger_premium_subscription_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active = false THEN
    -- Notify admins
    PERFORM notify_all_admins(
      'warning',
      'Premium Subscription Cancelled',
      'A premium subscription has been cancelled',
      'subscription',
      NEW.id,
      '/admin/users?id=' || NEW.user_id
    );
    
    -- Notify user
    PERFORM generate_user_notification(
      NEW.user_id,
      'warning',
      'Premium Subscription Cancelled',
      'Your premium subscription has been cancelled. You will lose access to premium features.',
      NULL,
      NEW.id,
      'subscription',
      '/dashboard'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_premium_subscription_cancelled ON public.premium_subscriptions;
CREATE TRIGGER trig_premium_subscription_cancelled
  AFTER UPDATE ON public.premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_premium_subscription_cancelled();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify triggers are created:

-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE 'trig_%';

-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_name LIKE 'trigger_%' OR routine_name LIKE 'generate_%' OR routine_name LIKE 'notify_%';
