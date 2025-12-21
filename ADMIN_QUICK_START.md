# Admin System - Quick Start Guide

## 1️⃣ Run the SQL File

Execute the SQL file in your Supabase SQL editor:
```sql
-- Copy entire contents of: scripts/018_admin_system_and_premium.sql
-- Paste into Supabase SQL editor
-- Click Run
```

**What gets created:**
- ✅ admins table
- ✅ admin_security_questions table  
- ✅ premium_tiers table (with default silver/gold/platinum tiers)
- ✅ transactions table
- ✅ admin_audit_logs table
- ✅ Transaction notification trigger
- ✅ All indexes for performance

## 2️⃣ Install Dependencies

```bash
npm install jsonwebtoken bcryptjs
# or
pnpm add jsonwebtoken bcryptjs
```

## 3️⃣ Set Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_super_secret_random_key_here
```

## 4️⃣ Create First Admin Account

### Option A: Via API (Postman/cURL)
```bash
curl -X POST http://localhost:3000/api/admin/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SuperSecure123!",
    "fullName": "Admin User",
    "securityQuestions": [
      {
        "question": "What is your mothers maiden name?",
        "answer": "smith"
      },
      {
        "question": "What city were you born in?",
        "answer": "new york"
      }
    ]
  }'
```

### Option B: Direct Database Insert (for testing)
```sql
-- Hash your password first using a tool or Node.js
-- Then insert directly
INSERT INTO public.admins (
  id,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  extensions.uuid_generate_v4(),
  'admin@example.com',
  '$2a$10$...', -- bcrypt hash
  'Admin User',
  'admin',
  true
);
```

## 5️⃣ Login to Admin Dashboard

1. Navigate to: `http://localhost:3000/admin/login`
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `SuperSecure123!`
3. Click "Sign In"

## 6️⃣ Manage Premium Tiers

### In Dashboard
1. Go to "Premium Tiers" tab
2. Click "New Tier" to create tier
3. Fill in details:
   - **Name**: e.g., "Bronze", "Silver", "Gold"
   - **Description**: Tier description
   - **Monthly Price**: In coins (e.g., 999, 1999, 4999)
   - **Max Boosts**: Number of profile boosts allowed
   - **Max Profile Views**: Profile view limit
   - **Features**: Priority support, analytics access toggle
4. Click "Create" or "Update"

### Default Tiers Created
The SQL file automatically creates:

**Silver** - 999 coins/month
- 5 boosts
- 100 profile views
- Messaging & unlimited likes

**Gold** - 1999 coins/month
- 15 boosts
- 500 profile views
- See who liked you, priority matching
- Priority support

**Platinum** - 4999 coins/month
- 50 boosts
- 2000 profile views
- Verified badge, advanced filters
- Priority support + analytics

## 7️⃣ Test Key Features

### ✅ Test Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SuperSecure123!"
  }'
```

### ✅ Test Get Current Admin Session
```bash
curl -X GET http://localhost:3000/api/admin/auth/me \
  -b "admin_token=your_token"
```

### ✅ Test Get All Premium Tiers
```bash
curl -X GET http://localhost:3000/api/admin/premium-tiers
```

### ✅ Test Create Transaction
```bash
curl -X POST http://localhost:3000/api/admin/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=your_token" \
  -d '{
    "userId": "user-id-here",
    "amount": 2999,
    "type": "subscription",
    "paymentMethod": "paystack",
    "paymentReference": "ref_12345"
  }'
```

### ✅ Test Update Transaction Status
```bash
curl -X PUT http://localhost:3000/api/admin/transactions/transaction-id \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=your_token" \
  -d '{
    "status": "completed"
  }'
```

## 📊 Database Schema Quick View

### Tables Created:
1. **admins** - Admin user accounts
2. **admin_security_questions** - Recovery questions
3. **premium_tiers** - Tier definitions
4. **transactions** - Payment tracking
5. **admin_audit_logs** - All admin actions logged

### Existing Tables Not Modified:
- ✅ users
- ✅ notifications
- ✅ premium_subscriptions (uses 'plan' column, not 'tier')
- ✅ marketplace_products
- ✅ events
- ✅ blog_posts

## 🔒 Security Notes

1. **Admin Roles**: 
   - `admin` - Full access
   - `moderator` - Limited moderation access
   - `analyst` - Read-only analytics access

2. **JWT Tokens**: 
   - Valid for 24 hours
   - Stored in HTTP-only cookies
   - Automatically validated on protected endpoints

3. **Audit Logging**:
   - All admin actions logged with timestamps
   - IP address and user agent captured
   - Old and new values tracked for edits

4. **Password Security**:
   - Stored as bcrypt hashes
   - Never transmitted in plain text
   - 10 salt rounds for hashing

## 🐛 Troubleshooting

### Error: "column 'tier' does not exist"
**Solution**: Already fixed! SQL file uses correct schema.

### Error: "Table admins already exists"  
**Solution**: Tables use `IF NOT EXISTS` so safe to re-run.

### Authentication not working
**Checklist**:
- [ ] JWT_SECRET is set in `.env.local`
- [ ] Admin record exists in database
- [ ] Cookie is being sent with requests
- [ ] Token hasn't expired (24 hours)

### Premium tiers not showing
**Checklist**:
- [ ] SQL file was executed
- [ ] premium_tiers table created
- [ ] Default seed data inserted
- [ ] API endpoint returning data

## 📝 Next Steps

1. ✅ Create admin accounts
2. ✅ Set up premium tiers
3. ⏳ Build user management page
4. ⏳ Build transaction dashboard
5. ⏳ Build product/event moderation
6. ⏳ Build analytics dashboard
7. ⏳ Implement Google OAuth for admins

