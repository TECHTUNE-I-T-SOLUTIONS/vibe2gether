-- Add referral_code column to users table
ALTER TABLE public.users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE public.users ADD COLUMN referred_by UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN referral_bonus_claimed BOOLEAN DEFAULT FALSE;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  code VARCHAR(20);
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 12));
    
    SELECT NOT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO is_unique;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code_trigger ON users;
CREATE TRIGGER set_referral_code_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Create referral_bonuses tracking table
CREATE TABLE IF NOT EXISTS public.referral_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referrer_bonus_amount INT DEFAULT 20,
  referred_bonus_amount INT DEFAULT 20,
  referrer_bonus_claimed BOOLEAN DEFAULT FALSE,
  referred_bonus_claimed BOOLEAN DEFAULT FALSE,
  referred_profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_id, referred_id)
);

-- Update coin_rates with new values
DELETE FROM coin_rates WHERE is_active = true;

INSERT INTO public.coin_rates (action_type, coins_amount, description, is_active)
VALUES
  ('view_received', 1, 'Coins earned when someone views your post', true),
  ('like_received', 1, 'Coins earned when someone likes your post', true),
  ('follow_received', 2, 'Coins earned when someone follows you', true),
  ('comment_received', 2, 'Coins earned when someone comments on your post', true),
  ('share_received', 5, 'Coins earned when someone shares your post', true),
  ('daily_login', 5, 'Coins earned for daily login', true),
  ('profile_complete', 10, 'Coins earned for completing your profile', true),
  ('first_post', 10, 'Coins earned for your first post', true),
  ('referral_signup', 20, 'Coins earned when referred person signs up', true);

-- Create function to handle referral bonus when referred user completes profile
CREATE OR REPLACE FUNCTION handle_referral_completion()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  bonus_record RECORD;
BEGIN
  -- Check if this user was referred and hasn't claimed bonus yet
  SELECT referred_by INTO referrer_id FROM users WHERE id = NEW.id AND referred_by IS NOT NULL;
  
  IF referrer_id IS NOT NULL THEN
    -- Find the referral bonus record
    SELECT * INTO bonus_record FROM referral_bonuses 
    WHERE referred_id = NEW.id AND referred_profile_completed = FALSE;
    
    IF bonus_record IS NOT NULL AND NEW.gender IS NOT NULL AND NEW.date_of_birth IS NOT NULL AND NEW.bio IS NOT NULL THEN
      -- Mark as profile completed
      UPDATE referral_bonuses 
      SET referred_profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = bonus_record.id;
      
      -- Award referrer bonus if not already claimed
      IF NOT bonus_record.referrer_bonus_claimed THEN
        UPDATE users 
        SET coins_balance = coins_balance + bonus_record.referrer_bonus_amount,
            total_coins_earned = total_coins_earned + bonus_record.referrer_bonus_amount
        WHERE id = referrer_id;
        
        UPDATE referral_bonuses 
        SET referrer_bonus_claimed = TRUE
        WHERE id = bonus_record.id;
        
        -- Create notification for referrer
        INSERT INTO public.notifications (user_id, type, title, message, reference_type, reference_id, is_read)
        VALUES (
          referrer_id,
          'referral_bonus',
          'Referral Bonus Earned!',
          'Your referred friend completed their profile. You earned 20 coins!',
          'referral',
          bonus_record.id,
          FALSE
        );
      END IF;
      
      -- Award referred bonus if not already claimed
      IF NOT bonus_record.referred_bonus_claimed THEN
        UPDATE users 
        SET coins_balance = coins_balance + bonus_record.referred_bonus_amount,
            total_coins_earned = total_coins_earned + bonus_record.referred_bonus_amount,
            referral_bonus_claimed = TRUE
        WHERE id = NEW.id;
        
        UPDATE referral_bonuses 
        SET referred_bonus_claimed = TRUE
        WHERE id = bonus_record.id;
        
        -- Create notification for referred
        INSERT INTO public.notifications (user_id, type, title, message, reference_type, reference_id, is_read)
        VALUES (
          NEW.id,
          'referral_bonus',
          'Welcome Bonus!',
          'Welcome to the platform! You earned 20 coins for completing your profile.',
          'referral',
          bonus_record.id,
          FALSE
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_completion_trigger ON users;
CREATE TRIGGER referral_completion_trigger
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.gender IS DISTINCT FROM NEW.gender OR OLD.date_of_birth IS DISTINCT FROM NEW.date_of_birth OR OLD.bio IS DISTINCT FROM NEW.bio)
EXECUTE FUNCTION handle_referral_completion();

-- Create function to handle signup bonus
CREATE OR REPLACE FUNCTION award_signup_bonus()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Get referrer if referred_by is set
  SELECT referred_by INTO referrer_id FROM users WHERE id = NEW.id;
  
  IF referrer_id IS NOT NULL THEN
    -- Create referral bonus record
    INSERT INTO public.referral_bonuses (referrer_id, referred_id, referrer_bonus_amount, referred_bonus_amount)
    VALUES (referrer_id, NEW.id, 20, 20);
    
    -- Create notification for referrer about new signup
    INSERT INTO public.notifications (user_id, type, title, message, reference_type, reference_id, is_read)
    VALUES (
      referrer_id,
      'referral_signup',
      'New Referral Sign Up!',
      'Your referral code was used for a new sign up. Earn 20 coins when they complete their profile!',
      'referral',
      NEW.id,
      FALSE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS award_signup_bonus_trigger ON users;
CREATE TRIGGER award_signup_bonus_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION award_signup_bonus();
