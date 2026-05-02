-- ============================================================
-- Fix: update_event_attendees triggers to use payment_status
-- 
-- Problem: Previous trigger checked `status` column which is
-- inconsistent. The reliable source of truth is `payment_status`:
--   - 'free'      = free event registration (valid)
--   - 'completed' = paid event, payment confirmed (valid)
--   - 'pending'   = payment initiated but not completed (SKIP)
--
-- This ensures only actually confirmed attendees are counted.
-- ============================================================

-- Fix the INSERT / UPDATE trigger function
CREATE OR REPLACE FUNCTION public.update_event_attendees_on_register()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registered_count = (
    SELECT COUNT(*) FROM public.event_registrations
    WHERE event_id = NEW.event_id
      AND payment_status IN ('free', 'completed')
  )
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the DELETE trigger function
CREATE OR REPLACE FUNCTION public.update_event_attendees_on_unregister()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registered_count = (
    SELECT COUNT(*) FROM public.event_registrations
    WHERE event_id = OLD.event_id
      AND payment_status IN ('free', 'completed')
  )
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Backfill: Correct registered_count for ALL existing events
-- ============================================================
UPDATE public.events e
SET registered_count = (
  SELECT COUNT(*) FROM public.event_registrations r
  WHERE r.event_id = e.id
    AND r.payment_status IN ('free', 'completed')
);
