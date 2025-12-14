-- Create reports table for content moderation

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- What is being reported
  reported_type VARCHAR(50) NOT NULL,
  -- Types: 'user', 'post', 'comment', 'message'
  reported_id UUID NOT NULL,
  
  -- Report details
  reason VARCHAR(100) NOT NULL,
  -- Reasons: 'spam', 'harassment', 'inappropriate', 'fake_profile', 'underage', 'other'
  
  description TEXT,
  
  -- Admin handling
  status VARCHAR(50) DEFAULT 'pending',
  -- Status: 'pending', 'reviewing', 'resolved', 'dismissed'
  
  handled_by UUID REFERENCES users(id),
  handled_at TIMESTAMPTZ,
  admin_notes TEXT,
  action_taken VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_type ON reports(reported_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_all" ON reports FOR ALL USING (true);
