# Contact Form System - Implementation Guide

## Overview

A fully functional public contact form system has been implemented with:
- **Public Contact Form** on `/help` page
- **Admin Management Interface** at `/admin/contacts`
- **Database Integration** with automatic admin notifications
- **Spam Prevention** with rate limiting
- **Email Validation** and form submission handling

---

## Database Setup

### SQL Migration File: `CONTACTS_TABLE_SETUP.sql`

Run this SQL file in your Supabase database to create the necessary tables and triggers.

#### Creates:

1. **`contacts` table** with the following fields:
   - `id` (UUID, Primary Key)
   - `name` (Text, Required)
   - `email` (Text, Required)
   - `phone` (Text, Optional)
   - `subject` (Text, Required)
   - `category` (Text, Optional) - general, account, technical, billing, safety, feature-request, bug-report
   - `message` (Text, Required)
   - `status` (Text) - new, read, responded, closed
   - `priority` (Text) - low, normal, high, urgent
   - `assigned_to` (UUID, Optional) - Foreign key to admins table
   - `response_notes` (Text, Optional)
   - `responded_at` (Timestamp, Optional)
   - `closed_at` (Timestamp, Optional)
   - `created_at` (Timestamp, Auto-set)
   - `updated_at` (Timestamp, Auto-updated)

2. **Indexes** for performance:
   - Index on `status` (for filtering)
   - Index on `email` (for lookups)
   - Index on `created_at` DESC (for sorting)
   - Index on `priority` (for filtering)
   - Index on `assigned_to` (for admin assignments)

3. **Triggers**:
   - **Auto-timestamp**: Updates `updated_at` on any modification
   - **Auto-notification**: Inserts notification into `admin_notifications` table when new contact is submitted

---

## API Endpoints

### POST `/api/contacts` - Submit Contact Form

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "subject": "Account Issue",
  "category": "account",
  "message": "I'm having trouble logging into my account..."
}
```

**Validation:**
- Required fields: `name`, `email`, `subject`, `message`
- Email format validation (RFC-compliant)
- Spam prevention: Max 1 submission per email within 5 minutes

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Thank you for contacting us. We'll get back to you soon!",
  "data": [
    {
      "id": "uuid-here"
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

### GET `/api/contacts?email=user@example.com` - Get Contact History

Returns up to 10 recent contact submissions for a given email address.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Account Issue",
      "status": "new",
      "created_at": "2024-01-18T10:00:00Z",
      "responded_at": null
    }
  ]
}
```

---

## Frontend Components

### 1. Public Contact Form - `/app/help/page.tsx`

**Features:**
- **Client-side form** with state management using `useState`
- **Form fields:**
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Category (dropdown, optional)
  - Subject (required)
  - Message (required, textarea)

- **User Experience:**
  - Real-time validation feedback
  - Loading state with spinner during submission
  - Success message with checkmark confirmation
  - Error messages display with red background
  - Form auto-resets after successful submission
  - Success message disappears after 5 seconds

- **Accessibility:**
  - Label elements for all form fields
  - Form marked as required for essential fields
  - Disabled state during loading
  - Semantic HTML structure

### 2. Admin Management Interface - `/app/admin/contacts/page.tsx`

**Features:**
- **Contact List View:**
  - Filter by status: All, New, Read, Responded, Closed
  - Color-coded badges for status and priority
  - Left border accent (red=urgent, orange=high, gray=normal, blue=low)
  - Contact information display (name, email, phone, date)

- **Contact Details:**
  - Full message display
  - Response history (if any)
  - Action buttons based on status

- **Actions:**
  - Mark as Read (for new submissions)
  - Add/Edit Response (opens modal dialog)
  - Close Contact (marks as closed)
  - Delete Contact (admin only)

- **Response Dialog:**
  - Displays contact's original message
  - Textarea for admin response
  - Auto-updates status to "responded" on submission
  - Stores timestamp of response

- **Loading & Empty States:**
  - Loading spinner while fetching contacts
  - Empty state message when no contacts found

---

## Admin Notifications

### Auto-Generated Notifications

When a new contact is submitted:

1. **Trigger Function** (`insert_contact_notification()`) automatically creates notifications
2. **For each active admin**, a notification is inserted into `admin_notifications` table with:
   - `type`: "contact_submission"
   - `title`: "New Contact Submission: [Subject]"
   - `message`: "From [Name] ([Email]): [First 100 chars of message]..."
   - `related_type`: "contact"
   - `related_id`: Contact UUID
   - `action_url`: "/admin/contacts/[contact-id]"
   - `is_read`: false

3. **Admin Notification Features:**
   - Appears in admin notifications panel
   - Linked to specific contact for easy access
   - Can be marked as read
   - Shows submission source and subject preview

---

## Navigation Integration

### Admin Sidebar Updates

**Desktop Sidebar** (`components/admin/sidebar.tsx`):
- Added Mail icon import from lucide-react
- Added Contacts item to secondaryItems:
  ```
  { icon: Mail, label: "contacts", href: "/admin/contacts" }
  ```
- Position: Between "testimonies" and "messages"

**Mobile Sidebar** (`components/admin/mobile-sidebar.tsx`):
- Added Mail icon import
- Added Contacts item to secondaryItems
- Same position as desktop for consistency

---

## Submission Flow

```
User fills form on /help
    ↓
Form validation (client-side)
    ↓
POST to /api/contacts
    ↓
Server validation & spam check
    ↓
Insert into contacts table
    ↓
PostgreSQL trigger fires
    ↓
Auto-insert notifications into admin_notifications
    ↓
Notifications appear in admin panel
    ↓
Admin processes response in /admin/contacts
    ↓
Admin submits response
    ↓
Status changes to "responded"
    ↓
Timestamp recorded
```

---

## Database Constraints

- **Status Check**: Only allows 'new', 'read', 'responded', 'closed'
- **Priority Check**: Only allows 'low', 'normal', 'high', 'urgent'
- **Foreign Key**: assigned_to references admins(id)
- **Timestamps**: Created_at set automatically, updated_at updated on every change

---

## Security Features

1. **Spam Prevention**
   - Rate limiting: Max 1 submission per email in 5-minute window
   - Returns 429 (Too Many Requests) if exceeded

2. **Input Validation**
   - Email format validation
   - Required field checks
   - Text trimming to prevent empty whitespace-only submissions

3. **Data Sanitization**
   - Email converted to lowercase for consistency
   - Names and subjects trimmed
   - XSS protection through React's built-in rendering

4. **Admin-Only Access**
   - Admin sidebar restricted to authenticated admins
   - Delete operations require admin role verification

---

## Status Workflow

### Contact Lifecycle

1. **New** (Default)
   - Initial state when submitted
   - Admin badge shows yellow
   - "Mark as Read" button available

2. **Read**
   - Admin has reviewed the contact
   - Status changed manually

3. **Responded**
   - Admin submitted a response
   - Status auto-changes when submitting response
   - Response text and timestamp stored

4. **Closed**
   - Issue resolved or no further action needed
   - Archived but still visible in admin panel

---

## Testing Checklist

- [ ] SQL migration creates contacts table successfully
- [ ] Triggers execute without errors
- [ ] Admin notifications created on new contact submission
- [ ] Form validation works (required fields, email format)
- [ ] Spam prevention prevents duplicate submissions within 5 minutes
- [ ] File upload handling works (if applicable)
- [ ] Admin can filter contacts by status
- [ ] Admin can add response to contact
- [ ] Status changes to "responded" after admin response
- [ ] Contact appears in admin sidebar
- [ ] Mobile view displays form correctly
- [ ] Error messages display properly
- [ ] Success confirmation shows after submission

---

## Files Created/Modified

### Created:
- `CONTACTS_TABLE_SETUP.sql` - Database migration
- `app/api/contacts/route.ts` - API endpoint
- `app/admin/contacts/page.tsx` - Admin management page

### Modified:
- `app/help/page.tsx` - Added contact form
- `components/admin/sidebar.tsx` - Added contacts navigation
- `components/admin/mobile-sidebar.tsx` - Added contacts navigation

---

## Future Enhancements

1. **Email Notifications**
   - Send auto-reply email to user when submitted
   - Send email to admin when new contact received
   - Send notification email when response submitted

2. **Attachment Support**
   - Allow file uploads with contact form
   - Store file references in database

3. **Categories**
   - Expand category options
   - Route contacts to specific admin teams
   - Auto-assign based on category

4. **Advanced Filtering**
   - Search by name, email, subject
   - Date range filtering
   - Priority-based sorting

5. **Analytics**
   - Contact volume trends
   - Response time metrics
   - Category distribution

6. **Integration**
   - Slack notifications
   - Email forwarding
   - Ticketing system export

---

## Troubleshooting

### Notifications Not Appearing
- Check that triggers were created successfully
- Verify admins exist with `role` IN ('admin', 'moderator')
- Ensure admins have `is_active = true`

### Spam Prevention Not Working
- Verify the 5-minute window logic in the API
- Check that email is being lowercase-converted

### Form Not Submitting
- Check browser console for errors
- Verify API endpoint is accessible
- Confirm Supabase connection string is valid

### Admin Page Shows No Contacts
- Check that contacts table was created
- Verify RLS policies allow admin access (if enabled)
- Check admin authentication status

---

## Support

For issues or questions regarding the contact form system, check:
1. Browser console for JavaScript errors
2. Network tab in DevTools for API response errors
3. Supabase dashboard for database errors
4. Server logs for API errors
