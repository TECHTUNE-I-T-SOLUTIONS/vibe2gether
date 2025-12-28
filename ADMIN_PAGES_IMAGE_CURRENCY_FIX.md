# Admin Marketplace & Events Pages - Image & Currency Fix

## Summary
Fixed critical issues in admin marketplace and events pages:
1. Images/thumbnails not displaying
2. Product prices not showing currency
3. Pending approval events filtering incorrectly

## Changes Made

### 1. Admin Marketplace Page (`app/admin/marketplace/page.tsx`)

#### Image Display Fix
- **Problem**: Products were stored with images in a `media` JSON array field `[{"url": "...", "type": "image"}, ...]` but the code was looking for an `images` array
- **Solution**: Updated `ProductCard` component to:
  - Extract image URL from `media` array (first image)
  - Fallback to `images` array if `media` doesn't exist
  - Display first available image

```typescript
const imageUrl = product.media && Array.isArray(product.media) && product.media.length > 0
  ? product.media[0].url
  : product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : null
```

#### Currency Display Fix
- **Problem**: Price was showing as `$180000` but should show `NGN 180000` with actual currency
- **Solution**: Changed price display from `${product.price}` to `{product.currency} {product.price}`

#### Code Structure
- Changed `ProductCard` from arrow function to regular function for better closure handling
- Properly closed component with closing parenthesis and curly braces

---

### 2. Admin Events Page (`app/admin/events/page.tsx`)

#### Pending Events Query Fix
- **Problem**: Query was looking for `status: 'inactive'` but pending events are stored with `status: 'pending'`
- **Solution**: Changed query to:
  ```typescript
  .eq("status", "pending")  // Was: .eq("status", "inactive")
  ```

#### Thumbnail Display Fix
- **Problem**: Thumbnails not displaying because code looked for `thumbnail_url` but database has `thumbnail` field
- **Solution**: Updated `EventCard` component to:
  - Use `event.thumbnail` (direct URL from database)
  - Fallback to `event.thumbnail_url` if needed
  - Extract URL properly

```typescript
const thumbnailUrl = event.thumbnail || event.thumbnail_url
```

#### Location Field Fix
- Updated to use correct database field: `event.location_name` with fallback to `event.location`

#### Code Structure
- Changed `EventCard` from arrow function to regular function
- Properly closed component with closing parenthesis and curly braces

---

## Database Field Reference

### Marketplace Products Table
- **images storage**: `media` field - JSON array of objects: `[{"url": "...", "type": "image"}, ...]`
- **currency**: `currency` field - e.g., "NGN", "USD"
- **price**: `price` field - numeric value

### Events Table
- **thumbnail**: `thumbnail` field - direct URL string
- **location**: `location_name` field (not `location`)
- **status**: 
  - `'upcoming'` - Admin events
  - `'pending'` - Pending approval events
  - `'inactive'` - Inactive events
  - `'rejected'` - Rejected events

---

## Testing Checklist

- [ ] Admin marketplace shows all uploaded product images
- [ ] Product prices display with correct currency (e.g., "NGN 180000")
- [ ] "Pending Approvals" tab shows only pending products
- [ ] "All Products" tab shows all products except rejected
- [ ] Admin events shows event thumbnails
- [ ] "Pending Approvals" tab shows pending events only
- [ ] Event location displays correctly
- [ ] Event prices show currency prefix

---

## Files Modified
1. `app/admin/marketplace/page.tsx` - Image extraction and currency display
2. `app/admin/events/page.tsx` - Pending status query and thumbnail display

## No Build Errors
- Events page: ✅ No errors
- Marketplace page: ✅ No syntax errors (some accessibility warnings remain)
