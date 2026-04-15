import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface MapPickerScreenProps {
  onLocationSelected: (location: LocationCoords) => void;
  initialLocation?: LocationCoords;
}

export function MapPickerScreen({ onLocationSelected, initialLocation }: MapPickerScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(
    initialLocation || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request location permission and get current position
  useEffect(() => {
    async function getCurrentLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setError('Location permission denied. Please enable in settings.');
          setIsLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentLocation(coords);
        setIsLoading(false);
      } catch (err) {
        setError('Unable to get current location. Please try again.');
        setIsLoading(false);
      }
    }

    getCurrentLocation();
  }, []);

  const handleConfirm = () => {
    if (currentLocation) {
      onLocationSelected(currentLocation);
    }
  };

  const handleRefreshLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCurrentLocation(coords);
      setIsLoading(false);
    } catch (err) {
      setError('Unable to refresh location. Please try again.');
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="location" size={64} color="#D45D31" />
          <Text style={styles.loadingTitle}>Getting Your Location</Text>
          <ActivityIndicator size="large" color="#D45D31" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location-sharp" size={80} color="#0C7A67" />
        </View>

        {currentLocation && (
          <>
            <Text style={styles.title}>Your Current Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>{currentLocation.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>{currentLocation.longitude.toFixed(6)}</Text>
              </View>
            </View>

            <Text style={styles.description}>
              This location will be used as your delivery point.
            </Text>
          </>
        )}

        {!currentLocation && !error && (
          <Text style={styles.errorText}>Unable to determine location</Text>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRefreshLocation}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={20} color="#0C7A67" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>Refresh Location</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
          disabled={!currentLocation || isLoading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.confirmButtonText}>Set Delivery Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 32,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0C7A67',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0C7A67',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  coordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C7A67',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  confirmButton: {
    backgroundColor: '#0C7A67',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#0C7A67',
  },
  secondaryButtonText: {
    color: '#0C7A67',
    fontSize: 16,
    fontWeight: '700',
  },
});
