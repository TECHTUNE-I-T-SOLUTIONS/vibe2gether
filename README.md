# Vibe2Gether

A modern, feature-rich dating and social connection platform built with cutting-edge web technologies. Connect with people, find matches, and build meaningful relationships in a safe and inclusive community.

## 🚀 Features

### Core Features
- **User Authentication** - Secure sign-up and login with NextAuth.js (Google OAuth & credentials)
- **Profile Management** - Create and customize your profile with photos, bio, and interests
- **Smart Matching Algorithm** - Find compatible matches based on interests and vibe score
- **Real-time Messaging** - Chat with matches and connections instantly
- **Activity Feed** - See likes, follows, and interactions from other users
- **Notifications** - Real-time alerts for messages, likes, matches, and more

### Discovery Features
- **Explore Page** - Discover new profiles with filtering and sorting options
- **Events Discovery** - Find and join local dating and social events
- **Blog Section** - Read dating tips, relationship advice, and community stories
- **Marketplace** - Buy and sell items within the community

### Safety & Trust
- **Report System** - Flag inappropriate behavior or accounts
- **Safety Guidelines** - Community standards and best practices
- **Privacy Controls** - Manage who can see your profile and data
- **Verification Badge** - Build trust with profile verification

### User Engagement
- **Coin System** - Earn and spend coins for premium features
- **Premium Membership** - Unlock advanced features and unlimited messaging
- **Saved Profiles** - Bookmark profiles to review later
- **Match History** - Keep track of past matches and connections

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.0.7 with Turbopack
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom animations
- **UI Components:** Shadcn/ui (customizable React components)
- **State Management:** React Hooks (useState, useContext)
- **Authentication:** NextAuth.js with Google OAuth

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes
- **Database:** PostgreSQL (via Prisma ORM)
- **Real-time:** WebSockets for messaging (planned)

### Developer Experience
- **Build Tool:** Turbopack (fast build times)
- **Linting:** ESLint
- **Styling:** PostCSS with Tailwind CSS
- **Package Manager:** pnpm

### Infrastructure
- **Hosting:** Vercel (recommended for Next.js)
- **Database Hosting:** Supabase or AWS RDS
- **Authentication:** NextAuth.js with Supabase PostgreSQL

## 📋 Project Structure

```
vibe2gether/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── posts/                # Post management
│   │   ├── users/                # User endpoints
│   │   └── dashboard/            # Dashboard API
│   ├── dashboard/                # Dashboard pages (protected)
│   │   ├── feed/                 # User feed
│   │   ├── matches/              # Match management
│   │   ├── messages/             # Messaging
│   │   ├── notifications/        # Notifications
│   │   ├── profile/              # User profile
│   │   ├── saved/                # Saved profiles
│   │   ├── settings/             # Settings
│   │   └── wallet/               # Coin wallet
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── blog/                     # Blog pages
│   ├── events/                   # Events discovery
│   ├── explore/                  # Profile exploration
│   ├── marketplace/              # Marketplace
│   ├── admin/                    # Admin dashboard
│   └── page.tsx                  # Homepage
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   ├── dashboard/                # Dashboard-specific components
│   ├── admin/                    # Admin components
│   └── [feature]/                # Feature components
├── lib/                          # Utility functions
│   ├── auth.ts                   # Auth utilities
│   ├── coins.ts                  # Coin system logic
│   ├── utils.ts                  # General utilities
│   ├── i18n/                     # Internationalization
│   ├── providers/                # React providers
│   └── supabase/                 # Database utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
│   ├── videos/                   # Video files
│   └── [images]/                 # Images and icons
├── scripts/                      # Database migration scripts
├── styles/                       # Global styles
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+ (or npm/yarn)
- PostgreSQL database (local or cloud)
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TECHTUNE-I-T-SOLUTIONS/vibe2gether.git
   cd vibe2gether
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/vibe2gether"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Optional: Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
   ```

4. **Set up the database**
   ```bash
   # Run Prisma migrations
   npx prisma migrate dev
   
   # (Optional) Seed initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Database
npx prisma studio    # Open Prisma Studio for database management
npx prisma migrate   # Run pending migrations

# Linting
pnpm lint            # Run ESLint

# Type Checking
pnpm type-check      # Check TypeScript types
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key tables include:

- **users** - User profiles and authentication
- **posts** - User posts and content
- **matches** - Match pairings and compatibility scores
- **messages** - Direct messages between users
- **notifications** - User notifications for interactions
- **coins_transactions** - Coin economy transactions
- **follows** - User follow relationships
- **engagement** - Likes, comments, and interactions

See `scripts/` directory for individual table creation SQL.

## 🔐 Authentication

Uses NextAuth.js with two authentication methods:

1. **Google OAuth** - Single sign-on with Google
2. **Credentials** - Email/password authentication

Session management handles JWT tokens and user data. Protected routes require valid sessions via middleware.

## 🎨 Styling & Design

- **Tailwind CSS** - Utility-first CSS framework
- **Custom Theme** - Gradient colors, custom animations
- **Responsive Design** - Mobile-first approach (sm, md, lg, xl breakpoints)
- **Dark Mode** - Full dark/light theme support via next-themes
- **Animations** - Smooth transitions and entrance effects

## 📱 Responsive Layout

- **Mobile** - Optimized for small screens with drawer navigation
- **Tablet** - Medium-sized layouts with flexible grids
- **Desktop** - Full-featured layout with sidebar navigation

## 🌍 Internationalization (i18n)

Supports multiple languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)

Language switching available in header and settings.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signout` - Sign out user

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `GET /api/users/search` - Search users

### Dashboard
- `POST /api/dashboard/stats` - Get dashboard statistics

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details

### Matches
- `GET /api/matches` - Get user matches
- `POST /api/matches` - Create match
- `PATCH /api/matches/:id` - Update match status

## 🚧 Development Status

- [x] User authentication (Google OAuth + credentials)
- [x] Profile management UI
- [x] Dashboard layout and navigation
- [x] Mobile responsive design
- [x] Theme switching (dark/light)
- [x] Internationalization setup
- [x] Logout confirmation modal
- [ ] Database integration for dashboard stats
- [ ] Messaging system
- [ ] Match algorithm
- [ ] Real-time notifications
- [ ] Admin dashboard
- [ ] Payment integration for premium

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the team at support@vibe2gether.com
- Join our Discord community

## 👥 Team

**TECHTUNE IT SOLUTIONS** - Developing modern, scalable web applications

## 🔗 Links

- **Live Demo:** https://vibe2gether.com (coming soon)
- **Documentation:** https://docs.vibe2gether.com (coming soon)
- **GitHub:** https://github.com/TECHTUNE-I-T-SOLUTIONS/vibe2gether
- **Issues:** https://github.com/TECHTUNE-I-T-SOLUTIONS/vibe2gether/issues

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)

---

**Made with ❤️ by TECHTUNE IT SOLUTIONS**
