import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, OrderStatusBadge } from './common';
import { formatDistance, formatETA } from '../utils/locationUtils';
import type { Order } from '../types';

interface RiderAssignmentCardProps {
  order: Order;
  riderCurrentLocation: { latitude: number; longitude: number } | null;
  onStartNavigation?: (order: Order) => void;
  onCallCustomer?: (phone: string) => void;
  onContactSupport?: () => void;
  onMarkDelivered?: (orderId: number) => void;
}

export function RiderAssignmentCard({
  order,
  riderCurrentLocation,
  onStartNavigation,
  onCallCustomer,
  onContactSupport,
  onMarkDelivered,
}: RiderAssignmentCardProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const usesPinnedCoordinates = order.addressLine.startsWith('Pinned location (');

  const deliveryLocation = {
    latitude: order.latitude,
    longitude: order.longitude,
  };

  let distance: string | null = null;
  let eta: string | null = null;

  if (riderCurrentLocation && usesPinnedCoordinates) {
    distance = formatDistance(riderCurrentLocation, deliveryLocation);
    eta = formatETA(riderCurrentLocation, deliveryLocation);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderLabel}>Order #{order.id}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <OrderStatusBadge status={order.status} compact />
      </View>

      {/* Route Visualization */}
      <View style={styles.routeVisualization}>
        <View style={styles.locationStop}>
          <View style={styles.locationDot_rider} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Your Location</Text>
            {riderCurrentLocation && (
              <Text style={styles.locationCoords}>
                {riderCurrentLocation.latitude.toFixed(4)}, {riderCurrentLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.locationStop}>
          <View style={styles.locationDot_destination} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Delivery Location</Text>
            <Text style={styles.locationCoords}>
              {usesPinnedCoordinates
                ? `${deliveryLocation.latitude.toFixed(4)}, ${deliveryLocation.longitude.toFixed(4)}`
                : order.addressLine}
            </Text>
          </View>
        </View>
      </View>

      {/* Distance & ETA Info */}
      {distance && eta && (
        <View style={styles.routeInfoCard}>
          <View style={styles.infoBlock}>
            <Ionicons name="location-outline" size={20} color="#0C7A67" />
            <View>
              <Text style={styles.infoBlockLabel}>Distance</Text>
              <Text style={styles.infoBlockValue}>{distance}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Ionicons name="timer-outline" size={20} color="#D45D31" />
            <View>
              <Text style={styles.infoBlockLabel}>ETA</Text>
              <Text style={styles.infoBlockValue}>{eta}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => order.customerPhone && onCallCustomer?.(order.customerPhone)}
        >
          <Ionicons name="call-outline" size={20} color="#0C7A67" />
          <Text style={styles.actionButtonText}>Call</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onStartNavigation?.(order)}
        >
          <Ionicons name="navigate-outline" size={20} color="#0C7A67" />
          <Text style={styles.actionButtonText}>Navigate</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setShowFullDetails(!showFullDetails)}
        >
          <Ionicons name={showFullDetails ? 'chevron-up' : 'chevron-down'} size={20} color="#0C7A67" />
          <Text style={styles.actionButtonText}>{showFullDetails ? 'Hide' : 'Details'}</Text>
        </Pressable>
      </View>

      <View style={styles.footerActions}>
        <AppButton
          label="Open in Maps"
          variant="secondary"
          onPress={() => onStartNavigation?.(order)}
        />
        {order.status === 'on_the_way' && onMarkDelivered ? (
          <AppButton label="Delivered" onPress={() => onMarkDelivered(order.id)} />
        ) : null}
      </View>

      {/* Full Details Section */}
      {showFullDetails && (
        <ScrollView style={styles.detailsSection} showsVerticalScrollIndicator={false}>
          {/* Customer Information */}
          <View style={styles.detailsGroup}>
            <Text style={styles.detailsGroupTitle}>Customer Information</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-outline" size={18} color="#0C7A67" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{order.customerName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Pressable
                style={styles.infoRow}
                onPress={() => order.customerPhone && onCallCustomer?.(order.customerPhone)}
              >
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={18} color="#D45D31" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValueLink}>{order.customerPhone}</Text>
                </View>
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail-outline" size={18} color="#0C7A67" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{order.customerEmail}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.detailsGroup}>
            <Text style={styles.detailsGroupTitle}>Delivery Address</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location-outline" size={18} color="#0C7A67" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{order.addressLine}</Text>
                </View>
              </View>

              {usesPinnedCoordinates ? (
                <>
                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="navigate-outline" size={18} color="#D45D31" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Coordinates</Text>
                      <Text style={styles.infoValue}>
                        {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.detailsGroup}>
            <Text style={styles.detailsGroupTitle}>Order Details ({order.items.length})</Text>
            <View style={styles.itemsList}>
              {order.items.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.dishName}</Text>
                      <Text style={styles.itemPrice}>₹{(item.unitPrice * item.quantity).toFixed(2)}</Text>
                    </View>
                    <View style={styles.itemQuantityBadge}>
                      <Text style={styles.itemQuantityText}>x{item.quantity}</Text>
                    </View>
                  </View>

                  {item.customizations.length > 0 && (
                    <View style={styles.customizations}>
                      {item.customizations.map((cust, custIndex) => (
                        <Text key={custIndex} style={styles.customizationText}>
                          • {cust.name}
                        </Text>
                      ))}
                    </View>
                  )}

                  {item.ingredientSnapshots.length > 0 && (
                    <View style={styles.ingredients}>
                      <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                      {item.ingredientSnapshots.map((ing, ingIndex) => (
                        <Text key={ingIndex} style={styles.ingredientText}>
                          • {ing.ingredientName}
                        </Text>
                      ))}
                    </View>
                  )}

                  {item.instructions && (
                    <View style={styles.instructions}>
                      <Text style={styles.instructionsLabel}>Special Instructions:</Text>
                      <Text style={styles.instructionsText}>{item.instructions}</Text>
                    </View>
                  )}

                  {index < order.items.length - 1 && <View style={styles.itemDivider} />}
                </View>
              ))}
            </View>
          </View>

          {/* Cost Breakdown */}
          <View style={styles.detailsGroup}>
            <Text style={styles.detailsGroupTitle}>Cost Breakdown</Text>
            <View style={styles.costBox}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Subtotal</Text>
                <Text style={styles.costValue}>₹{order.subtotal.toFixed(2)}</Text>
              </View>

              {order.discount > 0 && (
                <>
                  <View style={styles.costDivider} />
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Discount</Text>
                    <Text style={styles.costValueDiscount}>-₹{order.discount.toFixed(2)}</Text>
                  </View>
                </>
              )}

              <View style={styles.costDivider} />

              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Delivery Fee</Text>
                <Text style={styles.costValue}>₹{order.deliveryFee.toFixed(2)}</Text>
              </View>

              <View style={styles.costDivider} />

              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          <View style={styles.detailsGroup}>
            <Text style={styles.detailsGroupTitle}>Payment</Text>
            <View style={styles.paymentBox}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Method</Text>
                <Text style={[styles.paymentValue, styles[`payment_${order.paymentMethod}`]]}>
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                </Text>
              </View>

              <View style={styles.costDivider} />

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Status</Text>
                <Text style={[styles.paymentValue, styles[`paymentStatus_${order.paymentStatus}`]]}>
                  {order.paymentStatus === 'cod_pending'
                    ? 'Pending Collection'
                    : order.paymentStatus === 'paid'
                      ? 'Paid'
                      : 'COD Collected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <View style={styles.detailsGroup}>
              <Text style={styles.detailsGroupTitle}>Delivery Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{order.deliveryNotes}</Text>
              </View>
            </View>
          )}

          {/* Support Button */}
          {onContactSupport && (
            <View style={styles.detailsGroup}>
              <Pressable style={styles.supportButton} onPress={onContactSupport}>
                <Ionicons name="help-circle-outline" size={18} color="#FF6B6B" />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C7A67',
  },
  mapContainer: {
    position: 'relative',
    height: 180,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  miniMap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deliveryMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0C7A67',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  riderLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D45D31',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  routeInfoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C7A67',
  },
  routeDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E8E0D0',
  },
  routeVisualization: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 12,
  },
  locationStop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot_rider: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D45D31',
    marginTop: 2,
  },
  locationDot_destination: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0C7A67',
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0C7A67',
    fontFamily: 'monospace',
  },
  routeLine: {
    width: 3,
    height: 40,
    backgroundColor: '#D45D31',
    marginLeft: 5.5,
    marginVertical: 4,
  },
  routeInfoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBlockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  infoBlockValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C7A67',
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E0D0',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  footerActions: {
    borderBottomColor: '#E8E0D0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0C7A67',
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: 400,
  },
  detailsGroup: {
    marginBottom: 16,
  },
  detailsGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C7A67',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C7A67',
  },
  infoValueLink: {
    fontSize: 13,
    fontWeight: '600',
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
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C7A67',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D45D31',
  },
  itemQuantityBadge: {
    backgroundColor: '#0C7A67',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  itemQuantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  customizations: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderLeftWidth: 2,
    borderLeftColor: '#D45D31',
    marginTop: 4,
  },
  customizationText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  ingredients: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderLeftWidth: 2,
    borderLeftColor: '#0C7A67',
    marginTop: 4,
  },
  ingredientsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0C7A67',
    marginBottom: 4,
  },
  ingredientText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  instructions: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 2,
    borderLeftColor: '#FF9800',
    marginTop: 4,
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: '#333',
    fontStyle: 'italic',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E8E0D0',
    marginVertical: 8,
  },
  costBox: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  costValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C7A67',
  },
  costValueDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#E8E0D0',
  },
  totalRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#0C7A67',
    borderRadius: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  paymentBox: {
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  payment_cod: {
    color: '#FF9800',
  },
  payment_card: {
    color: '#2196F3',
  },
  paymentStatus_cod_pending: {
    color: '#FF6B6B',
  },
  paymentStatus_paid: {
    color: '#10B981',
  },
  paymentStatus_cod_collected: {
    color: '#10B981',
  },
  notesBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  bottomSpacer: {
    height: 20,
  },
});
