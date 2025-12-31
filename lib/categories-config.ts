// Enhanced Marketplace & Events Categories Configuration
// Used across products, events, and services

import {
  ShoppingBag,
  Utensils,
  Briefcase,
  Heart,
  Music,
  Camera,
  BookOpen,
  Dumbbell,
  Zap,
  Home,
  Users,
  MapPin,
  Star,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

// ============================================================
// PRODUCT CATEGORIES (Marketplace)
// ============================================================

export const PRODUCT_CATEGORIES = [
  { id: "gifts", label: "Gifts & Experiences", icon: Gift, color: "bg-pink-100 dark:bg-pink-900" },
  { id: "restaurants", label: "Restaurants & Dining", icon: Utensils, color: "bg-orange-100 dark:bg-orange-900" },
  { id: "services", label: "Professional Services", icon: Briefcase, color: "bg-blue-100 dark:bg-blue-900" },
  { id: "beauty", label: "Beauty & Wellness", icon: Heart, color: "bg-red-100 dark:bg-red-900" },
  { id: "entertainment", label: "Entertainment", icon: Music, color: "bg-purple-100 dark:bg-purple-900" },
  { id: "photography", label: "Photography & Media", icon: Camera, color: "bg-amber-100 dark:bg-amber-900" },
  { id: "education", label: "Education & Coaching", icon: BookOpen, color: "bg-green-100 dark:bg-green-900" },
  { id: "fitness", label: "Fitness & Sports", icon: Dumbbell, color: "bg-cyan-100 dark:bg-cyan-900" },
  { id: "electronics", label: "Electronics & Tech", icon: Zap, color: "bg-indigo-100 dark:bg-indigo-900" },
  { id: "home", label: "Home & Garden", icon: Home, color: "bg-lime-100 dark:bg-lime-900" },
  { id: "other", label: "Other", icon: ShoppingBag, color: "bg-gray-100 dark:bg-gray-900" },
]

// ============================================================
// SERVICE CATEGORIES (For professional services)
// ============================================================

export const SERVICE_CATEGORIES = [
  { id: "consulting", label: "Consulting", description: "Business & career guidance" },
  { id: "freelance", label: "Freelance Work", description: "Design, writing, programming" },
  { id: "tutoring", label: "Tutoring & Coaching", description: "Academic and skill training" },
  { id: "personal-training", label: "Personal Training", description: "Fitness and wellness" },
  { id: "photography", label: "Photography Services", description: "Professional photos & videos" },
  { id: "event-planning", label: "Event Planning", description: "Birthday, wedding, corporate" },
  { id: "cleaning", label: "Cleaning Services", description: "Home and office cleaning" },
  { id: "repairs", label: "Repair & Maintenance", description: "Home, auto, and tech repairs" },
  { id: "travel", label: "Travel Planning", description: "Tour guides and travel services" },
  { id: "other", label: "Other Services", description: "Other professional services" },
]

// ============================================================
// RESTAURANT CATEGORIES (For dining/food events)
// ============================================================

export const RESTAURANT_CATEGORIES = [
  { id: "fine-dining", label: "Fine Dining", description: "Upscale dining experience" },
  { id: "casual", label: "Casual Dining", description: "Relaxed restaurant setting" },
  { id: "fast-casual", label: "Fast Casual", description: "Quick service quality meals" },
  { id: "quick-service", label: "Quick Service", description: "Fast food and quick bites" },
  { id: "cafe", label: "Café & Bakery", description: "Coffee and pastries" },
  { id: "bar-lounge", label: "Bar & Lounge", description: "Drinks and cocktails" },
  { id: "food-truck", label: "Food Truck", description: "Mobile food service" },
  { id: "catering", label: "Catering Service", description: "Food for events" },
  { id: "ethnic", label: "Ethnic Cuisine", description: "International & fusion food" },
  { id: "other", label: "Other Dining", description: "Other food establishments" },
]

// ============================================================
// EVENT CATEGORIES
// ============================================================

export const EVENT_CATEGORIES = [
  { id: "concert", label: "Concert & Music", icon: Music },
  { id: "conference", label: "Conference & Seminar", icon: Users },
  { id: "festival", label: "Festival & Fair", icon: Sparkles },
  { id: "workshop", label: "Workshop & Class", icon: BookOpen },
  { id: "social", label: "Social Gathering", icon: Heart },
  { id: "sports", label: "Sports Event", icon: Dumbbell },
  { id: "networking", label: "Networking Event", icon: Briefcase },
  { id: "other", label: "Other Event", icon: Star },
]

// ============================================================
// EVENT FOOD/DRINK TYPES (Sub-categories for dining at events)
// ============================================================

export const EVENT_FOOD_TYPES = [
  { id: "local-cuisine", label: "Local Cuisine" },
  { id: "international", label: "International" },
  { id: "vegetarian", label: "Vegetarian/Vegan" },
  { id: "seafood", label: "Seafood" },
  { id: "bbq", label: "BBQ & Grilled" },
  { id: "desserts", label: "Desserts & Sweets" },
  { id: "drinks-only", label: "Drinks Only" },
  { id: "cocktails", label: "Cocktails & Mocktails" },
  { id: "mixed", label: "Mixed Menu" },
  { id: "other", label: "Other" },
]

// ============================================================
// LOCATION TYPES (Where events/services happen)
// ============================================================

export const LOCATION_TYPES = [
  { id: "virtual", label: "Virtual/Online", icon: Zap },
  { id: "in-person", label: "In-Person", icon: MapPin },
  { id: "hybrid", label: "Hybrid (Both)", icon: Star },
]

// ============================================================
// PRICE RANGES
// ============================================================

export const PRICE_RANGES = [
  { id: "budget", label: "Budget (< ₦5,000)", min: 0, max: 5000 },
  { id: "moderate", label: "Moderate (₦5,000 - ₦15,000)", min: 5000, max: 15000 },
  { id: "mid-range", label: "Mid-Range (₦15,000 - ₦50,000)", min: 15000, max: 50000 },
  { id: "upscale", label: "Upscale (₦50,000 - ₦100,000)", min: 50000, max: 100000 },
  { id: "luxury", label: "Luxury (> ₦100,000)", min: 100000, max: Infinity },
]

// ============================================================
// DIFFICULTY LEVELS (For workshops/classes)
// ============================================================

export const DIFFICULTY_LEVELS = [
  { id: "beginner", label: "Beginner", description: "No experience needed" },
  { id: "intermediate", label: "Intermediate", description: "Some experience required" },
  { id: "advanced", label: "Advanced", description: "Advanced skills needed" },
  { id: "all-levels", label: "All Levels", description: "Everyone welcome" },
]

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get category by ID from any category list
 */
export function getCategoryById(
  categoryId: string,
  list: Array<any> = PRODUCT_CATEGORIES
): any {
  return list.find((cat) => cat.id === categoryId)
}

/**
 * Get category label
 */
export function getCategoryLabel(
  categoryId: string,
  list: Array<any> = PRODUCT_CATEGORIES
): string {
  const category = getCategoryById(categoryId, list)
  return category?.label || "Other"
}

/**
 * Get category icon component
 */
export function getCategoryIcon(
  categoryId: string,
  list: Array<any> = PRODUCT_CATEGORIES
): LucideIcon | null {
  const category = getCategoryById(categoryId, list)
  return category?.icon || null
}

/**
 * Get category color
 */
export function getCategoryColor(
  categoryId: string,
  list: Array<any> = PRODUCT_CATEGORIES
): string {
  const category = getCategoryById(categoryId, list)
  return category?.color || "bg-gray-100 dark:bg-gray-900"
}

/**
 * Filter categories by search
 */
export function filterCategories(
  search: string,
  list: Array<any> = PRODUCT_CATEGORIES
): Array<any> {
  const query = search.toLowerCase()
  return list.filter(
    (cat) =>
      cat.label.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
  )
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Check if category is valid for product type
 */
export function isValidProductCategory(categoryId: string): boolean {
  return PRODUCT_CATEGORIES.some((cat) => cat.id === categoryId)
}

/**
 * Check if category is valid for event type
 */
export function isValidEventCategory(categoryId: string): boolean {
  return EVENT_CATEGORIES.some((cat) => cat.id === categoryId)
}

/**
 * Check if category is valid for service type
 */
export function isValidServiceCategory(categoryId: string): boolean {
  return SERVICE_CATEGORIES.some((cat) => cat.id === categoryId)
}

// ============================================================
// LEGACY COMPATIBILITY
// ============================================================

// For backwards compatibility with existing code
export const CATEGORIES = PRODUCT_CATEGORIES.map((cat) => cat.id)
export const LEGACY_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Art & Crafts",
  "Services",
  "Other",
]

export default {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  RESTAURANT_CATEGORIES,
  EVENT_CATEGORIES,
  EVENT_FOOD_TYPES,
  LOCATION_TYPES,
  PRICE_RANGES,
  DIFFICULTY_LEVELS,
  getCategoryById,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  filterCategories,
  isValidProductCategory,
  isValidEventCategory,
  isValidServiceCategory,
}
