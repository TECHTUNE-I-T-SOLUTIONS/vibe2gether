-- COIN FEATURES DATABASE SCHEMA REFERENCE
-- These tables are already in your database
-- This file documents the schema used for coin features

-- Users table (existing - used for coin_balance)
-- CREATE TABLE public.users (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   email varchar UNIQUE NOT NULL,
--   password_hash varchar NOT NULL,
--   display_name varchar,
--   full_name varchar NOT NULL,
--   coins_balance integer DEFAULT 0,
--   coins_earned integer DEFAULT 0,
--   created_at timestamp with time zone DEFAULT now(),
--   ...other fields
-- );

-- Coin Transactions Table (existing - used to track all coin movements)
-- CREATE TABLE public.coin_transactions (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id uuid NOT NULL REFERENCES public.users(id),
--   amount integer NOT NULL,
--   transaction_type varchar NOT NULL,
--   description text,
--   reference_id uuid,
--   reference_type varchar,
--   balance_after integer NOT NULL,
--   created_at timestamp with time zone DEFAULT now()
-- );

-- Withdraw Requests Table (existing - used for withdrawal tracking)
-- CREATE TABLE public.withdraw_requests (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id uuid NOT NULL REFERENCES public.users(id),
--   amount numeric NOT NULL,
--   currency varchar DEFAULT 'USD',
--   amount_in_naira numeric NOT NULL,
--   requested_coins integer NOT NULL,
--   bank_code varchar NOT NULL,
--   bank_name varchar NOT NULL,
--   account_number varchar NOT NULL,
--   account_name varchar NOT NULL,
--   status varchar DEFAULT 'pending',
--   notes text,
--   processed_by uuid REFERENCES public.admins(id),
--   processed_at timestamp with time zone,
--   rejection_reason text,
--   current_coin_balance integer NOT NULL,
--   user_coin_balance_at_request integer NOT NULL,
--   created_at timestamp with time zone DEFAULT now(),
--   updated_at timestamp with time zone DEFAULT now()
-- );

-- Notifications Table (existing - used for user notifications)
-- CREATE TABLE public.notifications (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id uuid NOT NULL REFERENCES public.users(id),
--   type varchar NOT NULL,
--   title varchar NOT NULL,
--   message text,
--   actor_id uuid REFERENCES public.users(id),
--   reference_id uuid,
--   reference_type varchar,
--   is_read boolean DEFAULT false,
--   created_at timestamp with time zone DEFAULT now()
-- );

-- TRANSACTION TYPE VALUES USED:
-- For Withdrawal Settlement:
-- - transaction_type: 'withdrawal_settled'
-- - reference_type: 'withdrawal_request'

-- For Coin Transfer:
-- - transaction_type: 'transfer_sent' (for sender)
-- - transaction_type: 'transfer_received' (for recipient)
-- - reference_type: 'user_transfer'

-- INDEXES (recommended for performance)
-- If not already created, add these indexes:

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id 
ON public.coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at 
ON public.coin_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_transaction_type 
ON public.coin_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id 
ON public.withdraw_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status 
ON public.withdraw_requests(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON public.notifications(is_read);
