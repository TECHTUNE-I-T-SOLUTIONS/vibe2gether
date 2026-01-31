# 📍 WALLET PAGE - TRANSFER FEATURE LOCATION GUIDE

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                    Wallet Page                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          TOTAL BALANCE CARD                  │  │
│  │                                              │  │
│  │  Total Balance                               │  │
│  │  570 coins                                   │  │
│  │  ≈ $1.14 USD  ≈ ₦1,653 NGN  ≈ Fr667 XAF    │  │
│  │                                              │  │
│  │  [Verify] [Transfer] [Cash Out] [Buy Coins] │  │
│  │    ↑                                          │  │
│  │    NEW TRANSFER BUTTON ADDED HERE             │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Stats Cards (Earned/Spent)           │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Transactions / Withdrawals / Earn / etc.    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Transfer Button Details

### Location on Page:
- **Page:** `app/dashboard/wallet/page.tsx`
- **Component:** Balance Overview Card
- **Position:** Button row with Verify, Cash Out, Buy Coins
- **Icon:** Gift icon from lucide-react
- **Text:** "Transfer" (desktop) / "Send" (mobile)

### Button Styling:
```tsx
Button {
  variant: "secondary"
  className: "rounded-full bg-white/20 text-white hover:bg-white/30"
  onClick: () => setShowTransferModal(true)
}
```

## Modal Workflow

### Step 1: Search User
```
┌────────────────────────────────────┐
│  Transfer Coins                    │
│  Send coins to another user...     │
├────────────────────────────────────┤
│                                    │
│  Search User                       │
│  [🔍 Search by name or email...] │
│                                    │
│  Search Results:                   │
│  ┌──────────────────────────────┐ │
│  │ 👤 John Doe                  │ │ ← Click to select
│  │    john@example.com          │ │
│  ├──────────────────────────────┤ │
│  │ 👤 Jane Smith                │ │
│  │    jane@example.com          │ │
│  ├──────────────────────────────┤ │
│  │ 👤 Bob Johnson               │ │
│  │    bob@example.com           │ │
│  └──────────────────────────────┘ │
│                                    │
├────────────────────────────────────┤
│                 [Continue] (button) │
└────────────────────────────────────┘
```

### Step 2: Confirm & Enter Amount
```
┌────────────────────────────────────┐
│  Transfer Coins                    │
│  Send coins to another user...     │
├────────────────────────────────────┤
│                                    │
│  Selected Recipient:               │
│  ┌──────────────────────────────┐ │
│  │ 👤 John Doe                  │ │
│  │    john@example.com          │ │
│  └──────────────────────────────┘ │
│                                    │
│  Amount (coins)                    │
│  [    100               ]          │
│  You have 570 coins available      │
│                                    │
│  Message (Optional)                │
│  [Gift message......]             │
│                                    │
│  Transfer Summary:                 │
│  ┌──────────────────────────────┐ │
│  │ Recipient:  John Doe         │ │
│  │ Amount:     🪙 100 coins     │ │
│  │ After:      470 coins        │ │
│  └──────────────────────────────┘ │
│                                    │
├────────────────────────────────────┤
│  [Back]  [Send 100 Coins] (button) │
└────────────────────────────────────┘
```

## Files Modified/Created

### 1. Modified File: `app/dashboard/wallet/page.tsx`

**Lines Added/Changed:**
- **Line ~5:** Added import for TransferCoinsModal
- **Line ~95:** Added state `const [showTransferModal, setShowTransferModal] = useState(false)`
- **Lines ~545-553:** Added Transfer button in button row
- **Lines ~595-600:** Added TransferCoinsModal component

**Changes Summary:**
```tsx
// Import added
import { TransferCoinsModal } from "@/components/wallet/transfer-coins-modal"

// State added
const [showTransferModal, setShowTransferModal] = useState(false)

// Button added (between Verify and Cash Out buttons)
<Button 
  variant="secondary" 
  className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0 text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 flex-1 min-w-[80px] sm:flex-none"
  onClick={() => setShowTransferModal(true)}
>
  <Gift className="w-4 h-4 mr-1" />
  <span className="hidden sm:inline">Transfer</span>
  <span className="sm:hidden">Send</span>
</Button>

// Modal added
<TransferCoinsModal
  open={showTransferModal}
  onOpenChange={setShowTransferModal}
  userBalance={user?.coins_balance || 0}
  onTransferSuccess={() => window.location.reload()}
/>
```

### 2. New File: `components/wallet/transfer-coins-modal.tsx`

**Purpose:** Complete transfer modal component with two-step workflow

**Key Features:**
- Search step with real-time user search
- Confirm step with amount entry and summary
- Validation and error handling
- Loading states
- Toast notifications

**Props:**
```tsx
interface TransferCoinsModalProps {
  open: boolean                    // Modal visibility
  onOpenChange: (open: boolean) => void  // Control visibility
  userBalance: number              // Current user's coin balance
  onTransferSuccess: () => void    // Callback after successful transfer
}
```

**Functions:**
- `handleSearch()` - Search for users
- `handleSelectUser()` - Select recipient and go to confirm step
- `handleTransfer()` - Process the transfer
- `handleClose()` - Close modal or go back

### 3. New File: `app/api/users/search/route.ts`

**Purpose:** API endpoint to search users by name or email

**Method:** GET

**Query Parameters:**
- `q` (string, required) - Search query

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "User Name",
      "avatar_url": "https://..."
    }
  ]
}
```

**Endpoint:** `/api/users/search?q=search_term`

### 4. Existing File: `app/api/wallet/transfer-coins/route.ts`

**Status:** Already exists and fully functional

**Purpose:** Process coin transfers between users

**Method:** POST

**Request Body:**
```json
{
  "recipientId": "user_id_uuid",
  "coins": 100,
  "message": "Optional message"
}
```

**Features:**
- Validates sender authentication
- Checks recipient exists
- Verifies sufficient balance
- Prevents self-transfer
- Creates transaction records
- Sends notifications
- Automatic rollback on failure

---

## User Experience Flow

### 1️⃣ Start Transfer
User clicks **"Transfer"** button on wallet page
↓

### 2️⃣ Open Modal
Modal opens with search field ready
↓

### 3️⃣ Search User
User types recipient name/email
Real-time search results appear
↓

### 4️⃣ Select Recipient
User clicks on desired recipient
Modal goes to Step 2 (Confirm)
↓

### 5️⃣ Enter Amount
User enters coin amount
Balance preview updates in real-time
↓

### 6️⃣ Add Message (Optional)
User can add personal message to gift
↓

### 7️⃣ Review Summary
User sees breakdown:
- Recipient name
- Amount in coins
- New balance after transfer
↓

### 8️⃣ Confirm Transfer
User clicks "Send X Coins" button
Transfer processes on server
↓

### 9️⃣ Success
Toast notification appears
Modal closes
Page reloads
Wallet shows updated balance
↓

### 🔟 Complete
User is back on wallet page with new balance
Transaction appears in history
Recipient gets notification

---

## Component Interaction Diagram

```
┌─────────────────────────────────────┐
│   Wallet Page                       │
│   (app/dashboard/wallet/page.tsx)   │
└──────────────┬──────────────────────┘
               │
               │ Click Transfer Button
               ↓
┌─────────────────────────────────────┐
│   TransferCoinsModal Component       │
│   (components/wallet/...)           │
│                                     │
│  ┌─ Step 1: Search User             │
│  │  - Input: search query           │
│  │  - API: /api/users/search        │
│  │  - Output: user list             │
│  │                                  │
│  └─ Step 2: Confirm Transfer        │
│     - Input: amount, message        │
│     - API: /api/wallet/transfer-coins
│     - Output: transfer success      │
└─────────────────────────────────────┘
```

---

## Mobile vs Desktop Display

### Desktop View:
```
┌───────────────────────────────┐
│     Total Balance Card        │
│  [Verify] [Transfer] [Withdraw] [Buy]
│                               │
```
- Shows full "Transfer" text
- Buttons auto-wrap if needed
- Full modal on larger screens

### Mobile View:
```
┌──────────────────┐
│ Total Balance    │
│ [ID][Send][Out]  │
│ [Buy]            │
└──────────────────┘
```
- Shows "Send" on mobile (short text)
- Buttons stack/wrap efficiently
- Modal is centered and responsive
- Touch-friendly spacing maintained

---

## Accessibility Features

✅ **Semantic HTML**
- Proper label elements
- Input fields with associated labels
- Dialog with title and description

✅ **Keyboard Navigation**
- Tab through search results
- Enter to select user
- Tab through form fields
- Enter to submit

✅ **Screen Reader Support**
- Labels for inputs
- Button text describes action
- Dialog title and description
- Error messages announced

✅ **Visual Feedback**
- Loading spinners
- Disabled states
- Hover effects
- Focus indicators

---

## Summary

The **Transfer** button is now visible in the Balance Card on the wallet page, right next to the Verify, Cash Out, and Buy Coins buttons. When clicked, it opens a beautiful two-step modal that guides users through:

1. **Searching** for the recipient
2. **Confirming** the transfer amount and details

The implementation includes full validation, error handling, and a smooth user experience across all devices! 🎉

