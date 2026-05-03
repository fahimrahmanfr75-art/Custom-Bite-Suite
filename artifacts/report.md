# Technology and Tools

The Custom-Bite Suite application is built using a modern, cross-platform mobile development stack centered on React Native and the Expo framework. The following table provides a complete inventory of every technology, library, framework, and tool used in the project, along with its specific version and its role within the system:

## Core Framework and Runtime

| Technology | Version | Role |
|------------|---------|------|
| **React Native** | 0.81.5 | The core cross-platform mobile application framework that allows building native Android (and iOS) applications using JavaScript and React component architecture. Provides the bridge between JavaScript business logic and native platform UI rendering. |
| **Expo SDK** | 54.0.33 | A managed development platform built on top of React Native that provides a unified build system, native module management, over-the-air updates, and a comprehensive set of pre-built native APIs (camera, location, filesystem, cryptography). Eliminates the need for manual native code configuration. |
| **React** | 19.1.0 | The declarative UI library that powers the component-based architecture. All screens, cards, buttons, forms, and interactive elements are built as React functional components with hooks (`useState`, `useEffect`, `useMemo`, `useContext`). |
| **TypeScript** | 5.9.2 | A statically-typed superset of JavaScript used for the entire codebase. Provides compile-time type checking, interface definitions, generic types, and union/intersection types that prevent runtime type errors and improve code maintainability. All domain entities (User, Dish, Order, CartItem, etc.) are defined as TypeScript interfaces in `src/types.ts` (316 lines of type definitions). |
| **Hermes** | Bundled with RN 0.81.x | The JavaScript engine optimized for React Native that provides faster application startup, reduced memory usage, and smaller APK size compared to the legacy JavaScriptCore engine. Enabled by default in React Native 0.81.x on Android. |

## Navigation and Routing

| Technology | Version | Role |
|------------|---------|------|
| **@react-navigation/native** | 7.2.2 | The core navigation library providing the navigation container, navigation state management, and screen transition infrastructure. |
| **@react-navigation/native-stack** | 7.14.10 | Provides native stack navigator used for screen-to-screen transitions (e.g., AuthScreen → CustomerDashboard, menu → DishTab detail screen, orders → LiveTrackingScreen). Uses native platform navigation APIs for smooth, hardware-accelerated transitions. |
| **@react-navigation/bottom-tabs** | 7.15.9 | Provides the bottom tab navigator used within the CustomerDashboard to organize the four customer-facing tabs: Explore, Cart, Orders, and Account. Each tab renders a distinct scrollable view within the same screen container. |

## Data Persistence and Database

| Technology | Version | Role |
|------------|---------|------|
| **expo-sqlite** | 16.0.10 | The local database engine providing a full SQLite interface for on-device data persistence. All application data — users, dishes, orders, ingredients, reviews, refund requests, audit logs, banners, offers, and session state — is stored in a single SQLite database file (`custom_bite_suite.db`). The repository layer (`src/data/repository.ts`, 2,294 lines) provides 25+ exported functions that abstract all SQL operations behind a clean TypeScript API. Supports exclusive transactions (`withExclusiveTransactionAsync`) for atomic multi-table writes. |

## Location and Mapping

| Technology | Version | Role |
|------------|---------|------|
| **expo-location** | 19.0.8 | Provides GPS location services for two core features: (1) Customer delivery address pinning via `getCurrentPositionAsync` with high accuracy in the MapPickerScreen, and (2) Real-time rider location tracking via `watchPositionAsync` with balanced accuracy, 10-second time intervals, and 10-meter distance thresholds. Handles runtime permission requests for `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`. |
| **react-native-maps** | 1.20.1 | Provides the native map component for rendering Google Maps views. Used for location visualization in delivery tracking and address selection contexts. |

## Security and Validation

| Technology | Version | Role |
|------------|---------|------|
| **expo-crypto** | 15.0.8 | Provides cryptographic functions for secure password handling. User passwords are hashed using the SHA-256 algorithm via `Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password)` before storage in the database. Plaintext passwords are never persisted. |
| **Zod** | 4.3.6 | A TypeScript-first runtime schema validation library used to validate all user input during registration and login. The registration schema (`src/utils/validation.ts`) enforces: minimum character lengths for names and usernames, valid email format, phone number format, password complexity (minimum 8 characters, at least one uppercase letter, at least one digit), and password confirmation matching. |

## UI, Animation, and Gesture Handling

| Technology | Version | Role |
|------------|---------|------|
| **react-native-gesture-handler** | 2.28.0 | Provides a native gesture recognition system that replaces React Native's built-in touch handling with more performant, native-driven gesture processing. The `GestureHandlerRootView` wraps the entire application in `App.tsx` to enable gesture-based interactions throughout all screens. |
| **react-native-reanimated** | 4.1.1 | Provides high-performance, native-driven animations that run on the UI thread rather than the JavaScript thread. Used for smooth scroll-based banner carousel animations, press feedback effects, and screen transition animations. |
| **react-native-safe-area-context** | 5.6.0 | Provides safe area insets for handling device notches, status bars, home indicators, and other system UI elements. Ensures that content is never obscured by hardware or software system chrome. |
| **react-native-screens** | 4.16.0 | Enables native screen containers for each route in the navigation stack, improving memory efficiency and transition performance by using the platform's native view recycling mechanisms. |
| **react-native-svg** | 15.12.1 | Provides SVG rendering support for scalable vector graphics used in icons, illustrations, and decorative elements throughout the application. |
| **expo-linear-gradient** | 15.0.8 | Provides linear gradient backgrounds used in the authentication screen's "Onyx & Ember" dark-mode design. Creates smooth color transitions from dark teal to deep ember tones across the login and registration interfaces. |
| **@expo/vector-icons (Ionicons)** | 15.1.1 | Provides the Ionicons icon set (700+ icons) used throughout the application for navigation elements, action buttons, status indicators, informational badges, and decorative embellishments. Icons include: `chevron-back`, `call`, `navigate-outline`, `location-outline`, `timer-outline`, `person-circle`, `radio`, `alert-circle`, `refresh`, `checkmark-circle`, and others. |
| **expo-image-picker** | 55.0.18 | Provides access to the device's media library and camera roll for selecting images. Used by the manager role to upload dish images and promotional banner images directly from the device's photo gallery. Configured for 16:9 aspect ratio cropping with full quality. |

## Date and Time Utilities

| Technology | Version | Role |
|------------|---------|------|
| **date-fns** | 4.1.0 | A modern, modular date utility library used for financial metric calculations in the manager dashboard. Provides `isSameDay`, `isSameWeek` (with configurable week start), `isSameMonth`, and `parseISO` functions to accurately compute daily, weekly, and monthly revenue totals from order creation timestamps. |

## System Configuration

| Technology | Version | Role |
|------------|---------|------|
| **expo-status-bar** | 3.0.9 | Controls the device status bar appearance (light/dark text, background color) to maintain visual consistency with the application's theme. |
| **expo-system-ui** | 6.0.9 | Controls system-level UI properties such as the root view background color, ensuring a seamless visual experience during app startup and screen transitions. |
| **expo-build-properties** | 1.0.10 | Configures native build settings through `app.json` plugins, including: enabling the New Architecture (`newArchEnabled: true`) for Fabric renderer and TurboModules, enabling cleartext HTTP traffic for development, and setting minimum SDK versions. |

## Development and Quality Assurance Tools

| Technology | Version | Role |
|------------|---------|------|
| **ESLint** | 10.2.0 | Static code analysis tool that enforces coding standards, identifies potential errors, and ensures consistent code style across the entire TypeScript/React Native codebase. |
| **@typescript-eslint/parser** | 8.58.1 | Provides TypeScript-aware parsing for ESLint, enabling lint rules that understand TypeScript-specific syntax such as interfaces, generics, type assertions, and enums. |
| **@typescript-eslint/eslint-plugin** | 8.58.1 | Provides TypeScript-specific lint rules including no-unused-variables, no-explicit-any, consistent-type-definitions, and prefer-nullish-coalescing. |
| **Jest** | 29.7.0 | JavaScript testing framework used for unit testing business logic functions (order math calculations, validation schemas, location utilities). |
| **jest-expo** | 54.0.17 | Expo-specific Jest preset that configures the test environment for React Native components, providing mock implementations for native modules. |
| **@testing-library/react-native** | 13.3.3 | Provides utilities for testing React Native components in a user-centric way, focusing on how users interact with the UI rather than implementation details. |
| **babel-preset-expo** | 54.0.10 | Babel preset that configures JavaScript/TypeScript transpilation for Expo projects, enabling modern syntax features and platform-specific optimizations. |

## Build and Deployment Tools

| Technology | Role |
|------------|------|
| **Expo CLI** | Command-line interface for running the development server (`expo start`), generating native projects (`expo prebuild`), and managing Expo-specific configurations. |
| **Gradle (Android)** | The native Android build system used to compile Java/Kotlin code, package native libraries, bundle the JavaScript runtime, and produce the final APK artifact. Invoked via `gradlew assembleRelease` for production builds. |
| **Android Studio / Android SDK** | Provides the Android emulator, ADB debugging tools, and SDK components required for native Android compilation. |
| **Node.js + npm** | The JavaScript runtime (Node.js 18+) and package manager (npm) used for dependency installation, script execution, and development server hosting. |
| **Custom Build Script (`build_release_apk.bat`)** | A batch script that automates the release APK build process: bundling the JavaScript code with `npx react-native bundle`, compiling the native Android project with Gradle, and producing a self-contained APK that runs without a development Metro server. |

---

# Features

The Custom-Bite Suite application provides a comprehensive set of features organized by the three user roles it serves. Each feature is implemented, tested, and functional in the current codebase:

## Authentication and Account Management

| Feature | Description |
|---------|-------------|
| **Multi-Role Registration** | New users can register as a Customer, Manager, or Rider by providing: first name, last name, username, email, phone number, date of birth, password, and password confirmation. All fields are validated in real-time using Zod schemas that enforce minimum lengths, valid formats, password complexity (minimum 8 characters, at least one uppercase letter, at least one digit), and password confirmation matching. |
| **Flexible Login** | Users can log in using any one of their three identifiers — email, username, or phone number — combined with their password and role selector. The system performs case-insensitive matching for email and username, and exact matching for phone numbers. |
| **SHA-256 Password Security** | All passwords are cryptographically hashed using the SHA-256 algorithm via `expo-crypto` before storage. Plaintext passwords are never written to the database. |
| **Duplicate Prevention** | The system prevents registration with an email, username, or phone that already exists in the database (case-insensitive for email and username). |
| **Demo Credentials** | Pre-configured demo accounts are available for quick testing: Customer (sara / Customer123), Manager (manager / Manager123), Rider (rider1 / Rider123). |
| **Persistent Session** | User sessions are persisted in a local `app_session` table with upsert semantics, allowing the application to restore the logged-in user's context on subsequent launches without requiring re-authentication. |
| **Secure Logout** | Logging out deletes the session record, clears the in-memory cart, records an audit log entry, and redirects the user to the authentication screen. |

## Customer Features

| Feature | Description |
|---------|-------------|
| **Curated Menu Browsing** | Customers browse a fine-dining menu of 16 dishes organized into 8 categories: Amuse & Starters, Salads & Cheese, Handmade Pasta, Sea & Shore, From the Grill, Seasonal Sides, Desserts, and Cocktails & Zero Proof. Each dish card displays its name, image (or placeholder), star rating, review count, price (including mandatory ingredient surcharges), description, category, preparation time, and calorie count. |
| **Real-Time Search** | A search bar filters the menu in real-time by matching the query against dish names and ingredient names (case-insensitive substring matching), allowing customers to find dishes by ingredient keywords (e.g., searching "truffle" surfaces all truffle-containing dishes). |
| **Category Filtering** | Horizontally scrollable category pills (including an "All" option) instantly filter the dish grid to show only dishes in the selected category. |
| **Ingredient-Level Customization** | Each dish has a dedicated detail screen (DishTab) with interactive ingredient checkboxes grouped by category. Three ingredient types are supported: **Mandatory** (always included, checkbox locked), **Default** (included by default, removable by unchecking), and **Optional Extras** (not included, addable by checking with a per-ingredient surcharge). The total price updates dynamically as customizations are modified. |
| **Special Instructions** | Customers can enter free-text preparation instructions per dish item (e.g., "no nuts", "extra crispy", "allergen: shellfish") that are transmitted to the kitchen in the order record. |
| **Shopping Cart Management** | A full-featured cart with: per-item quantity controls (increment/decrement with minimum of 1), individual item removal, complete cart clearing, and automatic removal of zero-quantity items. The cart displays each item's customizations, instructions, and calculated price. |
| **Dynamic Price Summary** | The checkout screen shows: subtotal (sum of all item prices with customization deltas), active discount percentage and calculated discount amount (from qualifying promotional offers), flat delivery fee ($3.50), and final total. |
| **Delivery Location Selection** | Two address input methods: (1) GPS-based pinning via the MapPickerScreen that uses `expo-location` to capture the device's current GPS coordinates with high accuracy, and (2) Manual address entry with area name, road number, and house number fields. Customers can toggle between methods. |
| **Dual Payment Methods** | Orders can be placed with two payment options: "Pay online" (payment status: `paid`) or "Cash on Delivery" (payment status: `cod_pending`). |
| **Promotional Banner Carousel** | An auto-rotating horizontal carousel (4.5-second rotation interval) displays active promotional banners with pagination dots. Each banner features an image, title, and description set by the manager. |
| **Promotional Offers with Discounts** | Time-limited promotional offers are displayed in a scrollable carousel on the Explore tab. Customers can apply an eligible offer (e.g., "Midweek Chef Selection — 10% off") to receive a percentage discount on their order subtotal. |
| **Real-Time Order Tracking** | Active orders (pending through on_the_way) are displayed with: a visual step-by-step status timeline with timestamps for each completed phase, order ID, creation date, current status badge, itemized contents, rider information (when assigned), total price, and payment method. |
| **Live Delivery Tracking** | For orders in "on_the_way" status, a dedicated LiveTrackingScreen shows: estimated arrival time (calculated via Haversine formula), remaining distance (in km or meters), route visualization with rider and destination dots connected by a visual path, rider name and phone, a "Call Rider" button, and expandable detail sections for route info, order summary, item list, and delivery notes. |
| **Order Cancellation** | Customers can cancel orders that haven't yet reached the "ready" status (cancellable statuses: pending, accepted, preparing). |
| **Refund Requests** | Customers can submit refund requests for delivered orders by providing a structured reason and detailed description. The system prevents duplicate refund requests for the same order and blocks refunds for rejected or canceled orders. |
| **Dish Reviews and Ratings** | An interactive 1–5 star rating system with written comments. One review per customer per dish is enforced; submitting again updates the existing review. The review form pre-populates with the user's previous rating and comment if they have already reviewed the dish. Reviews are displayed immediately in the UI after submission. |
| **Profile and Account** | Customers can view their account details (name, username, email, phone, date of birth) and log out from the Account tab. |

## Manager Features

| Feature | Description |
|---------|-------------|
| **Incoming Order Processing** | The Command tab displays all pending orders with customer name, phone, itemized contents, total price, and payment method. The manager can accept each order (advancing to "accepted") or reject it (with an audit-logged reason). |
| **Kitchen Pipeline Management** | A filterable order status view covering all 8 statuses (pending, accepted, preparing, ready, on_the_way, delivered, rejected, canceled) with pill-based filters. The manager can advance orders through the kitchen flow: accepted → preparing → ready → on_the_way by pressing "Advance Status". |
| **Full Menu CRUD** | Complete dish lifecycle management: create new dishes, edit existing dishes (all fields pre-populated from database state), and delete dishes. Dish creation/editing includes: name, description, base price, preparation time, calorie count, spice level, category assignment, availability toggle (visible/hidden from customers), and image (URL or device upload via image picker). |
| **Ingredient Category Management** | Per-dish ingredient organization into named categories (e.g., "Seafood", "Citrus & Garden", "Finish"). Managers can add/remove categories, set category names and descriptions, and reorder categories. |
| **Individual Ingredient Management** | Within each category, managers can add/remove ingredients and configure: ingredient name, extra price, and behavioral flags (mandatory — always included; default — included but removable). Mandatory ingredients automatically disable the "can add" and "can remove" flags. |
| **Promotional Banner System** | Full CRUD for promotional banners: create, edit, and delete banners with image (URL or device upload), title, description, sort order, and active/inactive status. Only active banners are shown to customers. Managed via a modal-based editing interface. |
| **Financial Dashboard** | Computed revenue metrics displayed on the Finance tab: daily revenue (orders delivered today), weekly revenue (Monday-start week), monthly revenue (current calendar month), and outstanding COD balance (cash-on-delivery orders not yet marked as collected). All calculations use `date-fns` for accurate date grouping. |
| **Refund Processing** | View all customer refund requests with order ID, reason, details, and current status. Approve or deny each pending request with a resolution note. Decisions are recorded with a review timestamp and reviewer ID. |
| **Comprehensive Order History** | The History tab displays all completed, rejected, and canceled orders as expandable cards. Each expanded card shows: order summary (ID, status, timestamps, payment status, delivery location, coordinates, delivery notes), customer details (ID, name, phone, email), rider details (ID, name, phone), and full dish breakdown (dish name, quantity, unit price, line total, kitchen instruction notes, and ingredient snapshots grouped by category). |
| **Manager Profile** | View profile information (name, username, email, phone, role) and logout. |

## Rider Features

| Feature | Description |
|---------|-------------|
| **Available Delivery Browse** | The Assignments tab lists all unclaimed orders (status: "on_the_way", no assigned rider) with customer name, phone, itemized contents, delivery address, total, and payment method. |
| **Delivery Claiming** | Riders claim deliveries with an atomic SQL operation using optimistic locking (`WHERE rider_id IS NULL OR rider_id = ?`) to prevent double-claiming when multiple riders compete for the same order. |
| **Detailed Assignment Cards** | Claimed delivery assignments are displayed as rich, expandable cards showing: customer information (name, phone, email), delivery address (text or GPS coordinates), route visualization (rider dot → route line → destination dot), real-time distance and ETA (calculated via Haversine formula using `locationUtils.ts`), quick-action buttons (Call, Navigate, Details toggle), and full order details (items with quantities, customizations, ingredient snapshots, instructions, cost breakdown, payment info, delivery notes). |
| **GPS-Powered Live Tracking** | Real-time rider location tracking using `expo-location`'s `watchPositionAsync` with balanced accuracy, 10-second time intervals, and 10-meter distance thresholds. Location updates feed into distance and ETA calculations displayed on assignment cards. |
| **Google Maps Navigation** | A "Navigate" / "Open in Maps" button launches Google Maps with the delivery address as the navigation target, using URL deep links (`https://www.google.com/maps/search/`). Supports both text addresses and GPS coordinate queries. |
| **Customer Phone Call** | A "Call" button initiates a phone call to the customer via the device's native dialer using `tel:` deep links. |
| **Delivery Completion** | Marking an order as delivered: advances the status from "on_the_way" to "delivered" with a timestamp, and if the payment method is COD with status "cod_pending", automatically marks the cash as collected (`cod_collected`) with a collection timestamp. |
| **Support Contact** | A "Contact Support" button opens the device's email client pre-addressed to `support@custombite.com` with a prefilled subject line. |
| **Earnings Dashboard** | The Earnings tab shows: total earnings (sum of delivery fees from all completed deliveries), total delivery count, and average earnings per delivery. |
| **Delivery History** | A chronological list of all completed deliveries showing: order ID, delivery date/time, status badge, earnings amount, customer info, address, item count, order total, payment method and status, delivery notes, and per-item breakdown with customizations and instructions. |
| **Rider Profile** | View profile information (name, username, email, phone) and logout. |

## Cross-Cutting System Features

| Feature | Description |
|---------|-------------|
| **Comprehensive Audit Logging** | Every significant action in the system generates an immutable audit log entry recording: actor user ID, entity type (session, user, order, dish, refund_request, banner), entity ID, action description, detail text, and ISO 8601 timestamp. Tracked actions include: login, logout, registration, order creation, all status transitions, order rejection, order cancellation, rider claims, dish CRUD, banner CRUD, refund submissions, refund decisions, and COD collections. |
| **Ingredient Snapshot Preservation** | When an order is placed, the exact ingredient composition of each ordered dish is captured and frozen as an immutable snapshot in the `order_item_ingredients` table. This ensures that the manager and rider can see the exact ingredients the customer selected at order time, even if the dish's ingredient configuration is later changed or the dish is deleted. |
| **Curated Menu Auto-Synchronization** | On first application launch, the system automatically synchronizes a chef-curated catalog of 16 fine-dining dishes (with full ingredient category and ingredient definitions), 2 promotional banners, and 2 time-limited discount offers into the local SQLite database. The sync is idempotent — dishes, banners, and offers are only inserted if they don't already exist. |
| **Schema Migration System** | The database initialization code includes a multi-step migration system that checks for table existence and column presence before applying schema changes, rebuilds tables when structural modifications are required (using the `_old_` rename pattern), backfills computed data (ingredient snapshots for existing orders), and tracks migration state to prevent re-execution. |

---

# Implementation

## Interface Design / Front-End

The Custom-Bite Suite front-end is built entirely with React Native functional components using TypeScript. The user interface follows a **3D Layered Card design system** with a suite of reusable shared components defined in `src/components/common.tsx` (562 lines). The design language features three stacked visual layers per card — a top content layer, a mid-tone shadow layer, and a dark base layer — that create a tactile, depth-rich appearance with press-down animations on interactive elements.

### Design System Components

| Component | Purpose |
|-----------|---------|
| **ScreenCard** | The primary section container used across all dashboards. Renders a three-layer card (top: `#F9F6EE`, mid: `#D7D1BE`, base: `#6F6A5C`) with 24px border radius, 18px padding, and 12px gap between children. All major content blocks on every screen are wrapped in a ScreenCard. |
| **Card3D** | A nested card component for items within a ScreenCard (order panels, dish cards, history cards, ingredient editors). Uses a tighter three-layer stack (top: `#FBFCF8`, mid: `#E1DBC9`, base: `#7E786C`) with 14px border radius and 12px padding. |
| **AppButton** | A universal button component supporting four variants: **Primary** (ember `#D45D31` — for main actions like Accept, Add to Cart, Save), **Secondary** (teal `#174C4F` — for auxiliary actions like Edit, Upload, Open in Maps), **Ghost** (white `#FFFCF4` with dark text — for navigation like Back, Cancel), and **Danger** (crimson `#9D3C2A` — for destructive actions like Reject, Delete, Remove). All buttons include a shine overlay and press-down transform animation (`translateY: 6px`). |
| **Pill** | A toggleable chip/tag component used for category filters, status filters, tab selectors, and boolean toggles. Active state uses teal background (`#174C4F`) with cream text; inactive state uses muted gray (`#E7E3D9`) with teal text. Capsule shape with `borderRadius: 999`. |
| **Field** | A form input component with label text, three-layer input surface, error state styling (red border + error message), and support for multiline text, numeric keypads, and password masking. Used across all forms: registration, login, dish editing, banner editing, address entry, special instructions, and review comments. |
| **OrderStatusBadge** | A color-coded status indicator badge with eight distinct colors: Pending (gray `#E5E7EB`), Accepted (blue `#DBEAFE`), Preparing (pink `#FCE7F3`), Ready (amber `#FEF3C7`), On the Way (light green `#DCFCE7`), Delivered (dark green `#D1E9D5`), Rejected (red `#FCCCC3`), Canceled (red `#FCCCC3`). Supports compact and standard sizes. |
| **SectionTitle** | A section header component with bold title text (22px, weight 700), optional subtitle, and optional action slot (for placing buttons like "Add dish" or "Add category" inline with the title). |
| **Checkbox** | A custom checkbox component using `Pressable` with a square indicator that fills with a configurable accent color when checked. Used in the DishTab ingredient customization interface. |

### Screen Architecture

The application consists of 7 screen files and 3 component files:

| Screen | File | Lines | Role |
|--------|------|-------|------|
| **AuthScreen** | `AuthScreen.tsx` | 419 lines | The entry screen for unauthenticated users. Features an "Onyx & Ember" dark-mode theme with linear gradient backgrounds (dark teal to deep ember). Provides tabbed login/registration forms with role selector pills (Customer, Manager, Rider), field-level validation with inline error messages, and demo credential hints. Animated form transitions and secure password entry with show/hide toggle. |
| **CustomerDashboard** | `CustomerDashboard.tsx` | ~800 lines | The main customer interface with four logical sections managed by state: **Explore** (banner carousel, offer cards, search bar, category pills, dish grid), **Cart** (item list, quantity controls, price summary, location picker toggle, payment buttons), **Orders** (active tracking with timeline, completed history, refund submission), and **Account** (profile display, logout). Manages the full cart state, checkout flow, and review submission. |
| **DishTab** | `DishTab.tsx` | 695 lines | A full-screen dish detail view accessible from the customer's Explore tab. Displays the dish hero image, name, description, metadata (spice, prep time, calories), star rating, ingredient customization checkboxes grouped by category, quantity selector, dynamic price calculation, "Add to cart" action, and a review section with interactive star input and existing review display. |
| **ManagerDashboard** | `ManagerDashboard.tsx` | 1,330 lines | The most complex screen in the application. Tabbed interface with five sections: **Profile** (info + logout), **Command** (incoming orders with accept/reject + kitchen pipeline with status filter pills and advance controls), **Menu** (dish list with edit/delete actions, dish editor form with image upload, ingredient category/ingredient management, and banner system with modal editor), **Finance** (revenue metrics + refund processing with approve/deny), and **History** (expandable order archive cards with full details). |
| **RiderDashboard** | `RiderDashboard.tsx` | 477 lines | Three-tab rider interface: **Profile** (info + logout), **Assignments** (available unclaimed deliveries with claim button + active assignments rendered as RiderAssignmentCards with GPS tracking), and **Earnings** (metric cards for total earnings/delivery count/average + chronological delivery history). Integrates `expo-location` for real-time GPS tracking. |
| **LiveTrackingScreen** | `LiveTrackingScreen.tsx` | 586 lines | A dedicated tracking interface shown to customers when their order is on the way. Displays ETA and distance (computed via Haversine formula), route visualization (rider dot → path → destination dot), rider info card with call button, and expandable detail sections for route, order summary, items, and delivery notes. Includes a "Live Update" status badge. |
| **MapPickerScreen** | `MapPickerScreen.tsx` | 272 lines | A location picker screen that uses `expo-location` to acquire the customer's GPS coordinates. Shows a loading state during GPS acquisition, displays coordinates in a styled card, provides "Refresh Location" and "Set Delivery Location" actions, and handles permission denial and error states gracefully. |

| Component | File | Lines | Role |
|-----------|------|-------|------|
| **common.tsx** | `common.tsx` | 562 lines | The shared design system containing all reusable components (ScreenCard, Card3D, AppButton, Pill, Field, SectionTitle, OrderStatusBadge), the LayeredSurface rendering engine, and all common styles. |
| **RiderAssignmentCard** | `RiderAssignmentCard.tsx` | 850 lines | A complex, self-contained card component for rider delivery assignments. Features: header with order label and status badge, route visualization, distance/ETA info bar, quick-action icons (Call, Navigate, Details), footer action buttons (Open in Maps, Delivered), and expandable detail sections (customer info, address, order items with ingredients/customizations/instructions, cost breakdown, payment info, delivery notes, support contact). |
| **Checkbox** | `Checkbox.tsx` | ~50 lines | A custom checkbox component for ingredient selection in DishTab. |

### Role-Specific Color Themes

Each user role has a distinct color palette for immediate visual identification:

| Role | Primary Accent | Background Tone | Header Accent | Description |
|------|---------------|-----------------|---------------|-------------|
| **Auth Screen** | Ember `#D45D31` | Dark gradient (teal → black) | Onyx `#0F2529` | Dramatic dark-mode theme with glassmorphic input fields |
| **Customer** | Ember `#D45D31` | Warm cream `#F2EDE2` | Teal `#174C4F` | Warm neutral palette conveying a premium dining ambiance |
| **Manager** | Ember `#D45D31` | Sage `#EFF1EA` | Dark teal `#174C4F` | Muted, professional tone suited for operational dashboards |
| **Rider** | Teal `#0C7A67` | Mint `#EEF5F2` | Green `#0C7A67` | Cool, energetic palette reflecting active outdoor delivery |

---

## Back-End

The Custom-Bite Suite's back-end is implemented as a **local-first data layer** — there is no remote server, REST API, or cloud database. All data persistence, business logic, query processing, and transaction management is handled on-device through a SQLite database accessed via the `expo-sqlite` library. This architecture makes the application fully functional offline and eliminates external infrastructure dependencies.

### Database Architecture

The application uses a single SQLite database file (`custom_bite_suite.db`) containing **13 tables**:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **users** | Stores all registered user accounts across all three roles. | `id`, `role`, `first_name`, `last_name`, `username`, `email`, `phone`, `date_of_birth`, `password_hash`, `address_line`, `latitude`, `longitude`, `notes`, `created_at` |
| **categories** | Menu categories that organize dishes (e.g., "Amuse & Starters", "Handmade Pasta"). | `id`, `name`, `description`, `sort_order` |
| **dishes** | All menu items with pricing, metadata, and availability status. | `id`, `category_id`, `name`, `description`, `price`, `prep_time_minutes`, `calories`, `spice_level`, `is_available`, `image_url`, `created_at` |
| **ingredients** | A global ingredient name registry (shared across dishes). | `id`, `name` |
| **ingredient_categories** | Per-dish groupings that organize ingredients into labeled sections (e.g., "Seafood", "Sauce", "Enhancements"). | `id`, `dish_id`, `name`, `description`, `sort_order` |
| **dish_ingredients** | The junction table linking ingredients to dishes with behavioral configuration. | `id`, `dish_id`, `ingredient_id`, `ingredient_category_id`, `is_mandatory`, `is_default`, `extra_price`, `can_add`, `can_remove`, `sort_order` |
| **orders** | All customer orders with full lifecycle tracking — 11 timestamp columns for every status transition. | `id`, `customer_id`, `customer_email`, `rider_id`, `address_line`, `latitude`, `longitude`, `delivery_notes`, `status`, `payment_method`, `payment_status`, `subtotal`, `discount`, `delivery_fee`, `total`, `created_at`, `accepted_at`, `preparing_at`, `ready_at`, `picked_up_at`, `delivered_at`, `rejected_at`, `canceled_at`, `rider_latitude`, `rider_longitude`, `cash_collected_at` |
| **order_items** | Individual line items within an order, capturing the dish and quantity at time of purchase. | `id`, `order_id`, `dish_id`, `quantity`, `unit_price`, `instructions` |
| **order_item_customizations** | Records of ingredient customizations (adds/removes) applied to each order item. | `id`, `order_item_id`, `ingredient_id`, `action`, `price_delta` |
| **order_item_ingredients** | Immutable ingredient snapshots capturing the exact ingredient composition of each ordered dish at the moment the order was placed. | `id`, `order_item_id`, `ingredient_id`, `ingredient_name`, `ingredient_category_name`, `is_mandatory`, `is_default`, `extra_price` |
| **reviews** | Customer dish reviews with ratings and comments. Enforces `UNIQUE(dish_id, customer_id)`. | `id`, `dish_id`, `customer_id`, `rating`, `comment`, `created_at` |
| **refund_requests** | Customer refund submissions with manager review workflow. Enforces `UNIQUE(order_id)`. | `id`, `order_id`, `customer_id`, `reason`, `details`, `status`, `resolution_note`, `reviewed_at`, `reviewed_by`, `created_at` |
| **audit_logs** | Immutable audit trail of all significant system actions. | `id`, `user_id`, `entity_type`, `entity_id`, `action`, `detail`, `created_at` |
| **app_session** | Single-row session table tracking the currently logged-in user. Enforces `CHECK(id = 1)`. | `id`, `user_id`, `role`, `last_login_at` |
| **banner_images** | Promotional banners managed by the manager and displayed to customers. | `id`, `image_url`, `title`, `description`, `is_active`, `sort_order`, `created_at` |
| **offers** | Time-limited promotional discount offers. | `id`, `title`, `description`, `discount_percent`, `active_from`, `active_to`, `banner_color`, `created_at` |

### Repository Layer (`src/data/repository.ts` — 2,294 lines)

The repository is the single point of contact between the application's UI layer and the SQLite database. It exports **25+ functions** that encapsulate all SQL operations:

| Function | Purpose |
|----------|---------|
| `execSchema()` | Initializes the database schema with all 13+ tables, runs multi-step migrations (table rebuilds, column additions, data backfills), synchronizes the curated menu catalog, seeds demo user accounts, and performs ingredient snapshot backfilling for existing orders. All operations are wrapped in exclusive transactions. |
| `loadSnapshot()` | Reads the complete database state into an `AppSnapshot` TypeScript object containing: users, offers, banners, categories, ingredient categories, ingredients, dishes (with joined ingredients and reviews), orders (with joined items, customizations, ingredient snapshots, and refund requests), audit logs, computed manager metrics, and the current session. Uses sequential `await` calls to avoid SQLite concurrency issues. |
| `login()` | Validates credentials via Zod schema, matches the identifier against email/username/phone (case-insensitive), verifies the SHA-256 password hash, upserts the session record, and logs an audit entry. |
| `register()` | Validates all registration fields, checks for duplicate email/username/phone, hashes the password, inserts the user record, creates a session, and logs an audit entry. |
| `logout()` | Logs an audit entry and deletes the session record. |
| `placeOrder()` | The most complex transaction: validates cart and delivery location, looks up the customer account, fetches all ingredient configurations for ordered dishes, calculates order totals (subtotal, discount, delivery fee, total), inserts the order record, inserts order items with computed unit prices, inserts customization records, builds and stores ingredient snapshots, and logs an audit entry — all within a single exclusive transaction. |
| `advanceOrder()` | Validates actor role permissions, checks current order status, computes the next valid status in the pipeline, updates the order with the new status and corresponding timestamp, and logs an audit entry. Enforces: manager cannot mark as delivered (rider-only), rider can only complete on_the_way orders assigned to them, closed orders cannot be advanced. |
| `rejectOrder()` | Manager-only: validates the actor is a manager, checks the order is pending, sets status to "rejected" with a rejection timestamp, and logs an audit entry. |
| `cancelOrderByCustomer()` | Validates the order belongs to the requesting customer, checks the status is cancellable (pending, accepted, or preparing), sets status to "canceled" with a cancellation timestamp, and logs an audit entry. |
| `claimOrderByRider()` | Validates the actor is a rider, checks the order is on_the_way, performs an atomic update with optimistic locking (`WHERE rider_id IS NULL OR rider_id = ?`), assigns the rider's GPS coordinates, and logs an audit entry. |
| `upsertDishRecord()` | Handles both creation and editing of dishes within an exclusive transaction: inserts or updates the dish record, deletes and re-creates all ingredient categories and dish_ingredient associations, ensures ingredient name records exist in the global registry, normalizes sort orders, and logs an audit entry. |
| `deleteDishRecord()` | Deletes a dish from the menu (with cascading deletion of ingredient associations) and logs an audit entry. |
| `submitRefund()` | Validates order ownership and eligibility, checks for duplicate requests, inserts the refund record, and logs an audit entry. |
| `submitReview()` | Supports both insert (new review) and update (existing review) with upsert logic based on `dish_id + customer_id` uniqueness, and logs an audit entry. |
| `updateRefundDecision()` | Updates a refund request's status (approved/denied) with a resolution note, review timestamp, and reviewer ID, and logs an audit entry. |
| `confirmCash()` | Marks a COD order's payment as collected with a timestamp and logs an audit entry. |
| `upsertBannerImage()` / `removeBannerImage()` | Manager-only banner CRUD operations with auto-calculated sort order and audit logging. |
| `assignOrderRider()` | Assigns a specific rider to an order and logs an audit entry. |

### State Management (`src/context/AppContext.tsx` — 298 lines)

The `AppContext` is a React Context provider that serves as the single source of truth for the entire application. It:

1. **Initializes the database** on first render by calling `execSchema()` and `loadSnapshot()`.
2. **Exposes the snapshot** — a complete, denormalized view of the database state — to all child components via the `useApp()` hook.
3. **Provides 15+ action methods** (login, logout, register, placeOrder, moveOrderToNextStatus, rejectCustomerOrder, cancelOrder, upsertMenuDish, removeMenuDish, submitReview, submitRefundRequest, updateRefundDecision, claimDeliveryOrder, confirmOrderCash, upsertBanner, removeBanner) that delegate to repository functions and automatically reload the snapshot after each mutation.
4. **Manages the in-memory cart state** (items array, delivery coordinates, manual address fields, address mode toggle) that persists within the component's lifecycle.

---

## Modules

The Custom-Bite Suite codebase is organized into the following logical modules, each with a clearly defined responsibility:

### Module 1: Authentication Module
- **Files**: `AuthScreen.tsx`, `validation.ts`, `repository.ts` (login/register/logout functions)
- **Responsibility**: Handles all user identity operations — registration with Zod schema validation, multi-identifier login (email/username/phone), SHA-256 password hashing, session persistence via the `app_session` table, and secure logout with session cleanup. Provides role-based routing that directs authenticated users to their role-specific dashboard (CustomerDashboard, ManagerDashboard, or RiderDashboard).

### Module 2: Menu and Catalog Module
- **Files**: `CustomerDashboard.tsx` (Explore section), `DishTab.tsx`, `curatedMenu.ts`, `repository.ts` (dish/ingredient functions)
- **Responsibility**: Manages the entire restaurant menu catalog. Includes: curated menu auto-synchronization from `curatedMenu.ts` (16 dishes, 8 categories, 45+ ingredient categories, 130+ individual ingredients), real-time search and category filtering, dish detail display with ingredient customization, and the manager's full menu CRUD operations (create/edit/delete dishes, manage ingredient categories and ingredients).

### Module 3: Cart and Ordering Module
- **Files**: `CustomerDashboard.tsx` (Cart section), `orderMath.ts`, `MapPickerScreen.tsx`, `repository.ts` (placeOrder)
- **Responsibility**: Manages the customer's shopping experience from dish selection to order submission. Includes: in-memory cart state management (add/remove/update items with customizations), dynamic price calculation (subtotal with customization deltas, discount application, flat delivery fee, total), dual address input (GPS via MapPickerScreen or manual entry), dual payment method selection (card/COD), and the transactional order placement operation that atomically creates order records, line items, customizations, and ingredient snapshots.

### Module 4: Order Lifecycle Module
- **Files**: `CustomerDashboard.tsx` (Orders section), `ManagerDashboard.tsx` (Command section), `repository.ts` (advanceOrder/rejectOrder/cancelOrder)
- **Responsibility**: Manages the complete order lifecycle from placement to completion. Implements the 8-status state machine (pending → accepted → preparing → ready → on_the_way → delivered, with rejected and canceled as terminal states), role-based access control for status transitions (manager: accept/reject/advance; rider: deliver; customer: cancel), timestamp recording for each transition, and the filterable kitchen pipeline view with status-aware action buttons.

### Module 5: Delivery and Tracking Module
- **Files**: `RiderDashboard.tsx`, `RiderAssignmentCard.tsx`, `LiveTrackingScreen.tsx`, `locationUtils.ts`, `repository.ts` (claimOrderByRider/confirmCash)
- **Responsibility**: Manages all delivery logistics. For riders: available delivery browsing, atomic order claiming with optimistic locking, detailed assignment cards with expandable sections, real-time GPS tracking via `watchPositionAsync`, Haversine-based distance and ETA calculations, Google Maps navigation integration, customer call initiation, and delivery completion with automatic COD collection. For customers: real-time live tracking with ETA display, route visualization, rider info, and call capability. The `locationUtils.ts` module (156 lines) provides: `calculateDistance` (Haversine formula), `calculateDistanceInMeters`, `formatDistance`, `calculateETA`, `calculateETAWithStops`, `formatETA`, `getBearingEmoji`, `isRiderCloseToDest`, `getMidpoint`, and `calculateMapRegionDelta`.

### Module 6: Financial and Refund Module
- **Files**: `ManagerDashboard.tsx` (Finance section), `RiderDashboard.tsx` (Earnings section), `orderMath.ts`, `repository.ts` (submitRefund/updateRefundDecision)
- **Responsibility**: Handles all financial operations and metrics. For managers: computed revenue dashboards (daily/weekly/monthly using `date-fns`), outstanding COD tracking, and refund request processing (approve/deny with resolution notes). For riders: personal earnings tracking (total earnings, delivery count, average per delivery) and delivery history with per-order earnings. The `orderMath.ts` module (85 lines) provides: `calculateCartSubtotal`, `calculateOrderTotals` (subtotal calculation with discount and delivery fee), `nextOrderStatus` (state machine logic), and `buildManagerMetrics` (revenue aggregation).

### Module 7: Review and Feedback Module
- **Files**: `DishTab.tsx` (review section), `repository.ts` (submitReview)
- **Responsibility**: Manages the customer review and rating system. Provides: an interactive 1–5 star rating selector, a written comment input, one-review-per-customer-per-dish enforcement via database unique constraint, upsert logic that allows customers to edit their existing reviews, immediate local UI state updates for real-time feedback display, and aggregated average rating and review count computation displayed on menu cards.

### Module 8: Banner and Promotions Module
- **Files**: `ManagerDashboard.tsx` (Menu section — banner subsystem), `CustomerDashboard.tsx` (Explore section — carousel and offers), `curatedMenu.ts`, `repository.ts` (upsertBannerImage/removeBannerImage)
- **Responsibility**: Manages the promotional content system. For managers: banner CRUD operations (create/edit/delete) with image upload (URL or device picker), title, description, sort ordering, and active/inactive status toggle. For customers: auto-rotating banner carousel with 4.5-second intervals and pagination dots, and promotional offer cards displaying discount percentages, descriptions, and active date ranges.

### Module 9: Audit and Compliance Module
- **Files**: `repository.ts` (logAudit function, called from every mutation)
- **Responsibility**: Provides a tamper-evident audit trail of all significant system actions. Every repository mutation function calls `logAudit()` as its final operation, recording: the acting user's ID, the entity type being affected (session, user, order, dish, refund_request, banner), the entity's ID, a machine-readable action string, a human-readable detail description, and an ISO 8601 timestamp. The audit log is append-only and is surfaced in the manager's data layer for operational review.

### Module 10: Database and Migration Module
- **Files**: `repository.ts` (execSchema, schema creation, migration logic), `curatedMenu.ts` (seed data)
- **Responsibility**: Manages the SQLite database lifecycle from initial creation through schema evolution. Includes: 13-table schema definition with constraints (foreign keys, unique indexes, check constraints), multi-step migration system with table existence and column presence checks, non-destructive table rebuild pattern (rename → create → migrate → drop), curated menu synchronization (idempotent seeding of dishes, ingredients, categories, banners, offers, and demo users), and ingredient snapshot backfilling for orders created before the snapshot system was implemented. All migrations execute within exclusive transactions for atomicity.