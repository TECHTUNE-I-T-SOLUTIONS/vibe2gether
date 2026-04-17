-- ADMINS TABLE SETUP
-- This file creates the admins table to store admin user accounts separately from regular users

-- ============================================================
-- Create Admins Table
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

-- ============================================================
-- Create Indexes for Admins Table
-- ============================================================

create index if not exists idx_admins_email on public.admins using btree (email) tablespace pg_default;
create index if not exists idx_admins_is_active on public.admins using btree (is_active) tablespace pg_default;
create index if not exists idx_admins_role on public.admins using btree (role) tablespace pg_default;
create index if not exists idx_admins_created_at on public.admins using btree (created_at desc) tablespace pg_default;

-- ============================================================
-- Create Admin Security Questions Table (Optional)
-- ============================================================

create table if not exists public.admin_security_questions (
  id uuid not null default extensions.uuid_generate_v4 (),
  admin_id uuid not null,
  question character varying(500) not null,
  answer_hash character varying(255) not null,
  created_at timestamp with time zone not null default now(),
  constraint admin_security_questions_pkey primary key (id),
  constraint admin_security_questions_admin_id_fkey foreign key (admin_id) references admins (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_admin_security_questions_admin_id on public.admin_security_questions using btree (admin_id) tablespace pg_default;

-- ============================================================
-- Verify Tables Created
-- ============================================================

-- Run these queries to verify:
-- SELECT COUNT(*) as admin_count FROM public.admins;
-- SELECT COUNT(*) as questions_count FROM public.admin_security_questions;
