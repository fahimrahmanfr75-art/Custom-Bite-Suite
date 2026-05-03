import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, Card3D, ScreenCard, SectionTitle } from '../components/common';

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
      } catch {
        setError('Unable to get current location. Please try again.');
        setIsLoading(false);
      }
    }

    void getCurrentLocation();
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
    } catch {
      setError('Unable to refresh location. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.page}>
        <View style={styles.loadingWrap}>
          <ScreenCard>
            <SectionTitle title="Confirm Delivery Location" subtitle="Checking your current device coordinates." />
            <Card3D style={styles.loadingCard}>
              <Ionicons name="location" size={54} color="#D45D31" />
              <Text style={styles.loadingTitle}>Getting Your Location</Text>
              <Text style={styles.loadingText}>This is used as the delivery point for your order.</Text>
              <ActivityIndicator size="large" color="#D45D31" />
            </Card3D>
          </ScreenCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <ScreenCard>
          <SectionTitle title="Confirm Delivery Location" subtitle="Use the latest device coordinates as your delivery point." />

          {error ? (
            <Card3D style={styles.errorCard}>
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={20} color="#9D3C2A" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Card3D>
          ) : null}

          <Card3D style={styles.locationCard}>
            <View style={styles.locationHero}>
              <View style={styles.iconBadge}>
                <Ionicons name="location-sharp" size={36} color="#0C7A67" />
              </View>
              <View style={styles.locationHeroCopy}>
                <Text style={styles.locationTitle}>Current Device Location</Text>
                <Text style={styles.locationSubtitle}>
                  Review the latest coordinates before saving them for delivery.
                </Text>
              </View>
            </View>

            {currentLocation ? (
              <View style={styles.coordinateStack}>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>{currentLocation.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>{currentLocation.longitude.toFixed(6)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.mutedText}>Unable to determine location.</Text>
            )}
          </Card3D>

          <View style={styles.actions}>
            <View style={styles.actionCell}>
              <AppButton
                label="Refresh"
                icon="refresh"
                variant="secondary"
                onPress={() => void handleRefreshLocation()}
                disabled={isLoading}
              />
            </View>
            <View style={styles.actionCell}>
              <AppButton
                label="Set"
                icon="checkmark-circle"
                onPress={handleConfirm}
                disabled={!currentLocation || isLoading}
              />
            </View>
          </View>
        </ScreenCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#F2EDE2',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  loadingTitle: {
    color: '#0F2529',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingText: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FCCCC3',
    borderColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    color: '#9D3C2A',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  locationCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  locationHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  locationHeroCopy: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    color: '#0F2529',
    fontSize: 18,
    fontWeight: '700',
  },
  locationSubtitle: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
  },
  coordinateStack: {
    gap: 10,
  },
  coordinateRow: {
    alignItems: 'center',
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  coordinateLabel: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  coordinateValue: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  mutedText: {
    color: '#56707B',
    fontSize: 13,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCell: {
    alignItems:'center',
  },
});
