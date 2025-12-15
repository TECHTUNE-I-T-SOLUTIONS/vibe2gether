-- Regenerate referral codes for all users (fixes codes with spaces)
-- This will replace all existing codes with properly formatted ones
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  -- Process all users that have referral codes (including those with spaces)
  FOR user_record IN SELECT id FROM public.users ORDER BY created_at
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
