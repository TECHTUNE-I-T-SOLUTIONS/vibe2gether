@echo off
REM Quick deployment guide for Supabase Notification System

echo ===================================================================
echo Vibe2Gether Notification System - Deployment Guide
echo ===================================================================
echo.
echo STEP 1: Open Supabase SQL Editor
echo - Go to https://supabase.com
echo - Login to your project
echo - Click 'SQL Editor' in the left sidebar
echo.
echo STEP 2: Execute the SQL file
echo - Open: /scripts/013_comprehensive_notification_triggers.sql
echo - Copy entire content
echo - Paste into Supabase SQL Editor
echo - Click 'Run' button
echo.
echo STEP 3: Verify Deployment
echo - You should see success messages
echo - No red error messages
echo.
echo STEP 4: Test the System
echo - Go to your app
echo - Trigger an action (like, comment, follow, etc)
echo - Check /dashboard/notifications page
echo - Verify notification appears with actual message
echo.
echo STEP 5: Verify No Errors
echo - Open browser DevTools (F12)
echo - Check Console tab for errors
echo - Check Network tab - see /api/notifications response
echo.
echo ===================================================================
echo NOTIFICATION TYPES DEPLOYED
echo ===================================================================
echo.
echo [OK] Welcome Notification       - New user signup
echo [OK] Like Notification          - User likes your post
echo [OK] Follow Notification        - User follows you
echo [OK] Comment Notification       - User comments on your post
echo [OK] View Notification          - User views your post
echo [OK] Save Notification          - User saves your post
echo [OK] Message Notification       - User sends you a message
echo [OK] New Post Notification      - Someone you follow posts
echo [OK] Match Notification         - New match created
echo [OK] Coins Earned Notification  - You earned coins
echo [OK] Wallet Update Notification - Via coin_transactions table
echo.
echo ===================================================================
echo FIXES APPLIED
echo ===================================================================
echo.
echo [FIXED] profile_views table reference (was non-existent)
echo [FIXED] NaN coins earned display
echo [FIXED] Showing actual notification messages from database
echo [FIXED] System notifications with null actor_id
echo.
echo ===================================================================
echo TESTING CHECKLIST
echo ===================================================================
echo.
echo [ ] Run SQL file in Supabase
echo [ ] Create new user account (check Welcome notification)
echo [ ] Like a post (check Like notification)
echo [ ] Follow a user (check Follow notification)
echo [ ] Comment on a post (check Comment notification)
echo [ ] View a post (check View notification)
echo [ ] Save a post (check Save notification)
echo [ ] Send a message (check Message notification)
echo [ ] Complete an action earning coins (check Coins notification)
echo.
echo ===================================================================
echo.
pause
