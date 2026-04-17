-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  amount_ngn DECIMAL(15, 2) NOT NULL,
  amount_coins INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  rejection_reason TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  transaction_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- Add RLS policies
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
  FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true);

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view and update all withdrawal requests
CREATE POLICY "Admins can manage all withdrawal requests" ON withdrawal_requests
  FOR ALL
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);
