import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance, formatETA } from '../utils/locationUtils';
import type { Order } from '../types';

interface LiveTrackingScreenProps {
  order: Order;
  onBack: () => void;
}

export function LiveTrackingScreen({ order, onBack }: LiveTrackingScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  async function handleCallRider() {
    const riderPhone = order.riderPhone?.trim();
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

  if (order.status !== 'on_the_way' || !order.riderId || order.riderLatitude === null || order.riderLongitude === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onBack}>
            <Ionicons name="chevron-back" size={28} color="#0C7A67" />
          </Pressable>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#D45D31" />
          <Text style={styles.emptyTitle}>Tracking Unavailable</Text>
          <Text style={styles.emptyMessage}>Rider is not on the way yet or location data is unavailable.</Text>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const riderLocation = {
    latitude: order.riderLatitude,
    longitude: order.riderLongitude,
  };

  const deliveryLocation = {
    latitude: order.latitude,
    longitude: order.longitude,
  };

  const distanceFormatted = formatDistance(riderLocation, deliveryLocation);
  const eta = formatETA(riderLocation, deliveryLocation);

  const numDishes = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#0C7A67" />
        </Pressable>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={styles.spacer} />
      </View>

      {/* Main Tracking Card */}
      <View style={styles.mainCard}>
        <View style={styles.trackingHeader}>
          <View style={styles.trackingInfo}>
            <Text style={styles.trackingLabel}>Estimated Arrival</Text>
            <Text style={styles.eta}>{eta}</Text>
          </View>
          <View style={styles.distanceContainer}>
            <Text style={styles.distance}>{distanceFormatted}</Text>
            <Text style={styles.distanceLabel}>away</Text>
          </View>
        </View>

        {/* Location visualization */}
        <View style={styles.routeVisualization}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.riderDot]} />
            <Text style={styles.locationName}>{order.riderName || 'Rider'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.destinationDot]} />
            <Text style={styles.locationName}>Your Location</Text>
          </View>
        </View>

        {/* Rider Info */}
        <View style={styles.riderInfoCard}>
          <View style={styles.riderHeader}>
            <Ionicons name="person-circle" size={40} color="#D45D31" />
            <View style={styles.riderDetails}>
              <Text style={styles.riderNameText}>{order.riderName || 'Rider'}</Text>
              <Text style={styles.riderStatus}>On the way</Text>
            </View>
          </View>
          {order.riderPhone && (
            <Pressable style={styles.callButton} onPress={() => void handleCallRider()}>
              <Ionicons name="call" size={18} color="#0C7A67" />
              <Text style={styles.callButtonText}>Call Rider</Text>
            </Pressable>
          )}
        </View>

        {/* Details Toggle */}
        <Pressable
          style={styles.expandButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.expandButtonText}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#0C7A67"
          />
        </Pressable>
      </View>

      {/* Detailed Order Info - Expandable */}
      {showDetails && (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          {/* Rider Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rider</Text>
            <View style={styles.riderDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{order.riderName || 'Unknown'}</Text>
              </View>
              {order.riderPhone && (
                <>
                  <View style={styles.divider} />
                  <Pressable style={styles.detailRow} onPress={() => void handleCallRider()}>
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.detailValueLink}>{order.riderPhone}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Distance & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{distanceFormatted}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.detailValue}>{eta}</Text>
              </View>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>#{order.id}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>{numDishes} {numDishes === 1 ? 'dish' : 'dishes'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailValueHighlight}>₹{order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Order Items */}
          {order.items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
              <View style={styles.itemsList}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View>
                      <Text style={styles.itemName}>{item.dishName}</Text>
                      {item.customizations.length > 0 && (
                        <Text style={styles.itemCustomizations}>
                          {item.customizations.map((c) => c.name).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{order.deliveryNotes}</Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <Ionicons name="radio" size={16} color="#10B981" />
        <Text style={styles.statusText}>Live Update</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C7A67',
  },
  spacer: {
    width: 28,
  },
  mainCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eta: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D45D31',
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C7A67',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  routeVisualization: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  riderDot: {
    backgroundColor: '#D45D31',
  },
  destinationDot: {
    backgroundColor: '#0C7A67',
  },
  locationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  routeLine: {
    width: 3,
    height: 30,
    backgroundColor: '#D45D31',
    marginLeft: 5.5,
    marginVertical: 4,
  },
  riderInfoCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2529',
  },
  riderStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0C7A67',
    gap: 6,
  },
  callButtonText: {
    color: '#0C7A67',
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C7A67',
  },
  detailsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C7A67',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailsBox: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  riderDetailsBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1E9D5',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C7A67',
  },
  detailValueLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D45D31',
  },
  detailValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D45D31',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E0D0',
  },
  itemsList: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F2529',
    marginBottom: 2,
  },
  itemCustomizations: {
    fontSize: 11,
    color: '#999',
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D45D31',
  },
  notesBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  notesText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 16,
  },
  statusText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C7A67',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#0C7A67',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
