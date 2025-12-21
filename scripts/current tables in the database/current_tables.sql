-- we're not using supabase auth
-- we're saving user data and details in the users table
-- always update this file as you create new sql files so it can be up to date


-- coin rates

create table public.coin_rates (
  id uuid not null default extensions.uuid_generate_v4 (),
  action_type character varying(50) not null,
  coins_amount integer not null,
  description text null,
  is_active boolean null default true,
  updated_at timestamp with time zone null default now(),
  constraint coin_rates_pkey primary key (id),
  constraint coin_rates_action_type_key unique (action_type)
) TABLESPACE pg_default;


-- coin transactions

create table public.coin_transactions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  amount integer not null,
  transaction_type character varying(50) not null,
  description text null,
  reference_id uuid null,
  reference_type character varying(50) null,
  balance_after integer not null,
  created_at timestamp with time zone null default now(),
  constraint coin_transactions_pkey primary key (id),
  constraint coin_transactions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coin_transactions_user_id on public.coin_transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_coin_transactions_type on public.coin_transactions using btree (transaction_type) TABLESPACE pg_default;

create index IF not exists idx_coin_transactions_created_at on public.coin_transactions using btree (created_at desc) TABLESPACE pg_default;


-- comments
create table public.comments (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  post_id uuid not null,
  parent_id uuid null,
  content text not null,
  likes_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint comments_pkey primary key (id),
  constraint comments_parent_id_fkey foreign KEY (parent_id) references comments (id) on delete CASCADE,
  constraint comments_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint comments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_comments_post_id on public.comments using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_comments_user_id on public.comments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_comments_parent_id on public.comments using btree (parent_id) TABLESPACE pg_default;

create trigger comment_notification_trigger
after INSERT on comments for EACH row
execute FUNCTION create_comment_notification ();


-- follows
create table public.follows (
  id uuid not null default extensions.uuid_generate_v4 (),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint follows_pkey primary key (id),
  constraint follows_follower_id_following_id_key unique (follower_id, following_id),
  constraint follows_follower_id_fkey foreign KEY (follower_id) references users (id) on delete CASCADE,
  constraint follows_following_id_fkey foreign KEY (following_id) references users (id) on delete CASCADE,
  constraint follows_check check ((follower_id <> following_id))
) TABLESPACE pg_default;

create index IF not exists idx_follows_follower_id on public.follows using btree (follower_id) TABLESPACE pg_default;

create index IF not exists idx_follows_following_id on public.follows using btree (following_id) TABLESPACE pg_default;

create trigger follow_notification_trigger
after INSERT on follows for EACH row
execute FUNCTION create_follow_notification ();



-- likes
create table public.likes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint likes_pkey primary key (id),
  constraint likes_user_id_post_id_key unique (user_id, post_id),
  constraint likes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint likes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_likes_post_id on public.likes using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_likes_user_id on public.likes using btree (user_id) TABLESPACE pg_default;

create trigger like_notification_trigger
after INSERT on likes for EACH row
execute FUNCTION create_like_notification ();


-- matches
create table public.matches (
  id uuid not null default extensions.uuid_generate_v4 (),
  user1_id uuid not null,
  user2_id uuid not null,
  status character varying(50) null default 'pending'::character varying,
  initiated_by uuid null,
  compatibility_score integer null,
  last_message_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint matches_pkey primary key (id),
  constraint matches_user1_id_user2_id_key unique (user1_id, user2_id),
  constraint matches_initiated_by_fkey foreign KEY (initiated_by) references users (id),
  constraint matches_user1_id_fkey foreign KEY (user1_id) references users (id) on delete CASCADE,
  constraint matches_user2_id_fkey foreign KEY (user2_id) references users (id) on delete CASCADE,
  constraint matches_check check ((user1_id <> user2_id))
) TABLESPACE pg_default;

create index IF not exists idx_matches_user1_id on public.matches using btree (user1_id) TABLESPACE pg_default;

create index IF not exists idx_matches_user2_id on public.matches using btree (user2_id) TABLESPACE pg_default;

create index IF not exists idx_matches_status on public.matches using btree (status) TABLESPACE pg_default;

create trigger match_notification_trigger
after INSERT on matches for EACH row
execute FUNCTION create_match_notification ();

create trigger match_status_notification_trigger
after
update on matches for EACH row
execute FUNCTION create_match_status_notification ();


-- messages
create table public.messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  match_id uuid not null,
  sender_id uuid not null,
  content text null,
  message_type character varying(50) null default 'text'::character varying,
  media_url character varying(500) null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  deleted_by_sender boolean null default false,
  deleted_by_receiver boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_match_id_fkey foreign KEY (match_id) references matches (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_match_id on public.messages using btree (match_id) TABLESPACE pg_default;

create index IF not exists idx_messages_sender_id on public.messages using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at desc) TABLESPACE pg_default;

create trigger message_notification_trigger
after INSERT on messages for EACH row
execute FUNCTION create_message_notification ();


-- notifications
create table public.notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  type character varying(50) not null,
  title character varying(255) not null,
  message text null,
  actor_id uuid null,
  reference_id uuid null,
  reference_type character varying(50) null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  action_url character varying(500) null,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_actor_id_fkey foreign KEY (actor_id) references users (id) on delete set null,
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_is_read on public.notifications using btree (is_read) TABLESPACE pg_default;

create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_notifications_type on public.notifications using btree (type) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id_is_read on public.notifications using btree (user_id, is_read) TABLESPACE pg_default;


-- post views
create table public.post_views (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  post_id uuid not null,
  viewer_ip character varying(45) null,
  created_at timestamp with time zone null default now(),
  constraint post_views_pkey primary key (id),
  constraint post_views_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_views_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_post_views_post_id on public.post_views using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_post_views_user_id on public.post_views using btree (user_id) TABLESPACE pg_default;

create trigger view_notification_trigger
after INSERT on post_views for EACH row
execute FUNCTION create_view_notification ();


-- posts
create table public.posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  content text null,
  tags text[] null default '{}'::text[],
  media jsonb null default '[]'::jsonb,
  views_count integer null default 0,
  likes_count integer null default 0,
  comments_count integer null default 0,
  shares_count integer null default 0,
  saves_count integer null default 0,
  is_public boolean null default true,
  allow_comments boolean null default true,
  location_name character varying(255) null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_posts_user_id on public.posts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_posts_created_at on public.posts using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_posts_is_public on public.posts using btree (is_public) TABLESPACE pg_default;

create index IF not exists idx_posts_views_count on public.posts using btree (views_count desc) TABLESPACE pg_default;

create index IF not exists idx_posts_tags on public.posts using gin (tags) TABLESPACE pg_default;


-- referal bonus
create table public.referral_bonuses (
  id uuid not null default extensions.uuid_generate_v4 (),
  referrer_id uuid not null,
  referred_id uuid not null,
  referrer_bonus_amount integer null default 20,
  referred_bonus_amount integer null default 20,
  referrer_bonus_claimed boolean null default false,
  referred_bonus_claimed boolean null default false,
  referred_profile_completed boolean null default false,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint referral_bonuses_pkey primary key (id),
  constraint referral_bonuses_referrer_id_referred_id_key unique (referrer_id, referred_id),
  constraint referral_bonuses_referred_id_fkey foreign KEY (referred_id) references users (id) on delete CASCADE,
  constraint referral_bonuses_referrer_id_fkey foreign KEY (referrer_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;


-- reports
create table public.reports (
  id uuid not null default extensions.uuid_generate_v4 (),
  reporter_id uuid not null,
  reported_type character varying(50) not null,
  reported_id uuid not null,
  reason character varying(100) not null,
  description text null,
  status character varying(50) null default 'pending'::character varying,
  handled_by uuid null,
  handled_at timestamp with time zone null,
  admin_notes text null,
  action_taken character varying(100) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint reports_pkey primary key (id),
  constraint reports_handled_by_fkey foreign KEY (handled_by) references users (id),
  constraint reports_reporter_id_fkey foreign KEY (reporter_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_reports_reporter_id on public.reports using btree (reporter_id) TABLESPACE pg_default;

create index IF not exists idx_reports_status on public.reports using btree (status) TABLESPACE pg_default;

create index IF not exists idx_reports_reported_type on public.reports using btree (reported_type) TABLESPACE pg_default;

create index IF not exists idx_reports_created_at on public.reports using btree (created_at desc) TABLESPACE pg_default;



-- saved posts
create table public.saved_posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint saved_posts_pkey primary key (id),
  constraint saved_posts_user_id_post_id_key unique (user_id, post_id),
  constraint saved_posts_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint saved_posts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_saved_posts_user_id on public.saved_posts using btree (user_id) TABLESPACE pg_default;

create trigger save_notification_trigger
after INSERT on saved_posts for EACH row
execute FUNCTION create_save_notification ();


-- sessions
create table public.sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  session_token character varying(255) not null,
  expires_at timestamp with time zone not null,
  user_agent text null,
  ip_address character varying(45) null,
  device_type character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sessions_pkey primary key (id),
  constraint sessions_session_token_key unique (session_token),
  constraint sessions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_sessions_user_id on public.sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_sessions_token on public.sessions using btree (session_token) TABLESPACE pg_default;

create index IF not exists idx_sessions_expires on public.sessions using btree (expires_at) TABLESPACE pg_default;


-- users
create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null,
  password_hash character varying(255) not null,
  full_name character varying(255) not null,
  display_name character varying(100) null,
  date_of_birth date null,
  gender character varying(50) null,
  bio text null,
  profile_picture character varying(500) null,
  cover_picture character varying(500) null,
  country_code character varying(10) null,
  mobile_number character varying(20) null,
  country character varying(100) null,
  city character varying(100) null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  is_verified boolean null default false,
  is_premium boolean null default false,
  is_admin boolean null default false,
  is_active boolean null default true,
  coins_balance integer null default 0,
  total_coins_earned integer null default 0,
  language character varying(10) null default 'en'::character varying,
  looking_for character varying(50) null,
  interests text[] null,
  last_login_at timestamp with time zone null,
  email_verified_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  followers_count integer null default 0,
  following_count integer null default 0,
  referral_code character varying(20) null,
  referred_by uuid null,
  referral_bonus_claimed boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_referral_code_key unique (referral_code),
  constraint users_referred_by_fkey foreign KEY (referred_by) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_country on public.users using btree (country) TABLESPACE pg_default;

create index IF not exists idx_users_is_active on public.users using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_users_is_premium on public.users using btree (is_premium) TABLESPACE pg_default;

-- user_verifications (added)
create table IF NOT EXISTS public.user_verifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  id_type character varying(50) NOT NULL,
  id_number character varying(100),
  id_document_url character varying(500),
  selfie_url character varying(500),
  status character varying(50) NOT NULL DEFAULT 'pending',
  decision_reason text NULL,
  reviewed_by uuid NULL,
  reviewed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  constraint user_verifications_pkey primary key (id),
  constraint user_verifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_verifications_user_id on public.user_verifications using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_user_verifications_status on public.user_verifications using btree (status) TABLESPACE pg_default;

-- Trigger to create notifications for verification submissions and status changes
CREATE OR REPLACE FUNCTION public.create_verification_notification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at)
    VALUES (NEW.user_id, 'verification', 'Verification submitted', 'Your verification request has been received and is pending review.', NEW.user_id, NEW.id, 'verification', '/dashboard/verification', now());
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
      IF (NEW.status = 'verified') THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at)
        VALUES (NEW.user_id, 'verification', 'Profile verified', 'Congratulations — your profile has been verified.', COALESCE(NEW.reviewed_by, NULL), NEW.id, 'verification', '/profile/' || NEW.user_id, now());
      ELSIF (NEW.status = 'rejected') THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at)
        VALUES (NEW.user_id, 'verification', 'Verification rejected', COALESCE(NEW.decision_reason, 'Your verification was not approved.'), COALESCE(NEW.reviewed_by, NULL), NEW.id, 'verification', '/dashboard/verification', now());
      ELSE
        INSERT INTO notifications (user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at)
        VALUES (NEW.user_id, 'verification', 'Verification updated', 'Your verification status is now: ' || NEW.status, COALESCE(NEW.reviewed_by, NULL), NEW.id, 'verification', '/dashboard/verification', now());
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_notification_trigger ON public.user_verifications;
CREATE TRIGGER verification_notification_trigger
AFTER INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.create_verification_notification();

create index IF not exists idx_users_created_at on public.users using btree (created_at) TABLESPACE pg_default;

create trigger award_signup_bonus_trigger
after INSERT on users for EACH row
execute FUNCTION award_signup_bonus ();

create trigger referral_completion_trigger
after
update on users for EACH row when (
  old.gender::text is distinct from new.gender::text
  or old.date_of_birth is distinct from new.date_of_birth
  or old.bio is distinct from new.bio
)
execute FUNCTION handle_referral_completion ();

create trigger set_referral_code_trigger BEFORE INSERT on users for EACH row
execute FUNCTION set_referral_code ();



-- verification tokens
create table public.verification_tokens (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  token character varying(255) not null,
  token_type character varying(50) not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint verification_tokens_pkey primary key (id),
  constraint verification_tokens_token_key unique (token),
  constraint verification_tokens_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_verification_tokens_token on public.verification_tokens using btree (token) TABLESPACE pg_default;

create index IF not exists idx_verification_tokens_user_id on public.verification_tokens using btree (user_id) TABLESPACE pg_default;


-- ============================================================
-- MARKETPLACE PRODUCTS TABLE
-- ============================================================
create table public.marketplace_products (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title character varying(255) not null,
  description text null,
  category character varying(100) not null,
  price numeric(10, 2) not null,
  currency character varying(10) null default 'USD'::character varying,
  media jsonb null default '[]'::jsonb,
  is_available boolean null default true,
  is_featured boolean null default false,
  views_count integer null default 0,
  interest_count integer null default 0,
  location_name character varying(255) null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  tags text[] null,
  condition character varying(50) null,
  status character varying(50) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketplace_products_pkey primary key (id),
  constraint marketplace_products_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_marketplace_products_user_id on public.marketplace_products using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_products_category on public.marketplace_products using btree (category) TABLESPACE pg_default;

create index IF not exists idx_marketplace_products_status on public.marketplace_products using btree (status) TABLESPACE pg_default;

create index IF not exists idx_marketplace_products_created_at on public.marketplace_products using btree (created_at desc) TABLESPACE pg_default;


-- ============================================================
-- MARKETPLACE INQUIRIES TABLE
-- ============================================================
create table public.marketplace_inquiries (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  buyer_id uuid not null,
  message text null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketplace_inquiries_pkey primary key (id),
  constraint marketplace_inquiries_product_id_fkey foreign KEY (product_id) references marketplace_products (id) on delete CASCADE,
  constraint marketplace_inquiries_buyer_id_fkey foreign KEY (buyer_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_marketplace_inquiries_product_id on public.marketplace_inquiries using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_inquiries_buyer_id on public.marketplace_inquiries using btree (buyer_id) TABLESPACE pg_default;


-- ============================================================
-- EVENTS TABLE
-- ============================================================
create table public.events (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_by uuid not null,
  title character varying(255) not null,
  description text null,
  category character varying(100) not null,
  event_date timestamp with time zone not null,
  event_end_date timestamp with time zone null,
  location_name character varying(255) null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  thumbnail character varying(500) null,
  media jsonb null default '[]'::jsonb,
  capacity integer null,
  registered_count integer null default 0,
  ticket_price numeric(10, 2) null,
  is_free boolean null default true,
  is_featured boolean null default false,
  status character varying(50) null default 'upcoming'::character varying,
  tags text[] null,
  organizer_name character varying(255) null,
  organizer_contact character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id),
  constraint events_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_events_created_by on public.events using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_events_status on public.events using btree (status) TABLESPACE pg_default;

create index IF not exists idx_events_category on public.events using btree (category) TABLESPACE pg_default;

create index IF not exists idx_events_event_date on public.events using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_events_created_at on public.events using btree (created_at desc) TABLESPACE pg_default;


-- ============================================================
-- EVENT REGISTRATIONS TABLE
-- ============================================================
create table public.event_registrations (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  user_id uuid not null,
  status character varying(50) null default 'registered'::character varying,
  registered_at timestamp with time zone null default now(),
  constraint event_registrations_pkey primary key (id),
  constraint event_registrations_event_id_user_id_key unique (event_id, user_id),
  constraint event_registrations_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint event_registrations_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_registrations_event_id on public.event_registrations using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_event_registrations_user_id on public.event_registrations using btree (user_id) TABLESPACE pg_default;


-- ============================================================
-- BLOG POSTS TABLE
-- ============================================================
create table public.blog_posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  author_id uuid not null,
  title character varying(255) not null,
  slug character varying(255) not null,
  content text not null,
  excerpt text null,
  thumbnail character varying(500) null,
  category character varying(100) null,
  tags text[] null,
  is_published boolean null default false,
  is_featured boolean null default false,
  views_count integer null default 0,
  likes_count integer null default 0,
  comments_count integer null default 0,
  published_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint blog_posts_pkey primary key (id),
  constraint blog_posts_slug_key unique (slug),
  constraint blog_posts_author_id_fkey foreign KEY (author_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_author_id on public.blog_posts using btree (author_id) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_slug on public.blog_posts using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_is_published on public.blog_posts using btree (is_published) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_published_at on public.blog_posts using btree (published_at desc) TABLESPACE pg_default;


-- ============================================================
-- BLOG COMMENTS TABLE
-- ============================================================
create table public.blog_comments (
  id uuid not null default extensions.uuid_generate_v4 (),
  post_id uuid not null,
  user_id uuid not null,
  parent_id uuid null,
  content text not null,
  is_approved boolean null default true,
  likes_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint blog_comments_pkey primary key (id),
  constraint blog_comments_parent_id_fkey foreign KEY (parent_id) references blog_comments (id) on delete CASCADE,
  constraint blog_comments_post_id_fkey foreign KEY (post_id) references blog_posts (id) on delete CASCADE,
  constraint blog_comments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_blog_comments_post_id on public.blog_comments using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_blog_comments_user_id on public.blog_comments using btree (user_id) TABLESPACE pg_default;


-- ============================================================
-- ACCOUNT TOPUP REQUESTS TABLE
-- ============================================================
create table public.account_topups (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  amount numeric(10, 2) not null,
  coins_amount integer not null,
  payment_method character varying(50) not null,
  status character varying(50) null default 'pending'::character varying,
  reference_id character varying(255) null,
  processed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint account_topups_pkey primary key (id),
  constraint account_topups_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_account_topups_user_id on public.account_topups using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_account_topups_status on public.account_topups using btree (status) TABLESPACE pg_default;

create index IF not exists idx_account_topups_created_at on public.account_topups using btree (created_at desc) TABLESPACE pg_default;


-- ============================================================
-- PREMIUM SUBSCRIPTIONS TABLE
-- ============================================================
create table public.premium_subscriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  plan character varying(50) not null,
  amount numeric(10, 2) not null,
  status character varying(50) null default 'active'::character varying,
  started_at timestamp with time zone null default now(),
  expires_at timestamp with time zone not null,
  auto_renew boolean null default true,
  payment_method character varying(50) null,
  reference_id character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint premium_subscriptions_pkey primary key (id),
  constraint premium_subscriptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_premium_subscriptions_user_id on public.premium_subscriptions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_premium_subscriptions_status on public.premium_subscriptions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_premium_subscriptions_expires_at on public.premium_subscriptions using btree (expires_at) TABLESPACE pg_default;


-- ============================================================
-- CONTENT REQUEST TABLE (for posts, events, products)
-- ============================================================
create table public.content_requests (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  request_type character varying(50) not null,
  title character varying(255) not null,
  description text null,
  details jsonb null,
  status character varying(50) null default 'pending'::character varying,
  admin_notes text null,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint content_requests_pkey primary key (id),
  constraint content_requests_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint content_requests_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_content_requests_user_id on public.content_requests using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_content_requests_request_type on public.content_requests using btree (request_type) TABLESPACE pg_default;

create index IF not exists idx_content_requests_status on public.content_requests using btree (status) TABLESPACE pg_default;

create index IF not exists idx_content_requests_created_at on public.content_requests using btree (created_at desc) TABLESPACE pg_default;


-- ============================================================
-- USER PREFERENCES TABLE
-- ============================================================
create table public.user_preferences (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  email_notifications boolean null default true,
  push_notifications boolean null default true,
  sms_notifications boolean null default false,
  marketing_emails boolean null default false,
  show_online_status boolean null default true,
  profile_visibility character varying(50) null default 'public'::character varying,
  allow_messages_from character varying(50) null default 'everyone'::character varying,
  theme character varying(50) null default 'system'::character varying,
  language character varying(10) null default 'en'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_preferences_user_id on public.user_preferences using btree (user_id) TABLESPACE pg_default;


-- ============================================================
-- USER SECURITY SETTINGS TABLE
-- ============================================================
create table public.user_security_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  two_factor_enabled boolean null default false,
  two_factor_method character varying(50) null,
  backup_codes text[] null,
  last_password_change timestamp with time zone null,
  password_change_required boolean null default false,
  active_sessions_count integer null default 0,
  login_alerts_enabled boolean null default true,
  suspicious_activity_alerts_enabled boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_security_settings_pkey primary key (id),
  constraint user_security_settings_user_id_key unique (user_id),
  constraint user_security_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_security_settings_user_id on public.user_security_settings using btree (user_id) TABLESPACE pg_default;


-- ============================================================
-- PRIVACY SETTINGS TABLE
-- ============================================================
create table public.privacy_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  allow_friend_requests boolean null default true,
  allow_profile_visits boolean null default true,
  show_last_seen boolean null default true,
  show_activity_status boolean null default true,
  block_list text[] null,
  mute_list text[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint privacy_settings_pkey primary key (id),
  constraint privacy_settings_user_id_key unique (user_id),
  constraint privacy_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_privacy_settings_user_id on public.privacy_settings using btree (user_id) TABLESPACE pg_default;


-- MARKETPLACE TABLES
-- ============================================================
create table if not exists public.marketplace_products (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title character varying(255) not null,
  description text not null,
  category character varying(100) not null,
  price numeric(10, 2) not null,
  currency character varying(10) null default 'USD'::character varying,
  images jsonb null default '[]'::jsonb,
  condition character varying(50) not null,
  is_available boolean null default true,
  views_count integer null default 0,
  interested_count integer null default 0,
  rating numeric(3, 2) null,
  reviews_count integer null default 0,
  location_name character varying(255) null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketplace_products_pkey primary key (id),
  constraint marketplace_products_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_marketplace_products_user_id on public.marketplace_products using btree (user_id) tablespace pg_default;
create index if not exists idx_marketplace_products_category on public.marketplace_products using btree (category) tablespace pg_default;
create index if not exists idx_marketplace_products_is_available on public.marketplace_products using btree (is_available) tablespace pg_default;
create index if not exists idx_marketplace_products_created_at on public.marketplace_products using btree (created_at desc) tablespace pg_default;

create table if not exists public.marketplace_inquiries (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  buyer_id uuid not null,
  message text null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketplace_inquiries_pkey primary key (id),
  constraint marketplace_inquiries_product_id_fkey foreign key (product_id) references marketplace_products (id) on delete cascade,
  constraint marketplace_inquiries_buyer_id_fkey foreign key (buyer_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_marketplace_inquiries_product_id on public.marketplace_inquiries using btree (product_id) tablespace pg_default;
create index if not exists idx_marketplace_inquiries_buyer_id on public.marketplace_inquiries using btree (buyer_id) tablespace pg_default;
create index if not exists idx_marketplace_inquiries_status on public.marketplace_inquiries using btree (status) tablespace pg_default;


-- EVENTS TABLES
-- ============================================================
create table if not exists public.events (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title character varying(255) not null,
  description text not null,
  category character varying(100) not null,
  event_date timestamp with time zone not null,
  end_date timestamp with time zone null,
  location_name character varying(255) not null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  image_url character varying(500) null,
  capacity integer null,
  registered_count integer null default 0,
  is_public boolean null default true,
  is_cancelled boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id),
  constraint events_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_events_user_id on public.events using btree (user_id) tablespace pg_default;
create index if not exists idx_events_category on public.events using btree (category) tablespace pg_default;
create index if not exists idx_events_event_date on public.events using btree (event_date) tablespace pg_default;
create index if not exists idx_events_is_public on public.events using btree (is_public) tablespace pg_default;

create table if not exists public.event_registrations (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  user_id uuid not null,
  status character varying(50) null default 'registered'::character varying,
  created_at timestamp with time zone null default now(),
  constraint event_registrations_pkey primary key (id),
  constraint event_registrations_event_id_user_id_key unique (event_id, user_id),
  constraint event_registrations_event_id_fkey foreign key (event_id) references events (id) on delete cascade,
  constraint event_registrations_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_event_registrations_event_id on public.event_registrations using btree (event_id) tablespace pg_default;
create index if not exists idx_event_registrations_user_id on public.event_registrations using btree (user_id) tablespace pg_default;


-- BLOG TABLES
-- ============================================================
create table if not exists public.blog_posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title character varying(255) not null,
  slug character varying(255) not null unique,
  content text not null,
  excerpt text null,
  thumbnail_url character varying(500) null,
  category character varying(100) not null,
  status character varying(50) null default 'draft'::character varying,
  views_count integer null default 0,
  likes_count integer null default 0,
  comments_count integer null default 0,
  is_featured boolean null default false,
  published_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint blog_posts_pkey primary key (id),
  constraint blog_posts_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_blog_posts_user_id on public.blog_posts using btree (user_id) tablespace pg_default;
create index if not exists idx_blog_posts_slug on public.blog_posts using btree (slug) tablespace pg_default;
create index if not exists idx_blog_posts_status on public.blog_posts using btree (status) tablespace pg_default;
create index if not exists idx_blog_posts_category on public.blog_posts using btree (category) tablespace pg_default;
create index if not exists idx_blog_posts_published_at on public.blog_posts using btree (published_at desc) tablespace pg_default;

create table if not exists public.blog_comments (
  id uuid not null default extensions.uuid_generate_v4 (),
  post_id uuid not null,
  user_id uuid not null,
  parent_id uuid null,
  content text not null,
  likes_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint blog_comments_pkey primary key (id),
  constraint blog_comments_post_id_fkey foreign key (post_id) references blog_posts (id) on delete cascade,
  constraint blog_comments_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint blog_comments_parent_id_fkey foreign key (parent_id) references blog_comments (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_blog_comments_post_id on public.blog_comments using btree (post_id) tablespace pg_default;
create index if not exists idx_blog_comments_user_id on public.blog_comments using btree (user_id) tablespace pg_default;


-- CONTENT REQUEST TABLES
-- ============================================================
create table if not exists public.content_requests (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  request_type character varying(50) not null,
  title character varying(255) not null,
  description text not null,
  category character varying(100) null,
  status character varying(50) null default 'pending'::character varying,
  admin_notes text null,
  admin_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint content_requests_pkey primary key (id),
  constraint content_requests_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint content_requests_admin_id_fkey foreign key (admin_id) references users (id) on delete set null
) tablespace pg_default;

create index if not exists idx_content_requests_user_id on public.content_requests using btree (user_id) tablespace pg_default;
create index if not exists idx_content_requests_request_type on public.content_requests using btree (request_type) tablespace pg_default;
create index if not exists idx_content_requests_status on public.content_requests using btree (status) tablespace pg_default;


-- PREMIUM & BILLING TABLES
-- ============================================================
create table if not exists public.premium_subscriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null unique,
  plan character varying(50) null default 'monthly'::character varying,
  status character varying(50) null default 'active'::character varying,
  price numeric(10, 2) not null,
  currency character varying(10) null default 'USD'::character varying,
  start_date timestamp with time zone null default now(),
  end_date timestamp with time zone null,
  auto_renew boolean null default true,
  next_billing_date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint premium_subscriptions_pkey primary key (id),
  constraint premium_subscriptions_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_premium_subscriptions_user_id on public.premium_subscriptions using btree (user_id) tablespace pg_default;
create index if not exists idx_premium_subscriptions_status on public.premium_subscriptions using btree (status) tablespace pg_default;

create table if not exists public.account_topups (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  amount numeric(10, 2) not null,
  coins integer not null,
  currency character varying(10) null default 'USD'::character varying,
  payment_method character varying(50) not null,
  transaction_id character varying(255) null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint account_topups_pkey primary key (id),
  constraint account_topups_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_account_topups_user_id on public.account_topups using btree (user_id) tablespace pg_default;
create index if not exists idx_account_topups_status on public.account_topups using btree (status) tablespace pg_default;


-- SETTINGS TABLES
-- ============================================================
create table if not exists public.notification_preferences (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null unique,
  likes_notifications boolean null default true,
  comments_notifications boolean null default true,
  messages_notifications boolean null default true,
  match_notifications boolean null default true,
  event_notifications boolean null default true,
  email_notifications boolean null default false,
  push_notifications boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint notification_preferences_pkey primary key (id),
  constraint notification_preferences_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_notification_preferences_user_id on public.notification_preferences using btree (user_id) tablespace pg_default;

create table if not exists public.security_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null unique,
  two_factor_enabled boolean null default false,
  two_factor_method character varying(50) null,
  last_login_at timestamp with time zone null,
  last_password_change_at timestamp with time zone null,
  login_attempts integer null default 0,
  account_locked boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint security_settings_pkey primary key (id),
  constraint security_settings_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_security_settings_user_id on public.security_settings using btree (user_id) tablespace pg_default;


-- FOLLOWERS/FOLLOWING TABLE
-- ============================================================
create table if not exists public.follows (
  id uuid not null default extensions.uuid_generate_v4 (),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint follows_pkey primary key (id),
  constraint follows_follower_id_following_id_key unique (follower_id, following_id),
  constraint follows_follower_id_fkey foreign key (follower_id) references users (id) on delete cascade,
  constraint follows_following_id_fkey foreign key (following_id) references users (id) on delete cascade,
  constraint follows_check check ((follower_id <> following_id))
) tablespace pg_default;

create index if not exists idx_follows_follower_id on public.follows using btree (follower_id) tablespace pg_default;
create index if not exists idx_follows_following_id on public.follows using btree (following_id) tablespace pg_default;


-- ADMIN MESSAGING SYSTEM
-- ============================================================
create table if not exists public.admin_messages_conversations (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  admin_id uuid not null,
  last_message text null,
  last_message_time timestamp with time zone null default now(),
  unread_count integer null default 0,
  is_resolved boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_messages_conversations_pkey primary key (id),
  constraint admin_messages_conversations_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint admin_messages_conversations_admin_id_fkey foreign key (admin_id) references admins (id) on delete cascade,
  constraint admin_messages_conversations_unique unique (user_id, admin_id)
) tablespace pg_default;

create index if not exists idx_admin_messages_conversations_user_id on public.admin_messages_conversations using btree (user_id) tablespace pg_default;
create index if not exists idx_admin_messages_conversations_admin_id on public.admin_messages_conversations using btree (admin_id) tablespace pg_default;
create index if not exists idx_admin_messages_conversations_resolved on public.admin_messages_conversations using btree (is_resolved) tablespace pg_default;
create index if not exists idx_admin_messages_conversations_last_message_time on public.admin_messages_conversations using btree (last_message_time desc) tablespace pg_default;


create table if not exists public.admin_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  conversation_id uuid not null,
  sender_id uuid not null,
  sender_type character varying(50) not null,
  content text not null,
  attachment_url text null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_messages_pkey primary key (id),
  constraint admin_messages_conversation_id_fkey foreign key (conversation_id) references admin_messages_conversations (id) on delete cascade,
  constraint admin_messages_sender_type_check check ((sender_type in ('user', 'admin')))
) tablespace pg_default;

create index if not exists idx_admin_messages_conversation_id on public.admin_messages using btree (conversation_id) tablespace pg_default;
create index if not exists idx_admin_messages_sender_id on public.admin_messages using btree (sender_id) tablespace pg_default;
create index if not exists idx_admin_messages_created_at on public.admin_messages using btree (created_at desc) tablespace pg_default;


-- FEATURED REQUESTS TABLE
-- ============================================================
-- Stores feature requests from users for products/services/events
create table if not exists public.featured_requests (
  id uuid not null default extensions.uuid_generate_v4 (),
  title character varying(255) not null,
  description text not null,
  type character varying(50) not null,
  image_url character varying(500),
  status character varying(50) not null default 'pending',
  user_id uuid not null,
  views integer default 0,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint featured_requests_pkey primary key (id),
  constraint featured_requests_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_featured_requests_user_id on public.featured_requests using btree (user_id) tablespace pg_default;
create index if not exists idx_featured_requests_status on public.featured_requests using btree (status) tablespace pg_default;
create index if not exists idx_featured_requests_created_at on public.featured_requests using btree (created_at desc) tablespace pg_default;
create index if not exists idx_featured_requests_type on public.featured_requests using btree (type) tablespace pg_default;


-- ADMINS TABLE
-- ============================================================
create table if not exists public.admins (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null unique,
  password_hash character varying(255) not null,
  full_name character varying(255) not null,
  profile_picture character varying(500),
  cover_image character varying(500),
  role character varying(50) not null default 'moderator',
  permissions text[] default '{}'::text[],
  is_active boolean not null default true,
  two_factor_enabled boolean default false,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) tablespace pg_default;

create index if not exists idx_admins_email on public.admins using btree (email) tablespace pg_default;
create index if not exists idx_admins_is_active on public.admins using btree (is_active) tablespace pg_default;
create index if not exists idx_admins_role on public.admins using btree (role) tablespace pg_default;
create index if not exists idx_admins_created_at on public.admins using btree (created_at desc) tablespace pg_default;


-- ADMIN NOTIFICATIONS TABLE
-- ============================================================
-- Stores notifications specific to admins (separate from user notifications)
create table if not exists public.admin_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  admin_id uuid not null,
  type character varying(50) not null,
  title character varying(255) not null,
  message text,
  related_type character varying(50),
  related_id uuid,
  action_url character varying(500),
  is_read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  constraint admin_notifications_pkey primary key (id),
  constraint admin_notifications_admin_id_fkey foreign key (admin_id) references admins (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_admin_notifications_admin_id on public.admin_notifications using btree (admin_id) tablespace pg_default;
create index if not exists idx_admin_notifications_is_read on public.admin_notifications using btree (is_read) tablespace pg_default;
create index if not exists idx_admin_notifications_created_at on public.admin_notifications using btree (created_at desc) tablespace pg_default;
create index if not exists idx_admin_notifications_admin_id_is_read on public.admin_notifications using btree (admin_id, is_read) tablespace pg_default;