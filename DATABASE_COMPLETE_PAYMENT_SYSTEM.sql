-- ============================================================================
-- COMPREHENSIVE PAYMENT & WITHDRAWAL SYSTEM - SINGLE MIGRATION FILE
-- ============================================================================
-- This file includes all new tables, modifications, and triggers needed for:
-- 1. Withdrawal system with bank verification
-- 2. Payment tracking for marketplace products
-- 3. Payment tracking for events with proper currency handling
-- 4. Message payment tracking
-- 5. Notifications and audit trails
-- ============================================================================

-- ============================================================================
-- 1. WITHDRAWAL REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency character varying NOT NULL DEFAULT 'USD',
  amount_in_naira numeric NOT NULL,
  requested_coins integer NOT NULL,
  bank_code character varying NOT NULL,
  bank_name character varying NOT NULL,
  account_number character varying NOT NULL,
  account_name character varying NOT NULL,
  account_type character varying DEFAULT 'individual',
  status character varying NOT NULL DEFAULT 'pending',
  notes text,
  processed_by uuid,
  processed_at timestamp with time zone,
  rejection_reason text,
  current_coin_balance integer NOT NULL,
  user_coin_balance_at_request integer NOT NULL,
  reference_id character varying,
  paystack_recipient_code character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT withdraw_requests_pkey PRIMARY KEY (id),
  CONSTRAINT withdraw_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT withdraw_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id ON public.withdraw_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON public.withdraw_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created_at ON public.withdraw_requests USING btree (created_at DESC);

-- ============================================================================
-- 2. MARKETPLACE MESSAGE PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.marketplace_message_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency character varying NOT NULL DEFAULT 'USD',
  amount_in_naira numeric,
  status character varying NOT NULL DEFAULT 'pending',
  payment_reference character varying,
  transaction_id uuid,
  message_unlocked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT marketplace_message_payments_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_message_payments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_message_payments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_message_payments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_message_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_message_payments_product_buyer ON public.marketplace_message_payments USING btree (product_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_payments_buyer_seller ON public.marketplace_message_payments USING btree (buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_payments_status ON public.marketplace_message_payments USING btree (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_message_payments_unique_buyer_product ON public.marketplace_message_payments (product_id, buyer_id) WHERE status = 'completed';

-- ============================================================================
-- 3. UPDATE EVENT_REGISTRATIONS TABLE TO INCLUDE PAYMENT FIELDS
-- ============================================================================
-- First, check if columns exist before adding them
ALTER TABLE IF EXISTS public.event_registrations 
ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'free',
ADD COLUMN IF NOT EXISTS payment_reference character varying,
ADD COLUMN IF NOT EXISTS transaction_id uuid,
ADD COLUMN IF NOT EXISTS amount_paid numeric,
ADD COLUMN IF NOT EXISTS currency character varying DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS payment_method character varying,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Add foreign key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_registrations_transaction_id_fkey'
  ) THEN
    ALTER TABLE public.event_registrations 
    ADD CONSTRAINT event_registrations_transaction_id_fkey 
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 4. UPDATE EVENTS TABLE TO STORE CURRENCY AND AMOUNT PROPERLY
-- ============================================================================
ALTER TABLE IF EXISTS public.events 
ADD COLUMN IF NOT EXISTS currency character varying NOT NULL DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_price_ngn numeric,
ADD COLUMN IF NOT EXISTS ticket_price_usd numeric;

-- ============================================================================
-- 5. CREATE FUNCTION TO INSERT NOTIFICATIONS (USER)
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_notification_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for user payment
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    action_url,
    created_at
  ) VALUES (
    NEW.user_id,
    'payment',
    'Payment Successful',
    CASE 
      WHEN NEW.type = 'coin_purchase' THEN 'Your coin purchase has been processed'
      WHEN NEW.type = 'event_registration' THEN 'Your event registration payment has been confirmed'
      WHEN NEW.type = 'marketplace_purchase' THEN 'Your product purchase has been confirmed'
      ELSE 'Your payment has been processed'
    END,
    NEW.id,
    'transaction',
    CASE 
      WHEN NEW.type = 'event_registration' THEN '/dashboard/events'
      WHEN NEW.type = 'marketplace_purchase' THEN '/dashboard/marketplace'
      ELSE '/dashboard/wallet'
    END,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE FUNCTION TO INSERT ADMIN NOTIFICATIONS (ADMIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_admin_notification_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admins about new withdrawal request
  INSERT INTO public.admin_notifications (
    admin_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    created_at
  )
  SELECT 
    a.id,
    'withdraw_request',
    'New Withdrawal Request',
    'User ' || u.display_name || ' has requested to withdraw $' || NEW.amount,
    NEW.id,
    'withdraw_request',
    '/admin/withdraw-requests',
    NOW()
  FROM public.admins a, public.users u
  WHERE u.id = NEW.user_id AND a.role IN ('admin', 'moderator');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE FUNCTION TO INSERT NOTIFICATIONS ON MARKETPLACE PURCHASE
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_notifications_on_marketplace_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification to buyer
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    action_url,
    created_at
  ) VALUES (
    NEW.buyer_id,
    'marketplace_purchase',
    'Purchase Confirmed',
    'Your purchase has been confirmed',
    NEW.id,
    'marketplace_purchase',
    '/dashboard/marketplace/purchases',
    NOW()
  );
  
  -- Notification to seller
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    actor_id,
    action_url,
    created_at
  ) VALUES (
    NEW.seller_id,
    'marketplace_sale',
    'New Purchase',
    'Your product has been purchased',
    NEW.id,
    'marketplace_purchase',
    NEW.buyer_id,
    '/dashboard/marketplace/sales',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CREATE FUNCTION TO INSERT NOTIFICATIONS ON EVENT REGISTRATION
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_notifications_on_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  organizer_id UUID;
BEGIN
  -- Get event details
  SELECT title, created_by INTO event_title, organizer_id
  FROM public.events
  WHERE id = NEW.event_id;
  
  -- Notification to attendee
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    action_url,
    created_at
  ) VALUES (
    NEW.user_id,
    'event_registration',
    'Registration Confirmed',
    'You have successfully registered for: ' || event_title,
    NEW.event_id,
    'event',
    '/dashboard/events/registered',
    NOW()
  );
  
  -- Notification to organizer
  IF organizer_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      actor_id,
      action_url,
      created_at
    ) VALUES (
      organizer_id,
      'event_attendee',
      'New Registration',
      'A new person has registered for your event',
      NEW.event_id,
      'event',
      NEW.user_id,
      '/dashboard/events/registrations',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. CREATE FUNCTION TO INSERT NOTIFICATIONS ON MESSAGE PAYMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_notifications_on_message_payment()
RETURNS TRIGGER AS $$
DECLARE
  product_title TEXT;
BEGIN
  -- Get product title
  SELECT title INTO product_title
  FROM public.marketplace_products
  WHERE id = NEW.product_id;
  
  -- Notification to seller that buyer paid to message
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    actor_id,
    action_url,
    created_at
  ) VALUES (
    NEW.seller_id,
    'message_payment',
    'New Buyer Message',
    'Someone paid to message about: ' || product_title,
    NEW.product_id,
    'marketplace_product',
    NEW.buyer_id,
    '/dashboard/marketplace/messages',
    NOW()
  );
  
  -- Notification to buyer
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    action_url,
    created_at
  ) VALUES (
    NEW.buyer_id,
    'message_payment',
    'Message Access Unlocked',
    'You can now message the seller about: ' || product_title,
    NEW.product_id,
    'marketplace_product',
    '/dashboard/marketplace/messages',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE TRIGGERS FOR PAYMENT NOTIFICATIONS
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_insert_notification_on_payment ON public.transactions;
CREATE TRIGGER trigger_insert_notification_on_payment
AFTER INSERT ON public.transactions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND NEW.user_id IS NOT NULL)
EXECUTE FUNCTION insert_notification_on_payment();

DROP TRIGGER IF EXISTS trigger_insert_admin_notification_on_withdrawal ON public.withdraw_requests;
CREATE TRIGGER trigger_insert_admin_notification_on_withdrawal
AFTER INSERT ON public.withdraw_requests
FOR EACH ROW
EXECUTE FUNCTION insert_admin_notification_on_withdrawal();

DROP TRIGGER IF EXISTS trigger_insert_notifications_on_marketplace_purchase ON public.marketplace_purchases;
CREATE TRIGGER trigger_insert_notifications_on_marketplace_purchase
AFTER INSERT ON public.marketplace_purchases
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION insert_notifications_on_marketplace_purchase();

DROP TRIGGER IF EXISTS trigger_insert_notifications_on_event_registration ON public.event_registrations;
CREATE TRIGGER trigger_insert_notifications_on_event_registration
AFTER INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW
WHEN (NEW.payment_status = 'completed' OR (NEW.payment_status = 'free' AND NEW.registered_at IS NOT NULL))
EXECUTE FUNCTION insert_notifications_on_event_registration();

DROP TRIGGER IF EXISTS trigger_insert_notifications_on_message_payment ON public.marketplace_message_payments;
CREATE TRIGGER trigger_insert_notifications_on_message_payment
AFTER INSERT ON public.marketplace_message_payments
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION insert_notifications_on_message_payment();

-- ============================================================================
-- 11. CREATE FUNCTION TO UPDATE WALLET ON PRODUCT PURCHASE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_seller_wallet_on_product_purchase()
RETURNS TRIGGER AS $$
DECLARE
  seller_coins_to_add INTEGER;
  seller_new_balance INTEGER;
BEGIN
  -- Calculate coins to add (10% of amount in dollars)
  seller_coins_to_add := FLOOR(NEW.total_amount * 0.1 * 500);
  
  -- Update seller's wallet
  UPDATE public.users
  SET 
    coins_balance = coins_balance + seller_coins_to_add,
    total_coins_earned = total_coins_earned + seller_coins_to_add,
    updated_at = NOW()
  WHERE id = NEW.seller_id
  RETURNING coins_balance INTO seller_new_balance;
  
  -- Insert coin transaction
  INSERT INTO public.coin_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    reference_type,
    balance_after,
    created_at
  ) VALUES (
    NEW.seller_id,
    seller_coins_to_add,
    'product_sale',
    'Earned from product sale',
    NEW.id,
    'marketplace_purchase',
    seller_new_balance,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. CREATE FUNCTION TO UPDATE WALLET ON EVENT REGISTRATION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_organizer_wallet_on_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  organizer_coins_to_add INTEGER;
  organizer_new_balance INTEGER;
BEGIN
  -- Only process if payment status is completed
  IF NEW.payment_status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get organizer ID
  SELECT created_by INTO organizer_id
  FROM public.events
  WHERE id = NEW.event_id;
  
  IF organizer_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate coins to add (based on amount paid)
  IF NEW.amount_paid IS NOT NULL AND NEW.amount_paid > 0 THEN
    organizer_coins_to_add := FLOOR(NEW.amount_paid * 500);
    
    -- Update organizer's wallet
    UPDATE public.users
    SET 
      coins_balance = coins_balance + organizer_coins_to_add,
      total_coins_earned = total_coins_earned + organizer_coins_to_add,
      updated_at = NOW()
    WHERE id = organizer_id
    RETURNING coins_balance INTO organizer_new_balance;
    
    -- Insert coin transaction
    INSERT INTO public.coin_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id,
      reference_type,
      balance_after,
      created_at
    ) VALUES (
      organizer_id,
      organizer_coins_to_add,
      'event_registration',
      'Earned from event registration',
      NEW.id,
      'event_registration',
      organizer_new_balance,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. CREATE TRIGGERS FOR WALLET UPDATES
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_seller_wallet_on_product_purchase ON public.marketplace_purchases;
CREATE TRIGGER trigger_update_seller_wallet_on_product_purchase
AFTER INSERT ON public.marketplace_purchases
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_seller_wallet_on_product_purchase();

DROP TRIGGER IF EXISTS trigger_update_organizer_wallet_on_event_registration ON public.event_registrations;
CREATE TRIGGER trigger_update_organizer_wallet_on_event_registration
AFTER INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_organizer_wallet_on_event_registration();

-- ============================================================================
-- 14. ADD INDEXES FOR BETTER PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON public.marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_id ON public.marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_seller_id ON public.marketplace_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_product_id ON public.marketplace_purchases(product_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON public.coin_transactions(transaction_type);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. Created withdraw_requests table for withdrawal requests
-- 2. Created marketplace_message_payments table for message access payments
-- 3. Updated event_registrations with payment fields
-- 4. Updated events table with currency fields
-- 5. Created 7 trigger functions for automatic notifications
-- 6. Created 2 wallet update functions for sellers/organizers
-- 7. Added appropriate indexes for performance
-- ============================================================================
