# Admin Authentication - System Architecture Diagram

## Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    VIBE2GETHER DATABASE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │   USERS TABLE       │      │   ADMINS TABLE          │  │
│  │                     │      │                         │  │
│  │ ✓ Regular users     │      │ ✓ Admin accounts        │  │
│  │ ✓ is_admin: false   │      │ ✓ role: admin/mod...    │  │
│  │ ✓ Profile data      │      │ ✓ permissions: []       │  │
│  │ ✓ is_verified      │      │ ✓ is_active: true       │  │
│  │ ✓ Followers/Posts   │      │ ✓ two_factor_enabled   │  │
│  │                     │      │ ✓ profile_picture      │  │
│  └─────────────────────┘      │ ✓ cover_image          │  │
│         Millions of users       └─────────────────────────┘  │
│                                    Small set of admins       │
│                                                             │
│                    ┌──────────────────────────┐            │
│                    │ ADMIN_SECURITY_QUESTIONS │            │
│                    │                          │            │
│                    │ ✓ admin_id (FK)          │            │
│                    │ ✓ question               │            │
│                    │ ✓ answer_hash (bcrypt)   │            │
│                    └──────────────────────────┘            │
│                                                             │
│              ┌────────────────────────────────────┐        │
│              │  ADMIN_NOTIFICATIONS TABLE         │        │
│              │                                    │        │
│              │ ✓ admin_id (FK to admins)          │        │
│              │ ✓ type: info/warning/success       │        │
│              │ ✓ title, message                   │        │
│              │ ✓ is_read, read_at                 │        │
│              └────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────┐
│  ADMIN LOGIN    │
└────────┬────────┘
         │
         ▼
    ┌──────────────────────────────────┐
    │ POST /api/admin/auth/login       │
    │ { email, password }              │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Query admins table by email      │
    │ SELECT * FROM admins WHERE email │
    └────────────┬────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    ✓ Found      ✗ Not found
         │               │
         ▼               ▼
    Check if       Return 401
    is_active=true   Unauthorized
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
  YES         NO → 401
    │
    ▼
    Verify password hash
    (bcryptjs.compare)
    │
    ┌────┴─────┐
    │           │
    ▼           ▼
  Valid     Invalid → 401
    │
    ▼
    Update last_login_at
    │
    ▼
    ┌──────────────────────────┐
    │ Create JWT Token         │
    │                          │
    │ {                        │
    │   id: admin.id,          │
    │   email: admin.email,    │
    │   role: admin.role,      │
    │   fullName: admin.full_name
    │   exp: now + 24h         │
    │ }                        │
    │ signed with JWT_SECRET   │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Set admin_token Cookie       │
    │                              │
    │ httpOnly: true               │
    │ secure: true (prod)          │
    │ sameSite: strict             │
    │ maxAge: 86400 (24 hours)     │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Return admin data        │
    │                          │
    │ {                        │
    │   id, email,             │
    │   fullName, role, ...    │
    │ }                        │
    └──────────────────────────┘
                 │
                 ▼
         ✅ LOGIN SUCCESS
```

## Verification Flow (Admin Panel Access)

```
┌────────────────────────────┐
│ User navigates to /admin   │
└────────────┬───────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ AdminLayout Component       │
    │ (useEffect)                 │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ GET /api/admin/auth/me       │
    │ (sends admin_token cookie)   │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Read admin_token from cookie │
    └────────────┬─────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
      Found           Not found
         │                │
         ▼                ▼
    Verify JWT    Return 401
    signature       Redirect to
         │          /auth/login
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
  Valid     Invalid → 401
    │
    ▼
    Extract admin.id from token
    │
    ▼
    ┌──────────────────────────────┐
    │ Query admins table by ID     │
    │ SELECT * FROM admins         │
    │ WHERE id = decoded.id        │
    │ AND is_active = true         │
    └────────────┬─────────────────┘
                 │
         ┌───────┴─────────┐
         │                 │
         ▼                 ▼
    Found & Active   Not found or inactive
         │                 │
         ▼                 ▼
    Return admin    Return 404
    data (flat)      Redirect to
         │            /auth/login
         ▼
    ┌─────────────────────────────┐
    │ AdminLayout sets auth state │
    │ setIsAuthenticated(true)     │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ AdminHeader fetches data    │
    │ from /api/admin/auth/me     │
    │ (already have it)           │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Display Admin Information   │
    │                             │
    │ Avatar [PIC] ▼              │
    │       Admin Name            │
    │       admin@email.com       │
    │       ─────────────         │
    │       Profile               │
    │       Settings              │
    │       ─────────────         │
    │       Logout ← Opens Modal  │
    └─────────────────────────────┘
                 │
                 ▼
         ✅ ADMIN PANEL LOADED
```

## Logout Flow

```
┌──────────────────────────┐
│ Click Logout in Dropdown │
└────────────┬─────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ LogoutConfirmationDialog Opens │
    │                                │
    │ "Sign out?"                    │
    │ Are you sure you want to       │
    │ sign out?                      │
    │                                │
    │  [Cancel] [Sign out]           │
    └────────────┬────────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
         ▼                  ▼
      Cancel             Sign out
         │                  │
         ▼                  ▼
    Close Modal       POST /api/admin/auth/logout
         │                  │
         ▼                  ▼
    Stay on page    ┌────────────────────────┐
                    │ Delete admin_token     │
                    │ cookie                 │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Return 200 OK          │
                    │ message: "Logged out"  │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Redirect to            │
                    │ /auth/login            │
                    └────────────┬───────────┘
                                 │
                                 ▼
                         ✅ LOGGED OUT
```

## Data Flow - Header Display

```
┌──────────────────────────────────┐
│ /api/admin/auth/me Response      │
│                                  │
│ {                                │
│   "id": "uuid-123",              │
│   "email": "admin@ex.com",       │
│   "full_name": "Admin User",     │
│   "profile_picture": "https://...",
│   "cover_image": "https://...",  │
│   "role": "admin",               │
│   "is_active": true,             │
│   "created_at": "2025-12-21"     │
│ }                                │
└────────────┬─────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ AdminHeader Component          │
    │                                │
    │ fetchAdminData() receives data │
    │ (handles both flat & nested)   │
    │                                │
    │ const adminData = data.admin   │
    │                || data;        │
    │                                │
    │ setAdminData({                 │
    │   id, email, full_name,        │
    │   profile_picture              │
    │ })                             │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ Render in Dropdown Menu        │
    │                                │
    │ <Avatar>                       │
    │   <AvatarImage                 │
    │     src={profile_picture} />   │
    │   <AvatarFallback>A</...>      │
    │ </Avatar>                      │
    │                                │
    │ <div>                          │
    │   <p>{full_name}</p>           │
    │   <p>{email}</p>               │
    │ </div>                         │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ DISPLAY                        │
    │                                │
    │ [Admin Profile Picture] ▼      │
    │ Admin User                     │
    │ admin@example.com              │
    │ ─────────────────────          │
    │ Profile                        │
    │ Settings                       │
    │ ─────────────────────          │
    │ Logout                         │
    └────────────────────────────────┘
```

## Separation Benefits

```
BEFORE (if using users table):
┌─────────────────────────────────────┐
│ USERS TABLE                         │
├─────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐ │
│ │ Regular User │  │ Admin User   │ │ ← Mixed!
│ │ is_admin=F   │  │ is_admin=T   │ │
│ └──────────────┘  └──────────────┘ │
│                                     │
│ Issues:                            │
│ ✗ Can query admins by accident    │
│ ✗ Different permission logic      │
│ ✗ Harder to manage                │
│ ✗ Performance issues              │
└─────────────────────────────────────┘

AFTER (with separate admins table):
┌─────────────────────────────────────┐
│ DATABASE                            │
├─────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐ │
│ │ USERS TABLE  │  │ ADMINS TABLE │ │ ← Separated!
│ │              │  │              │ │
│ │ Regular user │  │ Admin user   │ │
│ │ is_admin=F   │  │ role=admin   │ │
│ │ (millions)   │  │ (dozens)     │ │
│ └──────────────┘  └──────────────┘ │
│                                     │
│ Benefits:                           │
│ ✓ Complete separation              │
│ ✓ Different auth logic            │
│ ✓ Easy to manage                  │
│ ✓ Better performance              │
│ ✓ Clear permissions               │
│ ✓ Security isolation              │
└─────────────────────────────────────┘
```

## Summary

✅ **Separation** - Admins in separate table
✅ **Security** - Different auth logic and permissions
✅ **Performance** - Smaller admin table, better queries
✅ **Clarity** - Clear role definition
✅ **Scalability** - Easy to add new admin features

**Status: PRODUCTION READY**
