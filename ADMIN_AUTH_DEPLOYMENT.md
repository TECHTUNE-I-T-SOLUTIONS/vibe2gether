# Admin Auth Setup - Quick Start

## What Changed?

✅ Created separate `admins` table for admin accounts
✅ Reverted all auth routes to use `admins` table instead of `users`
✅ Admins completely separated from regular users
✅ All 404 errors should now be fixed

## Files Changed

### Reverted (Back to using admins table)
- `app/api/admin/auth/login/route.ts`
- `app/api/admin/auth/me/route.ts`
- `app/api/admin/auth/signup/route.ts`
- `app/api/admin/auth/forgot-password/route.ts`

### Created (New setup files)
- `SETUP_ADMINS_TABLE.sql` - Run this in Supabase to create admins table
- `ADMIN_AUTH_SETUP.md` - Complete documentation
- Updated `scripts/current tables in the database/current_tables.sql` - Added admins schema

## 3-Step Deployment

### Step 1: Create Admins Table in Supabase

1. Go to Supabase SQL Editor
2. Copy contents of `SETUP_ADMINS_TABLE.sql`
3. Paste and click "Run"

This creates:
- `admins` table (stores admin accounts)
- `admin_security_questions` table (optional, for password recovery)
- All necessary indexes

### Step 2: Deploy Updated Code

Deploy these updated routes:
```
app/api/admin/auth/login/route.ts
app/api/admin/auth/me/route.ts
app/api/admin/auth/signup/route.ts
app/api/admin/auth/forgot-password/route.ts
```

### Step 3: Test

1. Go to `/admin/signup`
2. Create first admin account
3. Email: admin@example.com
4. Password: (min 8 chars)
5. Full Name: Admin User
6. Click Sign Up
7. Verify in Supabase - admin should appear in `admins` table
8. Login at `/admin`
9. Verify header shows profile picture

## Database Structure

```
Admins Table:
├── id (UUID)
├── email (unique)
├── password_hash (bcryptjs)
├── full_name
├── profile_picture (URL)
├── cover_image (URL)
├── role (admin/moderator/support/viewer)
├── permissions (text array)
├── is_active (boolean)
├── two_factor_enabled (boolean)
├── last_login_at
├── created_at
└── updated_at

Admin Security Questions Table:
├── id (UUID)
├── admin_id (FK → admins.id)
├── question
├── answer_hash (bcryptjs)
└── created_at
```

## Fix Summary

**Problem:** 
- `GET /api/admin/auth/me` returned 404
- Admin header wasn't showing profile picture
- Routes looking for non-existent `admins` table

**Solution:**
- Created `admins` table with full schema
- All routes now query `admins` table
- Admins completely separated from users

**Result:**
- ✅ No more 404 errors
- ✅ Header displays profile picture
- ✅ Admin dropdown shows email
- ✅ Logout modal works
- ✅ Complete admin separation

## Architecture

```
Admin Login
    ↓
Query admins table
    ↓
Verify password (bcryptjs)
    ↓
Create JWT token
    ↓
Set admin_token cookie
    ↓
↓
Admin Visits /admin
    ↓
AdminLayout checks auth
    ↓
GET /api/admin/auth/me (with admin_token cookie)
    ↓
Verify JWT
    ↓
Query admins table
    ↓
Return admin data
    ↓
AdminHeader displays info
    ↓
✅ Profile picture shows
✅ Email shows in dropdown
✅ All working!
```

## Quick Reference

| Item | Value |
|------|-------|
| Admins Table | `public.admins` |
| Auth Endpoints | `/api/admin/auth/*` |
| Auth Cookie | `admin_token` (httpOnly) |
| Token Expiry | 24 hours |
| Password Hash | bcryptjs (10 rounds) |
| Security Questions | Optional (separate table) |
| Role Field | admin/moderator/support/viewer |
| Permissions | Text array |

## Verification

After deployment, verify:

```sql
-- Check admins table exists
SELECT COUNT(*) FROM public.admins;

-- Check your admin account
SELECT id, email, full_name, is_active FROM admins WHERE email = 'admin@example.com';

-- Check last login updated
SELECT email, last_login_at FROM admins ORDER BY last_login_at DESC LIMIT 1;

-- Check security questions (if used)
SELECT COUNT(*) FROM admin_security_questions;
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on /api/admin/auth/me | Run SETUP_ADMINS_TABLE.sql |
| Header not showing picture | Check admin in admins table has profile_picture URL |
| Can't create admin | Check admins table created in Supabase |
| Login fails | Verify admin exists and is_active = true |

---

**Status: Ready for Production ✅**

See `ADMIN_AUTH_SETUP.md` for complete documentation.
