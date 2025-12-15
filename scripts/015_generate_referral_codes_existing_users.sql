-- Generate referral codes for existing users who don't have one
-- Uses a loop to ensure uniqueness
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM public.users WHERE referral_code IS NULL
  LOOP
    -- Keep generating until we find a unique code
    LOOP
      new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_record.id::TEXT || NOW()::TEXT) FROM 1 FOR 8) || SUBSTRING(TO_CHAR(EXTRACT(EPOCH FROM NOW()), '0000000000') FROM 1 FOR 5));
      
      -- Check if this code already exists
      SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
      
      -- If code doesn't exist, exit loop and use it
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Update user with the new code
    UPDATE public.users SET referral_code = new_code WHERE id = user_record.id;
  END LOOP;
END $$;
