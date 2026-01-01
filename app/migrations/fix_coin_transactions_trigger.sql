-- Fix the trigger function to work with coin_transactions table
-- The coin_transactions table doesn't have a 'status' field, so we need to update the function

CREATE OR REPLACE FUNCTION update_coins_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's coins_balance in the users table
  -- using the balance_after value from coin_transactions
  UPDATE users
  SET 
    coins_balance = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS trigger_update_coins_balance ON coin_transactions;

CREATE TRIGGER trigger_update_coins_balance
AFTER INSERT OR UPDATE ON coin_transactions
FOR EACH ROW
EXECUTE FUNCTION update_coins_balance_on_transaction();
