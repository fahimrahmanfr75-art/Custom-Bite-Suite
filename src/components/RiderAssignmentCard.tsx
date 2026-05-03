import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, Card3D, OrderStatusBadge } from './common';
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
    <Card3D style={styles.shell}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryCopy}>
          <Text style={styles.orderLabel}>Assignment #{order.id}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.summaryMeta}>
            {order.items.length} item{order.items.length === 1 ? '' : 's'} · ${order.total.toFixed(2)}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} compact />
      </View>

      <Card3D style={styles.routePanel}>
        <View style={styles.routeHeader}>
          <Text style={styles.sectionLabel}>Route Overview</Text>
          {distance && eta ? <Text style={styles.routeMeta}>{distance} · {eta}</Text> : null}
        </View>

        <View style={styles.routeVisualization}>
          <View style={styles.locationStop}>
            <View style={[styles.locationDot, styles.riderDot]} />
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Your Location</Text>
              <Text style={styles.locationValue}>
                {riderCurrentLocation
                  ? `${riderCurrentLocation.latitude.toFixed(4)}, ${riderCurrentLocation.longitude.toFixed(4)}`
                  : 'Waiting for live rider location'}
              </Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.locationStop}>
            <View style={[styles.locationDot, styles.destinationDot]} />
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Delivery Location</Text>
              <Text style={styles.locationValue}>
                {usesPinnedCoordinates
                  ? `${deliveryLocation.latitude.toFixed(4)}, ${deliveryLocation.longitude.toFixed(4)}`
                  : order.addressLine}
              </Text>
            </View>
          </View>
        </View>

        {distance && eta ? (
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricCardWarm]}>
              <Ionicons name="location" size={18} color="#0C7A67" />
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{distance}</Text>
            </View>
            <View style={[styles.metricCard, styles.metricCardAccent]}>
              <Ionicons name="timer" size={18} color="#D45D31" />
              <Text style={styles.metricLabel}>ETA</Text>
              <Text style={styles.metricValue}>{eta}</Text>
            </View>
          </View>
        ) : null}
      </Card3D>

      <View style={styles.actionGrid}>
        <View style={styles.actionCell}>
          <AppButton
            label="Call"
            icon="call"
            variant="secondary"
            onPress={() => order.customerPhone && onCallCustomer?.(order.customerPhone)}
          />
        </View>
        <View style={styles.actionCell}>
          <AppButton
            label="Navigate"
            icon="navigate"
            variant="secondary"
            onPress={() => onStartNavigation?.(order)}
          />
        </View>
      </View>

<View style={styles.actionGrid}>
      {order.status === 'on_the_way' && onMarkDelivered ? (
        <View style={styles.primaryActionRow}>
          <AppButton
            label="Delivered"
            icon="checkmark-done"
            onPress={() => onMarkDelivered(order.id)}
          />
        </View>
      ) : null}

        <View style={styles.actionCell}>
          <AppButton
            label={showFullDetails ? 'Hide Details' : 'Show Details'}
            icon={showFullDetails ? 'chevron-up' : 'chevron-down'}
            variant="ghost"
            onPress={() => setShowFullDetails((current) => !current)}
          />
        </View></View>

      {showFullDetails ? (
        <View style={styles.detailsSection}>
          <Card3D style={styles.detailPanel}>
            <Text style={styles.sectionLabel}>Customer</Text>
            <View style={styles.detailStack}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Name</Text>
                <Text style={styles.detailValue}>{order.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Phone</Text>
                <Text style={[styles.detailValue, styles.detailLink]}>{order.customerPhone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Email</Text>
                <Text style={styles.detailValue}>{order.customerEmail}</Text>
              </View>
            </View>
          </Card3D>

          <Card3D style={styles.detailPanel}>
            <Text style={styles.sectionLabel}>Delivery Address</Text>
            <View style={styles.detailStack}>
              <View style={styles.detailRowAligned}>
                <Text style={styles.detailValueWide}>{order.addressLine}</Text>
              </View>
              {usesPinnedCoordinates ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Coordinates</Text>
                  <Text style={styles.detailValue}>
                    {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card3D>

          <Card3D style={styles.detailPanel}>
            <Text style={styles.sectionLabel}>Order Details</Text>
            <View style={styles.itemStack}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemHeaderCopy}>
                      <Text style={styles.itemName}>{item.dishName}</Text>
                      <Text style={styles.itemPrice}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                    </View>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>x{item.quantity}</Text>
                    </View>
                  </View>

                  {item.customizations.length > 0 ? (
                    <Text style={styles.supportingText}>
                      Customizations: {item.customizations.map((cust) => cust.name).join(', ')}
                    </Text>
                  ) : null}

                  {item.ingredientSnapshots.length > 0 ? (
                    <Text style={styles.supportingText}>
                      Ingredients: {item.ingredientSnapshots.map((ing) => ing.ingredientName).join(', ')}
                    </Text>
                  ) : null}

                  {item.instructions ? (
                    <View style={styles.noteBlock}>
                      <Text style={styles.noteLabel}>Special Instructions</Text>
                      <Text style={styles.noteText}>{item.instructions}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </Card3D>

          <Card3D style={styles.detailPanel}>
            <Text style={styles.sectionLabel}>Payment</Text>
            <View style={styles.detailStack}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Subtotal</Text>
                <Text style={styles.detailValue}>${order.subtotal.toFixed(2)}</Text>
              </View>
              {order.discount > 0 ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Discount</Text>
                  <Text style={styles.discountValue}>-${order.discount.toFixed(2)}</Text>
                </View>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Delivery Fee</Text>
                <Text style={styles.detailValue}>${order.deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalBand]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Method</Text>
                <Text style={styles.detailValue}>
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Status</Text>
                <Text style={styles.detailValue}>
                  {order.paymentStatus === 'cod_pending'
                    ? 'Pending Collection'
                    : order.paymentStatus === 'paid'
                      ? 'Paid'
                      : 'COD Collected'}
                </Text>
              </View>
            </View>
          </Card3D>

          {order.deliveryNotes ? (
            <Card3D style={styles.detailPanel}>
              <Text style={styles.sectionLabel}>Delivery Notes</Text>
              <View style={styles.notePanel}>
                <Text style={styles.noteText}>{order.deliveryNotes}</Text>
              </View>
            </Card3D>
          ) : null}

          {onContactSupport ? (
            <View style={styles.supportRow}>
              <AppButton
                label="Contact Support"
                icon="help-circle-outline"
                variant="danger"
                onPress={onContactSupport}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card3D>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#FBFEFD',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  orderLabel: {
    color: '#0C7A67',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  customerName: {
    color: '#0F2529',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryMeta: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
  },
  routePanel: {
    backgroundColor: '#FBFEFD',
    borderColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  routeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  routeMeta: {
    color: '#56707B',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  routeVisualization: {
    gap: 4,
  },
  locationStop: {
    flexDirection: 'row',
    gap: 12,
  },
  locationDot: {
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
    minWidth: 0,
  },
  locationTitle: {
    color: '#56707B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  locationValue: {
    color: '#0F2529',
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  routeLine: {
    backgroundColor: '#D1E9D5',
    height: 34,
    marginLeft: 5.5,
    width: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    alignItems: 'center',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  metricCardWarm: {
    backgroundColor: '#D4F1E8',
  },
  metricCardAccent: {
    backgroundColor: '#FCE8D5',
  },
  metricLabel: {
    color: '#56707B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#0F2529',
    fontSize: 15,
    fontWeight: '700',
  },
  actionGrid: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCell: {
    alignItems: 'center',
  },
  primaryActionRow: {
    alignItems: 'center',
  },
  detailsSection: {
    gap: 12,
  },
  detailPanel: {
    backgroundColor: '#FBFEFD',
    borderColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  detailStack: {
    gap: 8,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  detailRowAligned: {
    gap: 6,
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
    minWidth: 0,
    textAlign: 'right',
  },
  detailValueWide: {
    color: '#0F2529',
    fontSize: 13,
    lineHeight: 18,
  },
  detailLink: {
    color: '#D45D31',
  },
  itemStack: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#EEF5F2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  itemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  itemHeaderCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  itemName: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  itemPrice: {
    color: '#0C7A67',
    fontSize: 12,
    fontWeight: '700',
  },
  quantityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1E9D5',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quantityText: {
    color: '#0F2529',
    fontSize: 12,
    fontWeight: '700',
  },
  supportingText: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 17,
  },
  noteBlock: {
    backgroundColor: '#FCE8D5',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  noteLabel: {
    color: '#9D3C2A',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noteText: {
    color: '#0F2529',
    fontSize: 12,
    lineHeight: 17,
  },
  discountValue: {
    color: '#2D6D3E',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  totalBand: {
    backgroundColor: '#D4F1E8',
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
  notePanel: {
    backgroundColor: '#FCE8D5',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  supportRow: {
    alignItems: 'center',
    paddingBottom: 6,
  },
});
