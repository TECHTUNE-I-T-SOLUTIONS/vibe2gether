-- Paystack Integration Schema
-- Uses existing transactions table for all payment records from Paystack
-- Transactions table schema includes all necessary fields for Paystack payments

-- ============================================================
-- TRANSACTIONS TABLE (EXISTING - NO CHANGES NEEDED)
-- ============================================================
-- The existing transactions table has all required fields:
-- - id (UUID) - Primary key
-- - user_id (UUID) - User making payment
-- - amount (INTEGER) - Amount in Kobo for NGN, smallest unit for currency
-- - currency (VARCHAR) - NGN or USD
-- - type (VARCHAR) - 'product', 'event', etc.
-- - status (VARCHAR) - 'pending', 'completed', 'failed'
-- - payment_method (VARCHAR) - 'card', 'bank_transfer', etc.
-- - payment_reference (VARCHAR) - Paystack reference ID
-- - metadata (JSONB) - Stores Paystack response, customer info, etc.
-- - created_at, updated_at - Timestamps
--
-- This schema is compatible with Paystack integration without modifications

-- ============================================================
-- ADD COLUMNS TO PRODUCTS TABLE (if not exists)
-- ============================================================
-- These columns are optional and nullable to support payment tracking
-- without affecting existing product APIs or functionality

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.marketplace_products ADD COLUMN payment_status VARCHAR(50) DEFAULT 'completed' NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.marketplace_products ADD COLUMN payment_reference VARCHAR(255) NULL;
  END IF;
END $$;

-- ============================================================
-- ADD COLUMNS TO EVENTS TABLE (if not exists)
-- ============================================================
-- These columns are optional and nullable to support event registration payment tracking
-- without affecting existing event APIs or functionality

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.events ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.events ADD COLUMN payment_reference VARCHAR(255) NULL;
  END IF;
END $$;

-- ============================================================
-- FUNCTIONS FOR PAYMENT TRACKING (Using Transactions Table)
-- ============================================================

-- Function to get user payment history from transactions table
CREATE OR REPLACE FUNCTION get_user_payment_history(p_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  reference VARCHAR,
  amount INTEGER,
  currency VARCHAR,
  status VARCHAR,
  type VARCHAR,
  payment_method VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    transactions.id,
    transactions.payment_reference,
    transactions.amount,
    transactions.currency,
    transactions.status,
    transactions.type,
    transactions.payment_method,
    transactions.created_at
  FROM public.transactions
  WHERE transactions.user_id = p_user_id
  ORDER BY transactions.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment statistics from transactions table
CREATE OR REPLACE FUNCTION get_payment_statistics(p_user_id UUID)
RETURNS TABLE (
  total_payments INT,
  total_amount INTEGER,
  successful_count INT,
  pending_count INT,
  failed_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_payments,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)::INTEGER as total_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INT as successful_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::INT as pending_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INT as failed_count
  FROM public.transactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEWS FOR REPORTING (Using Transactions Table)
-- ============================================================

CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
  t.user_id,
  u.email,
  u.full_name,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as successful_transactions,
  COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_amount_paid,
  MAX(t.created_at) as last_payment_date,
  COUNT(DISTINCT t.type) as transaction_types
FROM public.transactions t
LEFT JOIN public.users u ON t.user_id = u.id
GROUP BY t.user_id, u.email, u.full_name;

-- ============================================================
-- EXAMPLE DATA (Using Transactions Table)
-- ============================================================

/*
-- Example: Insert transaction for Paystack payment
-- Note: Amount should be in Kobo (NGN * 100) or smallest currency unit
INSERT INTO public.transactions (
  user_id,
  amount,
  currency,
  type,
  status,
  payment_method,
  payment_reference,
  metadata
) VALUES (
  'user-uuid-here',
  150000,  -- ₦1,500 in Kobo
  'NGN',
  'product',
  'completed',
  'card',
  'PSK_REF_20240101_001',
  '{
    "paystack_reference": "PSK_REF_20240101_001",
    "customer_email": "user@example.com",
    "authorization": {"auth_code": "..."},
    "item_id": "product-uuid",
    "item_title": "Product Name"
  }'::jsonb
);

-- Example: Get payment history for a user
SELECT * FROM get_user_payment_history('user-uuid-here', 10);

-- Example: Get payment statistics for a user
SELECT * FROM get_payment_statistics('user-uuid-here');
*/

-- ============================================================
-- VERIFICATION QUERIES (Using Transactions Table)
-- ============================================================

/*
-- Verify transactions table exists and has payment data
SELECT * FROM information_schema.tables WHERE table_name = 'transactions';

-- View all transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20;

-- View transactions by status
SELECT status, COUNT(*), SUM(amount) FROM transactions GROUP BY status;

-- View transactions by type (product, event, etc.)
SELECT type, COUNT(*), SUM(amount) FROM transactions GROUP BY type;

-- View payment summary
SELECT * FROM payment_summary;

-- Get specific user payment history
SELECT * FROM get_user_payment_history('user-uuid-here', 10);

-- Get payment statistics for a user
SELECT * FROM get_payment_statistics('user-uuid-here');

-- Check marketplace products with payment references
SELECT id, title, price, currency, payment_status, payment_reference 
FROM marketplace_products 
WHERE payment_reference IS NOT NULL;

-- Check events with payment references
SELECT id, title, ticket_price, currency, payment_status, payment_reference 
FROM events 
WHERE payment_reference IS NOT NULL;

-- View recent payments (last 24 hours)
SELECT * FROM transactions 
WHERE created_at > NOW() - INTERVAL '24 hours' 
ORDER BY created_at DESC;

-- View payment statistics summary
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
FROM transactions;
*/
