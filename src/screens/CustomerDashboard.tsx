import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, Card3D, Field, FloatingActionMenu, OrderStatusBadge, Pill, ScreenCard, SectionTitle, commonStyles } from '../components/common';
import {
  useAppActions,
  useAppStatus,
  useCatalogState,
  useOrdersState,
  useSessionState,
} from '../context/AppContext';
import {
  DELIVERY_FEE_CONFIG,
  calculateCartSubtotal,
  calculateOrderTotals,
} from '../utils/orderMath';
import { calculateDishPrice } from '../utils/dishPricing';
import { DishTab } from './DishTab';
import { MapPickerScreen } from './MapPickerScreen';
import { LiveTrackingScreen } from './LiveTrackingScreen';
import type { Dish, Order } from '../types';

type CustomerTab = 'explore' | 'cart' | 'orders' | 'account';

function formatCustomerTabLabel(tab: CustomerTab) {
  switch (tab) {
    case 'explore':
      return 'Explore';
    case 'cart':
      return 'Cart';
    case 'orders':
      return 'Orders';
    case 'account':
      return 'Account';
    default:
      return tab;
  }
}

export function CustomerDashboard() {
  const insets = useSafeAreaInsets();
  const { currentUser, session } = useSessionState();
  const { activeDiscountPercent, banners, categories, dishes, restaurantLocation } =
    useCatalogState();
  const orders = useOrdersState();
  const {
    addToCart,
    cancelMyOrder,
    cart,
    clearCart,
    logout,
    placeOrder,
    removeFromCart,
    submitRefund,
    submitReview,
    updateCartQuantity,
  } = useAppActions();
  const { isBusy } = useAppStatus();

  const [activeTab, setActiveTab] = useState<CustomerTab>('explore');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [roadNumber, setRoadNumber] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundDetails, setRefundDetails] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<number | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
  const bannerScrollRef = useRef<ScrollView | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  const customerOrders = orders.filter((order) => order.customerId === session?.userId);
  const activeOrders = customerOrders.filter((order) =>
    ['pending', 'accepted', 'preparing', 'ready', 'on_the_way'].includes(order.status)
  );
  const historyOrders = customerOrders.filter((order) => ['delivered', 'rejected', 'canceled'].includes(order.status));

  const effectiveLocation =
    deliveryLocation ??
    (currentUser ? { latitude: currentUser.latitude, longitude: currentUser.longitude } : null);
  const manualAddressLine = `${areaName.trim()}_Road_${roadNumber.trim()}_House_${houseNumber.trim()}`;
  const hasManualAddress =
    areaName.trim().length > 0 && roadNumber.trim().length > 0 && houseNumber.trim().length > 0;
  const canPlaceOrder = cart.length > 0 && isBusy === false && effectiveLocation !== null && (!useManualAddress || hasManualAddress);

  const filteredDishes = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return (dishes || []).filter((dish) => {
      if (!dish) return false;
      const matchesCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
      const ingredientText = (dish.ingredients || []).map((item) => item.name.toLowerCase()).join(' ');
      const matchesSearch =
        lowered.length === 0 ||
        dish.name.toLowerCase().includes(lowered) ||
        ingredientText.includes(lowered);
      return matchesCategory && matchesSearch;
    });
  }, [dishes, search, selectedCategory]);
  const customerNavigationItems = useMemo(
    () => [
      { key: 'explore', label: 'Explore dishes', icon: 'compass-outline' as const, active: activeTab === 'explore', onPress: () => setActiveTab('explore') },
      { key: 'cart', label: 'Cart', icon: 'bag-handle-outline' as const, active: activeTab === 'cart', onPress: () => setActiveTab('cart') },
      { key: 'orders', label: 'Orders', icon: 'receipt-outline' as const, active: activeTab === 'orders', onPress: () => setActiveTab('orders') },
      { key: 'account', label: 'Account', icon: 'person-circle-outline' as const, active: activeTab === 'account', onPress: () => setActiveTab('account') },
    ],
    [activeTab]
  );

  const totals = calculateOrderTotals(cart, activeDiscountPercent, {
    restaurantLocation,
    deliveryLocation: effectiveLocation,
  });

  function calculateDisplayedDishPrice(dish: Dish | null | undefined): number {
    if (!dish) return 0;
    return calculateDishPrice(dish);
  }

  // Render star rating
  function renderStars(rating: number): string {
    const filled = Math.round(rating);
    const empty = 5 - filled;
    return '★'.repeat(filled) + '☆'.repeat(empty);
  }

  function openDish(dish: Dish) {
    setSelectedDish(dish);
  }

  async function handleMapLocationSelected(location: { latitude: number; longitude: number }) {
    setDeliveryLocation(location);
    setShowMapPicker(false);
  }

  useEffect(() => {
    banners.forEach((banner) => {
      if (banner.imageUrl) {
        void Image.prefetch(banner.imageUrl);
      }
    });
  }, [banners]);

  useEffect(() => {
    if (banners.length <= 1) {
      setActiveBannerIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveBannerIndex((current) => {
        const next = (current + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({
          x: next * Math.max(windowWidth - 32, 280),
          y: 0,
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [banners.length, windowWidth]);

  if (showMapPicker) {
    return (
      <MapPickerScreen
        onLocationSelected={handleMapLocationSelected}
        initialLocation={deliveryLocation || undefined}
      />
    );
  }

  if (trackingOrderId) {
    return (
      <LiveTrackingScreen
        order={orders.find((o) => o.id === trackingOrderId) || ({} as Order)}
        onBack={() => setTrackingOrderId(null)}
      />
    );
  }

  if (selectedDish) {
    return (
      <DishTab
        dish={selectedDish}
        onBack={() => setSelectedDish(null)}
        onAddToCart={(customizations, quantity, instructionText) => {
          addToCart({
            id: `${selectedDish.id}-${Date.now()}`,
            dishId: selectedDish.id,
            dishName: selectedDish.name,
            quantity,
            basePrice: calculateDishPrice(selectedDish),
            instructions: instructionText,
            customizations,
          });
          setSelectedDish(null);
        }}
        onSubmitReview={(rating, comment) => {
          void submitReview({
            dishId: selectedDish.id,
            rating,
            comment,
            orderId: 0,
          });
        }}
        currentUser={currentUser}
        isBusy={isBusy}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.page}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Customer Console</Text>
            {/* <Text style={styles.title}>Order with full kitchen and rider visibility.</Text> */}
          </View>
        </View>

        {activeTab === 'explore' ? (
          <>
            {banners.length > 0 ? (
              <View>
                <ScrollView
                  ref={(ref) => {
                    bannerScrollRef.current = ref;
                  }}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.bannerScroll}
                  onMomentumScrollEnd={(event) => {
                    const bannerWidth = Math.max(windowWidth - 32, 280);
                    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
                    setActiveBannerIndex(nextIndex);
                  }}
                >
                  {banners.map((banner) => (
                    <Card3D key={banner.id} style={[styles.bannerCard, { width: Math.max(windowWidth - 32, 280) }]}>
                      <Image
                        source={{ uri: banner.imageUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                        accessibilityLabel={banner.title}
                      />
                      <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                        <Text style={styles.bannerDescription} numberOfLines={2}>{banner.description}</Text>
                      </View>
                    </Card3D>
                  ))}
                </ScrollView>
                <View style={styles.bannerDots}>
                  {banners.map((banner, index) => (
                    <View
                      key={banner.id}
                      style={[styles.bannerDot, index === activeBannerIndex && styles.bannerDotActive]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <Card3D style={[styles.bannerCard, { width: Math.max(windowWidth - 32, 280) }]}>
                <View style={[styles.bannerImage, styles.bannerFallback]}>
                  <Text style={styles.bannerFallbackTitle}>No Active Banner</Text>
                  <Text style={styles.bannerFallbackText}>Manager can add a banner from Menu - Banner System.</Text>
                </View>
              </Card3D>
            )}



            <ScreenCard>
              <SectionTitle
                title="Search and browse"
              // subtitle="Find dishes by name or by ingredient to match dietary needs."
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
                {filteredDishes.filter(d => d != null).map((dish) => (
                  <Card3D key={dish.id} style={styles.dishCard}>
                    <Pressable onPress={() => openDish(dish)}>
                      {dish.imageUrl ? (
                        <Image
                          source={{ uri: dish.imageUrl }}
                          style={styles.dishImage}
                          accessibilityLabel={dish.name}
                        />
                      ) : (
                        <View style={[styles.dishImage, styles.dishImagePlaceholder]} />
                      )}
                      <View style={styles.dishContent}>
                        <View style={styles.dishHead}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dishName}>{dish.name}</Text>
                            {dish.averageRating > 0 ? (
                              <Text style={styles.dishRating}>
                                {renderStars(dish.averageRating)} {dish.averageRating.toFixed(1)} ({dish.reviewCount})
                              </Text>
                            ) : (
                              <Text style={styles.dishRating}>No ratings yet</Text>
                            )}
                          </View>
                          <Text style={styles.dishPrice}>${calculateDisplayedDishPrice(dish).toFixed(2)}</Text>
                        </View>
                        <Text style={styles.dishDescription}>{dish.description}</Text>
                        <Text style={styles.dishMeta}>
                          {dish.categoryName} • {dish.prepTimeMinutes} min • {dish.calories} kcal
                        </Text>
                      </View>
                    </Pressable>
                  </Card3D>
                ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'cart' ? (
          <ScreenCard>
            <SectionTitle
              title="Digital cart"
            // subtitle="Customize items, set delivery location, then place your order."
            />
            <View style={styles.stack}>
              {cart.length === 0 ? (
                <Text style={commonStyles.mutedText}>No items yet. Add a dish from Explore.</Text>
              ) : (
                  cart.map((item) => (
                    <View key={item.id} style={styles.cartItemCard}>
                      <View style={styles.cartItemHeader}>
                        <Text
                          style={styles.cartItemName}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.dishName}
                        </Text>
                        <AppButton
                          icon="trash"
                          variant="danger"
                          onPress={() => removeFromCart(item.id)}
                        />
                      </View>
                      {item.customizations.length > 0 && (
                      <Text style={styles.cartItemMeta}>
                        {item.customizations.map((c) => `${c.action} ${c.name}`).join(', ')}
                      </Text>
                    )}
                    {item.instructions && (
                      <Text style={styles.cartItemMeta}>📝 {item.instructions}</Text>
                    )}
                    <View style={styles.cartItemFooter}>
                      <View style={styles.cartQuantity}>
                        <AppButton
                          icon="remove"
                          variant="ghost"
                          onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
                        />
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <AppButton
                          icon="add"
                          variant="ghost"
                          onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
                        />
                      </View>
                      <Text style={styles.itemPrice}>
                        ${(
                          (item.basePrice +
                            item.customizations.reduce((sum, customization) => sum + customization.priceDelta, 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {cart.length > 0 && (
              <>
                <View style={styles.divider} />

                <View style={styles.stack}>
                  <View style={styles.deliveryHeaderRow}>
                    <Text style={styles.sectionLabel}>Delivery Location</Text>
                    <View style={styles.deliverySwitchGroup}>
                      <Text style={styles.deliverySwitchLabel}>Manual</Text>
                      <Switch
                        value={useManualAddress}
                        onValueChange={setUseManualAddress}
                        trackColor={{ false: '#D6D3C9', true: '#D45D31' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                  {useManualAddress ? (
                    <View style={styles.stack}>
                      <Field label="Area name" value={areaName} onChangeText={setAreaName} />
                      <Field label="Road no." value={roadNumber} onChangeText={setRoadNumber} />
                      <Field label="House no." value={houseNumber} onChangeText={setHouseNumber} />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.cartItemMeta}>
                        {effectiveLocation
                          ? `${effectiveLocation.latitude.toFixed(5)}, ${effectiveLocation.longitude.toFixed(5)}`
                          : 'No location selected'}
                      </Text>
                      <AppButton
                        label="Set Location"
                        variant="secondary"
                        onPress={() => {
                          setShowMapPicker(true);
                        }}
                      />
                    </>
                  )}
                </View>

                <Field
                  label="Delivery notes (optional)"
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                  placeholder="Direction, floor no., landmark..."
                  multiline
                />

                <View style={styles.divider} />

                <View style={styles.totalsCard}>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Subtotal</Text>
                    <Text style={styles.totalsValue}>${calculateCartSubtotal(cart).toFixed(2)}</Text>
                  </View>
                  {totals.discount > 0 && (
                    <View style={styles.totalsRow}>
                      <Text style={styles.totalsLabel}>Discount ({activeDiscountPercent}%)</Text>
                      <Text style={styles.totalsValue}>−${totals.discount.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Delivery fee</Text>
                    <Text style={styles.totalsValue}>${totals.deliveryFee.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.cartItemMeta}>
                    {totals.deliveryFee === 0
                      ? `Free delivery unlocked on orders of $${DELIVERY_FEE_CONFIG.freeDeliveryThreshold.toFixed(2)} or more.`
                      : `Distance-based pricing with a $${DELIVERY_FEE_CONFIG.minimumFee.toFixed(2)} floor and free delivery from $${DELIVERY_FEE_CONFIG.freeDeliveryThreshold.toFixed(2)}.`}
                  </Text>
                  <View style={styles.totalsRowFinal}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.stack}>
                  <View style={styles.centeredButtonRow}>
                    <AppButton label="Clear cart" variant="ghost" onPress={clearCart} />
                  </View>
                  <View style={styles.checkoutRow}>
                    <AppButton
                      label={isBusy ? 'Placing order...' : 'Pay online'}
                      onPress={() =>
                        void placeOrder({
                          deliveryNotes,
                          paymentMethod: 'card',
                          latitude: effectiveLocation?.latitude ?? NaN,
                          longitude: effectiveLocation?.longitude ?? NaN,
                          deliveryAddressLine: useManualAddress ? manualAddressLine : undefined,
                        })
                      }
                      disabled={!canPlaceOrder}
                    />
                    <AppButton
                      label={isBusy ? 'Placing order...' : 'Cash on delivery'}
                      variant="secondary"
                      onPress={() =>
                        void placeOrder({
                          deliveryNotes,
                          paymentMethod: 'cod',
                          latitude: effectiveLocation?.latitude ?? NaN,
                          longitude: effectiveLocation?.longitude ?? NaN,
                          deliveryAddressLine: useManualAddress ? manualAddressLine : undefined,
                        })
                      }
                      disabled={!canPlaceOrder}
                    />
                  </View>
                </View>
              </>
            )}
          </ScreenCard>
        ) : null}

        {activeTab === 'orders' ? (
          <>
            <ScreenCard>
              <SectionTitle
                title="Live tracking"
              // subtitle="Real-time updates on order status and rider location"
              />
              <View style={styles.stack}>
                {activeOrders.length === 0 ? (
                  <Text style={commonStyles.mutedText}>No active orders right now.</Text>
                ) : (
                  activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onCancel={() => void cancelMyOrder(order.id)}
                      onTrackLive={() => setTrackingOrderId(order.id)}
                    />
                  ))
                )}
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle
                title="Order history"
              // subtitle="Detailed view of past orders"
              />
              <View style={styles.stack}>
                {historyOrders.length === 0 ? (
                  <Text style={commonStyles.mutedText}>No completed orders yet.</Text>
                ) : (
                  historyOrders.map((order) => (
                    <Card3D key={order.id} style={styles.orderHistoryCard}>
                      <View style={styles.orderHeader}>
                        <View>
                          <Text style={styles.dishName}>Order #{order.id}</Text>
                          <Text style={styles.dishMeta}>
                            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                          </Text>
                        </View>
                        <View style={styles.orderStatus}>
                          <OrderStatusBadge status={order.status} compact />
                        </View>
                      </View>

                      <View style={styles.orderItemsSection}>
                        <Text style={styles.sectionLabel}>Items</Text>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.orderItem}>
                            <Text style={styles.dishName}>
                              {item.dishName} × {item.quantity}
                            </Text>
                            {item.customizations?.length > 0 && (
                              <Text style={styles.dishMeta}>
                                {item.customizations.map((c) => `${c.action} ${c.name}`).join(', ')}
                              </Text>
                            )}
                            <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)} each</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.orderMetaSection}>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Subtotal</Text>
                          <Text style={styles.metaValue}>${order.subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Total</Text>
                          <Text style={styles.metaValueBold}>${order.total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Payment</Text>
                          <Text style={styles.metaValue}>{order.paymentMethod.toUpperCase()}</Text>
                        </View>
                        {order.deliveryNotes && (
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Notes</Text>
                            <Text style={styles.metaValue}>{order.deliveryNotes}</Text>
                          </View>
                        )}
                      </View>

                      {order.status === 'delivered' && (
                        <View style={styles.orderHistoryFooter}>
                          <View style={styles.centeredButtonWrap}>
                            <AppButton
                              label="Request refund"
                              variant="ghost"
                              onPress={() => setRefundOrderId(order.id)}
                            />
                          </View>
                        </View>
                      )}
                    </Card3D>
                  ))
                )}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'account' && currentUser ? (
          <ScreenCard>
            <SectionTitle
              title="Account"
            // subtitle="Profile information"
            />
            <Card3D style={styles.accountCard}>
              <View style={styles.accountField}>
                <Text style={styles.accountLabel}>Name</Text>
                <Text style={styles.accountValue}>
                  {currentUser.firstName} {currentUser.lastName}
                </Text>
              </View>
              <View style={styles.accountField}>
                <Text style={styles.accountLabel}>Username</Text>
                <Text style={styles.accountValue}>@{currentUser.username}</Text>
              </View>
              <View style={styles.accountField}>
                <Text style={styles.accountLabel}>Email</Text>
                <Text style={styles.accountValue}>{currentUser.email}</Text>
              </View>
              <View style={styles.accountField}>
                <Text style={styles.accountLabel}>Phone</Text>
                <Text style={styles.accountValue}>{currentUser.phone}</Text>
              </View>
              <View style={styles.accountField}>
                <Text style={styles.accountLabel}>Date of Birth</Text>
                <Text style={styles.accountValue}>{currentUser.dateOfBirth}</Text>
              </View>
            </Card3D>
            <View style={styles.centeredButtonRow}>
              <View style={styles.centeredButtonWrap}>
                <AppButton
                  label="Logout"
                  variant="danger"
                  onPress={() => void logout()}
                />
              </View>
            </View>
          </ScreenCard>
        ) : null}
      </ScrollView>

      <Modal visible={refundOrderId !== null} animationType="fade" transparent>
        <View
          style={[
            styles.modalBackdrop,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <ScreenCard style={styles.modalCard}>
            <SectionTitle title="Refund request" subtitle={`Order #${refundOrderId ?? ''}`} />
            <Field label="Reason" value={refundReason} onChangeText={setRefundReason} />
            <Field label="Details" value={refundDetails} onChangeText={setRefundDetails} multiline />
            <View style={styles.actionRow}>
              <AppButton icon='close' label="Cancel" variant="ghost" onPress={() => setRefundOrderId(null)} />
              <AppButton
                label="Submit"
                icon='paper-plane'
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

      <FloatingActionMenu
        items={customerNavigationItems}
        activeLabel={formatCustomerTabLabel(activeTab)}
        accentColor="#D45D31"
        containerStyle={{ bottom: Math.max(insets.bottom, 16) + 12 }}
      />
    </KeyboardAvoidingView>
  );
}

function OrderCard({ order, onCancel, onTrackLive }: { order: Order; onCancel: () => void; onTrackLive?: () => void }) {
  const steps = [
    ['Pending', order.createdAt],
    ['Accepted', order.acceptedAt],
    ['Preparing', order.preparingAt],
    ['Ready', order.readyAt],
    ['On the way', order.pickedUpAt],
  ];

  const currentStatus = order.status;
  const canCancel = currentStatus !== 'ready' && currentStatus !== 'on_the_way' && currentStatus !== 'delivered';

  return (
    <Card3D style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.dishName}>Order #{order.id}</Text>
          <Text style={styles.dishMeta}>
            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.orderStatus}>
          <Text style={[styles.statusBadge, styles.statusActive]}>
            {currentStatus === 'accepted' && ' Accepted'}
            {currentStatus === 'preparing' && ' Preparing'}
            {currentStatus === 'ready' && '✓ Ready'}
            {currentStatus === 'on_the_way' && ' On the way'}
          </Text>
        </View>
      </View>

      <View style={styles.orderItemsSection}>
        <Text style={styles.sectionLabel}>Items ({order.items.length})</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.orderItem}>
            <Text style={styles.dishName}>
              {item.dishName} × {item.quantity}
            </Text>
            {item.customizations?.length > 0 && (
              <Text style={styles.dishMeta}>
                {item.customizations.map((c) => `${c.action} ${c.name}`).join(', ')}
              </Text>
            )}
            <Text style={styles.itemPrice}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {order.riderName && (
        <View style={styles.riderSection}>
          <Text style={styles.sectionLabel}>Rider Information</Text>
          <View style={styles.riderInfo}>
            <Text style={styles.dishMeta}>Name: {order.riderName}</Text>
            {order.riderPhone && <Text style={styles.dishMeta}>Phone: {order.riderPhone}</Text>}
            {order.riderLatitude && order.riderLongitude && (
              <Text style={styles.dishMeta}>
                Location: ({order.riderLatitude.toFixed(4)}, {order.riderLongitude.toFixed(4)})
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.timelineContainer}>
        <Text style={styles.sectionLabel}>Order Timeline</Text>
        <View style={styles.timeline}>
          {steps.map(([label, timestamp]) => {
            const isCompleted = !!timestamp;
            return (
              <View key={label} style={styles.timelineRow}>
                <View style={[styles.timelineDot, isCompleted && styles.timelineDotActive]} />
                <View style={{ flex: 1, flexDirection: 'row'}}>
                  <Text style={styles.timelineLabel}>{label}</Text>
                  {timestamp && (
                    <Text style={styles.timelineTime}>{new Date(timestamp).toLocaleTimeString()}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {order.deliveryNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Delivery Notes</Text>
          <Text style={styles.dishMeta}>{order.deliveryNotes}</Text>
        </View>
      )}

      <View style={styles.orderMetaSection}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Total</Text>
          <Text style={styles.metaValueBold}>${order.total.toFixed(2)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Payment</Text>
          <Text style={styles.metaValue}>{order.paymentMethod.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.centeredAction}>
        {order.status === 'on_the_way' && onTrackLive && (
            <View style={styles.centeredButtonWrap}>
              <AppButton
                label="Live Tracking"
                icon='locate'
                variant="secondary"
                onPress={onTrackLive}
            />
            </View>
        )}
        {canCancel && (
          <View style={styles.centeredButtonWrap}>
          <AppButton
            label="Cancel order"
            icon='trash'
            variant="danger"
            onPress={onCancel}
          />
          </View>
        )}
      </View>
    </Card3D>
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
    paddingTop: 16,
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
    padding: 8,
  },
  bannerScroll: {
    marginHorizontal: -8,
    paddingHorizontal: 8,
    padding: 10,
  },
  bannerCard: {
    borderRadius: 12,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  bannerImage: {
    aspectRatio: 16 / 9,
    backgroundColor: '#E3DACA',
    borderRadius: 12,
  },
  bannerFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  bannerFallbackTitle: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '700',
  },
  bannerFallbackText: {
    color: '#56707B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  bannerContent: {
    backgroundColor: '#FFFBF2',
    gap: 4,
    padding: 10,
  },
  bannerTitle: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerDescription: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 16,
  },
  bannerDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 6,
  },
  bannerDot: {
    backgroundColor: '#D1C8B8',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  bannerDotActive: {
    backgroundColor: '#D45D31',
    width: 18,
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
    gap: 16,
  },
  dishCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
    padding: 12,
  },
  dishImage: {
    aspectRatio: 16 / 9,
    backgroundColor: '#E3DACA',
    borderRadius: 12,
  },
  dishImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishContent: {
    gap: 8,
    padding: 12,
    paddingTop: 8,
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
  dishRating: {
    color: '#D45D31',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dishPrice: {
    color: '#D45D31',
    fontSize: 18,
    fontWeight: '800',
  },
  dishDescription: {
    color: '#335057',
    fontSize: 13,
    lineHeight: 18,
  },
  dishMeta: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 16,
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
  cartItemCard: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  cartItemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cartItemName: {
    color: '#0F2529',
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 0,
  },
  cartItemMeta: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 16,
  },
  cartItemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cartQuantity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checkoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  centeredButtonRow: {
    alignItems: 'center',
  },
  centeredButtonWrap: {
    alignSelf: 'center',
  },
  quantityText: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  itemPrice: {
    color: '#D45D31',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    borderBottomColor: '#000000',
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  sectionLabel: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deliverySwitchGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deliverySwitchLabel: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalsCard: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  totalsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalsRowFinal: {
    alignItems: 'center',
    borderTopColor: '#000000',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalsLabel: {
    color: '#56707B',
    fontSize: 13,
    fontWeight: '500',
  },
  totalsValue: {
    color: '#335057',
    fontSize: 13,
    fontWeight: '600',
  },
  totalLabel: {
    color: '#0F2529',
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    color: '#D45D31',
    fontSize: 18,
    fontWeight: '800',
  },
  accountCard: {
    backgroundColor: '#F9F6F0',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 0,
    paddingVertical: 0,
  },
  accountField: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#E3DACA',
    borderBottomWidth: 1,
  },
  accountLabel: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accountValue: {
    color: '#0F2529',
    fontSize: 15,
    fontWeight: '500',
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
  orderHistoryFooter: {
    alignItems: 'flex-start',
    borderTopColor: '#000000',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 30, 33, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalImage: {
    aspectRatio: 16 / 9,
    backgroundColor: '#E3DACA',
    borderRadius: 12,
    marginBottom: 8,
  },
  ingredientSectionTitle: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E3DACA',
  },
  ingredientRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDE2',
  },
  ingredientBadge: {
    backgroundColor: '#FCE8D5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientBadgeText: {
    color: '#D45D31',
    fontSize: 11,
    fontWeight: '600',
  },
  priceInfo: {
    backgroundColor: '#F2EDE2',
    borderRadius: 8,
    gap: 4,
    padding: 12,
  },
  timeline: {
    gap: 6,
  },
  timelineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
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
  orderCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  orderHistoryCard: {
    backgroundColor: '#F9F6F0',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  orderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 6,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
  },
  statusActive: {
    backgroundColor: '#FCE8D5',
    color: '#D45D31',
  },
  statusDelivered: {
    backgroundColor: '#D1E9D5',
    color: '#2D6D3E',
  },
  statusCancelled: {
    backgroundColor: '#FCCCC3',
    color: '#C1483D',
  },
  orderItemsSection: {
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  orderItem: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    padding: 8,
  },
  riderSection: {
    gap: 6,
  },
  riderInfo: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    padding: 8,
  },
  timelineContainer: {
    gap: 8,
  },
  notesSection: {
    gap: 6,
  },
  orderMetaSection: {
    backgroundColor: '#F2EDE2',
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    padding: 10,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    color: '#335057',
    fontSize: 12,
    fontWeight: '500',
  },
  metaValueBold: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  timelineLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  timelineTime: {
    color: '#000000',
    fontSize: 11,
    textAlign: 'right',
  },
  centeredAction: {
    alignItems: 'center',
  },
});
