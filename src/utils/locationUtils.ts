/**
 * Location utilities for calculating distance and ETA
 * Based on Haversine formula for lat/lon coordinates
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
  const dLon = (point2.longitude - point1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * (Math.PI / 180)) *
      Math.cos(point2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Calculate distance in meters (useful for short distances)
 */
export function calculateDistanceInMeters(point1: LatLng, point2: LatLng): number {
  return calculateDistance(point1, point2) * 1000;
}

/**
 * Format distance for display
 * Shows km if > 1km, otherwise meters
 */
export function formatDistance(point1: LatLng, point2: LatLng): string {
  const distanceKm = calculateDistance(point1, point2);
  if (distanceKm >= 1) {
    return `${distanceKm.toFixed(1)} km`;
  }
  const distanceM = distanceKm * 1000;
  return `${Math.round(distanceM)} m`;
}

/**
 * Calculate ETA in minutes based on distance and average speed
 * Assumes average delivery speed of 30 km/h (typical for urban delivery)
 * Adds buffer time for pickup, stops, etc
 */
export function calculateETA(
  riderLocation: LatLng,
  destinationLocation: LatLng,
  speedKmPerHour: number = 30
): number {
  const distanceKm = calculateDistance(riderLocation, destinationLocation);
  const timeHours = distanceKm / speedKmPerHour;
  const timeMinutes = timeHours * 60;
  
  // Add 2 minute buffer for variability
  return Math.max(1, Math.ceil(timeMinutes + 2));
}

/**
 * Calculate ETA with multiple stops
 * Useful if rider has multiple deliveries
 */
export function calculateETAWithStops(
  riderLocation: LatLng,
  destinationLocation: LatLng,
  numberOfStops: number = 1,
  speedKmPerHour: number = 30,
  timePerStopMinutes: number = 3
): number {
  const travelTime = calculateETA(riderLocation, destinationLocation, speedKmPerHour);
  const stopTime = (numberOfStops - 1) * timePerStopMinutes;
  return travelTime + stopTime;
}

/**
 * Format ETA for display
 * Returns "X min" or "< 1 min"
 */
export function formatETA(
  riderLocation: LatLng,
  destinationLocation: LatLng,
  speedKmPerHour?: number
): string {
  const eta = calculateETA(riderLocation, destinationLocation, speedKmPerHour);
  if (eta < 1) {
    return '< 1 min';
  }
  return `${eta} min`;
}

/**
 * Get direction emoji based on bearing between two points
 */
export function getBearingEmoji(from: LatLng, to: LatLng): string {
  const dLon = to.longitude - from.longitude;
  const y = Math.sin(dLon) * Math.cos(to.latitude);
  const x =
    Math.cos(from.latitude) * Math.sin(to.latitude) -
    Math.sin(from.latitude) * Math.cos(to.latitude) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalizedBearing = (bearing + 360) % 360;

  if (normalizedBearing < 22.5 || normalizedBearing >= 337.5) return '↑'; // North
  if (normalizedBearing < 67.5) return '↗'; // Northeast
  if (normalizedBearing < 112.5) return '→'; // East
  if (normalizedBearing < 157.5) return '↘'; // Southeast
  if (normalizedBearing < 202.5) return '↓'; // South
  if (normalizedBearing < 247.5) return '↙'; // Southwest
  if (normalizedBearing < 292.5) return '←'; // West
  return '↖'; // Northwest
}

/**
 * Check if rider is close to destination
 * Returns true if distance < 100 meters
 */
export function isRiderCloseToDest(
  riderLocation: LatLng,
  destination: LatLng,
  thresholdMeters: number = 100
): boolean {
  const distanceMeters = calculateDistanceInMeters(riderLocation, destination);
  return distanceMeters < thresholdMeters;
}

/**
 * Calculate a midpoint between two coordinates
 * Useful for map centering during tracking
 */
export function getMidpoint(point1: LatLng, point2: LatLng): LatLng {
  return {
    latitude: (point1.latitude + point2.latitude) / 2,
    longitude: (point1.longitude + point2.longitude) / 2,
  };
}

/**
 * Calculate region delta for map to fit both points with padding
 */
export function calculateMapRegionDelta(point1: LatLng, point2: LatLng, padding: number = 0.1) {
  const latDiff = Math.abs(point1.latitude - point2.latitude);
  const lonDiff = Math.abs(point1.longitude - point2.longitude);

  return {
    latitudeDelta: Math.max(latDiff * (1 + padding), 0.01),
    longitudeDelta: Math.max(lonDiff * (1 + padding), 0.01),
  };
}
