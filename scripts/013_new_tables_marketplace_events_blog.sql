-- ============================================================
-- NEW TABLES FOR MARKETPLACE, EVENTS, BLOG, REQUESTS & BILLING
-- ============================================================

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
