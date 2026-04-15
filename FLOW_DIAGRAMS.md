# Implementation Flow Diagrams

## Customer Order Flow

```
CUSTOMER DASHBOARD (Browse Tab)
              ↓
        Add to Cart
              ↓
   CUSTOMER DASHBOARD (Cart Tab)
        ↙           ↘
   [SET LOCATION]  Items List
        ↓
 MapPickerScreen
  (Tap on map)
        ↓
 Select Coordinates
        ↓
 Confirm Location
        ↓
 (lat/lng stored in state)
        ↓
 [PLACE ORDER with location]
        ↓
   Order Created in DB
        ↓
 CUSTOMER DASHBOARD (Orders Tab)
   - Active Orders Section
```

---

## Customer Tracking Flow

```
CUSTOMER DASHBOARD (Orders Tab)
        ↓
   Active Orders
        ↓
   OrderCard Component
   (Status: "on_the_way")
        ↓
   "View Live Tracking" Button
   (Shows when status = on_the_way)
        ↓
   [CLICK TO TRACK]
        ↓
   LiveTrackingScreen
   ┌─────────────────────┐
   │ MAP DISPLAY         │
   │ 🔴 Rider Location   │
   │ 🟢 Delivery Point   │
   │ ----- Route -----   │
   │ Distance & ETA      │
   └─────────────────────┘
        ↓
   [TAP to EXPAND DETAILS]
        ↓
   ┌──────────────────────┐
   │ Rider Info           │
   │ Route Details        │
   │ Order Items          │
   │ Cost Breakdown       │
   │ Payment Info         │
   │ Delivery Notes       │
   └──────────────────────┘
```

---

## Rider Assignment Flow

```
RIDER DASHBOARD
      ↓
"assignments" Tab
      ↓
Available Deliveries
(status = on_the_way, no rider assigned)
      ↓
[ACCEPT DELIVERY]
      ↓
Order claimed by rider
      ↓
"My Assignments" Section
      ↓
RiderAssignmentCard
┌──────────────────────┐
│ Order #123           │
│ Customer Info        │
│                      │
│ ┌─────────────────┐  │
│ │ MINI MAP        │  │
│ │ 🔴 You  🟢 Dest │  │
│ │ 2km | 8 min     │  │
│ └─────────────────┘  │
│                      │
│ [📞] [🗺️] [📋]      │
└──────────────────────┘
      ↓
[TAP DETAILS / NAVIGATE / CALL]
      ↓
┌─────────────────────────┐
│ ASSIGNMENT CARD         │
│ (Expanded View)         │
│                         │
│ Customer Information    │
│ Delivery Address        │
│ Order Items             │
│ Ingredients             │
│ Customizations          │
│ Cost Breakdown          │
│ Payment Status          │
│ Delivery Notes          │
│ Support Contact         │
└─────────────────────────┘
      ↓
Complete Delivery
      ↓
Order moves to "delivered" status
```

---

## Location Selection UI Flow

```
┌─────────────────────────────────────┐
│        MapPickerScreen              │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────┐     │
│    │  INTERACTIVE MAP        │     │
│    │  (Full Screen)          │ [📍]│
│    │                         │     │
│    │  Default: Times Square  │     │
│    │  User Taps: Pin Placed  │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Delivery Location Selected         │
│  40.7128, -74.0060                  │
│                                     │
│  ┌──────────────────────────┐      │
│  │  Confirm Location        │      │
│  └──────────────────────────┘      │
│                                     │
│  ┌──────────────────────────┐      │
│  │  Cancel                  │      │
│  └──────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

---

## Live Tracking UI Flow

```
┌──────────────────────────────────┐
│   LiveTrackingScreen             │
├──────────────────────────────────┤
│                 ●Riding Live    │
│ ◄ Back  [Live Tracking]          │
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐ │
│ │      MAP VIEW                │ │
│ │                              │ │
│ │  Route:  ════════════════    │ │
│ │          🔴 Rider 🟢 You     │ │
│ │                              │ │
│ │  [Distance & ETA overlay]    │ │
│ │  2.1 km    |    8 min        │ │
│ │                              │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│                                  │
│ Estimated  | From         |  ▼  │
│ 8 minutes  | John Smith   | Tap │
│                                  │
│ [When Expanded ▼]                │
│ ┌─────────────────────────────┐ │
│ │Rider: John Smith            │ │
│ │Phone: +1 234-567-8900       │ │
│ │                             │ │
│ │Distance: 2.1 km             │ │
│ │ETA: 8 minutes               │ │
│ │                             │ │
│ │Order #123                   │ │
│ │Items: 2 dishes              │ │
│ │Total: ₹450                  │ │
│ │                             │ │
│ │• Biryani x1 (₹250)          │ │
│ │  Rice, Meat, Spices         │ │
│ │• Naan x2 (₹100)             │ │
│ │  Wheat, Butter              │ │
│ │                             │ │
│ │Notes: Call at arrival       │ │
│ └─────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

---

## Rider Assignment Card UI Flow

```
┌──────────────────────────────────────┐
│     RiderAssignmentCard              │
├──────────────────────────────────────┤
│                                      │
│  Order #123          [ON THE WAY]   │
│  John Smith                          │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │    MINI MAP PREVIEW            │ │
│  │    🔴 You   ─────── 🟢 Dest   │ │
│  │    2.1 km | 8 min  (overlay)   │ │
│  └────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  [📞 Call] [🗺️ Navigate] [📋 Expand] │
│                                      │
│ [When Expanded ▼]                    │
│ ┌──────────────────────────────────┐│
│ │ CUSTOMER INFORMATION             ││
│ │  Name: John Smith                ││
│ │  Phone: +1 234-567-8900 (tap)    ││
│ │  Email: john@example.com         ││
│ │                                  ││
│ │ DELIVERY ADDRESS                 ││
│ │  123 Main St, Apt 4B             ││
│ │  40.7128, -74.0060               ││
│ │                                  ││
│ │ ORDER DETAILS (2 items)          ││
│ │  Biryani x1        ₹250          ││
│ │  - Remove Chili                  ││
│ │  - Add Extra Rice                ││
│ │  Ingredients: Rice, Meat...      ││
│ │                                  ││
│ │  Naan x2           ₹100          ││
│ │  Ingredients: Wheat, Butter      ││
│ │                                  ││
│ │ COST BREAKDOWN                   ││
│ │  Subtotal        ₹400            ││
│ │  Delivery Fee    ₹50             ││
│ │  ═══════════════════             ││
│ │  TOTAL          ₹450             ││
│ │                                  ││
│ │ PAYMENT                          ││
│ │  Method: COD                     ││
│ │  Status: Pending Collection      ││
│ │                                  ││
│ │ NOTES                            ││
│ │  Call when arriving, apt is 4B   ││
│ │                                  ││
│ │  [📞 Contact Support]            ││
│ └──────────────────────────────────┘│
│                                      │
└──────────────────────────────────────┘
```

---

## State Management Flow

### CustomerDashboard State
```
deliveryLocation
  ↓ (MapPickerScreen)
  ├─ null (initial)
  ├─ { latitude, longitude } (after selection)
  └─ persists through checkout

trackingOrderId
  ↓ (Click "View Live Tracking")
  ├─ null (default)
  ├─ order.id (when tracking active)
  └─ opens LiveTrackingScreen

riderLocation (simulated)
  ↓ (5-second updates while trackingOrderId is set)
  ├─ null (initial)
  ├─ { latitude, longitude } (from GPS watch)
  └─ passed to LiveTrackingScreen
```

### RiderDashboard State
```
riderLocation (watched)
  ↓ (Continuous GPS tracking)
  ├─ null (initial)
  ├─ { latitude, longitude } (from Location.watchPositionAsync)
  └─ passed to RiderAssignmentCard components

activeTab
  ├─ 'profile'
  ├─ 'assignments' ← Location tracking active
  └─ 'earnings'
```

---

## Data Flow for Distance/ETA

```
LiveTrackingScreen
    ↓
Contains: order (with riderLatitude, riderLongitude, latitude, longitude)
    ↓
Call locationUtils functions:
    ├─ calculateDistance(riderLoc, deliveryLoc)
    │  ├─ Uses Haversine formula
    │  ├─ Returns distance in km
    │  └─ Passed to formatDistance()
    │
    ├─ formatDistance()
    │  ├─ Input: distance in km
    │  ├─ Decision: km or meters?
    │  └─ Returns: "2.1 km" or "500 m"
    │
    ├─ calculateETA(riderLoc, deliveryLoc)
    │  ├─ Default speed: 30 km/h
    │  ├─ Adds 2-min buffer
    │  └─ Returns: number of minutes
    │
    └─ formatETA()
       ├─ Input: minutes
       ├─ Decision: < 1 min?
       └─ Returns: "< 1 min" or "8 min"
    ↓
Display on UI
```

---

## Component Hierarchy

```
App
└─ CustomerDashboard (Tab-based)
   ├─ MapPickerScreen (Conditional)
   │  └─ MapView (react-native-maps)
   │     ├─ Marker
   │     └─ Button controls
   │
   ├─ LiveTrackingScreen (Conditional)
   │  └─ MapView + Polyline
   │     ├─ Marker (Rider)
   │     ├─ Marker (Delivery)
   │     └─ Expandable Details
   │
   └─ DishTab / Orders (Conditional)
      └─ OrderCard
         └─ "View Live Tracking" Button


App
└─ RiderDashboard (Tab-based)
   └─ assignments tab
      ├─ Available Deliveries
      │  └─ Basic Cards
      │
      └─ My Assignments
         └─ RiderAssignmentCard (Rich)
            ├─ Header Info
            ├─ Mini Map
            ├─ Quick Actions
            └─ Expandable Details
               ├─ Customer Info
               ├─ Delivery Address
               ├─ Order Items
               ├─ Cost Breakdown
               ├─ Payment Info
               └─ Delivery Notes
```

---

## Integration Points Checklist

### CustomerDashboard.tsx
- [x] Import MapPickerScreen
- [x] Import LiveTrackingScreen
- [x] Add state: showMapPicker
- [x] Add state: trackingOrderId
- [x] Add state: riderLocation
- [x] Implement: handleMapLocationSelected()
- [x] Implement: location watcher effect
- [x] Add conditional rendering for map picker
- [x] Add conditional rendering for live tracking
- [x] Update OrderCard to accept onTrackLive prop
- [x] Add tracking button to OrderCard

### RiderDashboard.tsx
- [x] Import RiderAssignmentCard
- [x] Import Location from expo-location
- [x] Add state: riderLocation
- [x] Implement: GPS location tracking
- [x] Implement: handleCallCustomer
- [x] Implement: handleStartNavigation
- [x] Implement: handleContactSupport
- [x] Replace assignment cards with RiderAssignmentCard
- [x] Pass callbacks to RiderAssignmentCard

---

## Error Handling Flows

### Location Permission Denied
```
MapPickerScreen
    ↓
requestForegroundPermissionsAsync()
    ↓
status !== 'granted'
    ↓
setLocationError()
    ↓
Display error banner
    ↓
Still show map (default location)
```

### Location Unavailable
```
Location.getCurrentPositionAsync()
    ↓
Catch error
    ↓
setLocationError("Unable to get location...")
    ↓
Continue with last known position or default
    ↓
User can still manually select location
```

### Tracking Data Missing
```
LiveTrackingScreen
    ↓
Check: order.riderLatitude == null?
    ↓
Show empty state
    ↓
"Rider location unavailable"
    ↓
User returns to orders list
```

---

## Performance Considerations

```
MapPickerScreen
├─ Single MapView instance
├─ One Marker (selected location)
└─ Minimal state updates

LiveTrackingScreen
├─ One MapView
├─ Two Markers
├─ One Polyline
└─ Location updates: 5-second intervals

RiderAssignmentCard
├─ One Mini map (scrollable)
├─ Lazy-loaded details (ScrollView)
├─ Efficient re-renders (useMemo)
└─ No unnecessary state updates

locationUtils
├─ O(1) Haversine calculations
├─ Minimal memory footprint
└─ No async operations
```

---

## Browser/Device Compatibility

```
Maps & Location
├─ iOS: ✅ Native support via ExpoGo
├─ Android: ✅ Native support via ExpoGo
└─ Web: ⚠️ Browser-based (limited location)

Real-time Updates
├─ Current: Simulated (5s polling)
├─ Target: WebSocket (backend)
└─ Fallback: API polling (10s)

Offline Support
├─ Maps: Cached tiles (automatic)
├─ Location: Last known position
└─ Data: Persisted in SQLite
```

