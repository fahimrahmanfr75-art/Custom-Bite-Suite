# Title: PREPARATION OF SRS DOCUMENT

## 1. Introduction

### 1.1 Purpose

The purpose of this Software Requirements Specification (SRS) document is to provide a comprehensive, detailed, and unambiguous description of the functional and non-functional requirements for the **Custom-Bite Suite** mobile application. This document serves as the authoritative reference for all stakeholders — including developers, project managers, quality assurance testers, academic evaluators, and future maintainers — to understand the full scope, behavior, constraints, and capabilities of the system. It defines what the software must do (functional requirements), how it must perform (non-functional requirements), and the environment in which it operates. The SRS is intended to minimize misunderstandings between the development team and end-users, facilitate verification and validation of the delivered product, and act as a contractual baseline for the system's expected behavior. Every feature described herein is grounded in the actual implemented codebase, ensuring traceability from requirement to implementation.

### 1.2 Intended Users

The Custom-Bite Suite application is designed to serve three distinct user roles, each representing a key stakeholder in the single-vendor food delivery ecosystem:

- **Customer (End Consumer)**: The primary end-user of the application. Customers are individuals who wish to browse the restaurant's curated menu, customize dishes with ingredient-level control (adding or removing optional, default, and mandatory ingredients), assemble orders in a digital shopping cart, place orders with card or cash-on-delivery payment, track their deliveries in real-time via GPS, submit reviews and ratings for dishes they have ordered, and request refunds when necessary. Customers are expected to be general smartphone users with low to moderate technical proficiency — they are familiar with common mobile app interactions such as scrolling, tapping, text input, and navigating between tabs. The application provides four customer-facing tabs: Explore (menu browsing and search), Cart (order assembly and checkout), Orders (active tracking and order history), and Account (profile viewing and logout).

- **Manager (Restaurant Operator)**: The business administrator responsible for the full operational management of the restaurant. The manager uses the application to receive and process incoming customer orders (accepting or rejecting them), advance orders through the kitchen pipeline (pending → accepted → preparing → ready → on the way), manage the complete menu catalog (creating, editing, and deleting dishes with ingredient categories and individual ingredient configuration), operate a promotional banner system with image uploads, monitor financial dashboards (daily, weekly, and monthly revenue, outstanding cash-on-delivery balances), process customer refund requests (approving or denying with resolution notes), and review a comprehensive order history with full dish breakdowns, customer details, rider information, and ingredient snapshots. The manager is expected to have moderate to high technical proficiency — comfortable with form-heavy data entry, administrative dashboards, and multi-tab navigation across the Profile, Command, Menu, Finance, and History sections.

- **Rider (Delivery Personnel)**: The field operative responsible for physically delivering orders from the restaurant to the customer's location. Riders use the application to browse and claim available delivery assignments, view detailed assignment cards with customer information (name, phone, email, address), navigate to delivery locations via Google Maps integration, call customers directly through the phone dialer, mark deliveries as completed (which automatically handles COD cash collection when applicable), and track their personal earnings and delivery history. Riders are expected to have low to moderate technical proficiency — they must be comfortable operating the application while on the move, using GPS-based navigation, and confirming delivery status on a mobile device. The rider interface is organized into three tabs: Profile, Assignments (available and active deliveries), and Earnings (financial summary and delivery history).

### 1.3 Scope

The **Custom-Bite Suite** is a single-vendor, multi-role food delivery management platform implemented as a cross-platform mobile application using React Native and Expo. The application is designed to serve as a complete operational control surface for a restaurant business, consolidating customer ordering, kitchen command, delivery rider logistics, financial reconciliation, and refund management into a unified, Android-ready mobile experience.

The scope of this system encompasses the following major functional areas:

1. **Multi-Role Authentication System**: Secure role-based registration and login for three distinct user types — Customer, Manager, and Rider — with SHA-256 password hashing, Zod schema validation, and session persistence via a local SQLite database.
2. **Customer Ordering Workflow**: A full-featured customer-facing experience including a curated restaurant menu with 16 dishes across 8 categories, ingredient-level dish customization with mandatory/default/optional ingredient handling, a digital shopping cart with quantity management, dual payment method support (Card and Cash on Delivery), GPS-based and manual delivery address selection, and a complete order lifecycle with real-time status tracking.
3. **Manager Command Center**: A comprehensive back-office dashboard enabling the restaurant manager to accept or reject incoming orders, advance orders through the kitchen pipeline (pending → accepted → preparing → ready → on_the_way), manage the full menu catalog (CRUD operations on dishes, ingredient categories, and individual ingredients), operate a promotional banner system with image upload capability, monitor financial metrics (daily/weekly/monthly revenue, outstanding COD, average order value), process refund requests (approve/deny with resolution notes), and review a detailed order history with full dish breakdown and ingredient snapshots.
4. **Rider Delivery Console**: A dedicated rider interface for claiming available delivery orders, viewing detailed assignment cards with customer information, GPS-powered distance and ETA calculations using the Haversine formula, Google Maps navigation integration, customer call capability, COD cash collection confirmation, delivery completion marking, and a personal earnings dashboard with delivery history.
5. **Live Order Tracking**: A real-time tracking screen accessible to customers for orders in the "on_the_way" status, displaying rider identity, estimated arrival time, distance remaining, route visualization, and expandable order details.
6. **Audit Logging**: A comprehensive audit trail that records every significant action in the system — including logins, logouts, order creation, status transitions, dish modifications, banner operations, refund decisions, and rider assignments — with actor identification, timestamps, and descriptive details.
7. **Review and Rating System**: A per-dish customer review system with 1-5 star ratings, written comments, one-review-per-customer-per-dish enforcement, edit capability for existing reviews, and real-time local display updates.
8. **Curated Menu Synchronization**: An automated menu management system that synchronizes a chef-curated catalog of fine-dining dishes, promotional banners, and time-limited discount offers into the local database on application startup.

The system explicitly **does not** include: a server-side backend or REST API (all data is managed locally via SQLite), user profile editing after registration, multi-restaurant/multi-vendor support, real-time push notifications, in-app payment gateway integration, or an iOS production build (although the framework supports it).

---

## 2. Overall Description

### 2.1 Product Perspective

Custom-Bite Suite is a **self-contained, standalone mobile application** that operates entirely on-device without dependency on external backend servers, cloud databases, or third-party APIs for its core functionality. The application is architecturally positioned as a monolithic client-side application that uses an embedded SQLite database (`custom_bite_suite.db`) as its sole persistent data store, managed through the `expo-sqlite` library. This design decision makes the application fully functional offline after initial installation and avoids the operational complexity of server infrastructure.

From a system-level perspective, Custom-Bite Suite interacts with the following external interfaces:

- **Operating System APIs (Android)**: The application interfaces with the Android operating system for permissions (location access via `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`, media library access for image uploads), system UI management (status bar configuration, safe area insets), and native gesture handling.
- **Device Hardware**: The application utilizes the device's GPS receiver for real-time rider location tracking and customer delivery address pinning, the device's camera roll and media library for dish and banner image uploads via `expo-image-picker`, and the device's telephony system for rider-to-customer and customer-to-rider phone call initiation via deep links (`tel:` protocol).
- **External Web Services (Optional)**: The application opens Google Maps for turn-by-turn delivery navigation via URL deep links (`https://www.google.com/maps/search/`), and provides an email contact link for rider support (`mailto:` protocol). These integrations are optional and the core application functions without them.
- **Expo Framework**: The application is built on the Expo managed workflow (SDK 54), which provides a unified build system, native module management, and development tooling. The application uses Expo's New Architecture (`newArchEnabled: true`) for improved performance.

The product is **not** a replacement for an existing system; it is a greenfield development designed as a comprehensive demonstration of a single-vendor food delivery platform's complete operational surface.

### 2.2 Product Key Functions

The Custom-Bite Suite application provides the following key functions, organized by the user role that primarily interacts with them:

**Authentication and Session Management:**
- User registration with role selection (Customer, Manager, Rider), collecting first name, last name, username, email, phone, date of birth, and password with confirmation
- Input validation using Zod schemas enforcing minimum lengths, email format, phone format, password complexity (minimum 8 characters, at least one uppercase letter, at least one digit), and password confirmation matching
- Multi-identifier login supporting email, username, or phone as the login credential, with role-aware credential matching
- SHA-256 cryptographic password hashing via `expo-crypto`
- Persistent single-user session stored in a dedicated `app_session` table with upsert-on-conflict semantics
- Secure logout with session deletion and audit logging
- Duplicate detection preventing registration with an already-used email, username, or phone number

**Customer Functions:**
- Browse a curated menu of 16 dishes organized into 8 categories (Amuse & Starters, Salads & Cheese, Handmade Pasta, Sea & Shore, From the Grill, Seasonal Sides, Desserts, Cocktails & Zero Proof)
- Search dishes by name or by ingredient keyword with real-time filtering
- Filter dishes by category using horizontally scrollable category pills
- View detailed dish pages with full description, price, preparation time, calorie count, spice level, star rating, review count, and high-resolution dish image
- Customize dish ingredients with a checkbox-based interface supporting three ingredient types: mandatory (always included, non-removable), default (included but removable), and optional extras (not included by default, addable for an extra price)
- Add special preparation instructions per dish item in a free-text field
- Manage a digital cart with per-item quantity adjustment (increment/decrement), item removal, and full cart clearing
- View a dynamic price summary showing subtotal (with customization price deltas), active discount percentage and amount, fixed delivery fee ($3.50), and calculated total
- Select delivery location via GPS coordinates (using the MapPickerScreen with `expo-location`) or manual address entry (area name, road number, house number)
- Place orders with two payment methods: online card payment (status: `paid`) or Cash on Delivery (status: `cod_pending`)
- View active orders with a visual step-by-step timeline showing timestamps for each status transition (Pending → Accepted → Preparing → Ready → On the Way)
- Cancel orders that have not yet reached "ready" status
- Access live tracking for orders in "on_the_way" status showing rider name, phone, distance, ETA, and route visualization
- View complete order history with itemized details, customizations, pricing breakdown, and payment method
- Submit refund requests for delivered orders with structured reason and detail fields
- Submit and edit dish reviews with a 1-5 star interactive rating and written comment, with one review per customer per dish enforced at the database level
- View user account profile (name, username, email, phone, date of birth) and perform logout
- View promotional banners in an auto-rotating horizontal carousel with pagination dots

**Manager Functions:**
- View manager profile information and perform logout
- Receive and process incoming orders: accept (advancing to "accepted" status) or reject (with audit-logged reason)
- Monitor kitchen pipeline with filterable order status view covering all 8 statuses (pending, accepted, preparing, ready, on_the_way, delivered, rejected, canceled)
- Advance order status through the kitchen pipeline: accepted → preparing → ready → on_the_way (manager cannot mark orders as delivered; that is a rider-only action)
- Full menu CRUD operations: create new dishes, edit existing dishes (name, description, price, preparation time, calories, spice level, category assignment, availability toggle, image URL or device-uploaded image), and delete dishes
- Manage ingredient categories per dish: add/remove ingredient category groups, set category name and description
- Manage individual ingredients within categories: add/remove ingredients, set ingredient name, price, and flags (mandatory, default)
- Operate a promotional banner system: create, edit, and delete banners with image URL or device-uploaded image, title, description, sort order, and active/inactive toggle
- View financial dashboard with computed metrics: daily revenue, weekly revenue, monthly revenue, outstanding COD (cash on delivery) balance, and total delivered order count
- Process customer refund requests: view pending refund submissions with reason and details, approve refunds (with resolution note), or deny refunds (with resolution note)
- Review comprehensive order history with expandable cards showing: order summary (ID, status, timestamps, payment status, delivery location, coordinates, delivery notes), customer details (ID, name, phone, email), rider details (ID, name, phone), and dish breakdown (dish name, quantity, unit price, line total, kitchen instruction notes, ingredient snapshots grouped by category)

**Rider Functions:**
- View rider profile information and perform logout
- Browse available unclaimed deliveries (orders in "on_the_way" status with no assigned rider)
- Claim delivery assignments with optimistic locking (preventing double-claiming via SQL `WHERE rider_id IS NULL OR rider_id = ?`)
- View detailed assignment cards with: customer name, phone, email; delivery address (textual or GPS coordinates); route visualization with rider and destination dots; real-time distance calculation and ETA estimation using the Haversine formula; itemized order contents with quantities, customizations, ingredient snapshots, and special instructions; cost breakdown (subtotal, discount, delivery fee, total); payment method and status
- Initiate GPS navigation to delivery address via Google Maps deep link
- Call the customer directly via phone dialer deep link
- Contact support via email deep link
- Mark delivery as completed, which automatically: advances order status to "delivered", and if COD payment, marks cash as collected
- Monitor real-time GPS location with `expo-location` watchPositionAsync (10-second interval, 10-meter distance threshold)
- View personal earnings dashboard showing: total earnings (sum of delivery fees), total delivery count, and average earnings per delivery
- Review delivery history with per-order details including customer info, address, items, customizations, payment method, payment status, and delivery notes

### 2.3 Users and Characteristics

The system supports three distinct user roles, each with different access levels, responsibilities, and interaction patterns:

| User Role | Description | Technical Proficiency | Primary Interactions |
|-----------|-------------|----------------------|---------------------|
| **Customer** | An end-user who browses the restaurant menu, customizes dishes, places orders, tracks deliveries, manages their cart, submits reviews, and requests refunds. Customers are expected to be general smartphone users with no technical expertise. They interact primarily with the Explore (menu browsing), Cart (order assembly), Orders (tracking and history), and Account (profile management) tabs. | Low to Moderate — Expected to be familiar with basic mobile app usage patterns such as scrolling, tapping, and text input. | Menu browsing, dish customization, cart management, order placement, live tracking, order cancellation, refund requests, dish reviews, account viewing, logout |
| **Manager** | The restaurant operator who manages the kitchen pipeline, curates the menu, processes financial transactions, handles refund requests, and monitors business metrics. The manager is expected to be a business-savvy user comfortable with administrative dashboards. They interact with the Profile, Command (order processing), Menu (dish/banner management), Finance (revenue and refunds), and History (order archives) tabs. | Moderate to High — Expected to understand order lifecycle management, menu catalog administration, and basic financial metrics. Must be comfortable with form-heavy data entry for dish creation and editing. | Order acceptance/rejection, status advancement, dish CRUD, ingredient management, banner management, financial monitoring, refund processing, order history review, logout |
| **Rider** | A delivery personnel who claims delivery assignments, navigates to customer locations, completes deliveries, and collects cash payments. Riders are expected to be field workers using the app while on the move. They interact with the Profile, Assignments (available and active deliveries), and Earnings (financial summary) tabs. | Low to Moderate — Must be comfortable with GPS-based navigation, phone calling, and confirming delivery status on a mobile device while in transit. | Delivery claiming, GPS navigation, customer calling, delivery completion, COD collection, earnings tracking, delivery history review, logout |

All three roles share a common authentication interface (login and registration screens) and are differentiated at runtime by the `session.role` field stored in the `app_session` database table. The application routes each authenticated user to their role-specific dashboard (`CustomerDashboard`, `ManagerDashboard`, or `RiderDashboard`) immediately upon successful login.

### 2.4 Operating Environment

The Custom-Bite Suite application is designed to operate in the following environment:

**Target Platform:**
- **Primary**: Android mobile devices (smartphones and tablets) running Android 5.0 (API level 21) or higher
- **Secondary (Framework-Supported)**: iOS devices running iOS 13.0 or higher (supported by the React Native and Expo framework but not the primary deployment target)
- **Tertiary**: Web browsers via Expo's web export (basic support configured in `app.json`)

**Runtime Environment:**
- **Framework**: React Native 0.81.5 with Expo SDK 54.0.33
- **Architecture**: Expo New Architecture enabled (`newArchEnabled: true`) for improved performance through Fabric renderer and TurboModules
- **JavaScript Engine**: Hermes (default engine for React Native 0.81.x on Android)
- **Local Database**: SQLite via `expo-sqlite` 16.0.10 — the application creates and manages a single database file (`custom_bite_suite.db`) on the device's local filesystem
- **Navigation**: React Navigation 7.x using native stack navigator for screen transitions and bottom tab navigator patterns
- **Gesture Handling**: `react-native-gesture-handler` 2.28.0 with `GestureHandlerRootView` wrapping the entire application
- **Animations**: `react-native-reanimated` 4.1.1 for performant, native-driven UI animations

**Build and Development Environment:**
- **Language**: TypeScript 5.9.2 with strict type checking
- **Build Tool**: Expo CLI and Gradle (Android)
- **Package Manager**: npm (with `package-lock.json` for deterministic installs)
- **Testing**: Jest 29.7.0 with `jest-expo` 54.0.17 and `@testing-library/react-native` 13.3.3
- **Linting**: ESLint 10.2.0 with `@typescript-eslint` parser and plugin
- **Validation**: Zod 4.3.6 for runtime schema validation of login and registration payloads

**Device Permissions Required:**
- `ACCESS_FINE_LOCATION` — Required for GPS-based delivery address selection and real-time rider location tracking
- `ACCESS_COARSE_LOCATION` — Fallback location permission for approximate positioning
- Media Library Access — Required at runtime (via `expo-image-picker`) for uploading dish and banner images from the device's photo library

**Network Requirements:**
- The application operates primarily **offline** with all data persisted locally in SQLite
- Internet connectivity is required only for: loading remote banner images (placeholder URLs), opening Google Maps navigation links, and initiating phone calls/emails to external contacts

### 2.5 Design and Implementation Constraints

The following constraints have been identified and apply to the design and implementation of the Custom-Bite Suite application:

1. **Local-Only Data Architecture**: All application data is stored in a local SQLite database on the device. There is no remote server, REST API, or cloud synchronization. This means that data is device-bound — a customer's orders, a manager's menu changes, and a rider's delivery history are local to the specific device on which the application is installed. Multi-device data sharing is not supported.

2. **Single-User Session Model**: The application supports only one active session at a time, enforced by the `app_session` table with a single-row constraint (`id = 1` with `CHECK(id = 1)`). Logging in as a different user overwrites the previous session. Simultaneous multi-user access on the same device is not supported.

3. **Single-Vendor Architecture**: The system is designed for a single restaurant vendor. There is no multi-tenant support, no vendor registration flow, and no marketplace functionality. All menu items, orders, and financial metrics belong to a single restaurant entity.

4. **No Real-Time Server Push**: Because there is no backend server, the application cannot receive real-time push notifications. Order status updates, new order arrivals, and refund status changes are only visible when the user navigates to the relevant screen (which triggers a snapshot reload from the local database). Polling or background refresh is not implemented.

5. **Password Security Limitation**: Passwords are hashed using SHA-256 via `expo-crypto`, which, while cryptographically secure for basic integrity checking, is not the recommended approach for production password storage (bcrypt, scrypt, or Argon2 would be preferred). This is a known limitation appropriate for the application's demonstration/academic context.

6. **Fixed Delivery Fee**: The delivery fee is a constant $3.50 per order (defined as `DELIVERY_FEE = 3.5` in `orderMath.ts`), regardless of distance, order size, or delivery complexity. Dynamic delivery fee calculation based on distance or demand is not implemented.

7. **Portrait-Only Orientation**: The application is locked to portrait orientation (`"orientation": "portrait"` in `app.json`), which limits usability on tablets in landscape mode.

8. **TypeScript Strict Mode**: All source code is written in TypeScript with strict type checking enabled. Third-party libraries must have compatible type definitions or be wrapped with appropriate type declarations.

9. **Expo Managed Workflow**: The application uses Expo's managed workflow, which means native code modifications must go through Expo's plugin system (`expo-build-properties`, `expo-sqlite`). Direct modification of native Android/iOS project files is discouraged unless ejected.

10. **SQLite Concurrency**: The `expo-sqlite` library has known limitations with concurrent async database reads sharing a single database handle. The application mitigates this by serializing snapshot reads (sequential `await` calls rather than `Promise.all`) in the `loadSnapshot` function.

11. **Cleartext Traffic**: The Android configuration explicitly allows cleartext (HTTP) traffic (`usesCleartextTraffic: true` in `expo-build-properties`), which is necessary for loading placeholder banner images over HTTP but would need to be restricted in a production deployment.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### FR-01: User Registration
- **FR-01.1**: The system shall provide a registration form collecting: role (Customer, Manager, or Rider), first name (minimum 2 characters), last name (minimum 2 characters), username (minimum 3 characters, alphanumeric with dots, dashes, and underscores only), email (valid email format), phone (minimum 10 digits, numeric with optional `+`, space, and dash), date of birth (in YYYY-MM-DD format), password (minimum 8 characters, at least one uppercase letter and one digit), and password confirmation.
- **FR-01.2**: The system shall validate all registration fields using Zod schema validation before submission, displaying inline error messages for each invalid field.
- **FR-01.3**: The system shall hash the user's password using SHA-256 before storing it in the database.
- **FR-01.4**: The system shall reject registration if the provided email, username, or phone number already exists in the `users` table (case-insensitive comparison for email and username).
- **FR-01.5**: Upon successful registration, the system shall automatically log in the newly created user by inserting a session record into the `app_session` table and log an audit entry with action "register".

#### FR-02: User Login
- **FR-02.1**: The system shall provide a login form accepting an identifier (email, username, or phone) and a password, with a role selector (Customer, Manager, Rider).
- **FR-02.2**: The system shall match the provided identifier against the `email`, `username`, and `phone` columns in the `users` table (case-insensitive for email and username), filtered by the selected role.
- **FR-02.3**: The system shall compare the SHA-256 hash of the provided password against the stored `password_hash` and reject login if they do not match, displaying the error message "Password is incorrect".
- **FR-02.4**: Upon successful login, the system shall upsert a session record in the `app_session` table (using `ON CONFLICT(id) DO UPDATE`) and log an audit entry with action "login".
- **FR-02.5**: The system shall provide pre-filled demo credentials for each role: Customer (sara / Customer123), Manager (manager / Manager123), Rider (rider1 / Rider123).

#### FR-03: User Logout
- **FR-03.1**: The system shall provide a logout button on each role's dashboard.
- **FR-03.2**: Upon logout, the system shall delete the session record from the `app_session` table, clear the in-memory cart, and log an audit entry with action "logout".
- **FR-03.3**: After logout, the system shall redirect the user to the AuthScreen (login/registration screen).

#### FR-04: Menu Browsing and Search
- **FR-04.1**: The system shall display all available dishes (`is_available = 1`) organized by their assigned category, with each dish rendered as a card showing: dish image (or placeholder), dish name, star rating with numeric average and review count, price (including mandatory ingredient surcharges), description, category name, preparation time in minutes, and calorie count.
- **FR-04.2**: The system shall provide a text search field that filters dishes in real-time by matching the search term against dish names and ingredient names (case-insensitive substring matching).
- **FR-04.3**: The system shall provide horizontally scrollable category pills (including an "all" option) that filter the dish list to show only dishes belonging to the selected category.
- **FR-04.4**: The system shall display promotional banners in an auto-rotating horizontal carousel (rotating every 4.5 seconds) with pagination dots, where each banner shows an image, title, and description.

#### FR-05: Dish Customization
- **FR-05.1**: The system shall display a dedicated dish detail screen (DishTab) when a dish is tapped, showing: full-resolution dish image, dish name, description, spice level, preparation time, calorie count, star rating with review count, and customizable ingredient sections grouped by ingredient category.
- **FR-05.2**: The system shall render ingredients with checkboxes in three behavioral modes:
  - **Mandatory ingredients**: Checkbox is always checked and disabled (non-interactive). These ingredients are always included in the order.
  - **Default ingredients**: Checkbox is checked by default. Unchecking creates a "remove" customization that subtracts the ingredient's extra price from the total.
  - **Optional extras**: Checkbox is unchecked by default. Checking creates an "add" customization that adds the ingredient's extra price to the total.
- **FR-05.3**: The system shall dynamically calculate and display the total price as: `(base dish price + sum of customization price deltas) × quantity`.
- **FR-05.4**: The system shall provide a quantity selector (increment/decrement buttons with minimum value of 1) and a free-text special instructions field.
- **FR-05.5**: Upon pressing "Add to cart", the system shall add the configured dish item (with customizations, quantity, and instructions) to the in-memory cart and navigate back to the menu.

#### FR-06: Cart Management
- **FR-06.1**: The system shall display all cart items with: dish name, applied customizations (action and ingredient name), special instructions, per-item quantity with increment/decrement controls, and item price (base price × quantity).
- **FR-06.2**: The system shall allow removing individual items from the cart and clearing the entire cart.
- **FR-06.3**: The system shall automatically remove items whose quantity is decremented to zero.
- **FR-06.4**: The system shall display an order summary showing: subtotal (sum of all item prices with customization deltas), active discount (percentage and calculated amount from qualifying offers), delivery fee ($3.50 flat rate), and total (subtotal − discount + delivery fee).

#### FR-07: Order Placement
- **FR-07.1**: The system shall require a valid delivery location (GPS coordinates or manual address) before allowing order submission.
- **FR-07.2**: The system shall provide two order submission buttons: "Pay online" (payment method: `card`, payment status: `paid`) and "Cash on delivery" (payment method: `cod`, payment status: `cod_pending`).
- **FR-07.3**: Upon order placement, the system shall: insert an order record with status "pending" into the `orders` table; insert order item records into `order_items` with calculated unit prices (base price + customization deltas); insert customization records into `order_item_customizations`; compute and store ingredient snapshots in `order_item_ingredients` capturing the exact ingredient composition at the time of order; clear the in-memory cart; and log an audit entry with action "create".
- **FR-07.4**: The system shall resolve the delivery address as: the manual address string (if manual entry is enabled and all fields are filled), or "Pinned location (lat, lon)" if GPS coordinates are used without a manual address.

#### FR-08: Order Tracking
- **FR-08.1**: The system shall display active orders (statuses: pending, accepted, preparing, ready, on_the_way) in the "Live tracking" section of the customer's Orders tab.
- **FR-08.2**: Each active order shall display: order ID, creation date and time, current status badge, itemized contents with quantities and customizations, rider information (name, phone, GPS coordinates) when assigned, a visual timeline showing completed/pending status steps with timestamps, delivery notes, total price, and payment method.
- **FR-08.3**: The system shall allow customers to cancel orders that have not yet reached "ready" status (cancellable statuses: pending, accepted, preparing).
- **FR-08.4**: For orders in "on_the_way" status, the system shall provide a "View Live Tracking" button that opens the LiveTrackingScreen showing: estimated arrival time (computed via Haversine formula), remaining distance (in km or meters), route visualization with rider and destination dots, rider name and "On the way" status, a "Call Rider" button linked to the rider's phone number, and expandable detail sections for rider info, route details, order summary, itemized order contents, and delivery notes.

#### FR-09: Order Processing (Manager)
- **FR-09.1**: The system shall display all pending orders in the "Incoming Orders" section of the Manager Command tab, showing: order ID, status badge, customer name, customer phone, itemized contents, total price, and payment method.
- **FR-09.2**: The manager shall be able to accept a pending order (advancing it to "accepted" status) or reject it (setting status to "rejected" with a timestamp and audit log entry).
- **FR-09.3**: The manager shall be able to advance orders through the kitchen pipeline: accepted → preparing → ready → on_the_way, with each transition recording a timestamp in the corresponding column and creating an audit log entry.
- **FR-09.4**: The system shall prevent the manager from marking orders as "delivered" (this is a rider-only action enforced in the `advanceOrder` function).
- **FR-09.5**: The system shall prevent status advancement of rejected or canceled orders.

#### FR-10: Menu Management (Manager)
- **FR-10.1**: The manager shall be able to create new dishes by specifying: dish name, description, base price, preparation time (minutes), calorie count, spice level, category assignment, availability toggle, dish image (URL or device upload), and one or more ingredient categories each containing one or more ingredients.
- **FR-10.2**: The manager shall be able to edit existing dishes with all fields pre-populated from the current database state, including reconstructed ingredient categories and ingredient assignments.
- **FR-10.3**: The manager shall be able to delete dishes from the menu (hard delete from the `dishes` table with cascading deletion of related ingredient categories and dish ingredients).
- **FR-10.4**: The system shall validate dish payloads before saving: dish name is required, dish description is required, ingredient names must be unique within a dish.
- **FR-10.5**: For each ingredient, the manager shall configure: name, extra price, and flags (is_default, is_mandatory). Mandatory ingredients automatically have `can_add` and `can_remove` set to false.

#### FR-11: Banner Management (Manager)
- **FR-11.1**: The manager shall be able to create, edit, and delete promotional banners.
- **FR-11.2**: Each banner shall have: an image (URL or device-uploaded file), title, description, sort order (numeric), and active/inactive status.
- **FR-11.3**: Only active banners (`is_active = 1`) shall be displayed on the customer's Explore tab.
- **FR-11.4**: The system shall enforce that only users with the "manager" role can create, update, or delete banners.

#### FR-12: Financial Dashboard (Manager)
- **FR-12.1**: The system shall compute and display: daily revenue (sum of delivered order totals created today), weekly revenue (sum of delivered order totals created this week, Monday start), monthly revenue (sum of delivered order totals created this month), and outstanding COD balance (sum of totals for COD orders not yet marked as collected).
- **FR-12.2**: Revenue calculations shall use the `date-fns` library functions `isSameDay`, `isSameWeek`, and `isSameMonth` for accurate date grouping.

#### FR-13: Refund Management
- **FR-13.1**: Customers shall be able to submit refund requests for delivered orders by providing a reason and detailed description.
- **FR-13.2**: The system shall prevent duplicate refund requests for the same order (enforced by a `UNIQUE` constraint on `order_id` in the `refund_requests` table).
- **FR-13.3**: The system shall prevent refund requests for rejected or canceled orders.
- **FR-13.4**: The manager shall be able to view all refund requests (with order ID, reason, details, and current status) and approve or deny each request with a resolution note.
- **FR-13.5**: Refund decisions shall be recorded with: updated status (approved/denied), resolution note, review timestamp, and reviewer user ID.

#### FR-14: Rider Delivery Management
- **FR-14.1**: Riders shall be able to view all unclaimed delivery orders (status: "on_the_way", rider_id: NULL) with customer information, item summary, delivery address, total, and payment method.
- **FR-14.2**: Riders shall be able to claim a delivery using an atomic SQL update with optimistic locking (`WHERE rider_id IS NULL OR rider_id = ?`) to prevent race conditions.
- **FR-14.3**: Riders shall be able to mark orders as delivered, which: advances the order status from "on_the_way" to "delivered" with a delivery timestamp, and if the payment method is COD with status "cod_pending", automatically sets payment status to "cod_collected" with a cash collection timestamp.
- **FR-14.4**: The system shall provide real-time GPS tracking of the rider's position using `expo-location` with `watchPositionAsync` (accuracy: Balanced, time interval: 10 seconds, distance interval: 10 meters).

#### FR-15: Review and Rating System
- **FR-15.1**: Customers shall be able to rate dishes on a 1-5 star scale using an interactive star selector and provide a written comment.
- **FR-15.2**: The system shall enforce one review per customer per dish at the database level (`UNIQUE(dish_id, customer_id)` constraint on the `reviews` table).
- **FR-15.3**: If a customer has previously reviewed a dish, the system shall pre-populate the review form with the existing rating and comment, and submitting shall update the existing review rather than creating a new one.
- **FR-15.4**: The system shall compute the average rating and total review count for each dish and display these on menu cards and dish detail screens.
- **FR-15.5**: Reviews shall be updated in the local UI state immediately upon submission for real-time visual feedback.

#### FR-16: Audit Logging
- **FR-16.1**: The system shall record an audit log entry for every significant action, including: user login, user logout, user registration, order creation, order status transitions (accepted, preparing, ready, on_the_way, delivered), order rejection, order cancellation, rider delivery claim, dish creation/update/deletion, banner creation/update/deletion, refund request creation, refund decision (approved/denied), COD cash collection, and rider assignment.
- **FR-16.2**: Each audit log entry shall record: actor user ID, entity type (session, user, order, dish, refund_request, banner), entity ID, action description, detail text, and ISO 8601 timestamp.

### 3.2 Non-Functional Requirements

#### NFR-01: Performance
- **NFR-01.1**: The application shall load the initial database schema, seed data, curated menu synchronization, and ingredient snapshot backfill within 5 seconds on a mid-range Android device.
- **NFR-01.2**: The application snapshot (full database read including users, offers, banners, categories, ingredient categories, ingredients, dishes with joined ingredients and reviews, orders with joined items/customizations/ingredient snapshots/refunds, audit logs, computed metrics, and session) shall complete within 2 seconds.
- **NFR-01.3**: The banner carousel shall rotate every 4.5 seconds with smooth CSS-based animation and no visible frame drops.
- **NFR-01.4**: GPS location updates for rider tracking shall arrive at 10-second intervals when the device is in motion (distance threshold: 10 meters).

#### NFR-02: Reliability
- **NFR-02.1**: All database write operations that involve multiple tables (order placement, dish upsert, menu synchronization, schema migration) shall be wrapped in exclusive SQLite transactions (`withExclusiveTransactionAsync`) to ensure atomicity and prevent partial writes.
- **NFR-02.2**: The `loadSnapshot` function shall use per-section error catching with fallback empty arrays/null values, ensuring that a failure in one data section (e.g., audit logs) does not prevent the rest of the application from loading.
- **NFR-02.3**: Schema migrations (ingredient table rebuild, orders table rebuild, dish ingredient schema upgrade) shall execute non-destructively with table existence and column presence checks before modifying the schema.

#### NFR-03: Usability
- **NFR-03.1**: The application shall use a consistent and visually distinctive design language featuring a "3D card" UI pattern with layered surfaces (top layer, bottom layer, base layer with shadow), glassmorphic elements, and a curated color palette (Onyx & Ember dark theme for auth, warm neutrals for customer, sage greens for manager, teal for rider).
- **NFR-03.2**: All interactive elements (buttons, pills, cards, checkboxes) shall provide visual press feedback through transform animations (`translateY: 6` on press).
- **NFR-03.3**: The application shall support keyboard avoidance on all scrollable screens (`KeyboardAvoidingView` with behavior "padding" on iOS and "height" on Android).
- **NFR-03.4**: Error messages shall be displayed inline below the affected form field in red text (`#DC2626`), with global error messages displayed as banners at the top of the screen.
- **NFR-03.5**: The application shall use a consistent order status badge system with color-coded backgrounds for each status: Pending (gray), Accepted (blue), Preparing (pink), Ready (amber), On the Way (green), Delivered (dark green), Rejected (red), Canceled (red).

#### NFR-04: Security
- **NFR-04.1**: All user passwords shall be hashed using the SHA-256 algorithm before storage; plaintext passwords shall never be persisted.
- **NFR-04.2**: Role-based access control shall be enforced at the repository layer: only managers can reject orders, advance kitchen statuses, manage dishes, manage banners, and process refunds; only riders can mark orders as delivered and claim deliveries; only customers can cancel their own orders and submit refund requests.
- **NFR-04.3**: Order cancellation shall verify that the requesting customer ID matches the order's customer ID before allowing the operation.
- **NFR-04.4**: Refund requests shall verify that the order belongs to the requesting customer and that the order is not in a rejected or canceled state.

#### NFR-05: Maintainability
- **NFR-05.1**: The application codebase shall use TypeScript with strict type checking (`"strict": true` in `tsconfig.json`) to catch type errors at compile time.
- **NFR-05.2**: All data types shall be centrally defined in a single `types.ts` file with 316 lines of strongly-typed interfaces and type aliases covering all domain entities.
- **NFR-05.3**: The data access layer shall be encapsulated in a single `repository.ts` file (2,294 lines) providing a clean API surface of exported functions that abstract all SQL operations.
- **NFR-05.4**: The application state shall be managed through a single React Context (`AppContext`) providing a unified `AppSnapshot` type with 30+ action methods, ensuring a single source of truth for all UI components.
- **NFR-05.5**: Shared UI components (ScreenCard, Card3D, SectionTitle, Pill, AppButton, Field, Checkbox, OrderStatusBadge) shall be centralized in `common.tsx` for consistency and reuse.

#### NFR-06: Portability
- **NFR-06.1**: The application shall be buildable as a standalone Android APK (release variant) that bundles the JavaScript runtime and does not require a development Metro server.
- **NFR-06.2**: The application architecture (React Native + Expo) shall be inherently portable to iOS with minimal configuration changes (iOS support is declared in `app.json` with `supportsTablet: true`).

### 3.3 Hardware and Software Requirements

#### Hardware Requirements

| Component | Minimum Requirement | Recommended |
|-----------|-------------------|-------------|
| **Device Type** | Android smartphone or tablet | Android smartphone with GPS |
| **Processor** | ARM-based processor (ARMv7 or ARM64) | ARM64 (64-bit) processor |
| **RAM** | 2 GB | 4 GB or more |
| **Storage** | 100 MB free space (for APK + database) | 200 MB free space |
| **Display** | 4.5" screen, 720p resolution | 5.5"+ screen, 1080p resolution |
| **GPS** | GPS receiver (required for rider tracking and customer location) | GPS with GLONASS/Galileo support |
| **Network** | WiFi or mobile data (for banner images and map navigation) | 4G/LTE or WiFi |
| **Camera/Storage Access** | Media library access (for image uploads) | — |

#### Software Requirements

| Component | Requirement | Version |
|-----------|------------|---------|
| **Operating System** | Android | 5.0 (API level 21) or higher |
| **Runtime Framework** | React Native | 0.81.5 |
| **Expo SDK** | Expo | 54.0.33 |
| **JavaScript Engine** | Hermes | Bundled with React Native 0.81.x |
| **Local Database** | SQLite | Via expo-sqlite 16.0.10 |
| **Programming Language** | TypeScript | 5.9.2 |
| **React** | React | 19.1.0 |
| **Navigation** | React Navigation | 7.x (native-stack, bottom-tabs) |
| **Location Services** | expo-location | 19.0.8 |
| **Image Picker** | expo-image-picker | 55.0.18 |
| **Cryptography** | expo-crypto | 15.0.8 |
| **Maps** | react-native-maps | 1.20.1 |
| **Validation** | Zod | 4.3.6 |
| **Date Utilities** | date-fns | 4.1.0 |
| **Gesture Handling** | react-native-gesture-handler | 2.28.0 |
| **Animations** | react-native-reanimated | 4.1.1 |
| **SVG** | react-native-svg | 15.12.1 |
| **Icons** | @expo/vector-icons (Ionicons) | 15.1.1 |
| **Build System (Dev)** | Node.js + npm | Node.js 18+ recommended |
| **Build System (Android)** | Gradle | Via Android SDK |
| **Testing Framework** | Jest + jest-expo | Jest 29.7.0, jest-expo 54.0.17 |
| **Linting** | ESLint + @typescript-eslint | ESLint 10.2.0 |

---

## 4. Conclusion

This Software Requirements Specification document provides a complete and rigorous description of the Custom-Bite Suite application — a single-vendor, multi-role food delivery management platform built with React Native, Expo, and SQLite. The document captures 16 core functional requirement groups spanning user authentication, menu browsing, dish customization, cart management, order placement and tracking, kitchen command operations, menu administration, banner management, financial dashboards, refund processing, rider delivery logistics, review systems, and comprehensive audit logging. It further defines 6 non-functional requirement categories addressing performance, reliability, usability, security, maintainability, and portability, along with detailed hardware and software specifications.

The application demonstrates a production-grade architectural approach with a strongly-typed TypeScript codebase (316 lines of type definitions, 2,294 lines of data access logic), transactional database operations, role-based access control, cryptographic password handling, GPS-based geolocation, Haversine-formula distance calculations, and a rich 3D-layered UI design system. With 16 curated dishes across 8 categories, each with multi-level ingredient customization, the system presents a realistic and comprehensive food delivery platform suitable for both academic evaluation and real-world operational reference.

All requirements documented herein are traceable to the implemented codebase and have been derived from a thorough analysis of every source file, screen component, context provider, data repository function, utility module, type definition, and configuration file in the project.