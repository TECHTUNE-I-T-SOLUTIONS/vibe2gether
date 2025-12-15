# Vibe2Gether - Setup Guide

## Prerequisites

- Node.js 18+ (Download from [nodejs.org](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL database (we recommend Supabase - free tier available)
- Google OAuth credentials
- Facebook OAuth credentials (optional)

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/TECHTUNE-I-T-SOLUTIONS/vibe2gether.git
cd vibe2gether

# Install dependencies
pnpm install
```

## Step 2: Set Up Supabase Database

### Option A: Use Supabase Cloud (Recommended)

1. Go to [supabase.com](https://supabase.com/) and sign up for a free account
2. Create a new project
3. Note your project credentials:
   - **Project URL**: Found in project settings → API
   - **API Key**: Found in project settings → API (use the `anon` public key)
   - **Database Connection String**: Found in project settings → Database
4. In your Supabase project dashboard, go to SQL Editor and run the table creation scripts from `/scripts/` folder:
   - `001_create_users_table.sql`
   - `002_create_posts_table.sql`
   - `003_create_engagement_tables.sql`
   - `004_create_follows_table.sql`
   - `005_create_coins_transactions.sql`
   - `006_create_matches_table.sql`
   - `007_create_messages_table.sql`
   - `008_create_notifications_table.sql`
   - `009_create_sessions_table.sql`
   - `010_create_reports_table.sql`
   - `011_create_rpc_functions.sql`

### Option B: Local PostgreSQL

If you prefer to run PostgreSQL locally:

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/)
2. Create a new database:
   ```bash
   createdb vibe2gether
   ```
3. Run the SQL scripts in order:
   ```bash
   psql -d vibe2gether -f scripts/001_create_users_table.sql
   psql -d vibe2gether -f scripts/002_create_posts_table.sql
   # ... repeat for all scripts
   ```

## Step 3: Get OAuth Credentials

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Go to Credentials and create an OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy your **Client ID** and **Client Secret**

### Facebook OAuth (Optional)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Set up Facebook Login product
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`
5. Copy your **App ID** and **App Secret**

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in the project root (copy from `.env.example` if available):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibe2gether"
# OR if using Supabase:
# DATABASE_URL="postgresql://postgres:[password]@db.[supabase-project-id].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
# To generate NEXTAUTH_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth (Optional)
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## Step 5: Generate NEXTAUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `NEXTAUTH_SECRET` in `.env.local`.

## Step 6: Verify Database Connection

Run the development server to test the connection:

```bash
pnpm dev
```

If you see any database connection errors in the console, check:
1. DATABASE_URL is correct
2. Supabase database is accessible (check firewall/IP restrictions)
3. All SQL scripts have been run to create tables
4. User has proper permissions in the database

## Step 7: Create Test User (Optional)

You can manually create a test user for credentials authentication:

```sql
INSERT INTO users (
  email, 
  password_hash, 
  full_name, 
  display_name, 
  is_verified, 
  email_verified_at,
  coins_balance,
  total_coins_earned
) VALUES (
  'test@example.com',
  '$2a$12$...',  -- bcrypt hash of 'password123'
  'Test User',
  'Test',
  true,
  NOW(),
  50,
  50
);
```

Or simply sign up through the UI at http://localhost:3000/signup.

## Step 8: Start Development

```bash
pnpm dev
```

The app will be available at http://localhost:3000

## Signup Flow

### Manual Signup (Email/Password)
1. User fills in full name, email, password
2. User selects date of birth and gender
3. User adds optional phone number, country, city, bio, display name
4. Account is created with:
   - `email_verified_at` set to current date (auto-verified)
   - `is_verified` set to true
   - Welcome bonus of 50 coins
   - `last_login_at` updated

### Google OAuth Signup
1. User clicks "Continue with Google"
2. Google account is created with basic info from Google profile
3. **Profile completion modal appears** asking for:
   - Display name
   - Gender
   - Date of birth
   - Country
   - Optional: City and Bio
4. All fields are saved to the database

## Database Schema Overview

### Users Table
- **Basic Info**: id, email, password_hash, full_name, display_name
- **Profile**: bio, profile_picture, cover_picture, gender, date_of_birth
- **Location**: country, country_code, city, latitude, longitude
- **Contact**: mobile_number
- **Status**: is_active, is_verified, is_premium, is_admin
- **Dates**: created_at, updated_at, last_login_at, email_verified_at
- **Social**: followers_count, following_count
- **Economy**: coins_balance, total_coins_earned, language, looking_for, interests

### Other Tables
- **posts** - User generated content
- **messages** - Direct messaging
- **matches** - Match pairings
- **notifications** - System and user notifications
- **coin_transactions** - Coin economy tracking
- **follows** - User follow relationships
- **likes, comments** - Post engagement
- **reports** - User reports and moderation

## Common Issues & Troubleshooting

### "ENOTFOUND" Error During Registration
**Problem**: Database host not found
**Solution**: 
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check internet connection
- Ensure Supabase project is active

### "fetch failed" Error
**Problem**: Cannot connect to database
**Solution**:
- Check DATABASE_URL format
- Verify Supabase IP whitelist (if configured)
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY is correct

### Google OAuth Not Working
**Problem**: OAuth flow fails
**Solution**:
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check redirect URI matches in Google Console and app
- Ensure NEXTAUTH_URL matches your domain

### "Invalid or expired token" 
**Problem**: Session issues
**Solution**:
- Clear browser cookies
- Regenerate NEXTAUTH_SECRET if changed
- Check NEXTAUTH_URL is correct

## Deployment

### Vercel (Recommended for Next.js)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and connect your GitHub repo
3. Add environment variables in project settings:
   - All variables from `.env.local`
4. Update Google OAuth redirect URI to: `https://yourdomain.vercel.app/api/auth/callback/google`
5. Deploy!

### Other Platforms

See our deployment guide for: AWS, Heroku, DigitalOcean, etc.

## Next Steps

1. ✅ Set up database
2. ✅ Configure OAuth
3. ✅ Set environment variables
4. ✅ Run `pnpm dev`
5. 🔄 Test signup flow
6. 🔄 Create test accounts
7. 📝 Explore the dashboard
8. 🚀 Deploy to production

## Support

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/TECHTUNE-I-T-SOLUTIONS/vibe2gether/issues)
- 💬 [Join Discord Community](https://discord.gg/vibe2gether)
- 📧 [Contact Support](mailto:support@vibe2gether.com)

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM](https://www.prisma.io/docs)
