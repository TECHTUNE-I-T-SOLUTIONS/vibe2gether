-- Create coins transactions table for tracking earnings and spending

CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  -- Types: 'view_earned', 'like_earned', 'follow_earned', 'premium_purchase', 
  -- 'discount_used', 'gift_sent', 'gift_received', 'referral_bonus', 'daily_bonus'
  
  description TEXT,
  
  -- Reference to related entity
  reference_id UUID,
  reference_type VARCHAR(50),
  -- Types: 'post', 'user', 'purchase'
  
  -- Balance after transaction
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);

-- Coin rates configuration table
CREATE TABLE IF NOT EXISTS coin_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) UNIQUE NOT NULL,
  coins_amount INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default coin rates
INSERT INTO coin_rates (action_type, coins_amount, description) VALUES
  ('view_received', 1, 'Coins earned when someone views your post'),
  ('like_received', 5, 'Coins earned when someone likes your post'),
  ('follow_received', 10, 'Coins earned when someone follows you'),
  ('comment_received', 3, 'Coins earned when someone comments on your post'),
  ('share_received', 8, 'Coins earned when someone shares your post'),
  ('daily_login', 5, 'Daily login bonus'),
  ('profile_complete', 50, 'Bonus for completing profile'),
  ('first_post', 20, 'Bonus for first post'),
  ('referral_signup', 100, 'Bonus when referred user signs up')
ON CONFLICT (action_type) DO NOTHING;

-- Enable RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coin_transactions_all" ON coin_transactions FOR ALL USING (true);
CREATE POLICY "coin_rates_select" ON coin_rates FOR SELECT USING (true);
