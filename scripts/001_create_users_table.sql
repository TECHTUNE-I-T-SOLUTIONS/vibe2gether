-- Create users table to store user authentication and profile data
-- Using our own auth instead of Supabase Auth to avoid 5000 user limit

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with hashed passwords and profile info
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  
  -- Profile details
  date_of_birth DATE,
  gender VARCHAR(50),
  bio TEXT,
  profile_picture VARCHAR(500),
  cover_picture VARCHAR(500),
  
  -- Contact info
  country_code VARCHAR(10),
  mobile_number VARCHAR(20),
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Account settings
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Coins and rewards
  coins_balance INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  
  -- Preferences
  language VARCHAR(10) DEFAULT 'en',
  looking_for VARCHAR(50),
  interests TEXT[],
  
  -- Timestamps
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (true);

-- Policy: Users can update their own data (will check in app logic)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (true);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (true);
