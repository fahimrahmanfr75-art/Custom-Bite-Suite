import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, Card3D, ScreenCard, SectionTitle } from '../components/common';
import { useRealtimeOrderTracking } from '../hooks/useRealtimeOrderTracking';
import { formatDistance, formatETA } from '../utils/locationUtils';
import type { Order } from '../types';

interface LiveTrackingScreenProps {
  order: Order;
  onBack: () => void;
}

export function LiveTrackingScreen({ order, onBack }: LiveTrackingScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { connectionState, liveOrder, liveUpdatedAt } = useRealtimeOrderTracking(order);

  async function handleCallRider() {
    const riderPhone = liveOrder.riderPhone?.trim();
    if (!riderPhone) {
      Alert.alert('Call unavailable', 'Rider phone number is not available for this order.');
      return;
    }

    const telUrl = `tel:${riderPhone}`;

    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (!supported) {
        Alert.alert('Call unavailable', `This device cannot place calls to ${riderPhone}.`);
        return;
      }

      await Linking.openURL(telUrl);
    } catch (error) {
      Alert.alert(
        'Call failed',
        error instanceof Error ? error.message : 'Unable to open the phone dialer.'
      );
    }
  }

  if (
    liveOrder.status !== 'on_the_way' ||
    !liveOrder.riderId ||
    liveOrder.riderLatitude === null ||
    liveOrder.riderLongitude === null
  ) {
    return (
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            {/* <Pressable onPress={onBack} style={styles.backIcon}>
              <Ionicons name="chevron-back" size={24} color="#D45D31" />
            </Pressable> */}
            <View>
              <Text style={styles.eyebrow}>Customer Console</Text>
              <Text style={styles.title}>Live tracking is not available yet.</Text>
            </View>
          </View>

          <ScreenCard>
            <SectionTitle title="Tracking Unavailable" subtitle="The rider is not on the way yet or location data is missing." />
            <Card3D style={styles.emptyPanel}>
              <Ionicons name="location-outline" size={42} color="#D45D31" />
              <Text style={styles.emptyTitle}>Check back once the order reaches rider dispatch.</Text>
              <Text style={styles.emptyText}>
                Tracking appears only after the order is assigned and live rider coordinates are available.
              </Text>
              <Text style={styles.connectionLabel}>Realtime: {formatConnectionState(connectionState)}</Text>
            </Card3D>
            <View style={styles.centerRow}>
              <AppButton label="Go Back" icon="arrow-back" variant="secondary" onPress={onBack} />
            </View>
          </ScreenCard>
        </ScrollView>
      </View>
    );
  }

  const riderLocation = {
    latitude: liveOrder.riderLatitude,
    longitude: liveOrder.riderLongitude,
  };

  const deliveryLocation = {
    latitude: liveOrder.latitude,
    longitude: liveOrder.longitude,
  };

  const distanceFormatted = formatDistance(riderLocation, deliveryLocation);
  const eta = formatETA(riderLocation, deliveryLocation);
  const numDishes = liveOrder.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {/* <Pressable onPress={onBack} style={styles.backIcon}>
            <Ionicons name="chevron-back" size={24} color="#D45D31" />
          </Pressable> */}
          <View>
            <Text style={styles.eyebrow}>Customer Console</Text>
            <Text style={styles.title}>Live rider tracking for order #{liveOrder.id}</Text>
          </View>
        </View>

        <ScreenCard>
          <SectionTitle title="Delivery Tracking" subtitle="Live route progress with rider contact details." />

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricCardWarm]}>
              <Text style={styles.metricLabel}>Estimated Arrival</Text>
              <Text style={styles.metricValue}>{eta}</Text>
            </View>
            <View style={[styles.metricCard, styles.metricCardAccent]}>
              <Text style={styles.metricLabel}>Distance Away</Text>
              <Text style={styles.metricValue}>{distanceFormatted}</Text>
            </View>
          </View>

          <Card3D style={styles.routeCard}>
            <Text style={styles.sectionLabel}>Route</Text>
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.riderDot]} />
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>{liveOrder.riderName || 'Rider'}</Text>
                <Text style={styles.locationSubtitle}>Current rider position</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.destinationDot]} />
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>Your Delivery Location</Text>
                <Text style={styles.locationSubtitle}>
                  {deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </Card3D>

          <Card3D style={styles.riderCard}>
            <View style={styles.riderHeader}>
              <View style={styles.riderIdentity}>
                <Ionicons name="person-circle" size={38} color="#D45D31" />
                <View style={styles.riderCopy}>
                  <Text style={styles.riderName}>{liveOrder.riderName || 'Rider'}</Text>
                  <Text style={styles.riderStatus}>On the way</Text>
                </View>
              </View>
              <View style={styles.liveBadge}>
                <Ionicons name="radio" size={14} color="#0C7A67" />
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            </View>
            <View style={styles.realtimeMeta}>
              <Text style={styles.connectionLabel}>Realtime: {formatConnectionState(connectionState)}</Text>
              <Text style={styles.connectionValue}>Updated {formatUpdatedAt(liveUpdatedAt)}</Text>
            </View>
            {liveOrder.riderPhone ? (
              <View style={styles.riderActions}>
                <AppButton
                  label="Call Rider"
                  icon="call"
                  variant="secondary"
                  onPress={() => void handleCallRider()}
                />
              </View>
            ) : null}
          </Card3D>
          <View style={styles.detailRow}>
            <View style={styles.centerRow}>
              <AppButton label="Back" icon="arrow-back" variant="secondary" onPress={onBack} />
            </View>
          <View style={styles.centerRow}>
            <AppButton
              label={showDetails ? 'Hide Details' : 'Show Details'}
              icon={showDetails ? 'chevron-up' : 'chevron-down'}
              variant="ghost"
              onPress={() => setShowDetails((current) => !current)}
            />
          </View></View>
        </ScreenCard>

        {showDetails ? (
          <ScreenCard>
            <SectionTitle title="Order Details" subtitle="Supporting route, rider, and order information." />

            <Card3D style={styles.detailCard}>
              <Text style={styles.sectionLabel}>Rider</Text>
              <View style={styles.detailStack}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Name</Text>
                  <Text style={styles.detailValue}>{liveOrder.riderName || 'Unknown'}</Text>
                </View>
                {liveOrder.riderPhone ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Contact</Text>
                    <Text style={[styles.detailValue, styles.detailLink]}>{liveOrder.riderPhone}</Text>
                  </View>
                ) : null}
              </View>
            </Card3D>

            <Card3D style={styles.detailCard}>
              <Text style={styles.sectionLabel}>Route Details</Text>
              <View style={styles.detailStack}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Distance</Text>
                  <Text style={styles.detailValue}>{distanceFormatted}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>ETA</Text>
                  <Text style={styles.detailValue}>{eta}</Text>
                </View>
              </View>
            </Card3D>

            <Card3D style={styles.detailCard}>
              <Text style={styles.sectionLabel}>Order Summary</Text>
              <View style={styles.detailStack}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Order ID</Text>
                  <Text style={styles.detailValue}>#{liveOrder.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Items</Text>
                  <Text style={styles.detailValue}>{numDishes} {numDishes === 1 ? 'dish' : 'dishes'}</Text>
                </View>
                <View style={[styles.detailRow, styles.totalBand]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${liveOrder.total.toFixed(2)}</Text>
                </View>
              </View>
            </Card3D>

            {liveOrder.items.length > 0 ? (
              <Card3D style={styles.detailCard}>
                <Text style={styles.sectionLabel}>Items</Text>
                <View style={styles.itemStack}>
                  {liveOrder.items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemCopy}>
                          <Text style={styles.itemName}>{item.dishName}</Text>
                          {item.customizations.length > 0 ? (
                            <Text style={styles.itemMeta}>
                              {item.customizations.map((customization) => customization.name).join(', ')}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card3D>
            ) : null}

            {liveOrder.deliveryNotes ? (
              <Card3D style={styles.detailCard}>
                <Text style={styles.sectionLabel}>Delivery Notes</Text>
                <View style={styles.noteCard}>
                  <Text style={styles.noteText}>{liveOrder.deliveryNotes}</Text>
                </View>
              </Card3D>
            ) : null}
          </ScreenCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

function formatConnectionState(state: string) {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'reconnecting':
      return 'Reconnecting';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Offline fallback';
  }
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#F2EDE2',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 120,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  backIcon: {
    alignItems: 'center',
    backgroundColor: '#FCE8D5',
    borderColor: '#000000',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  eyebrow: {
    color: '#D45D31',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F2529',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  metricCard: {
    borderColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  metricCardWarm: {
    backgroundColor: '#FFFBF2',
  },
  metricCardAccent: {
    backgroundColor: '#FCE8D5',
  },
  metricLabel: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#0F2529',
    fontSize: 22,
    fontWeight: '800',
  },
  routeCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  sectionLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    borderRadius: 999,
    height: 14,
    marginTop: 4,
    width: 14,
  },
  riderDot: {
    backgroundColor: '#D45D31',
  },
  destinationDot: {
    backgroundColor: '#0C7A67',
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  locationSubtitle: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 17,
  },
  routeLine: {
    backgroundColor: '#E3DACA',
    height: 34,
    marginLeft: 5.5,
    width: 3,
  },
  riderCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  riderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  riderIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  riderCopy: {
    flex: 1,
    gap: 2,
  },
  riderName: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '700',
  },
  riderStatus: {
    color: '#56707B',
    fontSize: 12,
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#D1E9D5',
    borderColor: '#000000',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadgeText: {
    color: '#0F2529',
    fontSize: 12,
    fontWeight: '700',
  },
  riderActions: {
    alignItems: 'flex-start',
  },
  realtimeMeta: {
    gap: 4,
  },
  connectionLabel: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  connectionValue: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '600',
  },
  centerRow: {
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  detailStack: {
    gap: 8,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  detailKey: {
    color: '#56707B',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#0F2529',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailLink: {
    color: '#D45D31',
  },
  totalBand: {
    backgroundColor: '#FCE8D5',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  totalLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    color: '#0F2529',
    fontSize: 15,
    fontWeight: '800',
  },
  itemStack: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  itemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  itemCopy: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 17,
  },
  itemQty: {
    color: '#D45D31',
    fontSize: 14,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#FCE8D5',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  noteText: {
    color: '#0F2529',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyPanel: {
    alignItems: 'center',
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  emptyTitle: {
    color: '#0F2529',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
