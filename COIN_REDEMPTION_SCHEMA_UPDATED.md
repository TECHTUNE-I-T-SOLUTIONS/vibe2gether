# Vibe2Gether Coin Redemption System - Database Schema Update

## Overview
This document outlines the complete database schema for the Vibe2Gether coin redemption system. The schema enables users to redeem their coins for premium features while maintaining proper tracking and expiration management.

## Updated Tables

### 1. **users** (MODIFIED)
Existing table with coin management fields. No changes needed but these fields are critical:

```sql
-- Key fields for coin system
coins_balance integer DEFAULT 0          -- Current coin balance
total_coins_earned integer DEFAULT 0     -- Lifetime coins earned
is_premium boolean DEFAULT false          -- Premium status (updated via coin redemption)
```

**Changes Made**: 
- `is_premium` field is updated when user redeems coins for premium membership
- Coins are deducted from `coins_balance` when any redemption occurs

---

### 2. **coin_redemptions** (EXISTING - CLARIFICATION)
Tracks all coin redemption events

```sql
CREATE TABLE public.coin_redemptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  redemption_type character varying NOT NULL,
  coins_amount integer NOT NULL,
  amount_usd numeric,
  amount_ngn numeric,
  status character varying NOT NULL DEFAULT 'active',
  reference_id uuid,
  expires_at timestamp with time zone NOT NULL,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX idx_coin_redemptions_user_id ON public.coin_redemptions(user_id);
CREATE INDEX idx_coin_redemptions_status ON public.coin_redemptions(status);
CREATE INDEX idx_coin_redemptions_expires_at ON public.coin_redemptions(expires_at);
```

**Redemption Types**:
- `premium` - Premium membership subscription (30 days)
- `profile_boost` - Profile visibility boost (24 hours)
- `featured_product` - Product feature listing (7 days)
- `gift_card` - Digital gift card ($10 value)

---

### 3. **coin_premium_subscriptions** (EXISTING - CLARIFICATION)
Premium membership redeemed with coins

```sql
CREATE TABLE public.coin_premium_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  plan character varying NOT NULL DEFAULT 'premium',
  status character varying NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL,
  features jsonb DEFAULT '["messaging", "visibility", "profile_boost"]'::jsonb,
  auto_renew boolean DEFAULT false,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_premium_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_premium_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Index
CREATE INDEX idx_coin_premium_subscriptions_user_id ON public.coin_premium_subscriptions(user_id);
```

**Features Included**:
- Enhanced messaging capabilities
- Increased profile visibility
- Profile boost usage
- Premium badges
- Analytics access

---

### 4. **profile_boosts** (EXISTING - CLARIFICATION)
Profile visibility boost purchased with coins

```sql
CREATE TABLE public.profile_boosts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  status character varying NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL,
  boost_level integer DEFAULT 1,
  views_count integer DEFAULT 0,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_boosts_pkey PRIMARY KEY (id),
  CONSTRAINT profile_boosts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX idx_profile_boosts_user_id ON public.profile_boosts(user_id);
CREATE INDEX idx_profile_boosts_status ON public.profile_boosts(status);
CREATE INDEX idx_profile_boosts_expires_at ON public.profile_boosts(expires_at);
```

**Effects**:
- User profile appears at top of users list for 24 hours
- Views are tracked during boost period
- Automatic expiration after 24 hours

---

### 5. **product_features** (EXISTING - CLARIFICATION)
Marketplace product feature boost

```sql
CREATE TABLE public.product_features (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  status character varying NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL,
  feature_type character varying DEFAULT 'premium',
  views_boost_count integer DEFAULT 0,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_features_pkey PRIMARY KEY (id),
  CONSTRAINT product_features_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id),
  CONSTRAINT product_features_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX idx_product_features_product_id ON public.product_features(product_id);
CREATE INDEX idx_product_features_user_id ON public.product_features(user_id);
CREATE INDEX idx_product_features_expires_at ON public.product_features(expires_at);
```

**Feature Types**:
- `basic` - Basic feature (3 days)
- `premium` - Premium feature (7 days) - 200 coins
- `special` - Special feature with top placement (14 days)

---

### 6. **coin_gift_cards** (EXISTING - CLARIFICATION)
Digital $10 gift cards

```sql
CREATE TABLE public.coin_gift_cards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  issued_by_user_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  gift_card_value numeric NOT NULL,
  gift_card_code character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'active',
  used_by_user_id uuid,
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_gift_cards_pkey PRIMARY KEY (id),
  CONSTRAINT coin_gift_cards_issued_by_user_id_fkey FOREIGN KEY (issued_by_user_id) REFERENCES public.users(id),
  CONSTRAINT coin_gift_cards_used_by_user_id_fkey FOREIGN KEY (used_by_user_id) REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX idx_coin_gift_cards_code ON public.coin_gift_cards(gift_card_code);
CREATE INDEX idx_coin_gift_cards_issued_by_user_id ON public.coin_gift_cards(issued_by_user_id);
CREATE INDEX idx_coin_gift_cards_status ON public.coin_gift_cards(status);
```

**Status Values**:
- `active` - Available for redemption
- `used` - Redeemed by another user
- `expired` - Expiration date passed

---

### 7. **coin_transactions** (EXISTING)
Transaction history for all coin movements

```sql
CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type character varying NOT NULL,
  description text,
  reference_id uuid,
  reference_type character varying,
  balance_after integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Index
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
```

**Transaction Types**:
- `redeemed_premium` - Redeemed for premium membership
- `redeemed_profile_boost` - Redeemed for profile boost
- `redeemed_featured_product` - Redeemed for product feature
- `redeemed_gift_card` - Redeemed for gift card

---

## Coin Conversion Formula

```
500 coins = 1 USD = 1,450 NGN
Therefore:
- 1 coin = 0.002 USD
- 1 coin = 2.9 NGN
- 1 USD = 1,450 NGN
```

## Redemption Pricing

| Feature | Coins Required | Value | Duration | Status |
|---------|---------------|-------|----------|--------|
| Premium Membership | Dynamic (from premium_tiers) | 1 month access | 30 days | Confirmed |
| Profile Boost | 50 | $0.10 | 24 hours | Confirmed |
| Featured Product | 200 | $0.40 | 7 days | Confirmed |
| Gift Card | 30,000 | $10.00 | 365 days | Confirmed |

**Note**: Premium membership coins are calculated from `premium_tiers.monthly_price` (assumed to be in USD cents) multiplied by 500.

---

## API Endpoints

### POST `/api/wallet/redeem-coins`
Redeem coins for any feature

**Request Body**:
```json
{
  "redemptionType": "premium|profile_boost|featured_product|gift_card",
  "coinsAmount": 50,
  "selectedProductId": "uuid-optional-for-featured-product"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Coins redeemed successfully",
  "newBalance": 12500,
  "redemption": { ... }
}
```

**Logic Flow**:
1. Validate user session
2. Verify sufficient coin balance
3. Check for invalid states (already premium, no products for featured)
4. Create appropriate record in related table
5. Deduct coins from `users.coins_balance`
6. Create transaction record in `coin_transactions`
7. Create redemption record in `coin_redemptions`
8. Create user notification
9. Return success response

---

### GET `/api/premium-tiers`
Fetch available premium tier pricing

**Response**:
```json
{
  "success": true,
  "tiers": [
    {
      "id": "uuid",
      "name": "Premium",
      "monthly_price": 999,
      "features": ["messaging", "visibility"],
      "is_active": true
    }
  ]
}
```

---

### GET `/api/marketplace/my-products`
Fetch user's products for featured product selection

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "title": "Product Name",
      "condition": "New",
      "is_featured": false
    }
  ]
}
```

---

## Database Triggers (To Be Created)

### 1. Auto-Deduct Coins on Redemption
```sql
CREATE OR REPLACE FUNCTION deduct_coins_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET coins_balance = coins_balance - NEW.coins_amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_coins_on_redemption
AFTER INSERT ON coin_redemptions
FOR EACH ROW
EXECUTE FUNCTION deduct_coins_on_redemption();
```

### 2. Update Premium Status
```sql
CREATE OR REPLACE FUNCTION update_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.expires_at > NOW() THEN
    UPDATE users
    SET is_premium = true
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_premium_status
AFTER INSERT ON coin_premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_premium_status();
```

### 3. Notify User on Redemption
```sql
CREATE OR REPLACE FUNCTION notify_user_redemption()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, reference_id)
  VALUES (
    NEW.user_id,
    'coin_redeemed',
    CONCAT(NEW.redemption_type, ' Redeemed'),
    CONCAT('You have successfully redeemed ', NEW.coins_amount, ' coins'),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_user_redemption
AFTER INSERT ON coin_redemptions
FOR EACH ROW
EXECUTE FUNCTION notify_user_redemption();
```

---

## Frontend Implementation

### Wallet Page Updates
1. **State Variables Added**:
   - `premiumTiers` - Premium tier pricing
   - `showRedemptionModal` - Modal visibility
   - `selectedRedemption` - Current redemption option
   - `userProducts` - User's marketplace products
   - `selectedProduct` - Selected product for feature
   - `redeeming` - Loading state

2. **Functions Added**:
   - `handleOpenRedemptionModal()` - Open redemption confirmation
   - `handleRedeemCoins()` - Execute redemption
   - `getPremiumCoins()` - Calculate coins from tier price

3. **Modal Components**:
   - Redemption confirmation dialog
   - Product selection dropdown (for featured products)
   - Balance verification
   - Feature duration information

4. **Redeem Options**:
   - Updated to include dynamic premium coin calculation
   - Added premium status check
   - Added product selection for featured products

---

## Data Flow for Coin Redemption

```
User Clicks "Redeem" Button
     ↓
Modal Opens (checks is_premium for premium feature)
     ↓
User Confirms Redemption (selects product if needed)
     ↓
POST /api/wallet/redeem-coins
     ↓
Validate: coins, user state, product (if needed)
     ↓
Create Redemption Record
     ↓
Update User Coins Balance
     ↓
Create Transaction Record
     ↓
Create User Notification
     ↓
Success Response & Page Reload
```

---

## Testing Checklist

- [ ] Premium membership shows "Already Premium" if user is premium
- [ ] Premium coins calculated correctly from tier price
- [ ] Profile boost requires no product selection
- [ ] Featured product requires product selection
- [ ] Coins deducted from balance on successful redemption
- [ ] Redemption records created correctly
- [ ] Transaction history shows all coin movements
- [ ] User notifications sent on redemption
- [ ] Expiration dates set correctly (30d premium, 24h boost, 7d feature)
- [ ] Gift card generates unique code
- [ ] Balance validation prevents redemption if insufficient
- [ ] Modal closes on successful redemption
- [ ] Page refreshes to reflect new balance

---

## Migration Notes

**No new SQL migrations required** - All tables already exist from previous implementations. This document consolidates the schema for reference and clarifies:

1. How coins are deducted
2. How redemption types map to database records
3. How premium status is managed
4. How expiration dates are set
5. How transaction history is tracked

**Implementation**: All database operations handled through Supabase client with Row Level Security (RLS) policies already in place.

