-- Notification Triggers for all user activities
-- These triggers automatically create notifications when users interact with the platform

-- 1. Trigger for LIKES (when user likes a post)
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
    'Your post got a new like from ' || COALESCE(u.display_name, u.full_name),
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id; -- Don't notify if user likes their own post

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS like_notification_trigger ON likes;
CREATE TRIGGER like_notification_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

-- 2. Trigger for FOLLOWS (when user follows another user)
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
    u.display_name || ' started following you',
    COALESCE(u.display_name, u.full_name) || ' started following you',
    NEW.follower_id,
    NEW.follower_id,
    'user',
    '/profile/' || NEW.follower_id
  FROM users u
  WHERE u.id = NEW.follower_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
CREATE TRIGGER follow_notification_trigger
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- 3. Trigger for COMMENTS (when user comments on a post)
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
    'Your post got a new comment from ' || COALESCE(u.display_name, u.full_name),
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id; -- Don't notify if user comments on their own post

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
CREATE TRIGGER comment_notification_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- 4. Trigger for POST VIEWS (when user views a post)
CREATE OR REPLACE FUNCTION create_view_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if this is a new view from a different user (every 10th view to avoid spam)
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
    'Your post got a new view',
    'Someone viewed your post',
    NEW.user_id,
    NEW.post_id,
    'post',
    '/dashboard/feed/' || NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id -- Don't notify if user views their own post
  AND (SELECT COUNT(*) FROM post_views WHERE post_id = NEW.post_id AND user_id = NEW.user_id) = 1; -- Only first view

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS view_notification_trigger ON post_views;
CREATE TRIGGER view_notification_trigger
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION create_view_notification();

-- 5. Trigger for MATCHES (when a match is created)
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify both users about the new match
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
    NEW.user2_id,
    'match',
    'You have a new match!',
    'You matched with someone! Start the conversation.',
    NEW.user1_id,
    NEW.id,
    'match',
    '/dashboard/matches/' || NEW.id
  WHERE NEW.status = 'matched';

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
    NEW.user1_id,
    'match',
    'You have a new match!',
    'You matched with someone! Start the conversation.',
    NEW.user2_id,
    NEW.id,
    'match',
    '/dashboard/matches/' || NEW.id
  WHERE NEW.status = 'matched';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_notification_trigger ON matches;
CREATE TRIGGER match_notification_trigger
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_notification();

-- 6. Trigger for MATCH STATUS UPDATES (when match status changes)
CREATE OR REPLACE FUNCTION create_match_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed to 'matched'
  IF NEW.status = 'matched' AND OLD.status != 'matched' THEN
    -- Notify user2
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
      NEW.user2_id,
      'match',
      'You have a new match!',
      'You matched with someone! Start the conversation.',
      NEW.user1_id,
      NEW.id,
      'match',
      '/dashboard/matches/' || NEW.id;

    -- Notify user1
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
      NEW.user1_id,
      'match',
      'You have a new match!',
      'You matched with someone! Start the conversation.',
      NEW.user2_id,
      NEW.id,
      'match',
      '/dashboard/matches/' || NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_status_notification_trigger ON matches;
CREATE TRIGGER match_status_notification_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION create_match_status_notification();

-- 7. Trigger for MESSAGES (when a new message is sent)
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  receiver_id uuid;
  sender_name varchar;
BEGIN
  -- Get the receiver (the other user in the match)
  SELECT CASE 
    WHEN m.user1_id = NEW.sender_id THEN m.user2_id
    ELSE m.user1_id
  END INTO receiver_id
  FROM matches m
  WHERE m.id = NEW.match_id;

  -- Get sender's display name
  SELECT COALESCE(display_name, full_name) INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;

  -- Create notification for the receiver
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
  VALUES (
    receiver_id,
    'message',
    sender_name || ' sent you a message',
    NEW.content,
    NEW.sender_id,
    NEW.match_id,
    'match',
    '/dashboard/messages/' || NEW.match_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- 8. Trigger for SAVED POSTS (optional - notify when someone saves your post)
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
    COALESCE(u.display_name, u.full_name) || ' saved your post',
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

DROP TRIGGER IF EXISTS save_notification_trigger ON saved_posts;
CREATE TRIGGER save_notification_trigger
AFTER INSERT ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION create_save_notification();

-- Index for better performance on notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
