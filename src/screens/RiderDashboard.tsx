import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { AppButton, Pill, ScreenCard, SectionTitle } from '../components/common';
import { useApp } from '../context/AppContext';

type RiderTab = 'assignments' | 'map' | 'cash' | 'profile';

export function RiderDashboard() {
  const { session, users, orders, logout, moveOrderToNextStatus, confirmOrderCash } = useApp();
  const [activeTab, setActiveTab] = useState<RiderTab>('assignments');
  const rider = users.find((user) => user.id === session?.userId) ?? null;
  const assignedOrders = useMemo(
    () => orders.filter((order) => order.riderId === session?.userId),
    [orders, session?.userId]
  );
  const activeDelivery = assignedOrders.find((order) => order.status !== 'delivered') ?? null;
  const codOrders = assignedOrders.filter((order) => order.paymentMethod === 'cod');

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Rider Console</Text>
            <Text style={styles.title}>Manage route, customer contact, status updates, and COD handover.</Text>
          </View>
          <AppButton label="Logout" variant="ghost" onPress={() => void logout()} />
        </View>

        <View style={styles.tabRow}>
          {(['assignments', 'map', 'cash', 'profile'] as RiderTab[]).map((tab) => (
            <Pill key={tab} label={tab} active={activeTab === tab} onPress={() => setActiveTab(tab)} />
          ))}
        </View>

        {activeTab === 'assignments' ? (
          <ScreenCard>
            <SectionTitle
              title="Delivery logistics"
              subtitle="One-tap state updates plus customer phone and delivery notes."
            />
            <View style={styles.stack}>
              {assignedOrders.map((order) => (
                <View key={order.id} style={styles.panel}>
                  <Text style={styles.itemTitle}>Order #{order.id}</Text>
                  <Text style={styles.itemMeta}>{order.customerName} | {order.customerPhone}</Text>
                  <Text style={styles.itemMeta}>Status: {order.status}</Text>
                  <Text style={styles.itemMeta}>Notes: {order.deliveryNotes || 'No extra notes'}</Text>
                  <Text style={styles.itemMeta}>Address: {order.addressLine}</Text>
                  <View style={styles.actionRow}>
                    <AppButton
                      label="Call customer"
                      variant="secondary"
                      onPress={() => void Linking.openURL(`tel:${order.customerPhone}`)}
                    />
                    <AppButton
                      label="Next status"
                      onPress={() => void moveOrderToNextStatus(order.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'map' ? (
          <ScreenCard>
            <SectionTitle
              title="Map integration"
              subtitle="Customer coordinates for navigation and doorstep accuracy."
            />
            {activeDelivery ? (
              <>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: activeDelivery.latitude,
                    longitude: activeDelivery.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: activeDelivery.latitude,
                      longitude: activeDelivery.longitude,
                    }}
                    title={`Order #${activeDelivery.id}`}
                    description={activeDelivery.addressLine}
                  />
                </MapView>
                <AppButton
                  label="Open native maps"
                  onPress={() =>
                    void Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${activeDelivery.latitude},${activeDelivery.longitude}`
                    )
                  }
                />
              </>
            ) : (
              <Text style={styles.itemMeta}>No active delivery to map right now.</Text>
            )}
          </ScreenCard>
        ) : null}

        {activeTab === 'cash' ? (
          <ScreenCard>
            <SectionTitle
              title="Cash reconciliation"
              subtitle="Confirm COD collections so the manager ledger updates immediately."
            />
            <View style={styles.stack}>
              {codOrders.map((order) => (
                <View key={order.id} style={styles.panel}>
                  <Text style={styles.itemTitle}>Order #{order.id}</Text>
                  <Text style={styles.itemMeta}>
                    Total: ${order.total.toFixed(2)} | Payment state: {order.paymentStatus}
                  </Text>
                  <Text style={styles.itemMeta}>Collected at: {order.cashCollectedAt ?? 'Pending'}</Text>
                  <AppButton
                    label="Confirm cash collected"
                    onPress={() => void confirmOrderCash(order.id)}
                    disabled={order.paymentStatus === 'cod_collected'}
                  />
                </View>
              ))}
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'profile' && rider ? (
          <ScreenCard>
            <SectionTitle title="Rider profile" subtitle="Current rider credentials and contact routing." />
            <Text style={styles.itemTitle}>
              {rider.firstName} {rider.lastName}
            </Text>
            <Text style={styles.itemMeta}>@{rider.username}</Text>
            <Text style={styles.itemMeta}>{rider.email}</Text>
            <Text style={styles.itemMeta}>{rider.phone}</Text>
            <Text style={styles.itemMeta}>{rider.addressLine}</Text>
            <Text style={styles.itemMeta}>Instructions: {rider.notes}</Text>
          </ScreenCard>
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
    paddingTop: 56,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
  panel: {
    backgroundColor: '#FBFEFD',
    borderColor: '#D0E2DA',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  itemTitle: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  map: {
    borderRadius: 18,
    height: 280,
    overflow: 'hidden',
  },
});
