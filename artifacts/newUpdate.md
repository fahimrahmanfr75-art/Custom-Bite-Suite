## Scope

This document defines the **required UI/UX changes**, **business logic updates**, and **database/schema modifications** for the following modules:

* Authentication (Login + Registration + User Profile)
* Customer Console (Explore, Dish Tab, Account, Cart, Orders)
* Manager Command Center (Profile, Orders, Menu, Command)
* Rider Console (Assignments + Delivery Flow)
* Shared system requirements (notifications, order lifecycle, map/location handling)

This specification assumes a **multi-role food delivery system** with 3 actors:

* Customer
* Manager
* Rider

---

# 1. Authentication Update (Customer + Manager + Rider)

## 1.1 UI Visual Requirements

### Input Field Styling

All input fields across the entire app must support a **consistent 3D effect**:

* Inner shadow + outer shadow
* Rounded corners
* Pressed effect on focus (slight scale/outline)
* Same styling must apply to:

  * Login inputs
  * Registration inputs
  * Cart notes input
  * Any form fields used by manager/rider/customer

**Standard Input Style Rules**

* Default: light shadow, subtle highlight
* Focused: stronger glow/border
* Error state: red border + error label below field
* Disabled: faded and unclickable

---

## 1.2 Validation & Error Handling (All Inputs)

### Requirement

Whenever user enters invalid or wrong data, the system must display a **specific error message** in the **correct field location**.

This applies to:

* Email fields
* Password fields
* Phone fields
* Name fields
* Dish ingredient selections
* Quantity fields
* Delivery notes
* Any input field in the entire system

### Error Message Rules

* Error text must appear **directly under the input field**
* Error must disappear once corrected
* Error must be descriptive, not generic

**Examples**

* Email:

  * “Email is required”
  * “Invalid email format”
* Password:

  * “Password must be at least 8 characters”
  * “Password must contain at least 1 number”
* Login failure:

  * “Account not found”
  * “Incorrect password”

---

## 1.3 Login & Registration Navigation Flow

### Default App Behavior

When app launches, user sees **Login screen first**.

### Login Screen Requirements

* Must contain:

  * Email input
  * Password input
  * Login button
  * A text link: **"Don't have an account? Register"**

### Registration Screen Requirements

* Must contain:

  * Required registration fields
  * Register button
  * A back button
  * A text link: **"Already have an account? Login"**

### Routing Logic

* If user tries to login and user does not exist:

  * Show error: **"User not found"**
  * Redirect user to Registration screen automatically OR show a prompt with redirect option.

---

## 1.4 Removal of Address and Delivery Notes from Registration/Profile

### Requirement

Remove these fields from:

* Registration form
* User profile/account page

Removed fields:

* Address
* Delivery notes

### New Rule

* Address and delivery notes are **NOT stored in user profile**
* They are only stored **per order** at checkout time

---

## 1.5 Keyboard Handling / Dynamic Screen Movement

### Requirement

Whenever user taps an input field:

* screen must shift upward dynamically
* keyboard must not block content
* the selected input field should move closer to keyboard

### UI Implementation Expectation

* Use scroll-aware layout (ScrollView + keyboard-aware view)
* Focused field should auto-scroll into visible region
* Works on:

  * Login screen
  * Registration screen
  * Cart delivery notes field
  * Manager add/edit dish screen
  * Any other input screen

---

# 2. Customer Console Update

## 2.1 Explore Tab

### 2.1.1 Banner System

#### UI Requirement

Explore tab must display a **banner section at the top**.

* Banner is an image
* Banner is configured by the Manager
* Banner must be shown to customers automatically

#### Backend Requirement

Manager must have ability to:

* upload/change banner image
* remove banner

#### Banner Display Rules

* Only one active banner at a time
* Cached locally for performance
* Should support fallback placeholder if none exists

---

### 2.1.2 Menu Card Layout Update (dish_card_layout.png)

#### UI Requirement

All dish cards shown in Explore tab must follow the design of `dish_card_layout.png`.

Each dish card must show:

* Dish image
* Dish name
* Short description (optional if available)
* Price (calculated from default ingredients)
* Category label (menu category)
* Rating (optional if system has reviews)
* Tap action opens Dish Tab (dish detail view)

---

### 2.1.3 Dish Price Calculation Rule (Default Ingredients)

#### New Pricing Logic

The displayed price in menu card is not static.
It is:

> Dish Base Price = sum(price of all default-selected ingredients)

Meaning:

* Each dish has ingredient groups/categories
* Some ingredients are mandatory/fixed
* Some are default-selected
* The dish’s displayed menu price is the sum of:

  * mandatory ingredient prices + default ingredient prices

Manager must define:

* Which ingredients are mandatory
* Which are default selected
* Which are optional extras
* Each ingredient has its own price

---

### 2.1.4 Database Impact (Explore Pricing)

Dish pricing can no longer be a single field unless used as cached computed value.

Recommended:

* Store ingredient prices individually
* Store default selection flags
* Compute total dynamically at runtime

Optional optimization:

* Maintain a cached `default_total_price` field per dish
* Update it whenever manager edits dish ingredients

---

## 2.2 Dish Tab (Dish Detail Page)

Dish tab must follow the UI concept of `dish_tab.png`.

### 2.2.1 Dish Detail UI Components

When dish is opened:

* Dish image (large header)
* Dish name + description
* Ingredient selection section (category-wise)
* Real-time price update
* Add to cart button
* Review section embedded in same screen
* Scrollable layout

---

### 2.2.2 Ingredient Category System

Ingredients are divided into **ingredient categories**.
Example categories:

* Bread type
* Sauce type
* Cheese type
* Toppings
* Add-ons

Not every dish must have same categories.

---

### 2.2.3 Ingredient Types (3 Behaviors)

#### (A) Fixed / Mandatory Ingredients

* Must always be included
* Selection toggle disabled
* Shows as locked/checked
* Represents the identity of the dish

Example message:

* “Mandatory ingredient”

#### (B) Default Selected Ingredients

* Selected by default
* User can unselect if they want
* Affects price dynamically

#### (C) Extra Ingredients

* Not selected by default
* User can add them
* Price increases dynamically

---

### 2.2.4 Real-Time Price Update

The UI must display updated dish total price instantly.

Price formula:

```
dish_price = sum(price of all selected ingredients)
```

This includes:

* mandatory
* default-selected (if not unselected)
* extras (if selected)

---

### 2.2.5 Review System Embedded in Dish Tab

Dish tab must include:

* Review summary section (rating average)
* Customer review list below

Displayed review data:

* Customer name (or anonymized)
* Rating (stars)
* Review comment
* Review timestamp

---

### 2.2.6 Review Data Source Rules

Reviews must be linked to:

* Dish
* Customer
* Order (optional but recommended to ensure authenticity)

Recommended rule:

* Customer can review only if they ordered that dish and order is delivered.

---

## 2.3 Account/Profile Tab Update

### 2.3.1 Logout Button Relocation

Logout must be moved inside the Account tab.

Placement:

* At bottom of user info section
* After all profile data

---

### 2.3.2 Remove Location and Notes

User profile must not contain:

* Location
* Delivery notes

Only display:

* Name
* Email
* Phone
* Account creation date (optional)

---

# 3. Cart Tab Update (cart.png Concept)

Cart UI must be redesigned according to `cart.png`.

## 3.1 Cart Item Layout Requirements

Each dish entry must show:

* Dish name
* Quantity selector
* Selected ingredients list (category wise)
* Individual dish total price
* Cancel/remove dish button

Example format:

* Burger X2

  * Bread: Sesame
  * Sauce: BBQ
  * Extra: Cheese
    Price: $12.00
    [Remove]

---

## 3.2 Total Order Section

Cart must show:

* Subtotal (sum of all dish totals)
* Delivery fee (computed after location is set)
* Final total
* Cancel all order button
* Place order button

---

## 3.3 Delivery Notes Input Field

Cart must keep **delivery notes** field.

Rules:

* Notes stored only for this order
* Notes must be validated (optional max length)

---

## 3.4 Delivery Location Selection (No Typing Address)

Instead of address input:

* Button: **Set Location**
* Opens Map screen (Google Maps or equivalent)

Customer selects exact delivery point:

* Drop pin / choose point
* Press OK
* Store latitude/longitude for this order

---

## 3.5 Delivery Fee System

After location is selected:

* system calculates delivery fee
* fee is added to total
* fee must be displayed clearly

Delivery fee can be based on:

* distance between restaurant and customer
* fixed minimum fee
* distance tiers

Stored per order:

* delivery_fee
* delivery_distance_km

---

# 4. Customer Orders Tab Update

## 4.1 Remove "Leave Review" from Order History

No review button should exist in order history screen.

Reviews will be accessible through dish tab review section.

---

## 4.2 Order History Must Become Expandable

Each order card must:

* show brief info by default
* expand when tapped
* show full details

### Expanded Order Details Must Include:

* Order ID
* Order status
* Dish list with category-wise ingredient list
* Quantity per dish
* Price per dish
* Total order price
* Order time
* Delivery time (if delivered)
* Rider info:

  * Rider ID
  * Name
  * Phone
* Payment status
* Delivery notes
* Delivery location displayed in map view

---

## 4.3 Live Tracking Notifications

Customer must receive notification whenever order status changes.

Status triggers include:

* accepted
* preparing
* ready
* on_the_way
* delivered
* rejected
* canceled

Notification methods:

* push notifications
* in-app alerts

---

## 4.4 On-The-Way Map Tracking

When order reaches `on_the_way`:

* customer can view rider’s live location on map
* map must show:

  * rider current position
  * customer drop-off pin
  * route line (optional)
  * estimated distance and ETA

---

## 4.5 Cancellation Rule (Critical)

Customer can cancel order only until order reaches status `ready`.

Rules:

* Cancel button visible only for:

  * pending
  * accepted
  * preparing
* Cancel button must disappear immediately after status becomes `ready`
* After ready, customer cannot cancel

---

# 5. Manager Command Center Update

## 5.1 Add Profile Tab

Manager UI must include a **Profile tab**.

Logout button must be placed inside this Profile tab:

* at bottom of page

---

## 5.2 Remove Logs Tab, Replace With Order History Tab

### Order History Tab Requirements

This tab must store and show **all completed/closed orders**, including:

* delivered
* rejected
* canceled

Each order card must expand and display full information:

* Order ID
* Order status
* Dish list with category-wise ingredients
* Dish quantity and price
* Total price
* Order time
* Delivery time (if delivered)
* Rider details:

  * rider id
  * name
  * phone
* Payment status
* Delivery notes
* Delivery location map view
* Customer details:

  * customer id
  * name
  * phone
  * email
* Order date

---

## 5.3 Command Tab (Active Orders)

### 5.3.1 Accept / Reject Flow

When customer places order:

* order appears in manager Command tab
* manager can:

  * accept
  * reject

If rejected:

* status becomes `rejected`
* order moves to history for both:

  * customer order history
  * manager order history

---

### 5.3.2 Status Advancement Rule

Manager can update status only up to:

* pending → accepted → preparing → ready → on_the_way

Manager must NOT have the ability to mark delivered.

Delivered status is reserved only for rider.

Once status becomes `delivered`:

* order moves automatically to manager order history

---

### 5.3.3 Remove Assign Rider Feature

Manager must not assign rider manually.

No rider assignment UI should exist.

Riders will claim orders automatically.

---

### 5.3.4 Command Tab Card Priority Information

Order card display must prioritize:

* Number of dishes
* Dish details (dish name + ingredient list category wise)
* Total price
* Payment method and payment status
* Customer name
* Customer location (map pin preview)
* Order ID

---

# 6. Manager Menu Tab Update

Menu tab UI must match customer dish layout style (`dish_tab_layout.png`).

## 6.1 Dish Card Requirements (Manager View)

Each dish must show:

* Dish image
* Dish name
* Dish description
* Menu category name
* Ingredient categories
* Ingredients with individual prices
* Mandatory/default/extra type markers

---

## 6.2 Dish Editing Requirements

Manager must be able to update:

* Dish image
* Dish name
* Dish description
* Menu category assignment
* Ingredient categories (add/remove/rename)
* Ingredients (add/remove/edit)
* Ingredient price
* Ingredient type:

  * mandatory (fixed)
  * default selected
  * extra optional

Manager must also be able to delete:

* ingredient
* ingredient category
* dish

---

## 6.3 Dish Adding Requirements

Add dish workflow must include:

1. Select menu category
2. Upload dish image
3. Enter name + description
4. Create ingredient categories (dish-specific)
5. Add ingredients under categories
6. Set price per ingredient
7. Mark ingredient as:

   * mandatory
   * default selected
   * extra
8. Save dish
9. System calculates default dish price automatically

---

## 6.4 Category System Clarification

There are two separate category types:

### (A) Menu Category

Example:

* Burgers
* Pizza
* Drinks

This is used for Explore filtering.

### (B) Ingredient Category (Dish-Specific)

Example:

* Sauce Options
* Cheese Options

This exists only within dish configuration.

Dish ingredient categories are not global.

---

# 7. Rider Console Update

## 7.1 Remove Map Tab

Rider console must not contain separate map tab.

Map functionality must be embedded inside assignment details.

---

## 7.2 Logout Button in Profile Tab

Logout must be moved under rider profile tab at bottom.

---

# 8. Rider Assignments Tab Update

## 8.1 Order Availability Logic

Orders become available to riders only when:

* manager updates order status to `on_the_way`

Meaning:

* preparing/ready orders are NOT visible to riders
* only on_the_way orders enter rider pool

---

## 8.2 Multi-Rider Claiming Mechanism

When an order becomes available:

* all riders receive notification
* all riders can see the order in available assignments list
* first rider who accepts gets it assigned

After one rider accepts:

* order disappears from other riders’ lists
* order is locked to assigned rider

This requires concurrency-safe locking in backend.

---

## 8.3 Rider Assignment Card Required Info

Assignment card must display:

* Map view (live tracking)

  * customer location pin
  * rider live location
  * distance and ETA
* Order ID
* Customer name
* Customer phone number
* Order details:

  * number of dishes
  * dish breakdown with ingredient list
  * total price
  * payment status

---

## 8.4 Delivery Completion

When rider presses **Delivered**:

* order status becomes `delivered`
* delivered timestamp saved
* order moves to order history for:

  * customer
  * manager
  * rider

---

# 9. Shared Order Lifecycle Specification

## 9.1 Order Status Flow (Final)

```
pending
accepted
preparing
ready
on_the_way
delivered
```

Alternative terminal statuses:

```
rejected
canceled
```

### Rules

* Manager can set status up to `on_the_way`
* Rider can set only `delivered`
* Customer can cancel only before `ready`

---

## 9.2 Cancellation Conditions

Customer cancellation allowed if status is:

* pending
* accepted
* preparing

Customer cancellation NOT allowed if status is:

* ready
* on_the_way
* delivered

Cancel action results in status:

* canceled

---

## 9.3 Rejected Order Flow

Manager rejects → status becomes `rejected`
Immediately added to order history for both sides.

---

# 10. Database Design Updates (Recommended Schema)

This section defines required schema updates to support all new requirements.

---

## 10.1 Banner Table

### `banners`

| Field      | Type     | Notes           |
| ---------- | -------- | --------------- |
| id         | PK       |                 |
| image_url  | string   | manager uploads |
| active     | boolean  | only 1 active   |
| created_at | datetime |                 |

---

## 10.2 Menu Category Table

### `menu_categories`

| Field      | Type     |
| ---------- | -------- |
| id         | PK       |
| name       | string   |
| created_at | datetime |

---

## 10.3 Dish Table

### `dishes`

| Field                | Type     | Notes                 |
| -------------------- | -------- | --------------------- |
| id                   | PK       |                       |
| menu_category_id     | FK       | menu category         |
| name                 | string   |                       |
| description          | text     |                       |
| image_url            | string   |                       |
| active               | boolean  |                       |
| cached_default_price | decimal  | optional optimization |
| created_at           | datetime |                       |

---

## 10.4 Ingredient Category Table (Dish-Specific)

### `dish_ingredient_categories`

| Field         | Type   | Notes |
| ------------- | ------ | ----- |
| id            | PK     |       |
| dish_id       | FK     |       |
| name          | string |       |
| display_order | int    |       |

---

## 10.5 Ingredients Table

### `dish_ingredients`

| Field       | Type     | Notes                       |
| ----------- | -------- | --------------------------- |
| id          | PK       |                             |
| dish_id     | FK       |                             |
| category_id | FK       | dish_ingredient_categories  |
| name        | string   |                             |
| price       | decimal  |                             |
| type        | enum     | mandatory / default / extra |
| created_at  | datetime |                             |

---

## 10.6 Orders Table

### `orders`

| Field          | Type              | Notes               |
| -------------- | ----------------- | ------------------- |
| id             | PK                |                     |
| customer_id    | FK                |                     |
| rider_id       | FK nullable       | assigned later      |
| status         | enum              | lifecycle           |
| subtotal       | decimal           | sum of dishes       |
| delivery_fee   | decimal           | computed            |
| total          | decimal           | subtotal + delivery |
| payment_status | enum              | unpaid/paid         |
| payment_method | enum              | COD/card/etc        |
| delivery_notes | text nullable     | per order           |
| delivery_lat   | float             |                     |
| delivery_lng   | float             |                     |
| ordered_at     | datetime          |                     |
| delivered_at   | datetime nullable |                     |
| canceled_at    | datetime nullable |                     |
| rejected_at    | datetime nullable |                     |

---

## 10.7 Order Items Table

### `order_items`

| Field       | Type    |
| ----------- | ------- |
| id          | PK      |
| order_id    | FK      |
| dish_id     | FK      |
| quantity    | int     |
| unit_price  | decimal |
| total_price | decimal |

---

## 10.8 Order Item Ingredients Table (Critical)

### `order_item_ingredients`

| Field                     | Type     | Notes                   |
| ------------------------- | -------- | ----------------------- |
| id                        | PK       |                         |
| order_item_id             | FK       |                         |
| ingredient_id             | FK       |                         |
| ingredient_name_snapshot  | string   | for history consistency |
| ingredient_price_snapshot | decimal  |                         |
| category_name_snapshot    | string   |                         |
| created_at                | datetime |                         |

**Reason for snapshots:**
Manager may change ingredient names/prices later. Order history must remain correct.

---

## 10.9 Reviews Table

### `dish_reviews`

| Field       | Type        |
| ----------- | ----------- |
| id          | PK          |
| dish_id     | FK          |
| customer_id | FK          |
| order_id    | FK optional |
| rating      | int         |
| comment     | text        |
| created_at  | datetime    |

---

# 11. Concurrency & Security Requirements

## 11.1 Rider Claiming Race Condition Prevention

When multiple riders attempt to accept the same order:

* backend must ensure only one succeeds
* others receive failure message: “Order already taken”

Implementation requirement:

* transaction lock / atomic update query
* order status remains `on_the_way` but rider_id gets set

Example logic:

* Update order set rider_id = X where id=Y and rider_id is null

---

## 11.2 Role-Based Access Control (RBAC)

### Customer Permissions

* browse dishes
* create order
* cancel order before ready
* view tracking
* view order history

### Manager Permissions

* manage menu
* accept/reject orders
* update status until on_the_way
* update banner

### Rider Permissions

* view available assignments
* accept assignment
* update delivered status only

---

## 11.3 Validation Hard Rules

All frontend validation must also exist in backend validation.

Backend must reject:

* invalid status transitions
* invalid cancellation attempts
* invalid dish ingredient combinations
* unauthorized actions

---

# 12. Notification Requirements

## 12.1 Customer Notifications

Customer must receive notifications when order status changes.

Minimum triggers:

* accepted
* rejected
* preparing
* ready
* on_the_way
* delivered
* canceled

---

## 12.2 Rider Notifications

Rider must receive notification when:

* a new order becomes available (status = on_the_way)

---

# 13. Map Requirements (Customer + Rider)

## 13.1 Customer Order Location Selection

* user chooses a point on map
* lat/lng stored in order

---

## 13.2 Live Rider Tracking

When order is on_the_way:

* rider location updates must stream periodically
* customer sees real-time movement

Minimum tracking features:

* distance to destination
* estimated time
* route display optional

---

# 14. UI/UX Consistency Rules (Global)

## 14.1 Consistent Design System

* 3D input fields everywhere
* consistent card shadows
* consistent button styles

## 14.2 Expandable Card Behavior

Orders in history must expand/collapse smoothly.

## 14.3 Disabled Button Behavior

Mandatory ingredients selection controls must be disabled visually.

---

# 15. Testing & Validation Requirements

## 15.1 Authentication Tests

* login with wrong password → shows correct error
* login with unknown email → redirects to registration
* registration missing required field → field-specific error

---

## 15.2 Ingredient Selection Tests

* mandatory ingredient cannot be unselected
* default ingredient can be unselected
* extra ingredient increases price
* price updates instantly and correctly

---

## 15.3 Order Lifecycle Tests

* customer cancels before ready → success
* customer cancels after ready → rejected
* manager cannot mark delivered
* rider can mark delivered
* rejected orders appear in both histories

---

## 15.4 Rider Claiming Tests

* two riders accept simultaneously → only one succeeds
* order removed from other rider lists instantly

---

# 16. Final Deliverable Summary (What Must Be Implemented)

## Authentication

* 3D fields
* validation errors per field
* login-first navigation
* register/login switching links
* remove address/notes from profile
* keyboard-aware UI movement

## Customer Console

* explore banner
* dish card redesign with images + computed default price
* dish detail redesign with ingredient categories and review section
* cart redesign with location map selection + delivery fee
* order history expandable with full details and map
* live tracking + notifications
* cancel allowed only before ready

## Manager Console

* profile tab with logout
* remove logs, add order history
* command tab accept/reject + status up to on_the_way
* remove assign rider
* menu redesign with ingredient category management

## Rider Console

* remove map tab
* profile tab logout
* assignments appear only after on_the_way
* first rider to accept locks order
* rider delivers and updates status

## Database

* new banner table
* dish ingredient category system
* ingredient type system
* order snapshots for ingredients
* order location stored per order
* review system integrated per dish

---

If you want, I can now produce the **complete ERD**, **SQL schema**, and **API endpoint specification** (REST + role guards + status transition rules).
