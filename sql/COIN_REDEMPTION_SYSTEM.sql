-- Coin Redemption System Database Schema
-- This file contains all necessary tables, triggers, and data for the coin redemption system

-- ===== COIN REDEMPTION TABLES =====

-- Table for tracking coin redemptions
CREATE TABLE public.coin_redemptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  redemption_type character varying NOT NULL, -- 'premium', 'profile_boost', 'product_feature', 'gift_card'
  coins_amount integer NOT NULL,
  amount_usd numeric,
  amount_ngn numeric,
  status character varying NOT NULL DEFAULT 'active', -- 'active', 'expired', 'used'
  reference_id uuid, -- links to premium_subscriptions, profile_boosts, or product features
  expires_at timestamp with time zone NOT NULL,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table for tracking profile boosts
CREATE TABLE public.profile_boosts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  status character varying NOT NULL DEFAULT 'active', -- 'active', 'expired'
  expires_at timestamp with time zone NOT NULL,
  boost_level integer DEFAULT 1, -- 1, 2, 3 for different visibility levels
  views_count integer DEFAULT 0,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_boosts_pkey PRIMARY KEY (id),
  CONSTRAINT profile_boosts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table for tracking marketplace product features
CREATE TABLE public.product_features (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  status character varying NOT NULL DEFAULT 'active', -- 'active', 'expired'
  expires_at timestamp with time zone NOT NULL,
  feature_type character varying DEFAULT 'basic', -- 'basic', 'premium', 'special'
  views_boost_count integer DEFAULT 0,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_features_pkey PRIMARY KEY (id),
  CONSTRAINT product_features_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id),
  CONSTRAINT product_features_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table for gift cards issued through coin redemption
CREATE TABLE public.coin_gift_cards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  issued_by_user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  gift_card_value numeric NOT NULL, -- $10 USD
  gift_card_code character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  used_by_user_id uuid,
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_gift_cards_pkey PRIMARY KEY (id),
  CONSTRAINT coin_gift_cards_issued_by_user_id_fkey FOREIGN KEY (issued_by_user_id) REFERENCES public.users(id),
  CONSTRAINT coin_gift_cards_used_by_user_id_fkey FOREIGN KEY (used_by_user_id) REFERENCES public.users(id)
);

-- Table for tracking premium subscriptions via coins (in addition to existing premium_subscriptions)
CREATE TABLE public.coin_premium_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  plan character varying NOT NULL DEFAULT 'basic', -- 'basic', 'premium', 'elite'
  status character varying NOT NULL DEFAULT 'active', -- 'active', 'expired'
  expires_at timestamp with time zone NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  auto_renew boolean DEFAULT false,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_premium_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_premium_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ===== INDEXES FOR PERFORMANCE =====

CREATE INDEX idx_coin_redemptions_user_id ON public.coin_redemptions(user_id);
CREATE INDEX idx_coin_redemptions_status ON public.coin_redemptions(status);
CREATE INDEX idx_coin_redemptions_expires_at ON public.coin_redemptions(expires_at);
CREATE INDEX idx_profile_boosts_user_id ON public.profile_boosts(user_id);
CREATE INDEX idx_profile_boosts_status ON public.profile_boosts(status);
CREATE INDEX idx_product_features_product_id ON public.product_features(product_id);
CREATE INDEX idx_product_features_user_id ON public.product_features(user_id);
CREATE INDEX idx_product_features_status ON public.product_features(status);
CREATE INDEX idx_coin_gift_cards_code ON public.coin_gift_cards(gift_card_code);
CREATE INDEX idx_coin_gift_cards_status ON public.coin_gift_cards(status);
CREATE INDEX idx_coin_premium_subscriptions_user_id ON public.coin_premium_subscriptions(user_id);
CREATE INDEX idx_coin_premium_subscriptions_status ON public.coin_premium_subscriptions(status);

-- ===== TRIGGERS FOR NOTIFICATIONS =====

-- Trigger: Notify admin when premium is purchased via coins
CREATE OR REPLACE FUNCTION notify_admin_premium_coin_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'premium' OR NEW.plan = 'elite' THEN
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
    )
    SELECT
      a.id,
      'coin_redemption',
      'Premium Subscription via Coins',
      CONCAT('User purchased ', NEW.plan, ' subscription using ', NEW.coins_spent, ' coins'),
      'coin_premium_subscriptions',
      NEW.id,
      CONCAT('/admin/coin-redemptions/', NEW.id),
      false,
      now()
    FROM public.admins a
    WHERE a.role = 'admin'
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_admin_premium_coin_purchase ON public.coin_premium_subscriptions;
CREATE TRIGGER trigger_notify_admin_premium_coin_purchase
AFTER INSERT ON public.coin_premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION notify_admin_premium_coin_purchase();

-- Trigger: Notify admin when product is featured via coins
CREATE OR REPLACE FUNCTION notify_admin_product_feature_coin()
RETURNS TRIGGER AS $$
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
  )
  SELECT
    a.id,
    'coin_redemption',
    'Product Featured via Coins',
    CONCAT('User featured product using ', NEW.coins_spent, ' coins'),
    'product_features',
    NEW.id,
    CONCAT('/admin/coin-redemptions/', NEW.id),
    false,
    now()
  FROM public.admins a
  WHERE a.role = 'admin'
  LIMIT 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_admin_product_feature_coin ON public.product_features;
CREATE TRIGGER trigger_notify_admin_product_feature_coin
AFTER INSERT ON public.product_features
FOR EACH ROW
EXECUTE FUNCTION notify_admin_product_feature_coin();

-- Trigger: Notify user when premium expires
CREATE OR REPLACE FUNCTION notify_user_premium_expiring()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_type,
      reference_id,
      is_read,
      created_at
    )
    VALUES (
      NEW.user_id,
      'subscription_expired',
      'Premium Subscription Expired',
      CONCAT('Your ', NEW.plan, ' premium subscription has expired. Renew to keep your benefits.'),
      'coin_premium_subscriptions',
      NEW.id,
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_user_premium_expiring ON public.coin_premium_subscriptions;
CREATE TRIGGER trigger_notify_user_premium_expiring
BEFORE UPDATE ON public.coin_premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION notify_user_premium_expiring();

-- Trigger: Notify user when profile boost expires
CREATE OR REPLACE FUNCTION notify_user_boost_expiring()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_type,
      reference_id,
      is_read,
      created_at
    )
    VALUES (
      NEW.user_id,
      'boost_expired',
      'Profile Boost Expired',
      CONCAT('Your profile boost has expired. You had ', OLD.views_count, ' views during the boost period. Boost again to continue!'),
      'profile_boosts',
      NEW.id,
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_user_boost_expiring ON public.profile_boosts;
CREATE TRIGGER trigger_notify_user_boost_expiring
BEFORE UPDATE ON public.profile_boosts
FOR EACH ROW
EXECUTE FUNCTION notify_user_boost_expiring();

-- Trigger: Notify user when gift card is used
CREATE OR REPLACE FUNCTION notify_user_gift_card_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.used_by_user_id IS NOT NULL AND OLD.used_by_user_id IS NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_type,
      reference_id,
      is_read,
      created_at
    )
    VALUES (
      NEW.issued_by_user_id,
      'gift_card_used',
      'Your Gift Card Was Used',
      CONCAT('Your $10 gift card (', NEW.gift_card_code, ') has been redeemed!'),
      'coin_gift_cards',
      NEW.id,
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_user_gift_card_used ON public.coin_gift_cards;
CREATE TRIGGER trigger_notify_user_gift_card_used
AFTER UPDATE ON public.coin_gift_cards
FOR EACH ROW
EXECUTE FUNCTION notify_user_gift_card_used();

-- Trigger: Deduct coins from user balance when redemption is created
CREATE OR REPLACE FUNCTION deduct_coins_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET coins_balance = coins_balance - NEW.coins_amount
  WHERE id = NEW.user_id AND coins_balance >= NEW.coins_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_coins_on_redemption ON public.coin_redemptions;
CREATE TRIGGER trigger_deduct_coins_on_redemption
AFTER INSERT ON public.coin_redemptions
FOR EACH ROW
EXECUTE FUNCTION deduct_coins_on_redemption();

-- ===== SAMPLE DATA =====

-- Insert coin redemption options
INSERT INTO public.coin_rates (action_type, coins_amount, description, is_active) 
VALUES 
  ('premium_membership', 500, '1 month of premium features', true),
  ('profile_boost', 50, '24hr visibility boost', true),
  ('product_feature', 200, 'Feature product for 7 days', true),
  ('gift_card_10', 30000, '$10 gift card', true)
ON CONFLICT (action_type) DO NOTHING;
