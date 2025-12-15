-- Comprehensive Notification Triggers
-- Drop existing triggers and recreate them with proper handling for all scenarios
-- This includes: likes, follows, comments, views, matches, messages, posts, marketplace products

-- ============================================================================
-- 1. WELCOME NOTIFICATION (System notification on user signup)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    action_url,
    is_read
  )
  VALUES (
    NEW.id,
    'system',
    'Welcome to Vibe2Gether!',
    'Your account has been created successfully. Start exploring and finding your perfect match!',
    NULL,
    '/dashboard',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS welcome_notification_trigger ON users;
CREATE TRIGGER welcome_notification_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_welcome_notification();

-- ============================================================================
-- 2. LIKE NOTIFICATIONS (when user likes a post)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'like',
    u.display_name || ' liked your post',
    'Your post got a new like from ' || COALESCE(u.display_name, u.full_name, u.email),
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = p.user_id 
    AND type = 'like' 
    AND actor_id = NEW.user_id 
    AND reference_id = NEW.post_id
    AND created_at > NOW() - INTERVAL '1 hour'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS like_notification_trigger ON likes;
CREATE TRIGGER like_notification_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

-- ============================================================================
-- 3. FOLLOW NOTIFICATIONS (when user follows another user)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    NEW.following_id,
    'follow',
    u.display_name || ' followed you',
    COALESCE(u.display_name, u.full_name, u.email) || ' is now following you',
    NEW.follower_id,
    NEW.following_id,
    'user',
    '/dashboard/profile/' || NEW.follower_id
  FROM users u
  WHERE u.id = NEW.follower_id
  AND NEW.following_id != NEW.follower_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = NEW.following_id 
    AND type = 'follow' 
    AND actor_id = NEW.follower_id
    AND created_at > NOW() - INTERVAL '1 day'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
CREATE TRIGGER follow_notification_trigger
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- ============================================================================
-- 4. COMMENT NOTIFICATIONS (when user comments on a post)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'comment',
    u.display_name || ' commented on your post',
    COALESCE(u.display_name, u.full_name, u.email) || ' commented: "' || SUBSTRING(NEW.content, 1, 50) || '..."',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
CREATE TRIGGER comment_notification_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- ============================================================================
-- 5. VIEW NOTIFICATIONS (when user views a post)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_view_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if the viewer is not the post owner and no recent notification exists
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'view',
    u.display_name || ' viewed your post',
    COALESCE(u.display_name, u.full_name, u.email) || ' viewed your post',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = p.user_id 
    AND type = 'view' 
    AND actor_id = NEW.user_id
    AND reference_id = NEW.post_id
    AND created_at > NOW() - INTERVAL '1 day'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS view_notification_trigger ON post_views;
CREATE TRIGGER view_notification_trigger
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION create_view_notification();

-- ============================================================================
-- 6. MATCH NOTIFICATIONS (when a new match is created)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify both users in the match
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    CASE WHEN u.id = NEW.user_id_1 THEN NEW.user_id_2 ELSE NEW.user_id_1 END,
    'match',
    'You have a new match!',
    'You matched with ' || COALESCE(u.display_name, u.full_name, u.email),
    CASE WHEN u.id = NEW.user_id_1 THEN NEW.user_id_2 ELSE NEW.user_id_1 END,
    NEW.id,
    'match',
    '/dashboard/matches/' || NEW.id
  FROM users u
  WHERE u.id = NEW.user_id_1
  
  UNION ALL
  
  SELECT
    CASE WHEN u.id = NEW.user_id_2 THEN NEW.user_id_1 ELSE NEW.user_id_2 END,
    'match',
    'You have a new match!',
    'You matched with ' || COALESCE(u.display_name, u.full_name, u.email),
    CASE WHEN u.id = NEW.user_id_2 THEN NEW.user_id_1 ELSE NEW.user_id_2 END,
    NEW.id,
    'match',
    '/dashboard/matches/' || NEW.id
  FROM users u
  WHERE u.id = NEW.user_id_2;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_notification_trigger ON matches;
CREATE TRIGGER match_notification_trigger
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_notification();

-- ============================================================================
-- 7. MESSAGE NOTIFICATIONS (when a message is sent)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    NEW.receiver_id,
    'message',
    u.display_name || ' sent you a message',
    COALESCE(u.display_name, u.full_name, u.email) || ': "' || SUBSTRING(NEW.message_text, 1, 50) || '..."',
    NEW.sender_id,
    NEW.id,
    'message',
    '/dashboard/messages'
  FROM users u
  WHERE u.id = NEW.sender_id
  AND NEW.receiver_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- ============================================================================
-- 8. SAVE NOTIFICATIONS (when user saves a post)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_save_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    p.user_id,
    'save',
    u.display_name || ' saved your post',
    COALESCE(u.display_name, u.full_name, u.email) || ' saved your post',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = p.user_id 
    AND type = 'save' 
    AND actor_id = NEW.user_id 
    AND reference_id = NEW.post_id
    AND created_at > NOW() - INTERVAL '1 day'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS save_notification_trigger ON saved_posts;
CREATE TRIGGER save_notification_trigger
AFTER INSERT ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION create_save_notification();

-- ============================================================================
-- 9. NEW POST NOTIFICATIONS (when user posts something)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_new_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all followers of the user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  )
  SELECT
    f.follower_id,
    'new_post',
    u.display_name || ' posted something new',
    COALESCE(u.display_name, u.full_name, u.email) || ' posted: "' || SUBSTRING(NEW.content, 1, 50) || '..."',
    NEW.user_id,
    NEW.id,
    'post',
    '/dashboard/feed/' || NEW.id
  FROM follows f
  JOIN users u ON u.id = NEW.user_id
  WHERE f.following_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS new_post_notification_trigger ON posts;
CREATE TRIGGER new_post_notification_trigger
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION create_new_post_notification();

-- ============================================================================
-- 10. COINS EARNED NOTIFICATIONS (when user receives coins)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_coins_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for positive amounts (earnings)
  IF NEW.amount > 0 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      action_url
    )
    VALUES (
      NEW.user_id,
      'coins_earned',
      'You earned ' || NEW.amount || ' coins!',
      'You earned ' || NEW.amount || ' coins from ' || COALESCE(NEW.description, 'an action'),
      NEW.id,
      'transaction',
      '/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coins_notification_trigger ON coin_transactions;
CREATE TRIGGER coins_notification_trigger
AFTER INSERT ON coin_transactions
FOR EACH ROW
EXECUTE FUNCTION create_coins_notification();

-- ============================================================================
-- 11. WALLET UPDATE NOTIFICATIONS (tracked via coin_transactions)
-- ============================================================================
-- Wallet updates are handled by the coins_notification trigger above

-- ============================================================================
-- Summary of Notification Types
-- ============================================================================
-- system: System notifications (welcome, announcements)
-- like: User liked your post
-- follow: User followed you
-- comment: User commented on your post
-- view: User viewed your post
-- match: New match created
-- message: New message received
-- save: User saved your post
-- new_post: Someone you follow posted
-- coins_earned: You earned coins from an action
-- All notifications are automatically created by triggers
-- No manual insertion needed - just perform the action!
