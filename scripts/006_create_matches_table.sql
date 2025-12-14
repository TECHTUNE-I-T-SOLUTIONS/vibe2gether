-- Create matches table for dating functionality

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Match status
  status VARCHAR(50) DEFAULT 'pending',
  -- Status: 'pending', 'matched', 'declined', 'unmatched'
  
  -- Who initiated
  initiated_by UUID REFERENCES users(id),
  
  -- Match score (compatibility)
  compatibility_score INTEGER,
  
  -- Last interaction
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_all" ON matches FOR ALL USING (true);
