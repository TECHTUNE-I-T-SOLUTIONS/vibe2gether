-- Fix organizer and seller wallet triggers to convert NGN to USD before awarding coins
-- Assumptions:
-- - amount_paid is stored in NGN
-- - 1 USD = 1450 NGN
-- - 500 coins = 1 USD

-- ============================================================
-- EVENTS: update_organizer_wallet_on_event_registration
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_organizer_wallet_on_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  organizer_coins_to_add INTEGER;
  organizer_new_balance INTEGER;
  usd_amount NUMERIC;
  usd_to_ngn_rate NUMERIC := 1450;
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

  -- Prevent duplicate awards for the same registration
  IF EXISTS (
    SELECT 1
    FROM public.coin_transactions
    WHERE reference_id = NEW.id
      AND reference_type = 'event_registration'
  ) THEN
    RETURN NEW;
  END IF;

  -- Calculate coins to add from NGN amount
  IF NEW.amount_paid IS NOT NULL AND NEW.amount_paid > 0 THEN
    usd_amount := NEW.amount_paid / usd_to_ngn_rate;
    organizer_coins_to_add := FLOOR(usd_amount * 500);

    IF organizer_coins_to_add > 0 THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organizer_wallet_on_event_registration ON public.event_registrations;
CREATE TRIGGER trigger_update_organizer_wallet_on_event_registration
AFTER INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_organizer_wallet_on_event_registration();

-- ============================================================
-- MARKETPLACE: update_seller_wallet_on_product_purchase
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_seller_wallet_on_product_purchase()
RETURNS TRIGGER AS $$
DECLARE
  seller_id UUID;
  seller_coins_to_add INTEGER;
  seller_new_balance INTEGER;
  usd_amount NUMERIC;
  usd_to_ngn_rate NUMERIC := 1450;
BEGIN
  -- Only process if payment status is completed
  IF NEW.payment_status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get seller ID
  SELECT seller_id INTO seller_id
  FROM public.marketplace_purchases
  WHERE id = NEW.id;

  IF seller_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate awards for the same purchase
  IF EXISTS (
    SELECT 1
    FROM public.coin_transactions
    WHERE reference_id = NEW.id
      AND reference_type = 'marketplace_purchase'
  ) THEN
    RETURN NEW;
  END IF;

  -- Calculate coins to add from NGN amount
  IF NEW.amount_paid IS NOT NULL AND NEW.amount_paid > 0 THEN
    usd_amount := NEW.amount_paid / usd_to_ngn_rate;
    seller_coins_to_add := FLOOR(usd_amount * 500);

    IF seller_coins_to_add > 0 THEN
      -- Update seller's wallet
      UPDATE public.users
      SET
        coins_balance = coins_balance + seller_coins_to_add,
        total_coins_earned = total_coins_earned + seller_coins_to_add,
        updated_at = NOW()
      WHERE id = seller_id
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
        seller_id,
        seller_coins_to_add,
        'marketplace_purchase',
        'Earned from product purchase',
        NEW.id,
        'marketplace_purchase',
        seller_new_balance,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_seller_wallet_on_product_purchase ON public.marketplace_purchases;
CREATE TRIGGER trigger_update_seller_wallet_on_product_purchase
AFTER INSERT OR UPDATE ON public.marketplace_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_wallet_on_product_purchase();
