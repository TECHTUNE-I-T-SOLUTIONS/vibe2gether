# Contact Form System - Visual Integration Guide

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC CONTACT FORM                          │
│                   /help (Support Page)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Still Need Help?                                              │
│  ─────────────────                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Name:          [____________]  Email:    [____________]  │  │
│  │ Phone:         [____________]  Category: [dropdown]      │  │
│  │ Subject:       [____________________________]             │  │
│  │ Message:       [_____________________________]            │  │
│  │                [_____________________________]            │  │
│  │                [_____________________________]            │  │
│  │                                                           │  │
│  │                [Submit Button]                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Other Ways to Reach Us:                                       │
│  ────────────────────────                                       │
│  [Live Chat] [Email] [Call Us]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Admin Dashboard Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Sidebar: [Admin Navigation]                                     │
│ - Dashboard                                                      │
│ - Users                                                          │
│ - Posts                                                          │
│ - Reports                                                        │
│ - Marketplace                                                    │
│ - Events                                                         │
│ - Blog                                                           │
│ - Announcements                                                  │
│ - Testimonies                                                    │
│ → CONTACTS ✓ (NEW)                                             │
│ - Messages                                                       │
│ - Transactions                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Contact Management Page

```
┌──────────────────────────────────────────────────────────────────┐
│              CONTACT SUBMISSIONS                                 │
│  [All] [New] [Read] [Responded] [Closed]                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ Contact #1                                                   │
│ │ Subject: Account Login Issue                                  │
│ │ [🟡 New]  [🟠 High]  [Account]                               │
│ │ From: John Doe - john@example.com  2024-01-18                │
│ │ Message: I'm unable to log into my account...                │
│ │ [Mark as Read] [Add Response] [Close]                        │
│ └──────────────────────────────────────────────────────────────
│
│ ┌─ Contact #2                                                   │
│ │ Subject: Feature Request                                      │
│ │ [🟢 Responded]  [🔵 Normal]  [Feature Request]               │
│ │ From: Jane Smith - jane@example.com  2024-01-17              │
│ │ Message: Can you add dark mode to the app?                   │
│ │ Response: Thanks for the suggestion! We'll consider...       │
│ │ [Edit Response] [Close]                                      │
│ └──────────────────────────────────────────────────────────────
│
│ ┌─ Contact #3                                                   │
│ │ Subject: Bug Report                                           │
│ │ [🔴 Urgent]  [🟢 Responded]  [Bug Report]                    │
│ │ From: Mike Johnson - mike@example.com  2024-01-16            │
│ │ Message: App crashes when uploading video...                 │
│ │ [Edit Response] [Close]                                      │
│ └──────────────────────────────────────────────────────────────
│
└──────────────────────────────────────────────────────────────────┘
```

## Notification System

```
┌──────────────────────────────────────────────────────────────────┐
│              ADMIN NOTIFICATIONS                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔔 New Contact Submission: Account Login Issue                  │
│    From John Doe (john@example.com): I'm unable to log...      │
│    [View] [Mark as Read]                                        │
│                                                                  │
│ 🔔 New Contact Submission: Feature Request                      │
│    From Jane Smith (jane@example.com): Can you add dark...      │
│    [View] [Mark as Read]                                        │
│                                                                  │
│ 🔔 New Contact Submission: Bug Report                           │
│    From Mike Johnson (mike@example.com): App crashes...        │
│    [View] [Mark as Read]                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Response Dialog

```
┌──────────────────────────────────────────────────────────┐
│          Response for John Doe                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Subject: Account Login Issue                            │
│ Message: I'm unable to log into my account because...   │
│                                                          │
│ Your Response:                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ We've received your message. Please try resetting  │ │
│ │ your password using the "Forgot Password" button... │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [Cancel] [Send Response]                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Form Success State

```
┌──────────────────────────────────────────────────────┐
│                  Still Need Help?                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│                    ✓ (Checkmark)                     │
│                                                      │
│               Thank You!                             │
│                                                      │
│  Your message has been submitted successfully.      │
│     We'll get back to you within 24 hours.          │
│                                                      │
│  Other Ways to Reach Us:                            │
│  [Live Chat] [Email] [Call Us]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Database Flow

```
                  ┌─────────────────┐
                  │  User Form      │
                  └────────┬────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  API Validation        │
              │ - Required fields      │
              │ - Email format         │
              │ - Rate limiting (5m)   │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Insert to Database    │
              │ - contacts table       │
              │ - status: "new"        │
              │ - priority: "normal"   │
              └────────────┬───────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  PostgreSQL Trigger Fires       │
         │  insert_contact_notification()  │
         └────────────────┬────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────┐
         │  Auto-Insert Notifications      │
         │  For each active admin:         │
         │  - type: contact_submission     │
         │  - related_id: contact.id       │
         │  - action_url: /admin/contacts  │
         │  - is_read: false               │
         └────────────────┬────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────┐
         │  Admin Notifications Panel      │
         │  Shows: Contact list + counts   │
         └─────────────────────────────────┘
```

## Status & Priority Legend

### Status Indicators
- 🟡 **New** - Unreviewed submission
- 🔵 **Read** - Admin has reviewed
- 🟢 **Responded** - Admin replied
- ⚪ **Closed** - Issue resolved

### Priority Indicators
- 🔴 **Urgent** - Requires immediate attention
- 🟠 **High** - Important issue
- 🔵 **Normal** - Standard priority
- 🟦 **Low** - Can wait

### Category Examples
- Account & Profile
- Technical Issues
- Billing & Payments
- Safety & Privacy
- Feature Request
- Bug Report
- General Inquiry

## Mobile Responsive

```
┌─────────────────────┐
│  Mobile Contact     │
│  Form /help         │
├─────────────────────┤
│                     │
│ Name                │
│ [__________]        │
│                     │
│ Email               │
│ [__________]        │
│                     │
│ Phone               │
│ [__________]        │
│                     │
│ Category            │
│ [Dropdown]          │
│                     │
│ Subject             │
│ [__________]        │
│                     │
│ Message             │
│ [__________]        │
│ [__________]        │
│                     │
│ [Submit]            │
│                     │
└─────────────────────┘
```

## File Structure

```
vibe2gether/
├── app/
│   ├── help/
│   │   └── page.tsx ..................... (Updated with form)
│   ├── api/
│   │   └── contacts/
│   │       └── route.ts ................ (NEW - API endpoint)
│   └── admin/
│       └── contacts/
│           └── page.tsx .............. (NEW - Admin page)
├── components/
│   └── admin/
│       ├── sidebar.tsx ............... (Updated - Mail icon)
│       └── mobile-sidebar.tsx ........ (Updated - Mail icon)
├── CONTACTS_TABLE_SETUP.sql .......... (NEW - Database)
├── CONTACT_FORM_IMPLEMENTATION.md .... (NEW - Docs)
├── CONTACT_FORM_QUICK_START.md ....... (NEW - Quick guide)
└── CONTACT_FORM_VISUAL_GUIDE.md ...... (NEW - This file)
```

---

**All components are fully integrated and ready for deployment!**
