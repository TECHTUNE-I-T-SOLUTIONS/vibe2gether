# Quick Start - Admin Panel Database Setup

## ⚠️ CRITICAL: Database Setup Required

The admin panel features won't work until you create the database tables. Follow these steps:

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your `vibe2gether` project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New Query"** button (top right)

## Step 2: Copy and Paste SQL

Open the file `SETUP_SQL.sql` in your project and copy ALL the SQL code.

Paste it into the Supabase SQL Editor text box.

## Step 3: Run the Query

Click the **"Run"** button (bottom right of SQL editor) or press `Ctrl+Enter`

You should see output like:
```
Query returned 0 rows (took 2.5s)
```

## Step 4: Verify Tables Were Created

In Supabase left sidebar:
1. Click **"Database"** 
2. Click **"Tables"**

You should now see two new tables:
- ✅ `featured_requests`
- ✅ `admin_notifications`

## Step 5: Test in App

1. Start your dev server: `npm run dev`
2. Navigate to:
   - `/admin/featured` - Featured requests page
   - `/admin/notifications` - Admin notifications page
3. On mobile, check the bottom navigation bar appears

## Troubleshooting

### ❌ Error: "relation 'featured_requests' does not exist"
- The table wasn't created
- Make sure you ran the SQL in Supabase SQL Editor
- Check the output - there should be no errors

### ❌ Error: "Invalid token" on notifications page
- Your admin JWT token might be missing admin_id
- Check that your admin is created in the `admins` table
- Make sure `admin_token` cookie is being set in admin auth

### ❌ Featured page shows "400 Bad Request"
- The SQL hasn't been run yet
- Run the SQL from `SETUP_SQL.sql` in Supabase

### ❌ Mobile sidebar not showing
- Check that you're on a mobile device or mobile viewport (< 1024px)
- On desktop, the sidebar should be hidden
- Mobile sidebar uses `lg:hidden` class

## What Each Table Does

### featured_requests
Stores feature requests from users for products/services/events
- Admin can approve/reject/delete requests
- Tracks views and rejection reasons

### admin_notifications
Stores notifications specific to admins
- Separate from user notifications
- Filtered by admin_id automatically
- Can mark as read, delete

## Files to Reference

- **`SETUP_SQL.sql`** - SQL to run (copy-paste into Supabase)
- **`ADMIN_DATABASE_SETUP.md`** - Detailed setup guide
- **`ADMIN_FIXES_SUMMARY.md`** - What was fixed and why

## Next Steps After Setup

1. ✅ Run SQL to create tables
2. ✅ Verify tables in Supabase
3. ✅ Test `/admin/featured` page
4. ✅ Test `/admin/notifications` page  
5. ✅ Test mobile sidebar on mobile device
6. (Optional) Enable RLS for security

---

**Estimated time: 2 minutes**
