import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton, Field, Pill, ScreenCard, SectionTitle, commonStyles } from '../components/common';
import { useApp } from '../context/AppContext';
import type { ManagerDishPayload } from '../types';

type ManagerTab = 'command' | 'menu' | 'finance' | 'logs';

const initialDish: ManagerDishPayload = {
  categoryId: 1,
  name: '',
  description: '',
  price: 0,
  prepTimeMinutes: 15,
  calories: 400,
  spiceLevel: 'Mild',
  isAvailable: true,
};

export function ManagerDashboard() {
  const {
    users,
    orders,
    dishes,
    categories,
    auditLogs,
    metrics,
    logout,
    upsertMenuDish,
    removeMenuDish,
    moveOrderToNextStatus,
    updateRefundDecision,
    assignRider,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ManagerTab>('command');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'preparing' | 'ready' | 'on_the_way' | 'delivered'>('all');
  const [editingDish, setEditingDish] = useState<ManagerDishPayload | null>(null);
  const riders = users.filter((user) => user.role === 'rider');

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Manager Command Center</Text>
            <Text style={styles.title}>Control menu, kitchen flow, riders, refunds, and ledger health.</Text>
          </View>
          <AppButton label="Logout" variant="ghost" onPress={() => void logout()} />
        </View>

        <View style={styles.tabRow}>
          {(['command', 'menu', 'finance', 'logs'] as ManagerTab[]).map((tab) => (
            <Pill key={tab} label={tab} active={activeTab === tab} onPress={() => setActiveTab(tab)} />
          ))}
        </View>

        {activeTab === 'command' ? (
          <ScreenCard>
            <SectionTitle
              title="Order command center"
              subtitle="Filter orders by state, inspect customers, and drive each order forward."
            />
            <View style={styles.tabRow}>
              {(['all', 'pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered'] as const).map((filter) => (
                <Pill key={filter} label={filter} active={statusFilter === filter} onPress={() => setStatusFilter(filter)} />
              ))}
            </View>
            <View style={styles.stack}>
              {filteredOrders.map((order) => (
                <View key={order.id} style={styles.panel}>
                  <Text style={styles.itemTitle}>Order #{order.id}</Text>
                  <Text style={styles.itemMeta}>
                    {order.customerName} | {order.customerPhone} | Rider: {order.riderName ?? 'Unassigned'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Status: {order.status} | Payment: {order.paymentMethod.toUpperCase()} / {order.paymentStatus}
                  </Text>
                  <Text style={styles.itemMeta}>Address: {order.addressLine}</Text>
                  <View style={styles.actionRow}>
                    <AppButton label="Advance status" onPress={() => void moveOrderToNextStatus(order.id)} />
                    {riders[0] ? (
                      <AppButton
                        label="Assign rider"
                        variant="secondary"
                        onPress={() => void assignRider(order.id, riders[0].id)}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'menu' ? (
          <ScreenCard>
            <SectionTitle
              title="Dynamic menu control"
              subtitle="Real-time CRUD for categories, dishes, pricing, and availability."
              action={
                <AppButton label="Add dish" onPress={() => setEditingDish({ ...initialDish })} />
              }
            />
            <View style={styles.stack}>
              {dishes.map((dish) => (
                <View key={dish.id} style={styles.panel}>
                  <Text style={styles.itemTitle}>{dish.name}</Text>
                  <Text style={styles.itemMeta}>
                    {dish.categoryName} | ${dish.price.toFixed(2)} | {dish.isAvailable ? 'Available' : 'Hidden'}
                  </Text>
                  <Text style={styles.itemMeta}>{dish.description}</Text>
                  <View style={styles.actionRow}>
                    <AppButton
                      label="Edit"
                      variant="secondary"
                      onPress={() =>
                        setEditingDish({
                          id: dish.id,
                          categoryId: dish.categoryId,
                          name: dish.name,
                          description: dish.description,
                          price: dish.price,
                          prepTimeMinutes: dish.prepTimeMinutes,
                          calories: dish.calories,
                          spiceLevel: dish.spiceLevel,
                          isAvailable: dish.isAvailable,
                        })
                      }
                    />
                    <AppButton
                      label="Delete"
                      variant="danger"
                      onPress={() => void removeMenuDish(dish.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'finance' ? (
          <>
            <ScreenCard>
              <SectionTitle title="Financial dashboard" subtitle="Daily, weekly, monthly, COD, and refund exposure." />
              <View style={styles.metricsGrid}>
                <View>
                  <Text style={commonStyles.metricLabel}>Daily revenue</Text>
                  <Text style={commonStyles.metricValue}>${metrics.dailyRevenue.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={commonStyles.metricLabel}>Weekly revenue</Text>
                  <Text style={commonStyles.metricValue}>${metrics.weeklyRevenue.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={commonStyles.metricLabel}>Monthly revenue</Text>
                  <Text style={commonStyles.metricValue}>${metrics.monthlyRevenue.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={commonStyles.metricLabel}>Outstanding COD</Text>
                  <Text style={commonStyles.metricValue}>${metrics.outstandingCod.toFixed(2)}</Text>
                </View>
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle title="Refund management" subtitle="Approve or deny complaints with an auditable note." />
              <View style={styles.stack}>
                {orders
                  .filter((order) => order.refundRequest)
                  .map((order) => (
                    <View key={order.id} style={styles.panel}>
                      <Text style={styles.itemTitle}>Order #{order.id}</Text>
                      <Text style={styles.itemMeta}>{order.refundRequest?.reason}</Text>
                      <Text style={styles.itemMeta}>{order.refundRequest?.details}</Text>
                      <Text style={styles.itemMeta}>Status: {order.refundRequest?.status}</Text>
                      {order.refundRequest?.status === 'requested' ? (
                        <View style={styles.actionRow}>
                          <AppButton
                            label="Approve"
                            onPress={() =>
                              void updateRefundDecision(
                                order.refundRequest!.id,
                                'approved',
                                'Approved after service quality review.'
                              )
                            }
                          />
                          <AppButton
                            label="Deny"
                            variant="danger"
                            onPress={() =>
                              void updateRefundDecision(
                                order.refundRequest!.id,
                                'denied',
                                'Insufficient evidence for refund.'
                              )
                            }
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'logs' ? (
          <ScreenCard>
            <SectionTitle title="Audit logs" subtitle="Detailed trace of who changed what and when." />
            <View style={styles.stack}>
              {auditLogs.map((log) => (
                <View key={log.id} style={styles.panel}>
                  <Text style={styles.itemTitle}>
                    {log.actorName} [{log.actorRole}]
                  </Text>
                  <Text style={styles.itemMeta}>
                    {log.action} {log.entityType} #{log.entityId}
                  </Text>
                  <Text style={styles.itemMeta}>{log.details}</Text>
                  <Text style={styles.itemMeta}>{new Date(log.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </ScreenCard>
        ) : null}
      </ScrollView>

      <Modal visible={editingDish !== null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScreenCard style={styles.modalCard}>
            <SectionTitle title={editingDish?.id ? 'Edit dish' : 'Create dish'} subtitle="Menu CRUD for pricing and availability." />
            {editingDish ? (
              <View style={styles.stack}>
                <Field label="Name" value={editingDish.name} onChangeText={(value) => setEditingDish({ ...editingDish, name: value })} />
                <Field label="Description" value={editingDish.description} onChangeText={(value) => setEditingDish({ ...editingDish, description: value })} multiline />
                <Field label="Price" value={String(editingDish.price)} onChangeText={(value) => setEditingDish({ ...editingDish, price: Number(value) || 0 })} keyboardType="decimal-pad" />
                <Field label="Prep time minutes" value={String(editingDish.prepTimeMinutes)} onChangeText={(value) => setEditingDish({ ...editingDish, prepTimeMinutes: Number(value) || 0 })} keyboardType="number-pad" />
                <Field label="Calories" value={String(editingDish.calories)} onChangeText={(value) => setEditingDish({ ...editingDish, calories: Number(value) || 0 })} keyboardType="number-pad" />
                <Field label="Spice level" value={editingDish.spiceLevel} onChangeText={(value) => setEditingDish({ ...editingDish, spiceLevel: value })} />
                <Field label="Category ID" value={String(editingDish.categoryId)} onChangeText={(value) => setEditingDish({ ...editingDish, categoryId: Number(value) || categories[0]?.id || 1 })} keyboardType="number-pad" />
                <Field label="Available (1/0)" value={editingDish.isAvailable ? '1' : '0'} onChangeText={(value) => setEditingDish({ ...editingDish, isAvailable: value !== '0' })} keyboardType="number-pad" />
                <Text style={styles.itemMeta}>
                  Categories: {categories.map((category) => `${category.id}-${category.name}`).join(', ')}
                </Text>
                <View style={styles.actionRow}>
                  <AppButton label="Cancel" variant="ghost" onPress={() => setEditingDish(null)} />
                  <AppButton
                    label="Save"
                    onPress={() => {
                      if (!editingDish) {
                        return;
                      }
                      void upsertMenuDish(editingDish).then(() => setEditingDish(null));
                    }}
                  />
                </View>
              </View>
            ) : null}
          </ScreenCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#EFF1EA',
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
    color: '#174C4F',
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
    backgroundColor: '#FBFCF8',
    borderColor: '#D4DBD1',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 37, 41, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
  },
});
