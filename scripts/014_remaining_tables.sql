-- MARKETPLACE TABLES
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

create table if not exists public.privacy_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null unique,
  profile_visibility character varying(50) null default 'public'::character varying,
  show_online_status boolean null default true,
  allow_messages_from character varying(50) null default 'all'::character varying,
  blocked_users uuid[] null default '{}'::uuid[],
  muted_users uuid[] null default '{}'::uuid[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint privacy_settings_pkey primary key (id),
  constraint privacy_settings_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_privacy_settings_user_id on public.privacy_settings using btree (user_id) tablespace pg_default;

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
