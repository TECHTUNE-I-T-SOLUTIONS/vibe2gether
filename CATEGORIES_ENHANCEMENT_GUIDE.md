# Enhanced Marketplace Categories - Implementation Guide

## Overview

This guide explains the new enhanced category system for Vibe2Gether marketplace, services, and events. The system now includes:

- ✅ **Product Categories** (11 categories for marketplace)
- ✅ **Service Categories** (10 professional services)
- ✅ **Restaurant Categories** (10 dining types)
- ✅ **Event Categories** (8 event types)
- ✅ **Sub-categories** for events (Food/Drink types)
- ✅ **Helper functions** for validation and display

---

## New Categories

### Product Categories (Marketplace)

```
1. Gifts & Experiences      🎁
2. Restaurants & Dining     🍽️
3. Professional Services    💼
4. Beauty & Wellness        ❤️
5. Entertainment            🎵
6. Photography & Media      📷
7. Education & Coaching     📚
8. Fitness & Sports         💪
9. Electronics & Tech       ⚡
10. Home & Garden           🏠
11. Other                   📦
```

### Service Categories (NEW)

```
1. Consulting             - Business & career guidance
2. Freelance Work        - Design, writing, programming
3. Tutoring & Coaching   - Academic and skill training
4. Personal Training     - Fitness and wellness
5. Photography Services  - Professional photos & videos
6. Event Planning        - Birthday, wedding, corporate
7. Cleaning Services     - Home and office cleaning
8. Repair & Maintenance  - Home, auto, and tech repairs
9. Travel Planning       - Tour guides and travel services
10. Other Services        - Other professional services
```

### Restaurant Categories (NEW)

```
1. Fine Dining           - Upscale dining experience
2. Casual Dining         - Relaxed restaurant setting
3. Fast Casual           - Quick service quality meals
4. Quick Service         - Fast food and quick bites
5. Café & Bakery         - Coffee and pastries
6. Bar & Lounge          - Drinks and cocktails
7. Food Truck            - Mobile food service
8. Catering Service      - Food for events
9. Ethnic Cuisine        - International & fusion food
10. Other Dining         - Other food establishments
```

### Event Categories

```
1. Concert & Music       🎵
2. Conference & Seminar  👥
3. Festival & Fair       ✨
4. Workshop & Class      📚
5. Social Gathering      ❤️
6. Sports Event          💪
7. Networking Event      💼
8. Other Event           ⭐
```

### Event Food/Drink Types (Sub-categories)

```
1. Local Cuisine         - Traditional dishes
2. International         - Global cuisines
3. Vegetarian/Vegan      - Plant-based options
4. Seafood              - Fresh seafood dishes
5. BBQ & Grilled        - Grilled specialties
6. Desserts & Sweets    - Sweet treats
7. Drinks Only          - Beverages only
8. Cocktails & Mocktails - Mixed drinks
9. Mixed Menu           - Various options
10. Other               - Other food types
```

---

## File Location

`lib/categories-config.ts`

---

## How to Use

### Import Configuration

```typescript
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  RESTAURANT_CATEGORIES,
  EVENT_CATEGORIES,
  EVENT_FOOD_TYPES,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  isValidProductCategory,
} from "@/lib/categories-config"
```

### In Product Creation Form

```tsx
import { PRODUCT_CATEGORIES } from "@/lib/categories-config"

export function ProductForm() {
  const [category, setCategory] = useState("")

  return (
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_CATEGORIES.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### Display Category with Icon and Color

```tsx
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from "@/lib/categories-config"
import { PRODUCT_CATEGORIES } from "@/lib/categories-config"

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const Icon = getCategoryIcon(categoryId, PRODUCT_CATEGORIES)
  const label = getCategoryLabel(categoryId, PRODUCT_CATEGORIES)
  const color = getCategoryColor(categoryId, PRODUCT_CATEGORIES)

  return (
    <div className={`${color} px-3 py-1 rounded-full flex items-center gap-2`}>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </div>
  )
}
```

### Validate Category

```typescript
import { isValidProductCategory, isValidServiceCategory } from "@/lib/categories-config"

// Check if category is valid
if (!isValidProductCategory(formData.category)) {
  throw new Error("Invalid product category")
}

if (!isValidServiceCategory(formData.category)) {
  throw new Error("Invalid service category")
}
```

### Get Category Details

```typescript
import { getCategoryById, PRODUCT_CATEGORIES } from "@/lib/categories-config"

const category = getCategoryById("restaurants", PRODUCT_CATEGORIES)
console.log(category.label) // "Restaurants & Dining"
console.log(category.icon)  // Utensils icon
console.log(category.color) // "bg-orange-100 dark:bg-orange-900"
```

### Filter Categories

```typescript
import { filterCategories, PRODUCT_CATEGORIES } from "@/lib/categories-config"

const searchResults = filterCategories("food", PRODUCT_CATEGORIES)
// Returns: [{ id: "restaurants", label: "Restaurants & Dining", ... }]
```

---

## Update Existing Code

### Before (Old Categories)

```tsx
const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Art & Crafts",
  "Services",
  "Other",
]
```

### After (New Categories)

```tsx
import { PRODUCT_CATEGORIES } from "@/lib/categories-config"

// Or use specific type
import { SERVICE_CATEGORIES, RESTAURANT_CATEGORIES } from "@/lib/categories-config"

// Use in forms:
{PRODUCT_CATEGORIES.map((cat) => (
  <option key={cat.id} value={cat.id}>{cat.label}</option>
))}
```

---

## Files to Update

### 1. Product Management Page
**File:** `app/dashboard/marketplace/manage/page.tsx`

```typescript
// OLD
const CATEGORIES = [
  "Electronics",
  "Fashion",
  // ...
]

// NEW
import { PRODUCT_CATEGORIES } from "@/lib/categories-config"

const CATEGORIES = PRODUCT_CATEGORIES.map((cat) => cat.label)
```

### 2. Marketplace Display Page
**File:** `app/marketplace/page.tsx`

```typescript
// OLD
const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gifts", label: "Gifts", icon: Gift },
  // ...
]

// NEW
import { PRODUCT_CATEGORIES } from "@/lib/categories-config"

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  ...PRODUCT_CATEGORIES,
]
```

### 3. Event Creation Page
**File:** `app/events/create/page.tsx` or similar

```typescript
import { EVENT_CATEGORIES, EVENT_FOOD_TYPES } from "@/lib/categories-config"

export function EventForm() {
  const [eventType, setEventType] = useState("")
  const [foodType, setFoodType] = useState("")

  return (
    <>
      {/* Event Type */}
      <Select value={eventType} onValueChange={setEventType}>
        <SelectTrigger>
          <SelectValue placeholder="Select event type" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_CATEGORIES.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Food Type (for dining/event with food) */}
      <Select value={foodType} onValueChange={setFoodType}>
        <SelectTrigger>
          <SelectValue placeholder="Select food type" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_FOOD_TYPES.map((food) => (
            <SelectItem key={food.id} value={food.id}>
              {food.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
```

### 4. Admin Dashboard (If needed)
**File:** `app/admin/marketplace/page.tsx`

```typescript
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  getCategoryLabel,
  getCategoryIcon,
} from "@/lib/categories-config"

// Show categories in filters/dropdowns
```

---

## Styling with Category Colors

Each category has a color scheme:

```typescript
// Using category colors in components
import { getCategoryColor } from "@/lib/categories-config"

export function ProductCard({ product }) {
  const bgColor = getCategoryColor(product.category)

  return (
    <div className={bgColor}>
      {/* Card content */}
    </div>
  )
}
```

### Available Colors

| Category | Color Class |
|----------|------------|
| Gifts | `bg-pink-100 dark:bg-pink-900` |
| Restaurants | `bg-orange-100 dark:bg-orange-900` |
| Services | `bg-blue-100 dark:bg-blue-900` |
| Beauty | `bg-red-100 dark:bg-red-900` |
| Entertainment | `bg-purple-100 dark:bg-purple-900` |
| Photography | `bg-amber-100 dark:bg-amber-900` |
| Education | `bg-green-100 dark:bg-green-900` |
| Fitness | `bg-cyan-100 dark:bg-cyan-900` |
| Electronics | `bg-indigo-100 dark:bg-indigo-900` |
| Home | `bg-lime-100 dark:bg-lime-900` |
| Other | `bg-gray-100 dark:bg-gray-900` |

---

## Database Considerations

If you're storing categories in the database:

```sql
-- Add category columns if not already present
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS food_type VARCHAR(50);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
```

### Example Queries

```sql
-- Get all products in a category
SELECT * FROM marketplace_products WHERE category = 'restaurants';

-- Count products by category
SELECT category, COUNT(*) FROM marketplace_products GROUP BY category;

-- Get popular categories
SELECT category, COUNT(*) as count 
FROM marketplace_products 
GROUP BY category 
ORDER BY count DESC;
```

---

## Validation Examples

### Server-Side Validation (API Route)

```typescript
import { isValidProductCategory } from "@/lib/categories-config"

export async function POST(request: NextRequest) {
  const { category, title } = await request.json()

  // Validate category
  if (!isValidProductCategory(category)) {
    return NextResponse.json(
      { error: "Invalid product category" },
      { status: 400 }
    )
  }

  // Continue with product creation
}
```

### Client-Side Validation (Form)

```typescript
import { isValidProductCategory } from "@/lib/categories-config"

function handleSubmit(data) {
  if (!isValidProductCategory(data.category)) {
    setError("Please select a valid category")
    return
  }

  // Submit form
}
```

---

## Migration Guide

If you're updating from old category system:

### Step 1: Backup Data

```sql
-- Backup existing data
CREATE TABLE marketplace_products_backup AS 
SELECT * FROM marketplace_products;
```

### Step 2: Add New Category Column

```sql
ALTER TABLE marketplace_products 
ADD COLUMN new_category VARCHAR(50);
```

### Step 3: Map Old to New Categories

```sql
UPDATE marketplace_products 
SET new_category = CASE 
  WHEN category = 'Electronics' THEN 'electronics'
  WHEN category = 'Fashion' THEN 'gifts'
  WHEN category = 'Home & Garden' THEN 'home'
  WHEN category = 'Sports & Outdoors' THEN 'fitness'
  WHEN category = 'Books' THEN 'education'
  WHEN category = 'Art & Crafts' THEN 'gifts'
  WHEN category = 'Services' THEN 'services'
  ELSE 'other'
END;
```

### Step 4: Verify

```sql
SELECT category, new_category, COUNT(*) 
FROM marketplace_products 
GROUP BY category, new_category;
```

### Step 5: Replace Old Column

```sql
-- After verification, drop old column and rename
ALTER TABLE marketplace_products DROP COLUMN category;
ALTER TABLE marketplace_products RENAME COLUMN new_category TO category;
```

---

## Testing Categories

### Test Validation

```typescript
import { isValidProductCategory } from "@/lib/categories-config"

// Should be true
console.log(isValidProductCategory("restaurants")) // true
console.log(isValidProductCategory("services")) // true

// Should be false
console.log(isValidProductCategory("invalid")) // false
console.log(isValidProductCategory("")) // false
```

### Test Filtering

```typescript
import { filterCategories, PRODUCT_CATEGORIES } from "@/lib/categories-config"

const results = filterCategories("food", PRODUCT_CATEGORIES)
console.log(results) // [{ id: "restaurants", label: "Restaurants & Dining", ... }]
```

### Test Display

```typescript
import { getCategoryLabel, getCategoryIcon } from "@/lib/categories-config"

const label = getCategoryLabel("restaurants")
const Icon = getCategoryIcon("restaurants")

console.log(label) // "Restaurants & Dining"
console.log(Icon) // Utensils component
```

---

## Backward Compatibility

The system includes `LEGACY_CATEGORIES` for backward compatibility:

```typescript
import { LEGACY_CATEGORIES, CATEGORIES } from "@/lib/categories-config"

// Old array still available
console.log(LEGACY_CATEGORIES) // ["Electronics", "Fashion", ...]

// New array format
console.log(CATEGORIES) // ["electronics", "fashion", ...]
```

---

## Benefits

✅ **Consistency** - Same categories across products, services, events
✅ **Validation** - Built-in validation functions
✅ **Display** - Icons and colors for better UX
✅ **Scalability** - Easy to add more categories
✅ **Type-safe** - Full TypeScript support
✅ **Backward Compatible** - Works with existing code
✅ **Searchable** - Filter categories by name
✅ **Localization-ready** - Easy to translate labels

---

## Next Steps

1. ✅ Update `app/dashboard/marketplace/manage/page.tsx`
2. ✅ Update `app/marketplace/page.tsx`
3. ✅ Update `app/events/create/page.tsx`
4. ✅ Update `app/admin/marketplace/page.tsx`
5. ✅ Update `app/admin/events/page.tsx`
6. ✅ Test all category selections
7. ✅ Verify database queries
8. ✅ Test category filters and search

---

## File Reference

**Configuration File:** `lib/categories-config.ts`

**Available Exports:**
- `PRODUCT_CATEGORIES` - Products/marketplace categories
- `SERVICE_CATEGORIES` - Professional services
- `RESTAURANT_CATEGORIES` - Dining/restaurants
- `EVENT_CATEGORIES` - Event types
- `EVENT_FOOD_TYPES` - Food types for events
- `PRICE_RANGES` - Price categories
- `DIFFICULTY_LEVELS` - Class/workshop difficulty
- `getCategoryById()` - Get category object
- `getCategoryLabel()` - Get category label
- `getCategoryIcon()` - Get icon component
- `getCategoryColor()` - Get color classes
- `filterCategories()` - Search categories
- `isValidProductCategory()` - Validate product category
- `isValidEventCategory()` - Validate event category
- `isValidServiceCategory()` - Validate service category

---

**Status:** ✅ Ready to Deploy
**Last Updated:** December 2024
**Version:** 1.0
