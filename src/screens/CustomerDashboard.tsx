import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AppButton, Field, Pill, ScreenCard, SectionTitle, commonStyles } from '../components/common';
import { useApp } from '../context/AppContext';
import { calculateCartSubtotal, calculateOrderTotals } from '../utils/orderMath';
import type { Dish, Order, OrderItemCustomization } from '../types';

type CustomerTab = 'explore' | 'cart' | 'orders' | 'account';

export function CustomerDashboard() {
  const {
    session,
    users,
    offers,
    dishes,
    categories,
    orders,
    cart,
    activeDiscountPercent,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    submitRefund,
    submitReview,
    logout,
    isBusy,
  } = useApp();

  const [activeTab, setActiveTab] = useState<CustomerTab>('explore');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<OrderItemCustomization[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isCod, setCod] = useState(true);
  const [refundReason, setRefundReason] = useState('');
  const [refundDetails, setRefundDetails] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<number | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [reviewDishId, setReviewDishId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');

  const currentUser = users.find((user) => user.id === session?.userId) ?? null;
  const customerOrders = orders.filter((order) => order.customerId === session?.userId);
  const activeOrders = customerOrders.filter((order) => order.status !== 'delivered');
  const historyOrders = customerOrders.filter((order) => order.status === 'delivered');

  const filteredDishes = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
      const ingredientText = dish.ingredients.map((item) => item.name.toLowerCase()).join(' ');
      const matchesSearch =
        lowered.length === 0 ||
        dish.name.toLowerCase().includes(lowered) ||
        ingredientText.includes(lowered);
      return matchesCategory && matchesSearch;
    });
  }, [dishes, search, selectedCategory]);

  const totals = calculateOrderTotals(cart, activeDiscountPercent);

  function openDish(dish: Dish) {
    setSelectedDish(dish);
    setInstructions('');
    setQuantity(1);
    setSelectedCustomizations([]);
  }

  function toggleCustomization(
    ingredientId: number,
    action: 'add' | 'remove',
    name: string,
    priceDelta: number
  ) {
    setSelectedCustomizations((current) => {
      const exists = current.find(
        (item) => item.ingredientId === ingredientId && item.action === action
      );
      if (exists) {
        return current.filter(
          (item) => !(item.ingredientId === ingredientId && item.action === action)
        );
      }
      return [...current, { ingredientId, action, name, priceDelta }];
    });
  }

  function commitDishSelection() {
    if (!selectedDish) {
      return;
    }
    addToCart({
      id: `${selectedDish.id}-${Date.now()}`,
      dishId: selectedDish.id,
      dishName: selectedDish.name,
      quantity,
      basePrice: selectedDish.price,
      instructions,
      customizations: selectedCustomizations,
    });
    setSelectedDish(null);
  }

  const topOffer = offers[0];

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Customer Console</Text>
            <Text style={styles.title}>Order with full kitchen and rider visibility.</Text>
          </View>
          <AppButton label="Logout" variant="ghost" onPress={() => void logout()} />
        </View>

        <View style={styles.tabRow}>
          {(['explore', 'cart', 'orders', 'account'] as CustomerTab[]).map((tab) => (
            <Pill key={tab} label={tab} active={tab === activeTab} onPress={() => setActiveTab(tab)} />
          ))}
        </View>

        {activeTab === 'explore' ? (
          <>
            {topOffer ? (
              <ScreenCard style={[styles.heroCard, { backgroundColor: topOffer.bannerColor }]}>
                <Text style={styles.offerKicker}>Current Offer</Text>
                <Text style={styles.offerTitle}>{topOffer.title}</Text>
                <Text style={styles.offerDescription}>{topOffer.description}</Text>
                <Text style={styles.offerMeta}>{topOffer.discountPercent}% automatically applied</Text>
              </ScreenCard>
            ) : null}

            <ScreenCard>
              <SectionTitle
                title="Search and browse"
                subtitle="Find dishes by name or by ingredient to match dietary needs."
              />
              <Field
                label="Search dishes or ingredients"
                value={search}
                onChangeText={setSearch}
                placeholder="Try jalapeno, chicken, avocado..."
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabRow}>
                  <Pill
                    label="all"
                    active={selectedCategory === 'all'}
                    onPress={() => setSelectedCategory('all')}
                  />
                  {categories.map((category) => (
                    <Pill
                      key={category.id}
                      label={category.name}
                      active={selectedCategory === category.id}
                      onPress={() => setSelectedCategory(category.id)}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={styles.stack}>
                {filteredDishes.map((dish) => (
                  <Pressable key={dish.id} onPress={() => openDish(dish)} style={styles.dishCard}>
                    <View style={styles.dishHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dishName}>{dish.name}</Text>
                        <Text style={styles.dishMeta}>
                          {dish.categoryName} | {dish.prepTimeMinutes} min | {dish.calories} kcal
                        </Text>
                      </View>
                      <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.dishDescription}>{dish.description}</Text>
                    <Text style={styles.dishMeta}>
                      Ingredients: {dish.ingredients.map((item) => item.name).join(', ')}
                    </Text>
                    <Text style={styles.dishMeta}>
                      Reviews: {dish.averageRating.toFixed(1)} / 5 from {dish.reviewCount} customers
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'cart' ? (
          <ScreenCard>
            <SectionTitle
              title="Digital cart"
              subtitle="Adjust quantities, choose COD, then send the order into the kitchen."
            />
            <View style={styles.stack}>
              {cart.length === 0 ? (
                <Text style={commonStyles.mutedText}>No items yet. Add a dish from Explore.</Text>
              ) : (
                cart.map((item) => (
                  <View key={item.id} style={styles.cartRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dishName}>
                        {item.dishName} x {item.quantity}
                      </Text>
                      <Text style={styles.dishMeta}>
                        {item.customizations.map((customization) => `${customization.action} ${customization.name}`).join(', ') || 'No custom changes'}
                      </Text>
                      {item.instructions ? (
                        <Text style={styles.dishMeta}>Instruction: {item.instructions}</Text>
                      ) : null}
                    </View>
                    <View style={styles.cartActions}>
                      <AppButton
                        label="-"
                        variant="ghost"
                        onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
                      />
                      <AppButton
                        label="+"
                        variant="ghost"
                        onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
                      />
                      <AppButton
                        label="Remove"
                        variant="danger"
                        onPress={() => removeFromCart(item.id)}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            <Field
              label="Delivery notes"
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="Gate code 1234, floor, landmark..."
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.dishName}>Cash on Delivery</Text>
              <Switch value={isCod} onValueChange={setCod} />
            </View>
            <Text style={styles.dishMeta}>Subtotal: ${calculateCartSubtotal(cart).toFixed(2)}</Text>
            <Text style={styles.dishMeta}>Discount: ${totals.discount.toFixed(2)}</Text>
            <Text style={styles.dishMeta}>Delivery fee: ${totals.deliveryFee.toFixed(2)}</Text>
            <Text style={styles.totalText}>Total: ${totals.total.toFixed(2)}</Text>

            <View style={styles.actionRow}>
              <AppButton label="Clear cart" variant="ghost" onPress={clearCart} />
              <AppButton
                label={isBusy ? 'Placing...' : 'Place order'}
                onPress={() =>
                  void placeOrder({
                    deliveryNotes,
                    paymentMethod: isCod ? 'cod' : 'card',
                  })
                }
                disabled={cart.length === 0 || isBusy}
              />
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'orders' ? (
          <>
            <ScreenCard>
              <SectionTitle
                title="Live tracking"
                subtitle="Accepted, preparing, ready, picked up, and rider contact are all visible."
              />
              <View style={styles.stack}>
                {activeOrders.length === 0 ? (
                  <Text style={commonStyles.mutedText}>No active orders right now.</Text>
                ) : (
                  activeOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle
                title="History, refund, and review"
                subtitle="Re-order favourites, file service complaints, or review dishes."
              />
              <View style={styles.stack}>
                {historyOrders.map((order) => (
                  <View key={order.id} style={styles.dishCard}>
                    <Text style={styles.dishName}>Order #{order.id}</Text>
                    <Text style={styles.dishMeta}>
                      {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
                    </Text>
                    <Text style={styles.dishMeta}>
                      {order.paymentMethod.toUpperCase()} | ${order.total.toFixed(2)} | {order.status}
                    </Text>
                    <View style={styles.actionRow}>
                      <AppButton
                        label="Request refund"
                        variant="ghost"
                        onPress={() => setRefundOrderId(order.id)}
                      />
                      <AppButton
                        label="Leave review"
                        variant="secondary"
                        onPress={() => {
                          setReviewOrderId(order.id);
                          setReviewDishId(order.items[0]?.dishId ?? null);
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'account' && currentUser ? (
          <ScreenCard>
            <SectionTitle title="Account" subtitle="Profile and default delivery details." />
            <Text style={styles.dishName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text style={styles.dishMeta}>@{currentUser.username}</Text>
            <Text style={styles.dishMeta}>{currentUser.email}</Text>
            <Text style={styles.dishMeta}>{currentUser.phone}</Text>
            <Text style={styles.dishMeta}>{currentUser.addressLine}</Text>
            <Text style={styles.dishMeta}>Notes: {currentUser.notes || 'None'}</Text>
          </ScreenCard>
        ) : null}
      </ScrollView>

      <Modal visible={!!selectedDish} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScreenCard style={styles.modalCard}>
            <SectionTitle
              title={selectedDish?.name ?? ''}
              subtitle={selectedDish?.description ?? ''}
              action={<AppButton label="Close" variant="ghost" onPress={() => setSelectedDish(null)} />}
            />
            <Text style={styles.dishMeta}>
              {selectedDish?.spiceLevel} spice | {selectedDish?.prepTimeMinutes} min
            </Text>
            <ScrollView style={{ maxHeight: 280 }}>
              <View style={styles.stack}>
                {selectedDish?.ingredients.map((ingredient) => (
                  <View key={`${ingredient.ingredientId}-${ingredient.isDefault}`} style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dishName}>{ingredient.name}</Text>
                      <Text style={styles.dishMeta}>
                        {ingredient.isAllergen ? 'Allergen aware' : 'Standard'} | {ingredient.extraPrice > 0 ? `+$${ingredient.extraPrice.toFixed(2)}` : 'No extra cost'}
                      </Text>
                    </View>
                    {ingredient.canRemove && ingredient.isDefault ? (
                      <AppButton
                        label={
                          selectedCustomizations.some(
                            (item) =>
                              item.ingredientId === ingredient.ingredientId && item.action === 'remove'
                          )
                            ? 'Undo remove'
                            : 'Remove'
                        }
                        variant="ghost"
                        onPress={() =>
                          toggleCustomization(
                            ingredient.ingredientId,
                            'remove',
                            ingredient.name,
                            0
                          )
                        }
                      />
                    ) : null}
                    {ingredient.canAdd ? (
                      <AppButton
                        label={
                          selectedCustomizations.some(
                            (item) =>
                              item.ingredientId === ingredient.ingredientId && item.action === 'add'
                          )
                            ? 'Undo add'
                            : 'Add'
                        }
                        variant="secondary"
                        onPress={() =>
                          toggleCustomization(
                            ingredient.ingredientId,
                            'add',
                            ingredient.name,
                            ingredient.extraPrice
                          )
                        }
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>
            <Field label="Kitchen instruction" value={instructions} onChangeText={setInstructions} />
            <Field label="Quantity" value={String(quantity)} onChangeText={(value) => setQuantity(Math.max(1, Number(value) || 1))} keyboardType="number-pad" />
            <AppButton label="Add to cart" onPress={commitDishSelection} />
          </ScreenCard>
        </View>
      </Modal>

      <Modal visible={refundOrderId !== null} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <ScreenCard style={styles.modalCard}>
            <SectionTitle title="Refund request" subtitle={`Order #${refundOrderId ?? ''}`} />
            <Field label="Reason" value={refundReason} onChangeText={setRefundReason} />
            <Field label="Details" value={refundDetails} onChangeText={setRefundDetails} multiline />
            <View style={styles.actionRow}>
              <AppButton label="Cancel" variant="ghost" onPress={() => setRefundOrderId(null)} />
              <AppButton
                label="Submit"
                onPress={() => {
                  if (!refundOrderId) {
                    return;
                  }
                  void submitRefund({
                    orderId: refundOrderId,
                    reason: refundReason,
                    details: refundDetails,
                  }).then(() => {
                    setRefundOrderId(null);
                    setRefundReason('');
                    setRefundDetails('');
                  });
                }}
              />
            </View>
          </ScreenCard>
        </View>
      </Modal>

      <Modal visible={reviewOrderId !== null} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <ScreenCard style={styles.modalCard}>
            <SectionTitle title="Dish review" subtitle={`Order #${reviewOrderId ?? ''}`} />
            <Field label="Dish ID" value={String(reviewDishId ?? '')} onChangeText={(value) => setReviewDishId(Number(value) || null)} keyboardType="number-pad" />
            <Field label="Rating 1-5" value={reviewRating} onChangeText={setReviewRating} keyboardType="number-pad" />
            <Field label="Comment" value={reviewComment} onChangeText={setReviewComment} multiline />
            <View style={styles.actionRow}>
              <AppButton label="Cancel" variant="ghost" onPress={() => setReviewOrderId(null)} />
              <AppButton
                label="Save"
                onPress={() => {
                  if (!reviewDishId || !reviewOrderId) {
                    return;
                  }
                  void submitReview({
                    orderId: reviewOrderId,
                    dishId: reviewDishId,
                    rating: Math.min(5, Math.max(1, Number(reviewRating) || 5)),
                    comment: reviewComment,
                  }).then(() => {
                    setReviewOrderId(null);
                    setReviewComment('');
                    setReviewRating('5');
                  });
                }}
              />
            </View>
          </ScreenCard>
        </View>
      </Modal>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const steps = [
    ['accepted', order.acceptedAt],
    ['preparing', order.preparingAt],
    ['ready', order.readyAt],
    ['on the way', order.pickedUpAt],
    ['delivered', order.deliveredAt],
  ];

  return (
    <View style={styles.dishCard}>
      <Text style={styles.dishName}>Order #{order.id}</Text>
      <Text style={styles.dishMeta}>
        {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
      </Text>
      <Text style={styles.dishMeta}>
        Rider: {order.riderName ?? 'Pending'} {order.riderPhone ? `| ${order.riderPhone}` : ''}
      </Text>
      <Text style={styles.dishMeta}>Notes: {order.deliveryNotes || 'No notes'}</Text>
      <View style={styles.timeline}>
        {steps.map(([label, date]) => (
          <View key={label} style={styles.timelineRow}>
            <View style={[styles.timelineDot, date ? styles.timelineDotActive : undefined]} />
            <Text style={styles.dishMeta}>
              {label}: {date ? new Date(date).toLocaleTimeString() : 'waiting'}
            </Text>
          </View>
        ))}
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
    color: '#D45D31',
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
    maxWidth: '80%',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroCard: {
    borderColor: 'transparent',
  },
  offerKicker: {
    color: '#FCE8D5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  offerTitle: {
    color: '#FFF8ED',
    fontSize: 28,
    fontWeight: '800',
  },
  offerDescription: {
    color: '#FFF2E0',
    fontSize: 15,
    lineHeight: 22,
  },
  offerMeta: {
    color: '#FCE8D5',
    fontSize: 13,
    fontWeight: '700',
  },
  stack: {
    gap: 12,
  },
  dishCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#E3DACA',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  dishHead: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  dishName: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '700',
  },
  dishPrice: {
    color: '#D45D31',
    fontSize: 20,
    fontWeight: '800',
  },
  dishDescription: {
    color: '#335057',
    fontSize: 14,
    lineHeight: 20,
  },
  dishMeta: {
    color: '#56707B',
    fontSize: 13,
    lineHeight: 18,
  },
  cartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  cartActions: {
    gap: 6,
    minWidth: 92,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  totalText: {
    color: '#0F2529',
    fontSize: 22,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 30, 33, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '88%',
    width: '100%',
  },
  timeline: {
    gap: 6,
  },
  timelineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  timelineDot: {
    backgroundColor: '#D6D1C4',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  timelineDotActive: {
    backgroundColor: '#D45D31',
  },
});
