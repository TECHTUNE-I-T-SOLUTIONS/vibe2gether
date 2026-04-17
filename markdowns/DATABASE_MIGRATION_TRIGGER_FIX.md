# Database Migration - Apply the Trigger Fix

## Steps to Fix the Trigger Function Error

The error `record "new" has no field "status"` occurs because the trigger function is trying to access a field that doesn't exist.

### Step 1: Log into Supabase Dashboard
1. Go to https://supabase.com
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run the Migration

Copy and paste this SQL into the SQL Editor and execute it:

```sql
-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_coins_balance ON coin_transactions;

-- Create or replace the corrected trigger function
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

-- Recreate the trigger with the corrected function
CREATE TRIGGER trigger_update_coins_balance
AFTER INSERT OR UPDATE ON coin_transactions
FOR EACH ROW
EXECUTE FUNCTION update_coins_balance_on_transaction();

-- Verify the trigger was created successfully
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_coins_balance';
```

### Step 3: Verify the Fix

After running the migration, you should see output confirming the trigger was created.

### What This Fix Does

1. **Drops the old trigger** that was causing errors
2. **Creates a corrected trigger function** that:
   - Takes the `balance_after` value from the `coin_transactions` table (which exists)
   - Updates the user's `coins_balance` in the users table
   - No longer tries to access non-existent fields
3. **Recreates the trigger** to automatically call the function when records are inserted/updated

### Why This Is Needed

Your `coin_transactions` table structure is:
```sql
id UUID (PK)
user_id UUID (FK)
amount INTEGER
transaction_type VARCHAR(50)
description TEXT
reference_id UUID
reference_type VARCHAR(50)
balance_after INTEGER  ✅ This field exists
created_at TIMESTAMP
```

But the old trigger function was looking for a `status` field that doesn't exist. The new function uses `balance_after` which is the correct field containing the user's balance after the transaction.

### After the Fix

- ✅ Coins will be added correctly without errors
- ✅ Trigger will automatically update user balances when coin_transactions are inserted
- ✅ No more database errors when saving coin purchases
- ✅ Complete audit trail in coin_transactions table

### Rollback (If Needed)

If you need to revert, run:
```sql
DROP TRIGGER trigger_update_coins_balance ON coin_transactions;
DROP FUNCTION update_coins_balance_on_transaction();
```

## Additional Checks

After applying the fix, verify your tables are correct:

```sql
-- Check coin_transactions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coin_transactions'
ORDER BY ordinal_position;

-- Check users table has coins_balance column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'coins_balance';

-- Check the trigger function exists
SELECT * FROM pg_proc 
WHERE proname = 'update_coins_balance_on_transaction';
```

## Done! ✅

Your database is now fixed and ready to handle coin purchases without errors.
