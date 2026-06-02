-- Subscription services: admin-created services that users can buy with Paystack.
-- Run this in Supabase SQL editor after the existing schema.

create table if not exists public.subscription_services (
  id uuid primary key default uuid_generate_v4(),
  name varchar not null,
  company varchar,
  description text not null,
  category varchar not null default 'General',
  price numeric(12,2) not null check (price >= 0),
  currency varchar not null default 'NGN',
  duration_value integer not null default 1 check (duration_value > 0),
  duration_unit varchar not null default 'month' check (duration_unit in ('day', 'week', 'month', 'year')),
  featured_services text[] not null default '{}',
  location_name varchar,
  terms text,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscription_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  service_id uuid not null references public.subscription_services(id) on delete restrict,
  amount numeric(12,2) not null,
  currency varchar not null default 'NGN',
  status varchar not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  payment_status varchar not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  paystack_reference varchar unique,
  paystack_transaction_id varchar,
  receipt_number varchar unique,
  starts_at timestamptz,
  expires_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscription_services_active on public.subscription_services(is_active, is_featured, created_at desc);
create index if not exists idx_user_subscription_purchases_user on public.user_subscription_purchases(user_id, status, created_at desc);
create index if not exists idx_user_subscription_purchases_reference on public.user_subscription_purchases(paystack_reference);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_subscription_services_updated_at on public.subscription_services;
create trigger touch_subscription_services_updated_at
before update on public.subscription_services
for each row execute function public.touch_updated_at();

drop trigger if exists touch_user_subscription_purchases_updated_at on public.user_subscription_purchases;
create trigger touch_user_subscription_purchases_updated_at
before update on public.user_subscription_purchases
for each row execute function public.touch_updated_at();

create or replace function public.notify_subscription_service_created()
returns trigger as $$
begin
  insert into public.admin_notifications (admin_id, type, title, message, related_id, related_type, action_url)
  select id, 'subscription_service_created', 'Subscription service created',
         new.name || ' is now available in subscription services.',
         new.id, 'subscription_service', '/admin/subscriptions'
  from public.admins
  where is_active = true;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_subscription_service_created on public.subscription_services;
create trigger trg_notify_subscription_service_created
after insert on public.subscription_services
for each row execute function public.notify_subscription_service_created();

create or replace function public.notify_subscription_purchase_paid()
returns trigger as $$
declare
  service_name text;
begin
  if new.payment_status = 'paid' and coalesce(old.payment_status, 'pending') <> 'paid' then
    select name into service_name from public.subscription_services where id = new.service_id;

    insert into public.notifications (user_id, type, title, message, reference_id, reference_type, action_url)
    values (
      new.user_id,
      'subscription_purchase_paid',
      'Subscription purchased',
      'Your ' || coalesce(service_name, 'subscription') || ' subscription is now active.',
      new.id,
      'user_subscription_purchase',
      '/dashboard/subscriptions'
    );

    insert into public.admin_notifications (admin_id, type, title, message, related_id, related_type, action_url)
    select id, 'subscription_purchase_paid', 'New subscription purchase',
           'A user purchased ' || coalesce(service_name, 'a subscription') || '.',
           new.id, 'user_subscription_purchase', '/admin/subscriptions'
    from public.admins
    where is_active = true;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_subscription_purchase_paid on public.user_subscription_purchases;
create trigger trg_notify_subscription_purchase_paid
after update on public.user_subscription_purchases
for each row execute function public.notify_subscription_purchase_paid();

alter table public.subscription_services enable row level security;
alter table public.user_subscription_purchases enable row level security;

-- This app uses NextAuth plus public.users/public.admins, not Supabase Auth.
-- Supabase RLS cannot safely identify the current app user with auth.uid().
-- Reads/writes that need user/admin identity are enforced in the Next.js API routes
-- with the service-role Supabase client. Keep direct table writes blocked by RLS.

drop policy if exists "Anyone can view subscription services" on public.subscription_services;
drop policy if exists "Public can view subscription services" on public.subscription_services;
drop policy if exists "Admins manage subscription services" on public.subscription_services;
drop policy if exists "Users view own subscription purchases" on public.user_subscription_purchases;
drop policy if exists "Users create own pending subscription purchases" on public.user_subscription_purchases;
drop policy if exists "Admins view subscription purchases" on public.user_subscription_purchases;

create policy "Public can view subscription services"
on public.subscription_services
for select
using (true);

-- No public policies are created for user_subscription_purchases.
-- The app reads and writes purchases through /api/subscriptions using service role,
-- so users only receive rows scoped to their NextAuth session in application code.
