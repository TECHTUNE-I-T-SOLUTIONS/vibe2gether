-- Alter the generate_referral_code function to fix space issue
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

-- Regenerate referral codes for all users (fixes codes with spaces)
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  -- Process all users that have referral codes (including those with spaces)
  FOR user_record IN SELECT id FROM public.users WHERE referral_code IS NOT NULL ORDER BY created_at
  LOOP
    -- Keep generating until we find a unique code
    LOOP
      -- Generate a 12-character alphanumeric code from MD5 hash
      new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_record.id::TEXT || NOW()::TEXT) FROM 1 FOR 12));
      
      -- Check if this code already exists
      SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code AND id != user_record.id) INTO code_exists;
      
      -- If code doesn't exist, exit loop and use it
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Update user with the new code
    UPDATE public.users SET referral_code = new_code WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Referral codes regenerated successfully!';
END $$;
