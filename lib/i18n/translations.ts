export type Locale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "zh"
  | "ja"
  | "ko"
  | "ar"
  | "hi"
  | "ru"
  | "it"
  | "nl"
  | "pl"
  | "tr"
  | "vi"
  | "th"
  | "id"
  | "ms"
  | "tl"
  | "sv"
  | "no"
  | "da"
  | "fi"
  | "cs"
  | "el"
  | "he"
  | "uk"
  | "ro"
  | "hu"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "sw"
  | "am"

export const locales: { code: Locale; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "el", name: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "עברית", flag: "🇮🇱" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Magyar", flag: "🇭🇺" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "am", name: "አማርኛ", flag: "🇪🇹" },
]

// Base translations (English)
const baseTranslations = {
  // Navigation
  home: "Home",
  explore: "Explore",
  marketplace: "Marketplace",
  events: "Events",
  about: "About",
  contact: "Contact",
  dashboard: "Dashboard",
  feed: "Feed",
  messages: "Messages",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
  wallet: "Wallet",
  signIn: "Sign In",
  signUp: "Sign Up",
  signOut: "Sign Out",
  getStarted: "Get Started",
  features: "Features",
  testimonials: "Testimonials",
  premium: "Premium",
  blog: "Blog",
  network: "Network",
  connections: "Connections",
  opportunities: "Opportunities",
  learn: "Learn & Grow",
  networkDescription: "Build meaningful professional connections and expand your network",
  heroTitle: "Connect, Build & Grow Together",
  heroSubtitle: "Join Africa's premier platform for entrepreneurs, professionals, and innovators. Network, find opportunities, and take your career or business to the next level.",
  getStartedForFree: "Get Started For Free",
  fullName: "Full Name",
  emailAddress: "Email Address",
  password: "Password",
  joinNow: "Join Now",
  alreadyHaveAccount: "Already have an account?",
  networkStepTitle: "Network",
  networkStepDesc: "Connect with like-minded professionals. Build partnerships and expand your reach.",
  findOppsStepTitle: "Find Opportunities",
  findOppsStepDesc: "Discover jobs, internships, funding and business opportunities tailored for you.",
  learnGrowStepTitle: "Learn & Grow",
  learnGrowStepDesc: "Access resources and events to help you develop your skills and business.",
  exploreOpps: "Explore Opportunities",
  viewAll: "View All",
  successStories: "Success Stories",
  readMoreStories: "Read More Stories",
  getAppTitle: "Vibe2Gether on your phone",
  getAppDesc: "Download our mobile app to stay connected, get real-time notifications, and explore opportunities on the go.",
  downloadOnAppStore: "Download on App Store",
  downloadOnPlayStore: "Download on Play Store",

  // Hero
  findYourPerfect: "Vibe Together",
  matchToday: "Start Connecting",
  heroBadge: "Join and meet other people — meet, sell, create events, post & trade",
  heroDescription: "Discover people, create events, buy & sell, post content, earn coins, and boost recognition — Vibe2Gether is a social app for everyone.",
  startYourJourney: "Start Your Journey",
  watchHowItWorks: "Watch How It Works",
  activeUsers: "Active Users",
  countries: "Countries",
  matchesDaily: "Matches Daily",
  appRating: "App Rating",

  // Features
  everythingYouNeed: "Everything You Need to",
  toConnect: "Connect & Explore",
  featuresDescription: "From connecting with people to discovering amazing products, Vibe2Gether brings it all together in one beautiful platform.",
  smartMatching: "Smart Matching",
  smartMatchingDesc: "Our AI-powered algorithm helps you find compatible connections based on interests, values, and compatibility.",
  discoverPeople: "Discover People",
  discoverPeopleDesc: "Explore millions of profiles from around the world. Filter by location, interests, and more.",
  marketplaceDesc: "Shop unique items, services, and experiences. From gifts to exclusive items.",
  createEvents: "Create Events",
  createEventsDesc: "Host and discover meetups, parties, and local experiences.",
  boosts: "Boosts",
  boostsDesc: "Increase your profile visibility with one-time boosts.",
  buyCoins: "Buy Coins",
  buyCoinsDesc: "Purchase coins to promote your posts and send gifts.",
  realTimeChat: "Real-time Chat",
  realTimeChatDesc: "Connect instantly with connections. Send messages, voice notes, GIFs, and more.",
  smartNotifications: "Smart Notifications",
  smartNotificationsDesc: "Never miss a match, message, or event. Stay updated with personalized alerts.",
  earnRedeem: "Earn & Redeem",
  earnRedeemDesc: "Earn coins from engagement and convert them to real rewards or premium features.",
  multiLanguage: "Multi-language",
  multiLanguageDesc: "Available in 40+ languages. Connect globally with people from around the world.",
  safeSecure: "Safe & Secure",
  safeSecureDesc: "Your privacy matters. Verified profiles, secure messaging, and 24/7 moderation.",

  // Profiles/Discover
  discoverProfiles: "Meet",
  amazingPeople: "Interesting People",
  discoverDescription: "Discover profiles from around the world. Your next connection awaits.",

  // Testimonials
  loveStories: "Success Stories from",
  ourCommunity: "Our Community",
  testimonialDescription: "Real connections, real stories. See what our members have to say about their Vibe2Gether experience.",

  // Auth Pages
  loginDescription: "Sign in to continue your journey to connecting with people.",
  joinCommunity: "Join other People Connecting Together",
  signupDescription: "Create your free account and start your journey to meaningful connections.",
  language: "Language",

  // Features
  featuresTitle: "Why Vibe2Gether?",

  // Profile
  editProfile: "Edit Profile",
  profileViews: "Profile Views",
  likesReceived: "Likes Received",
  followers: "Followers",
  following: "Following",
  coinsEarned: "Coins Earned",
  yourMatches: "Your Matches",
  recentActivity: "Recent Activity",

  // Coins
  coinBalance: "Coin Balance",
  earnCoins: "Earn Coins",
  withdraw: "Withdraw",
  convert: "Convert",
  viewsEarn: "views earn",
  likesEarn: "likes earn",
  followersEarn: "followers earn",
  coins: "coins",
  totalEarned: "Total Earned",
  transactions: "Transactions",

  // Feed
  createPost: "Create Post",
  whatsOnYourMind: "What's on your mind?",
  share: "Share",
  like: "Like",
  comment: "Comment",
  views: "views",
  save: "Save",
  report: "Report",
  delete: "Delete",
  copy: "Copy link",

  // Common
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  all: "All",
  verified: "Verified",
  online: "Online",
  offline: "Offline",
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  loading: "Loading...",
  error: "Error",
  success: "Success",
  cancel: "Cancel",
  confirm: "Confirm",
  save_changes: "Save Changes",
  close: "Close",

  // Admin
  adminDashboard: "Admin Dashboard",
  users: "Users",
  posts: "Posts",
  reports: "Reports",
  analytics: "Analytics",
  featuredRequests: "Featured Requests",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",

  // Auth
  welcomeBack: "Welcome back",
  createAccount: "Create your account",
  forgotPassword: "Forgot password?",
  rememberMe: "Remember me",
  noAccount: "Don't have an account?",
  hasAccount: "Already have an account?",
  confirmPassword: "Confirm Password",
  email: "Email",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  phoneNumber: "Phone Number",
  termsAgree: "I agree to the Terms of Service and Privacy Policy",
}

type TranslationKeys = keyof typeof baseTranslations

// Translations for all languages
export const translations: Record<Locale, Record<TranslationKeys, string>> = Object.fromEntries(
  Object.keys(locales.reduce((acc, l) => ({ ...acc, [l.code]: {} }), {})).map((lang) => [
    lang,
    { ...baseTranslations },
  ]),
) as Record<Locale, Record<TranslationKeys, string>>

// Override specific languages (keep existing ones but fixed)
translations.es = {
  ...baseTranslations,
  home: "Inicio",
  explore: "Explorar",
  marketplace: "Mercado",
  events: "Eventos",
  about: "Acerca de",
  contact: "Contacto",
  dashboard: "Panel",
  feed: "Feed",
  messages: "Mensajes",
  notifications: "Notificaciones",
  settings: "Configuración",
  profile: "Perfil",
  wallet: "Cartera",
  signIn: "Iniciar Sesión",
  signUp: "Registrarse",
  signOut: "Cerrar Sesión",
  getStarted: "Comenzar",
  features: "Características",
  testimonials: "Testimonios",
  premium: "Premium",
  blog: "Blog",
  heroTitle: "Conecte, Construya y Crezca Juntos",
  heroSubtitle: "Únase a la plataforma líder en África para emprendedores, profesionales e innovadores.",
  network: "Red",
}

translations.fr = {
  ...baseTranslations,
  home: "Accueil",
  explore: "Explorer",
  marketplace: "Marché",
  events: "Événements",
  about: "À propos",
  contact: "Contact",
  dashboard: "Tableau de bord",
  feed: "Fil",
  messages: "Messages",
  notifications: "Notifications",
  settings: "Paramètres",
  profile: "Profil",
  wallet: "Portefeuille",
  signIn: "Connexion",
  signUp: "Inscription",
  signOut: "Déconnexion",
  getStarted: "Commencer",
  features: "Fonctionnalités",
  testimonials: "Témoignages",
  premium: "Premium",
  blog: "Blog",
  heroTitle: "Connectez, construisez et grandissez ensemble",
  heroSubtitle: "Rejoignez la première plateforme africaine pour entrepreneurs, professionnels et innovateurs.",
  network: "Réseau",
}
