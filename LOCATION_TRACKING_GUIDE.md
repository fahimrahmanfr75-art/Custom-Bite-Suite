# Location Tracking & Map Integration Features

## Overview
This document describes the new delivery location selection, live order tracking, and rider assignment features implemented for Custom-Bite Suite.

---

## 1. Delivery Location Selection (No Typing Address)

### Feature: MapPickerScreen

**Location:** `src/screens/MapPickerScreen.tsx`

### How It Works:
Instead of customers typing their delivery address, they now:
1. Click **"Set Location"** button in the checkout screen
2. See a fullscreen map with their current location
3. **Drop a pin** by tapping anywhere on the map  
4. See the selected coordinates displayed
5. Press **"Confirm Location"** to save latitude/longitude

### UI Components:
- **Map View:** React-native-maps with tap-to-pin functionality
- **Location Button:** Blue "Locate" button to recenter on current GPS location
- **Bottom Panel:** Shows selected coordinates and confirmation button
- **Error Handling:** Displays errors if location permission is denied

### Technical Details:
```typescript
interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Called when customer confirms location
onLocationSelected(location: LocationCoords) => void
```

### Key Features:
- ✅ Real-time GPS tracking with `expo-location`
- ✅ Tap-to-drop pin on map
- ✅ Recenter to current location button
- ✅ Displays precise lat/lng coordinates
- ✅ Beautiful UI with error states

---

## 2. On-The-Way Map Tracking

### Feature: LiveTrackingScreen

**Location:** `src/screens/LiveTrackingScreen.tsx`

### How It Works:
When an order reaches **"on_the_way"** status and a rider is assigned:

1. Customer sees **"View Live Tracking"** button on their active order
2. Opens fullscreen map showing:
   - 🔴 **Rider's live location** (red marker)
   - 🟢 **Customer's delivery location** (green marker with house icon)
   - 📍 **Route line** connecting rider to destination
   - ⏱️ **ETA** (Estimated Time of Arrival)
   - 📏 **Distance** (formatted km or meters)

3. Tap to expand detailed order information:
   - Rider name & contact
   - Distance & ETA
   - Order items breakdown with ingredients
   - Delivery notes
   - Order total

### Map Features:
- Auto-zooms to show both rider and delivery location
- Blue power line showing the delivery route
- Custom markers with icons
- Auto-updates as rider moves (simulated in current version)

### Expandable Details Include:
- **Rider Section:** Name, phone number
- **Route Details:** Distance, estimated arrival time
- **Order Summary:** Order ID, number of dishes, total price
- **Items List:** Each dish with quantity and customizations
- **Ingredient Details:** Full ingredient breakdown per item
- **Delivery Notes:** Special instructions
- **Live Status Badge:** Indicates real-time tracking active

### Technical Details:
```typescript
interface LiveTrackingScreenProps {
  order: Order;
  onBack: () => void;
}

// Order must have:
order.status === 'on_the_way'
order.riderId !== null
order.riderLatitude !== null
order.riderLongitude !== null
```

---

## 3. Rider Assignment Card

### Feature: RiderAssignmentCard

**Location:** `src/components/RiderAssignmentCard.tsx`

### How It Works:
Replaces the basic text-only assignment cards in Rider Dashboard with rich interactive cards showing:

#### Card Header:
- Order number
- Customer name
- Status badge (on_the_way, ready, accepted)

#### Mini Map:
- Embedded map preview with:
  - Delivery destination (green pin)
  - Rider's current location (red pin)
  - Distance & ETA overlay

#### Quick Actions (Row of 3 Buttons):
- 📞 **Call** - Calls customer phone number
- 🗺️ **Navigate** - Opens Google Maps navigation
- 📋 **Details** - Toggle expanded details view

#### Expandable Details Section:
When tapped, shows full information in scrollable panel:

**Customer Information:**
- Name
- Phone (clickable - calls customer)
- Email

**Delivery Address:**
- Full address
- Coordinates (lat/lng)

**Order Details (Items):**
- Dish name & quantity
- Price breakdown
- Customizations (additions/removals)
- Ingredient list for each item
- Special instructions

**Cost Breakdown:**
- Subtotal
- Discount (if any)
- Delivery fee
- **Total** (highlighted)

**Payment Information:**
- Payment method (Card/COD)
- Payment status (Pending/Paid/Collected)

**Delivery Notes:** 
- Any special instructions

**Support Button:**
- Contact support for issues

### Technical Details:
```typescript
interface RiderAssignmentCardProps {
  order: Order;
  riderCurrentLocation: { latitude: number; longitude: number } | null;
  onStartNavigation?: (lat: number, lng: number) => void;
  onCallCustomer?: (phone: string) => void;
  onContactSupport?: () => void;
}
```

---

## 4. Location Utilities

### File: `src/utils/locationUtils.ts`

Provides helper functions for distance and ETA calculations:

### Available Functions:

#### `calculateDistance(point1: LatLng, point2: LatLng): number`
- Returns distance in **kilometers** using Haversine formula
- Accurate for geographical distance

#### `calculateDistanceInMeters(point1: LatLng, point2: LatLng): number`
- Returns distance in **meters**
- Useful for short-distance validation

#### `formatDistance(point1: LatLng, point2: LatLng): string`
- Returns formatted string: "1.2 km" or "500 m"
- Automatically switches between km and meters

#### `calculateETA(riderLocation: LatLng, destinationLocation: LatLng, speedKmPerHour: number = 30): number`
- Returns estimated time in minutes
- Default speed: 30 km/h (typical urban delivery)
- Adds 2-minute buffer for variability

#### `formatETA(riderLocation: LatLng, destinationLocation: LatLng): string`
- Returns formatted string: "15 min" or "< 1 min"
- User-friendly for display

#### `isRiderCloseToDest(riderLocation: LatLng, destination: LatLng, thresholdMeters: number = 100): boolean`
- Returns true if rider is within threshold distance
- Default: 100 meters
- Useful for "nearby" notifications

#### `getMidpoint(point1: LatLng, point2: LatLng): LatLng`
- Calculates center point between two locations
- Used for map centering in tracking view

#### `calculateMapRegionDelta(point1: LatLng, point2: LatLng, padding: number = 0.1): object`
- Returns lat/lon delta for map region
- Ensures both points fit in view with padding

#### `getBearingEmoji(from: LatLng, to: LatLng): string`
- Returns directional emoji (↑↗→↘↓↙←↖)
- Indicates direction from point A to point B

### Usage Examples:
```typescript
import { calculateDistance, formatDistance, formatETA } from '../utils/locationUtils';

// Calculate distance
const distanceKm = calculateDistance(
  { latitude: 40.7128, longitude: -74.006 },
  { latitude: 40.7589, longitude: -73.9851 }
);

// Format for display
const displayDistance = formatDistance(riderLoc, deliveryLoc); // "2.3 km"
const displayETA = formatETA(riderLoc, deliveryLoc); // "8 min"

// Check if close
if (isRiderCloseToDest(riderLoc, deliveryLoc, 150)) {
  showNotification('Rider is nearby!');
}
```

---

## 5. Integration Points

### CustomerDashboard Changes:

**New State Variables:**
```typescript
const [showMapPicker, setShowMapPicker] = useState(false);
const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
```

**Modified Functions:**
- `handleMapLocationSelected()` - Replaces GPS-only location picker
- New location watching effect for live updates (simulated)

**Conditional Rendering:**
```typescript
{showMapPicker ? <MapPickerScreen /> : null}
{trackingOrderId ? <LiveTrackingScreen /> : null}
```

**OrderCard Component:**
- New prop: `onTrackLive?: () => void`
- Shows "View Live Tracking" button when order is "on_the_way"

---

### RiderDashboard Changes:

**New Imports:**
```typescript
import { RiderAssignmentCard } from '../components/RiderAssignmentCard';
import * as Location from 'expo-location';
```

**New State:**
```typescript
const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
```

**Location Tracking:**
- Uses `Location.watchPositionAsync()` to track rider's current location
- Updates every 10 seconds or 10 meters of movement
- Auto-starts in 'assignments' tab

**Assignment Cards:**
- Replaced basic Card3D with `<RiderAssignmentCard />`
- Passes rider location, callbacks for navigation/calling

---

## 6. Database Schema Considerations

The existing Order type supports these features:

```typescript
type Order = {
  // Delivery Location
  latitude: number;
  longitude: number;
  addressLine: string;

  // Rider Information
  riderId: number | null;
  riderName: string | null;
  riderPhone: string | null;
  
  // Rider Live Location (updated in real-time via backend)
  riderLatitude: number | null;
  riderLongitude: number | null;

  // Other relevant fields
  deliveryNotes: string;
  deliveryFee: number;
  status: OrderStatus; // 'on_the_way', etc.
  
  // And all other existing fields...
};
```

### Backend Considerations:
1. **Rider Location Updates** - Need WebSocket or polling endpoint to push rider's lat/lng to app
2. **Real-time Sync** - Update `orders[].riderLatitude` and `riderLongitude` periodically
3. **Location Validation** - Validate that coordinates are within delivery radius

---

## 7. Real-time Updates (Future Enhancement)

Current implementation uses simulated rider location updates in the customer app every 5 seconds.

**To implement real-time updates:**
1. Use WebSocket connection from backend
2. Listen for `rider-location-updated` events with new coordinates
3. Update order object with new rider position
4. LiveTrackingScreen will automatically re-render with new data

```typescript
// Example WebSocket handling (future)
socket.on('rider-location-updated', (orderId, lat, lng) => {
  updateOrder(orderId, { riderLatitude: lat, riderLongitude: lng });
});
```

---

## 8. Configuration & Customization

### Speed Assumptions (in locationUtils):
```typescript
calculateETA(..., speedKmPerHour: number = 30) // Urban delivery speed
```

**Adjust for:**
- Faster deliveries: increase to 40-50 km/h
- Slower areas: decrease to 15-20 km/h

### Distance Formatting:
```typescript
// Current: shows "km" if ≥ 1km, otherwise "m"
// Customize threshold in formatDistance()
```

### Map Default Region:
```typescript
// Current default: Times Square, NYC
// Update in MapPickerScreen.tsx:
latitude: 40.7128,
longitude: -74.006,
```

### Location Tracking Interval:
```typescript
// In RiderDashboard.tsx - currently 10 seconds:
Location.watchPositionAsync({
  timeInterval: 10000, // milliseconds
  distanceInterval: 10, // meters
})
```

---

## 9. Error Handling

### Permission Errors:
- MapPickerScreen checks location permissions
- Shows error banner if permission denied
- Provides user-friendly error messages

### Location Unavailable:
- Falls back to default region if GPS fails
- Continues operation with last known location
- Graceful degradation

### Map Rendering:
- LiveTrackingScreen shows empty state if order not "on_the_way"
- RiderAssignmentCard handles null rider location gracefully

---

## 10. Testing Checklist

- [ ] Customer can set delivery location via map picker
- [ ] Coordinates are correctly stored in order
- [ ] Customer sees "View Live Tracking" button for on_the_way orders
- [ ] Live tracking screen shows both markers and route line
- [ ] Distance and ETA display correctly
- [ ] Map zooms to fit both locations
- [ ] Expandable details show all order information
- [ ] Rider sees assignment card with mini map
- [ ] Rider can call customer from card
- [ ] Rider can navigate to destination
- [ ] Assignment card expands to show full details
- [ ] Payment information displays correctly
- [ ] COD status shows collection requirement
- [ ] Delivery notes display properly
- [ ] Location updates work smoothly

---

## 11. File Structure

```
src/
├── screens/
│   ├── MapPickerScreen.tsx          # Location selection screen
│   ├── LiveTrackingScreen.tsx       # Customer order tracking
│   ├── CustomerDashboard.tsx        # Updated with map integration
│   └── RiderDashboard.tsx           # Updated with assignment card
├── components/
│   └── RiderAssignmentCard.tsx      # Rich assignment card component
└── utils/
    └── locationUtils.ts            # Distance and ETA calculations
```

---

## 12. Performance Notes

- **MapPickerScreen:** Lightweight, single map with one marker
- **LiveTrackingScreen:** Handles polyline updates smoothly
- **RiderAssignmentCard:** Scrollable details reduce initial payload
- **Location Tracking:** Configurable intervals prevent excessive battery drain
- **Distance Calculations:** Haversine formula is O(1) and fast

---

## Dependencies Used

- `react-native-maps` - Map rendering (already in project)
- `expo-location` - GPS and location services (already in project)
- `@expo/vector-icons` - Icons for markers and buttons
- Standard React Native components

**No new dependencies required!**

---

## Future Enhancements

1. **Estimated Route:** Show actual route line instead of straight line
2. **Traffic Data:** Adjust ETA based on real-time traffic
3. **Offline Mode:** Cache map tiles for offline viewing
4. **Notification Alerts:** Notify customer when rider is nearby
5. **Camera Control:** Better zoom/pan controls
6. **Delivery Photo:** Allow customer/rider to take delivery photo with map context
7. **Accessibility:** Text-to-speech for directions
8. **Analytics:** Track common delivery routes for optimization

---

## Support & Troubleshooting

### Map not showing locations:
- Check location permissions in app settings
- Verify latitude/longitude are valid numbers
- Check network connectivity for map tiles

### ETA seems inaccurate:
- Adjust default speed in locationUtils
- Consider adding traffic data integration
- Add historical delivery time data for ML predictions

### Rider location not updating:
- WebSocket connection may be needed
- Check backend API for rider location endpoint
- Verify rider device has location access enabled

---

Generated: April 14, 2026
Implementation Version: 1.0
