-- ==============================================================
-- VIBE2GETHER DATABASE FIXES - COMPREHENSIVE SQL SCRIPT
-- ==============================================================
-- This script fixes:
-- 1. is_verified default value (true -> false)
-- 2. Set all existing users is_verified to false
-- 3. Update referral counts from referral_bonuses table
-- 4. Fix any constraint issues
-- ==============================================================

-- ============================================================
-- 1. FIX: Set is_verified default to false
-- ============================================================
-- Drop existing constraint and recreate
ALTER TABLE public.users
ALTER COLUMN is_verified SET DEFAULT false;

-- Set all existing users to is_verified = false
UPDATE public.users
SET is_verified = false
WHERE is_verified = true OR is_verified IS NULL;

-- Verify the update
-- SELECT id, email, is_verified FROM public.users LIMIT 5;

-- ==============================================================
-- 2. FIX: Update followers_count and following_count from follows table
-- ==============================================================
-- This is important for accurate counts

-- Update followers_count
UPDATE public.users u
SET followers_count = (
  SELECT COUNT(*) 
  FROM public.follows f 
  WHERE f.following_id = u.id
);

-- Update following_count
UPDATE public.users u
SET following_count = (
  SELECT COUNT(*) 
  FROM public.follows f 
  WHERE f.follower_id = u.id
);

-- ==============================================================
-- 3. FIX: Update referral_bonus_claimed based on referral_bonuses
-- ==============================================================
-- Mark users as claimed if they have referral bonuses
UPDATE public.users u
SET referral_bonus_claimed = true
WHERE u.id IN (
  SELECT referred_id 
  FROM public.referral_bonuses 
  WHERE referred_bonus_claimed = true
)
AND u.referral_bonus_claimed = false;

-- ==============================================================
-- 4. FIX: Ensure all users have corresponding user_preferences
-- ==============================================================
INSERT INTO public.user_preferences (user_id, email_notifications, push_notifications, sms_notifications, marketing_emails, show_online_status, profile_visibility, allow_messages_from, theme, language)
SELECT 
  u.id,
  true,
  true,
  false,
  false,
  true,
  'public',
  'everyone',
  'system',
  COALESCE(u.language, 'en')
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================
-- 5. FIX: Ensure all users have corresponding privacy_settings
-- ==============================================================
INSERT INTO public.privacy_settings (user_id, allow_friend_requests, allow_profile_visits, show_last_seen, show_activity_status)
SELECT u.id, true, true, true, true
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================
-- 6. FIX: Ensure all users have corresponding user_security_settings
-- ==============================================================
INSERT INTO public.user_security_settings (user_id, two_factor_enabled, two_factor_method, password_change_required, login_alerts_enabled, suspicious_activity_alerts_enabled)
SELECT u.id, false, NULL, false, true, true
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_security_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================
-- 7. FIX: Clean up duplicate follows (if any)
-- ==============================================================
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY follower_id, following_id ORDER BY created_at ASC) as rn
  FROM public.follows
)
DELETE FROM public.follows
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- ==============================================================
-- 8. FIX: Verify coin_balance consistency
-- ==============================================================
-- Update coins_balance to match the latest coin_transaction balance_after
UPDATE public.users u
SET coins_balance = (
  SELECT COALESCE(balance_after, 0)
  FROM public.coin_transactions
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE u.id IN (SELECT user_id FROM public.coin_transactions);

-- ==============================================================
-- 9. FIX: Create indexes for improved performance
-- ==============================================================
-- These are performance optimizations

CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_user_id_status ON public.marketplace_products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_events_created_by_status ON public.events(created_by, status);

-- ==============================================================
-- 10. VERIFICATION: Check data consistency
-- ==============================================================
-- Run these SELECT queries to verify the fixes:
/*
-- Check is_verified is false for all users
SELECT COUNT(*) as verified_true_count FROM public.users WHERE is_verified = true;
-- Should return: 0

-- Check followers and following counts are accurate
SELECT u.id, u.email, u.followers_count, 
  (SELECT COUNT(*) FROM public.follows WHERE following_id = u.id) as actual_followers
FROM public.users u 
LIMIT 5;

-- Check referral_bonus_claimed updates
SELECT COUNT(*) as users_with_claimed_bonus FROM public.users WHERE referral_bonus_claimed = true;

-- Check user_preferences exist for all users
SELECT COUNT(*) as users_without_prefs FROM public.users u 
WHERE u.id NOT IN (SELECT user_id FROM public.user_preferences);
-- Should return: 0

-- Check privacy_settings exist for all users
SELECT COUNT(*) as users_without_privacy FROM public.users u 
WHERE u.id NOT IN (SELECT user_id FROM public.privacy_settings);
-- Should return: 0
*/

-- ==============================================================
-- END OF FIXES
-- ==============================================================
-- All fixes completed. The application should now work properly with:
-- - is_verified defaulting to false
-- - Accurate follower/following counts
-- - Proper referral bonus tracking
-- - User preferences and privacy settings initialized
-- - Improved query performance with new indexes
-- ==============================================================

-- ==============================================================
-- DATABASE TRIGGERS FOR AUTOMATIC COUNT UPDATES
-- ==============================================================
-- These triggers automatically update user counts when data changes

-- ==============================================================
-- TRIGGER: Update followers_count when a follow is added
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_followers_count_on_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET followers_count = (
    SELECT COUNT(*) FROM public.follows WHERE following_id = NEW.following_id
  )
  WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_followers_on_follow_insert ON public.follows;
CREATE TRIGGER trigger_update_followers_on_follow_insert
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_followers_count_on_follow_insert();

-- ==============================================================
-- TRIGGER: Update followers_count when a follow is deleted
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_followers_count_on_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET followers_count = (
    SELECT COUNT(*) FROM public.follows WHERE following_id = OLD.following_id
  )
  WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_followers_on_follow_delete ON public.follows;
CREATE TRIGGER trigger_update_followers_on_follow_delete
AFTER DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_followers_count_on_follow_delete();

-- ==============================================================
-- TRIGGER: Update following_count when a follow is added
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_following_count_on_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET following_count = (
    SELECT COUNT(*) FROM public.follows WHERE follower_id = NEW.follower_id
  )
  WHERE id = NEW.follower_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_following_on_follow_insert ON public.follows;
CREATE TRIGGER trigger_update_following_on_follow_insert
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_following_count_on_follow_insert();

-- ==============================================================
-- TRIGGER: Update following_count when a follow is deleted
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_following_count_on_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET following_count = (
    SELECT COUNT(*) FROM public.follows WHERE follower_id = OLD.follower_id
  )
  WHERE id = OLD.follower_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_following_on_follow_delete ON public.follows;
CREATE TRIGGER trigger_update_following_on_follow_delete
AFTER DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_following_count_on_follow_delete();

-- ==============================================================
-- TRIGGER: Update likes_count when a like is added
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_likes_count_on_like_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = (
    SELECT COUNT(*) FROM public.likes WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_likes_count_on_insert ON public.likes;
CREATE TRIGGER trigger_update_likes_count_on_insert
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_likes_count_on_like_insert();

-- ==============================================================
-- TRIGGER: Update likes_count when a like is deleted
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_likes_count_on_like_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = (
    SELECT COUNT(*) FROM public.likes WHERE post_id = OLD.post_id
  )
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_likes_count_on_delete ON public.likes;
CREATE TRIGGER trigger_update_likes_count_on_delete
AFTER DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_likes_count_on_like_delete();

-- ==============================================================
-- TRIGGER: Update comments_count when a comment is added
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_comments_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.comments WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_count_on_insert ON public.comments;
CREATE TRIGGER trigger_update_comments_count_on_insert
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comments_count_on_insert();

-- ==============================================================
-- TRIGGER: Update comments_count when a comment is deleted
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_comments_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.comments WHERE post_id = OLD.post_id
  )
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_count_on_delete ON public.comments;
CREATE TRIGGER trigger_update_comments_count_on_delete
AFTER DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comments_count_on_delete();

-- ==============================================================
-- TRIGGER: Update current_attendees when registration is created
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_event_attendees_on_register()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET current_attendees = (
    SELECT COUNT(*) FROM public.event_registrations 
    WHERE event_id = NEW.event_id AND status = 'registered'
  )
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_attendees_on_register ON public.event_registrations;
CREATE TRIGGER trigger_update_event_attendees_on_register
AFTER INSERT ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_attendees_on_register();

-- ==============================================================
-- TRIGGER: Update current_attendees when registration is deleted
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_event_attendees_on_unregister()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET current_attendees = (
    SELECT COUNT(*) FROM public.event_registrations 
    WHERE event_id = OLD.event_id AND status = 'registered'
  )
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_attendees_on_unregister ON public.event_registrations;
CREATE TRIGGER trigger_update_event_attendees_on_unregister
AFTER DELETE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_attendees_on_unregister();

-- ==============================================================
-- TRIGGER: Update coins_balance when transaction is completed
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_coins_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.users
    SET coins_balance = coins_balance + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coins_balance ON public.coin_transactions;
CREATE TRIGGER trigger_update_coins_balance
AFTER INSERT OR UPDATE ON public.coin_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_coins_balance_on_transaction();

-- ==============================================================
-- TRIGGER: Update saved_count when post is saved
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_saved_count_on_save()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saved_count = (
    SELECT COUNT(*) FROM public.saved_posts WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_count_on_save ON public.saved_posts;
CREATE TRIGGER trigger_update_saved_count_on_save
AFTER INSERT ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_count_on_save();

-- ==============================================================
-- TRIGGER: Update saved_count when post is unsaved
-- ==============================================================
CREATE OR REPLACE FUNCTION public.update_saved_count_on_unsave()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saved_count = (
    SELECT COUNT(*) FROM public.saved_posts WHERE post_id = OLD.post_id
  )
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_count_on_unsave ON public.saved_posts;
CREATE TRIGGER trigger_update_saved_count_on_unsave
AFTER DELETE ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_count_on_unsave();

-- ==============================================================
-- VERIFICATION: Check triggers are created
-- ==============================================================
/*
-- Check all triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
*/

-- ==============================================================
-- END OF TRIGGERS
-- ==============================================================
