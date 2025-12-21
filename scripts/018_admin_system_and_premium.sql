-- ============================================================
-- ADMIN SYSTEM TABLES AND FUNCTIONS
-- ============================================================

-- 1. ADMIN TABLE
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  email character varying(255) NOT NULL UNIQUE,
  password_hash character varying(255) NOT NULL,
  full_name character varying(255) NOT NULL,
  profile_picture character varying(500) NULL,
  role character varying(50) NOT NULL DEFAULT 'moderator', -- admin | moderator | analyst
  permissions text[] NULL DEFAULT '{}',
  is_active boolean NULL DEFAULT true,
  two_factor_enabled boolean NULL DEFAULT false,
  google_id character varying(255) NULL UNIQUE,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  last_login_at timestamp with time zone NULL,
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins USING btree (role) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins USING btree (is_active) TABLESPACE pg_default;

-- 2. ADMIN SECURITY QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_security_questions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NOT NULL,
  question character varying(255) NOT NULL,
  answer_hash character varying(255) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  constraint admin_security_questions_pkey primary key (id),
  constraint admin_security_questions_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_security_questions_admin_id ON public.admin_security_questions USING btree (admin_id) TABLESPACE pg_default;

-- 3. PREMIUM TIERS CONFIGURATION TABLE (must come before subscriptions)
CREATE TABLE IF NOT EXISTS public.premium_tiers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(50) NOT NULL UNIQUE,
  description text NULL,
  monthly_price integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}',
  max_boosts integer NOT NULL DEFAULT 0,
  max_profile_views integer NOT NULL DEFAULT 0,
  priority_support boolean NULL DEFAULT false,
  analytics boolean NULL DEFAULT false,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  constraint premium_tiers_pkey primary key (id),
  constraint premium_tiers_name_key unique (name)
) TABLESPACE pg_default;

-- Note: premium_subscriptions table already exists in database with 'plan' column, not 'tier'
-- If you need to alter it, use ALTER TABLE statements instead

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  admin_id uuid NULL,
  amount integer NOT NULL,
  currency character varying(10) NULL DEFAULT 'USD',
  type character varying(50) NOT NULL, -- subscription | coin_purchase | boost | marketplace | withdrawal
  status character varying(50) NOT NULL DEFAULT 'pending', -- pending | completed | failed | cancelled
  payment_method character varying(50) NOT NULL, -- paystack | paypal | apple_pay | stripe | card
  payment_reference character varying(255) NULL,
  dispute_reason text NULL,
  resolved_at timestamp with time zone NULL,
  resolved_by uuid NULL,
  metadata jsonb NULL DEFAULT '{}',
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint transactions_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete set null,
  constraint transactions_resolved_by_fkey foreign KEY (resolved_by) references admins (id) on delete set null
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_admin_id ON public.transactions USING btree (admin_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions USING btree (type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions USING btree (created_at desc) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON public.transactions USING btree (payment_method) TABLESPACE pg_default;

-- 5. ADMIN AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NOT NULL,
  action character varying(100) NOT NULL,
  resource_type character varying(100) NOT NULL,
  resource_id uuid NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  ip_address character varying(45) NULL,
  user_agent text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  constraint admin_audit_logs_pkey primary key (id),
  constraint admin_audit_logs_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs USING btree (admin_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs USING btree (action) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs USING btree (created_at desc) TABLESPACE pg_default;

-- ============================================================
-- NOTIFICATION TRIGGERS FOR ADMIN AND TRANSACTIONS
-- ============================================================

-- Trigger for transaction notifications
-- This trigger creates notifications when transactions are created or their status changes
CREATE OR REPLACE FUNCTION public.create_transaction_notification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status)) THEN
    IF NEW.status = 'completed' THEN
      IF NEW.user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type, created_at)
        VALUES (NEW.user_id, 'transaction', 'Transaction completed', 'Your ' || NEW.type || ' transaction has been completed successfully.', NEW.id, 'transaction', now());
      END IF;
    ELSIF NEW.status = 'failed' THEN
      IF NEW.user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type, created_at)
        VALUES (NEW.user_id, 'transaction', 'Transaction failed', 'Your ' || NEW.type || ' transaction failed. Please try again.', NEW.id, 'transaction', now());
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transaction_notification_trigger ON public.transactions;
CREATE TRIGGER transaction_notification_trigger
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.create_transaction_notification();

-- Insert default premium tiers
INSERT INTO premium_tiers (name, description, monthly_price, features, max_boosts, max_profile_views, priority_support, analytics)
VALUES
  ('silver', 'Perfect for getting started', 999, '{"unlimited_likes": true, "messaging": true}', 5, 100, false, false),
  ('gold', 'Most popular plan', 1999, '{"unlimited_likes": true, "messaging": true, "see_who_liked": true, "priority_matching": true}', 15, 500, true, false),
  ('platinum', 'Premium experience', 4999, '{"unlimited_likes": true, "messaging": true, "see_who_liked": true, "priority_matching": true, "verified_badge": true, "advanced_filters": true}', 50, 2000, true, true)
ON CONFLICT (name) DO NOTHING;
