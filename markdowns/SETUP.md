# Setup Guide - Vibe2Gether

## Environment Configuration

To run Vibe2Gether locally, you need to configure your environment variables with Supabase credentials.

### Prerequisites

1. **Node.js** 18+ installed
2. **pnpm** package manager
3. **Supabase Account** (free tier available at https://supabase.com)
4. **Google OAuth Credentials** (optional, for Google login)

### Step 1: Set Up Supabase

1. Go to https://supabase.com and create an account
2. Create a new project:
   - Choose your region
   - Set a strong password for the `postgres` user
   - Wait for the project to initialize (2-3 minutes)

3. In your Supabase dashboard, go to **Settings → API**
4. Copy these values:
   - `Project URL` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Step 2: Create Database Tables

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents from each SQL migration file in `/scripts/` directory:
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

4. Run each query one by one

### Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values in `.env.local`:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # NextAuth Configuration (required)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate-with: openssl rand -base64 32

   # Google OAuth (optional, for OAuth login)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   To generate a secure `NEXTAUTH_SECRET`, run:
   ```bash
   openssl rand -base64 32
   ```

### Step 4: Install Dependencies

```bash
cd vibe2gether
pnpm install
```

### Step 5: Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Testing the Application

### Create an Account (Manual Signup)

1. Go to http://localhost:3000/signup
2. Fill in the 3-step signup form:
   - **Step 1:** Email, Password, Full Name
   - **Step 2:** Date of Birth, Gender
   - **Step 3:** Country, Mobile Number
3. Accept Terms & Privacy Policy
4. Click "Create Account"
5. You'll be automatically signed in and redirected to the dashboard

### Complete Profile (OAuth Signup)

1. Go to http://localhost:3000/signup
2. Click "Sign up with Google" (if configured)
3. After signing in, a modal will appear asking you to complete your profile
4. Fill in additional details:
   - Date of Birth
   - Gender
   - Bio
   - Phone Number
   - Country
   - Looking For (Relationship type)
   - Interests

## Features Implemented

### Authentication
- ✅ Manual signup with email/password
- ✅ Google OAuth signup
- ✅ Multi-step signup form with validation
- ✅ Profile completion modal for OAuth users
- ✅ Password hashing with bcrypt
- ✅ Session management with NextAuth

### User Profiles
- ✅ Automatic profile completion request for OAuth users
- ✅ Profile completion API endpoint
- ✅ Support for all user fields from the users table
- ✅ Welcome bonus (50 coins) on signup

### Security
- ✅ Password validation (minimum 8 characters)
- ✅ Email validation
- ✅ Age verification (18+ required)
- ✅ CSRF protection via NextAuth
- ✅ SQL injection prevention via Supabase

### User Experience
- ✅ Multi-step signup with progress indicator
- ✅ Form validation with error messages
- ✅ Loading states during registration
- ✅ Toast notifications for feedback
- ✅ Responsive design (mobile & desktop)

## Troubleshooting

### "Failed to create account" Error

**Cause:** Environment variables are not set or Supabase connection is failing

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`
2. Check that the values are correct (copy-paste from Supabase Settings → API)
3. Ensure Supabase project is active and you can connect to it
4. Check browser console for detailed error messages

### "Email already in use" Error

**Cause:** User with that email already exists in the database

**Solution:**
1. Use a different email address
2. Or delete the user from Supabase Users table (in SQL Editor)

### "You must be at least 18 years old" Error

**Cause:** Date of birth indicates user is under 18

**Solution:**
- Set a date of birth that makes the user 18+

## API Endpoints

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "dateOfBirth": "1995-01-15",
  "gender": "male",
  "countryCode": "+1",
  "mobileNumber": "5551234567",
  "country": "United States"
}
```

#### Check Profile Completion Status
```bash
GET /api/auth/check-profile
```

Response:
```json
{
  "needsCompletion": true,
  "user": { ... }
}
```

#### Complete Profile
```bash
POST /api/auth/complete-profile
Content-Type: application/json

{
  "dateOfBirth": "1995-01-15",
  "gender": "female",
  "bio": "Love traveling and trying new cuisines",
  "countryCode": "+1",
  "mobileNumber": "5551234567",
  "country": "United States",
  "lookingFor": "relationship",
  "interests": ["Travel", "Cooking", "Music"]
}
```

## Database Schema

See `scripts/` directory for complete table definitions.

**Key Tables:**
- `users` - User profiles and authentication
- `posts` - User posts and content
- `matches` - Match pairings
- `messages` - Direct messages
- `notifications` - User notifications
- `coin_transactions` - Coin economy
- `follows` - User follow relationships

## Next Steps

1. **Set up Google OAuth:**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to `.env.local`

2. **Configure Stripe (for Premium):**
   - Sign up at https://stripe.com
   - Get your API keys
   - Add payment endpoints

3. **Set up Email Provider:**
   - Configure SendGrid or Resend
   - Send welcome emails after signup

4. **Deploy to Vercel:**
   - Push to GitHub
   - Connect Vercel to your repository
   - Set environment variables in Vercel dashboard
   - Deploy!

## Support

For issues or questions:
- Check the error messages in the console
- Review Supabase logs in the project dashboard
- Look at the API response details
- Check `.env.local` for missing or incorrect values

---

**Happy coding!** 🚀
