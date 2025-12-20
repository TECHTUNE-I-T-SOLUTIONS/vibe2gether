# Vibe2Gether - Feature Navigation Guide

## Quick Links to All New Pages

### 🛒 Marketplace
- **Admin Management:** `/app/admin/marketplace/page.tsx`
- **User Browse:** `/app/dashboard/marketplace/page.tsx`

### 📅 Events
- **Admin Management:** `/app/admin/events/page.tsx`
- **User Browse:** `/app/dashboard/events/page.tsx`

### 📖 Blog
- **Admin Management:** `/app/admin/blog/page.tsx`
- **User Blog List:** `/app/dashboard/blog/page.tsx`
- **Blog Post Detail:** `/app/dashboard/blog/[slug]/page.tsx`

### ⚙️ Settings (5 Pages)
- **Settings Hub:** `/app/dashboard/settings/page.tsx`
- **Account Settings:** `/app/dashboard/settings/account/page.tsx`
- **Notifications:** `/app/dashboard/settings/notifications/page.tsx`
- **Privacy:** `/app/dashboard/settings/privacy/page.tsx`
- **Security:** `/app/dashboard/settings/security/page.tsx`
- **Billing:** `/app/dashboard/settings/billing/page.tsx`

### 👥 Social Features
- **Followers:** `/app/dashboard/followers/page.tsx`
- **Following:** `/app/dashboard/following/page.tsx`

### ⭐ Premium
- **Premium Upgrade:** `/app/dashboard/premium/page.tsx`

---

## Database Tables Reference

Run these SQL queries to verify all tables exist:

```sql
-- Core Tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- All new tables should include:
-- marketplace_products
-- marketplace_inquiries
-- events
-- event_registrations
-- blog_posts
-- blog_comments
-- content_requests
-- premium_subscriptions
-- account_topups
-- notification_preferences
-- security_settings
-- follows
```

---

## Testing Checklist

### Marketplace
- [ ] Admin can create products
- [ ] Admin can search and filter products
- [ ] Admin can edit and delete products
- [ ] Users can browse marketplace
- [ ] Users can send inquiries to sellers
- [ ] Products show correct images and pricing

### Events
- [ ] Admin can create events
- [ ] Admin can manage event details
- [ ] Users can browse upcoming events
- [ ] Users can register for events
- [ ] Users can unregister from events
- [ ] Event capacity is tracked correctly

### Blog
- [ ] Admin can create blog posts
- [ ] Admin can manage featured status
- [ ] Users can browse blog posts
- [ ] Users can read full articles
- [ ] Users can leave comments
- [ ] Search and filtering works

### Settings
- [ ] Account page shows user info
- [ ] Users can edit profile details
- [ ] Notification preferences toggle correctly
- [ ] Privacy settings update in real-time
- [ ] Security settings allow password change
- [ ] Billing page shows coin balance
- [ ] Users can purchase coin packages

### Social
- [ ] Followers page shows users following you
- [ ] Following page shows users you follow
- [ ] Unfollow button works correctly
- [ ] Profile links navigate correctly

### Premium
- [ ] Premium page shows subscription status
- [ ] Users can select plan and proceed to payment
- [ ] Plan selection shows correct price
- [ ] Subscription features are listed

---

## Database Functions Used

All functions are in `/lib/supabase/queries.ts`:

```typescript
// Marketplace
getMarketplaceProducts()
getMarketplaceProductById()
createMarketplaceProduct()
updateMarketplaceProduct()
deleteMarketplaceProduct()
createMarketplaceInquiry()

// Events
getEvents()
getEventById()
registerForEvent()
unregisterFromEvent()
getUserEventRegistrations()
createEvent()
updateEvent()
deleteEvent()

// Blog
getBlogPosts()
getBlogPostBySlug()
getBlogComments()
createBlogPost()
updateBlogPost()
deleteBlogPost()

// Settings
getNotificationPreferences()
updateNotificationPreferences()
getSecuritySettings()
updateSecuritySettings()
getPrivacySettings()
updatePrivacySettings()

// Billing
getAccountTopups()
createAccountTopup()
getUserPremiumSubscription()
createPremiumSubscription()
getCoinsBalance()

// Social
getFollowers()
getFollowing()
followUser()
unfollowUser()
```

---

## Key Implementation Details

### Admin Pages Pattern
All admin pages follow this pattern:
1. Fetch data on component mount
2. Show table with search/filter
3. Toggle buttons for status changes
4. Edit dialog for detailed updates
5. Delete confirmation
6. Loading and error states

### User Page Pattern
User-facing pages follow this pattern:
1. Browse with search/filter
2. Infinite scroll pagination
3. Detail modals for more info
4. Action buttons (register, purchase, inquiry)
5. User feedback messages

### Settings Pattern
All settings pages follow this pattern:
1. Fetch user preferences
2. Show current values
3. Toggle switches or radio buttons
4. Real-time or save button updates
5. Dialogs for complex actions (2FA, blocked users)

---

## Troubleshooting

### Query Functions Not Found
- Verify functions are exported in `/lib/supabase/queries.ts`
- Check function spelling matches import statements
- Ensure function return types match usage

### Pages Not Rendering
- Check file path exactly matches route
- Verify `[slug]` syntax for dynamic routes
- Ensure component is exported as default
- Check imports for UI components

### Supabase Connection Issues
- Verify Supabase client is initialized
- Check RLS policies allow operations
- Ensure user is authenticated for protected routes
- Check network tab for API errors

### Styling Issues
- Verify Tailwind classes are correct
- Check imports for UI components
- Ensure dark mode is configured
- Check shadcn/ui components are installed

---

## Performance Optimization Ideas

1. **Image Optimization**
   - Use Next.js Image component (already implemented)
   - Add image compression in Supabase

2. **Database Optimization**
   - Add indexes on frequently queried fields
   - Implement database connection pooling

3. **Caching**
   - Implement React Query for data caching
   - Cache blog posts and events

4. **Code Splitting**
   - Lazy load modals and dialogs
   - Dynamic imports for heavy components

5. **Search Optimization**
   - Implement full-text search in Supabase
   - Add debouncing for search inputs

---

## Security Considerations

1. **RLS Policies**
   - Verify all tables have proper RLS enabled
   - Users can only see/edit their own data

2. **Authentication**
   - All routes require user authentication
   - Check auth state before rendering

3. **Data Validation**
   - Validate all form inputs
   - Use TypeScript for type safety

4. **Payment Security**
   - Use Stripe or similar for payments
   - Never store card details client-side
   - Implement server-side verification

---

## 🎉 You're All Set!

All 12 major features have been fully implemented and integrated. The application is ready for testing and deployment!
