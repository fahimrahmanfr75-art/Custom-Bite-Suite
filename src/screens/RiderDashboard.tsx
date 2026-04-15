import React, { useMemo, useState, useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { AppButton, Card3D, OrderStatusBadge, Pill, ScreenCard, SectionTitle } from '../components/common';
import { RiderAssignmentCard } from '../components/RiderAssignmentCard';
import { useApp } from '../context/AppContext';
import type { Order } from '../types';

type RiderTab = 'profile' | 'assignments' | 'earnings';

export function RiderDashboard() {
  const {
    session,
    users,
    orders,
    logout,
    moveOrderToNextStatus,
    confirmOrderCash,
    claimDeliveryOrder,
  } = useApp();
  const [activeTab, setActiveTab] = useState<RiderTab>('assignments');
  const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState('');

  // Get rider's current location periodically
  useEffect(() => {
    let locationSubscription: any;

    const setupLocationTracking = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setLocationMessage('Location services are off. Turn them on to use live rider tracking.');
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setLocationMessage('Location permission is required for live rider tracking.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRiderLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage('');

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (nextPosition) => {
            setRiderLocation({
              latitude: nextPosition.coords.latitude,
              longitude: nextPosition.coords.longitude,
            });
            setLocationMessage('');
          }
        );
      } catch {
        setLocationMessage('Live rider tracking is unavailable on this device right now.');
      }
    };

    if (activeTab === 'assignments') {
      void setupLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeTab]);

  const handleCallCustomer = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  const handleStartNavigation = (order: Order) => {
    const usesPinnedCoordinates = order.addressLine.startsWith('Pinned location (');
    const query = usesPinnedCoordinates
      ? `${order.latitude},${order.longitude}`
      : order.addressLine.split('_').filter(Boolean).join(' ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    void Linking.openURL(url);
  };

  const handleContactSupport = () => {
    void Linking.openURL('mailto:support@custombite.com?subject=Delivery%20Support');
  };

  async function handleMarkDelivered(orderId: number) {
    const order = orders.find((entry) => entry.id === orderId);
    await moveOrderToNextStatus(orderId);
    if (order?.paymentMethod === 'cod' && order.paymentStatus === 'cod_pending') {
      await confirmOrderCash(orderId);
    }
  }

  const rider = users.find((user) => user.id === session?.userId) ?? null;
  const availableOrders = useMemo(
    () => orders.filter((order) => order.status === 'on_the_way' && !order.riderId),
    [orders]
  );
  const assignedOrders = useMemo(
    () => orders.filter((order) => order.riderId === session?.userId && order.status !== 'delivered'),
    [orders, session?.userId]
  );

  // Delivered orders (completed deliveries)
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.riderId === session?.userId && order.status === 'delivered'),
    [orders, session?.userId]
  );

  // Financial statistics
  const financialStats = useMemo(() => {
    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
    const deliveryCount = deliveredOrders.length;
    const averagePerDelivery = deliveryCount > 0 ? totalEarnings / deliveryCount : 0;

    return {
      totalEarnings,
      deliveryCount,
      averagePerDelivery,
    };
  }, [deliveredOrders]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Rider Console</Text>
            {/* <Text style={styles.title}>Accept assignments, navigate, and complete deliveries.</Text> */}
          </View>
        </View>

        <View style={styles.tabRow}>
          {(['profile', 'assignments', 'earnings'] as RiderTab[]).map((tab) => (
            <Pill key={tab} label={tab} active={activeTab === tab} onPress={() => setActiveTab(tab)} />
          ))}
        </View>

        {activeTab === 'profile' && rider ? (
          <ScreenCard>
            <SectionTitle title="Rider Profile" subtitle="Account information" />
            <Card3D style={styles.panel}>
              <Text style={styles.itemTitle}>
                {rider.firstName} {rider.lastName}
              </Text>
              <Text style={styles.itemMeta}>@{rider.username}</Text>
              <Text style={styles.itemMeta}>{rider.email}</Text>
              <Text style={styles.itemMeta}>{rider.phone}</Text>
            </Card3D>
            <View style={styles.centeredButtonRow}>
              <View style={styles.centeredButtonWrap}>
                <AppButton label="Logout" variant="danger" onPress={() => void logout()} />
              </View>
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'assignments' ? (
          <>
            <ScreenCard>
              <SectionTitle title="Available Deliveries"
              // subtitle="Orders become available at on_the_way status." 
              />
              <View style={styles.stack}>
                {locationMessage ? (
                  <Text style={styles.locationNotice}>{locationMessage}</Text>
                ) : null}
                {availableOrders.length === 0 ? (
                  <Text style={styles.itemMeta}>No unclaimed deliveries available.</Text>
                ) : (
                  availableOrders.map((order) => (
                    <Card3D key={order.id} style={styles.panel}>
                      <Text style={styles.itemTitle}>Order #{order.id}</Text>
                      <Text style={styles.itemMeta}>
                        Customer: {order.customerName} | {order.customerPhone}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Items: {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
                      </Text>
                      <Text style={styles.itemMeta}>Address: {order.addressLine}</Text>
                      <Text style={styles.itemMeta}>
                        Total ${order.total.toFixed(2)} | {order.paymentMethod.toUpperCase()}
                      </Text>
                      <AppButton
                        label="Accept Delivery"
                        onPress={() => void claimDeliveryOrder(order.id)}
                      />
                    </Card3D>
                  ))
                )}
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle title="My Assignments" />
              <View style={styles.stack}>
                {assignedOrders.length === 0 ? (
                  <Text style={styles.itemMeta}>No active assignments.</Text>
                ) : (
                  assignedOrders.map((order) => (
                    <RiderAssignmentCard
                      key={order.id}
                      order={order}
                      riderCurrentLocation={riderLocation}
                      onStartNavigation={handleStartNavigation}
                      onCallCustomer={handleCallCustomer}
                      onContactSupport={handleContactSupport}
                      onMarkDelivered={(orderId) => void handleMarkDelivered(orderId)}
                    />
                  ))
                )}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'earnings' ? (
          <>
            <ScreenCard>
              <SectionTitle title="Financial Dashboard"
              // subtitle="Your earnings and delivery statistics" 
              />
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Earnings</Text>
                  <Text style={styles.metricValue}>${financialStats.totalEarnings.toFixed(2)}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Deliveries</Text>
                  <Text style={styles.metricValue}>{financialStats.deliveryCount}</Text>
                </View>
              </View>
              <View style={styles.metricCardWide}>
                <Text style={styles.metricLabel}>Average per Delivery</Text>
                <Text style={styles.metricValue}>${financialStats.averagePerDelivery.toFixed(2)}</Text>
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle title="Delivery History" subtitle={`Total: ${financialStats.deliveryCount} deliveries completed`} />
              <View style={styles.stack}>
                {deliveredOrders.length === 0 ? (
                  <Text style={styles.itemMeta}>No completed deliveries yet.</Text>
                ) : (
                  deliveredOrders
                    .sort((a, b) => new Date(b.deliveredAt || '').getTime() - new Date(a.deliveredAt || '').getTime())
                    .map((order) => (
                      <Card3D key={order.id} style={styles.historyPanel}>
                        <View style={styles.historyHeader}>
                          <View>
                            <Text style={styles.itemTitle}>Order #{order.id}</Text>
                            <Text style={styles.itemMeta}>
                              {new Date(order.deliveredAt || '').toLocaleDateString()} at {new Date(order.deliveredAt || '').toLocaleTimeString()}
                            </Text>
                          </View>
                          <View style={styles.historyHeaderRight}>
                            <OrderStatusBadge status={order.status} compact />
                            <Text style={styles.earningsBadge}>${order.deliveryFee.toFixed(2)}</Text>
                          </View>
                        </View>
                        <View style={styles.historyDetails}>
                          <Text style={styles.itemMeta}>Customer: {order.customerName}</Text>
                          <Text style={styles.itemMeta}>Phone: {order.customerPhone}</Text>
                          <Text style={styles.itemMeta}>Email: {order.customerEmail}</Text>
                          <Text style={styles.itemMeta}>Address: {order.addressLine}</Text>
                          {order.addressLine.startsWith('Pinned location (') ? (
                            <Text style={styles.itemMeta}>
                              Coordinates: {order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}
                            </Text>
                          ) : null}
                          <Text style={styles.itemMeta}>Items: {order.items.length} dish{order.items.length !== 1 ? 'es' : ''}</Text>
                          <Text style={styles.itemMeta}>Order Total: ${order.total.toFixed(2)}</Text>
                          <Text style={styles.itemMeta}>Payment: {order.paymentMethod.toUpperCase()}</Text>
                          <Text style={styles.itemMeta}>Payment Status: {order.paymentStatus}</Text>
                          {order.deliveryNotes ? (
                            <Text style={styles.itemMeta}>Delivery Notes: {order.deliveryNotes}</Text>
                          ) : null}
                        </View>
                        <View style={styles.historyOrderItems}>
                          {order.items.map((item) => (
                            <View key={item.id} style={styles.historyOrderItem}>
                              <Text style={styles.itemTitle}>{item.dishName}</Text>
                              <Text style={styles.itemMeta}>Quantity: {item.quantity}</Text>
                              <Text style={styles.itemMeta}>Unit Price: ${item.unitPrice.toFixed(2)}</Text>
                              {item.customizations.length > 0 ? (
                                <Text style={styles.itemMeta}>
                                  Customizations: {item.customizations.map((customization) => `${customization.action} ${customization.name}`).join(', ')}
                                </Text>
                              ) : null}
                              {item.instructions ? (
                                <Text style={styles.itemMeta}>Instructions: {item.instructions}</Text>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      </Card3D>
                    ))
                )}
              </View>
            </ScreenCard>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#EEF5F2',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 120,
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#0C7A67',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F2529',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    maxWidth: '82%',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stack: {
    gap: 12,
  },
  centeredButtonRow: {
    alignItems: 'center',
  },
  centeredButtonWrap: {
    alignSelf: 'center',
  },
  locationNotice: {
    color: '#9D3C2A',
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: '#FBFEFD',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  selectedPanel: {
    borderColor: '#0C7A67',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#D4F1E8',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardWide: {
    backgroundColor: '#D4F1E8',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    color: '#0C7A67',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#0F2529',
    fontSize: 28,
    fontWeight: '800',
  },
  historyPanel: {
    backgroundColor: '#FBFEFD',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  historyDetails: {
    gap: 6,
  },
  historyOrderItems: {
    gap: 8,
  },
  historyOrderItem: {
    backgroundColor: '#EEF5F2',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  earningsBadge: {
    backgroundColor: '#D1E9D5',
    color: '#2D6D3E',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  itemTitle: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#000000',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
});
