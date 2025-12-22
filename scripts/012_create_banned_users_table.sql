-- Create banned_users table to store information about banned users
CREATE TABLE public.banned_users (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(50),
  bio TEXT,
  profile_picture VARCHAR(500),
  cover_picture VARCHAR(500),
  country_code VARCHAR(10),
  mobile_number VARCHAR(20),
  country VARCHAR(100),
  city VARCHAR(100),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  coins_balance INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  language VARCHAR(10) DEFAULT 'en',
  looking_for VARCHAR(50),
  interests TEXT[],
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  referral_code VARCHAR(20),
  referred_by UUID,
  referral_bonus_claimed BOOLEAN DEFAULT FALSE,
  original_created_at TIMESTAMP WITH TIME ZONE,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by UUID,
  ban_reason TEXT,
  CONSTRAINT banned_users_pkey PRIMARY KEY (id),
  CONSTRAINT banned_users_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Create indexes for banned_users table
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users USING BTREE (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_at ON public.banned_users USING BTREE (banned_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON public.banned_users USING BTREE (banned_by) TABLESPACE pg_default;

-- Add comment to explain the table
COMMENT ON TABLE public.banned_users IS 'Archive table for banned users - mirrors the users table structure for records';
