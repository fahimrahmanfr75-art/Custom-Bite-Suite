# Custom Bite Suite - Update Implementation Guide

## ✅ COMPLETED WORK (Phase 1-5)

All foundation work has been completed successfully:

### Database & Schema
- ✅ Added `ingredient_categories` table for organizing ingredients by type (Bases, Toppings, Sauces, etc.)
- ✅ Added `banner_images` table for promotional banners
- ✅ Updated `dish_ingredients` with:
  - `ingredient_category_id` - links to ingredient categories
  - `is_mandatory` - marks ingredients that define the dish (cannot be removed)
  - `sort_order` - for proper ordering within categories
- ✅ Updated `orders` table with:
  - `customer_email` - for order tracking
  - `rider_latitude`, `rider_longitude` - for real-time rider location
  - `cancelled_at` - timestamp for cancelled orders

### Types & API Contracts
- ✅ `IngredientCategory` type with dish-specific ingredient grouping
- ✅ `BannerImage` type for promotional content
- ✅ `Ingredient` type for individual ingredient data
- ✅ Updated `DishIngredient` with category and mandatory flags
- ✅ Updated `Order` with rider location and email tracking
- ✅ Updated `RegisterPayload` - removed address and notes (collected during ordering)
- ✅ Updated `PlaceOrderPayload` - now includes latitude/longitude for map-based location selection
- ✅ Updated `AppSnapshot` to include banners, ingredientCategories, and ingredients

### Repository Functions
- ✅ `getBanners()` - fetches active promotional banners
- ✅ `getIngredientCategories()` - retrieves ingredient groupings per dish
- ✅ `getIngredients()` - gets ingredient master list
- ✅ Updated `register()` - no longer requires address/notes
- ✅ Updated `placeOrder()` - accepts map-selected coordinates
- ✅ Seed data includes sample:
  - Ingredient categories (Bases, Toppings, Sauces, etc.)
  - Banner images for promotions
  - Updated dish-ingredient relationships with mandatory flags

### UI Components & Authentication
- ✅ **Enhanced Field Component** (`src/components/common.tsx`):
  - 3D shadow effect (elevation: 3)
  - Per-field error message display
  - Red error styling (DC2626) with light red background
  - Automatic error clearing on user input

- ✅ **Authentication Screen** (`src/screens/AuthScreen.tsx`):
  - Removed address and delivery notes fields
  - Individual field validation with error messages
  - KeyboardAvoidingView for dynamic keyboard handling
  - Login/Register navigation links
  - Improved UX with form validation feedback

### Validation Schema
- ✅ Updated registerSchema to exclude address and notes
- ✅ Field-level validation with clear error messages

---

## ⏳ REMAINING WORK (Priority Order)

### PHASE 6: Customer Dashboard - Explore Tab
**File:** `src/screens/CustomerDashboard.tsx`

**Tasks:**
1. Update `activeTab === 'explore'` section to add banner carousel
   ```tsx
   // Add at top of explore section:
   {snapshot.banners.length > 0 && (
     <ScrollView horizontal showsHorizontalScrollIndicator={false}>
       {snapshot.banners.map(banner => (
         <BannerCard key={banner.id} banner={banner} />
       ))}
     </ScrollView>
   )}
   ```

2. Update dish card layout to match `dish_card_layout.png`:
   - Display dish.imageUrl
   - Show rating stars (dish.averageRating)
   - Show base price with mandatory ingredients included
   - Add visual rating count

3. On dish card press → set `setSelectedDish(dish)` to open details modal

**Reference:** Design shows burger image, name, description, rating (3 stars), $8.90 price

---

### PHASE 7: Dish Details Modal
**File:** `src/screens/CustomerDashboard.tsx`

**New Modal/Screen Component:**
1. Show full dish image with back button
2. Ingredients section organized by category:
   - **Mandatory (Fixed)** - grayed out/disabled (show price is included)
   - **Default (Checked)** - can uncheck to remove
   - **Extra (Unchecked)** - can add for additional cost
3. Real-time price calculation:
   ```tsx
   const customDelta = selectedCustomizations.reduce((sum, c) => sum + c.priceDelta, 0);
   const totalPrice = selectedDish.price + customDelta;
   ```
4. Reviews section:
   - Show existing reviews from `selectedDish.reviews`
   - Display reviewer name, rating stars, comment
   - (Don't allow writing review here - moved to order history)
5. "+ Add to cart" button at bottom

**Reference:** `dish_tab.png` shows categorized ingredients with checkboxes and real-time pricing

---

### PHASE 8: Customer Account Tab
**File:** `src/screens/CustomerDashboard.tsx`

**Tasks:**
1. Update `activeTab === 'account'` section:
   - Remove address display
   - Remove notes display
   - Show: firstName, lastName, email, phone, dateOfBirth
2. Move logout button to bottom of tab
3. Use card layout for user information display

---

### PHASE 9: Customer Cart Tab - Major Update
**File:** `src/screens/CustomerDashboard.tsx`

**Critical Changes:**
1. Update cart item display per `cart.png` reference:
   ```tsx
   // Each cart item should show:
   - Dish name in header (light purple background)
   - Ingredients list: "Brioche Bun, Lettuce Wrap, Crispy Bacon..."
   - Individual price and delete button (trash icon)
   - Quantity +/- buttons (minus and plus in boxes)
   ```

2. Replace "Delivery Address" text input with "Set Location" button:
   ```tsx
   // Button opens map picker (use expo-location & react-native-maps)
   // On location select: payload.latitude = selectedLat; payload.longitude = selectedLng;
   ```

3. Add delivery notes text input field

4. Calculate total with delivery fee:
   ```tsx
   const totals = calculateOrderTotals(cart, activeDiscountPercent);
   // Display: subtotal, discount, delivery_fee, total
   ```

5. Two payment buttons:
   - "💳 Pay Online" → paymentMethod = 'card'
   - "💵 Cash on Delivery" → paymentMethod = 'cod'

**Reference:** `cart.png` shows complete cart layout with items, notes, and payment options

---

### PHASE 10: Customer Orders Tab - Complete Redesign
**File:** `src/screens/CustomerDashboard.tsx`

**Tasks:**
1. Remove "leave review" button from history orders
2. Create expandable order cards showing:
   - Collapsed: Order ID, Status, Date, Total
   - Expanded:
     - Order ID, Status, Creation date
     - Rider Name, Phone, ID (if assigned)
     - **Detailed Items**: Each item shows CATEGORY-WISE ingredients
       ```
       Burger $7.50
       - Bases: Brioche Bun
       - Toppings: Lettuce, Tomato
       - Sauce: Garlic Mayo
       Qty: 1
       ```
     - Individual prices for each item
     - Total price, Payment status
     - Delivery notes
     - **Map view** of delivery location
     - Delivered date (if applicable)
     - **Delivered At** timestamp

3. Add cancellation button:
   ```tsx
   // Show cancel button only if status !== 'ready' && status !== 'delivered'
   // After ready status, button disappears
   ```

4. Live tracking features:
   ```tsx
   // When status === 'on_the_way':
   // - Show rider location on map (riderLatitude, riderLongitude)
   // - Show customer location (order.latitude, order.longitude)
   // - Display distance and ETA
   ```

5. Notification system (optional but recommended):
   - Set up listeners for status changes
   - Show toast notifications when status updates

---

### PHASE 11: Manager Dashboard Updates
**File:** `src/screens/ManagerDashboard.tsx`

**Tab 1 - Profile Tab (New):**
- Similar layout to customer profile
- Logout button at bottom

**Tab 2 - Order History Tab (Replace Logs):**
- Show all completed/cancelled orders
- Detailed expandable cards with full order information
- Filters: status, date range, customer name

**Tab 3 - Command Tab (Update):**
```tsx
// For each order:
// - Display card with: items, total, customer name, location
// - Buttons: "Accept" | "Reject" (for pending orders)
// - Status progression: pending → accepted → preparing → ready → on_the_way
// - REMOVE: Rider assignment button (riders accept from their end)
```

**Tab 4 - Menu Tab (Update):**
```tsx
// Similar to customer explore layout but with:
// - Edit button on each card
// - Delete button on each card
// - "+ Add new dish" button

// Edit/Add Dish Modal:
// - Image upload/change
// - Name, description fields
// - Ingredient management by category:
//   - Select ingredient category
//   - Add ingredients (check for mandatory/default/extra)
//   - Set prices for each ingredient
// - Menu category selection
// - Availability toggle
```

---

### PHASE 12: Rider Dashboard Updates
**File:** `src/screens/RiderDashboard.tsx`

**Tab 1 - Profile Tab:**
- Basic rider info
- Logout button at bottom

**Tab 2 - Assignments Tab (Update):**
```tsx
// Orders only appear when: order.status === 'on_the_way'
// 
// For each order:
// - "Accept" button → claims order for this rider
// - Once accepted, shows:
//   - Customer location on map
//   - Rider current location on map
//   - Distance between them
//   - "Delivered" button to complete
//   
// Map features:
// - Real-time rider location updates
// - Distance calculation
// - Navigation line between rider and customer
//   
// Order details shown:
// - Customer name, phone
// - Items ordered (with ingredients)
// - Total price
// - Payment status
```

---

## Building & Testing

### Before Publishing
```bash
# Check TypeScript
npm run typecheck

# Run linter
npm run lint

# Run tests
npm run test

# Build APK
npm run build:apk
```

### Critical Checks
- [ ] All screens render without crashes
- [ ] Database initializes with seed data
- [ ] Auth login/register works (removed address/notes)
- [ ] Customer can browse, search, and view dish details
- [ ] Cart shows ingredients and allows location selection
- [ ] Orders display with detailed information
- [ ] Manager can accept/reject and manage dishes
- [ ] Rider can accept orders and see locations
- [ ] Real-time locations update for riders
- [ ] APK builds successfully with no errors

---

## Important Notes

### Map Integration
- Using `react-native-maps` and `expo-location`
- For location picker: Return coordinates from map selection
- Store as `latitude`, `longitude` in order

### Ingredient Categories
- Each dish has its own ingredient categories
- Example: Burger has "Bases", "Toppings", "Sauces"
- These are created during seeding and can be managed by manager

### Delivery Location
- Previously taken from customer profile
- Now selected during checkout via map picker
- Coordinates sent with `PlaceOrderPayload`

### Rider Flow
- Riders see orders only when status = "on_the_way"
- They accept via notification and it appears in assignments
- Only riders can mark orders as "delivered"
- Their location tracked and shown to customers

---

## Next Immediate Step
Start with **Phase 6** (Explore Tab) - it's the entry point for customers and provides foundation for Phase 7 (Dish Details). These two phases are interdependent and should be completed together.
