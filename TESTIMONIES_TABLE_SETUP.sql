-- Create testimonies table (NextAuth based, no Supabase RLS)
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  user_name VARCHAR NOT NULL,
  user_location VARCHAR,
  user_avatar_url VARCHAR,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_notes TEXT,
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_testimonies_status ON testimonies(status);
CREATE INDEX idx_testimonies_user_id ON testimonies(user_id);
CREATE INDEX idx_testimonies_created_at ON testimonies(created_at DESC);
CREATE INDEX idx_testimonies_rating ON testimonies(rating DESC);
CREATE INDEX idx_testimonies_approved_at ON testimonies(approved_at DESC) WHERE status = 'approved';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonies_updated_at_trigger
BEFORE UPDATE ON testimonies
FOR EACH ROW
EXECUTE FUNCTION update_testimonies_updated_at();

-- Optional: Insert sample testimonies for testing (remove in production if needed)
-- INSERT INTO testimonies (user_id, user_name, user_location, user_avatar_url, rating, title, content, status, approved_at)
-- VALUES
--   ('user1', 'Jane Doe', 'Lagos, Nigeria', 'https://example.com/avatar1.jpg', 5, 'Amazing Platform!', 'I found my perfect match here. Highly recommended!', 'approved', CURRENT_TIMESTAMP),
--   ('user2', 'John Smith', 'Abuja, Nigeria', 'https://example.com/avatar2.jpg', 5, 'Great Experience', 'The app is super easy to use and the people are genuine.', 'approved', CURRENT_TIMESTAMP),
--   ('user3', 'Sarah Johnson', 'Lagos, Nigeria', 'https://example.com/avatar3.jpg', 4, 'Love It', 'Great community, would recommend to anyone looking to meet people.', 'approved', CURRENT_TIMESTAMP);
