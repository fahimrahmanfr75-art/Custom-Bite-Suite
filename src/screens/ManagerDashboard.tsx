import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, Card3D, Field, FloatingActionMenu, OrderStatusBadge, Pill, ScreenCard, SectionTitle, commonStyles } from '../components/common';
import {
  useAppActions,
  useAppStatus,
  useCatalogState,
  useMetricsState,
  useOrdersState,
  useSessionState,
} from '../context/AppContext';
import type { BannerPayload, Dish, ManagerDishPayload, Order, OrderItem } from '../types';
import { calculateDishPrice } from '../utils/dishPricing';

type ManagerTab = 'profile' | 'command' | 'menu' | 'finance' | 'history';

type EditableIngredient = ManagerDishPayload['ingredientCategories'][number]['ingredients'][number];
type EditableIngredientCategory = ManagerDishPayload['ingredientCategories'][number];

const initialBanner: BannerPayload = {
  imageUrl: '',
  title: '',
  description: '',
  isActive: true,
  sortOrder: 1,
};

const historyStatuses = ['delivered', 'rejected', 'canceled'] as const;

function createEmptyIngredient(sortOrder = 0): EditableIngredient {
  return {
    name: '',
    isMandatory: false,
    isDefault: false,
    extraPrice: 0,
    canAdd: true,
    canRemove: true,
    sortOrder,
  };
}

function createEmptyIngredientCategory(sortOrder = 0): EditableIngredientCategory {
  return {
    name: '',
    description: '',
    sortOrder,
    ingredients: [createEmptyIngredient(0)],
  };
}

function createInitialDish(categoryId: number): ManagerDishPayload {
  return {
    categoryId,
    name: '',
    description: '',
    price: 0,
    prepTimeMinutes: 15,
    calories: 400,
    spiceLevel: 'Mild',
    isAvailable: true,
    imageUrl: '',
    ingredientCategories: [createEmptyIngredientCategory(0)],
  };
}

function calculateDisplayedDishPrice(dish: Dish | null | undefined) {
  if (!dish) {
    return 0;
  }
  return calculateDishPrice(dish);
}

function calculateEditingDishPrice(dish: ManagerDishPayload | null | undefined) {
  if (!dish) {
    return 0;
  }

  return Number(
    dish.ingredientCategories
      .flatMap((category) => category.ingredients)
      .filter((ingredient) => ingredient.isDefault || ingredient.isMandatory)
      .reduce((sum, ingredient) => sum + (Number(ingredient.extraPrice) || 0), 0)
      .toFixed(2)
  );
}

function renderStars(rating: number) {
  const fullStar = '\u2605';
  const emptyStar = '\u2606';
  return fullStar.repeat(Math.round(rating)) + emptyStar.repeat(5 - Math.round(rating));
}

function formatOrderStatus(status: Order['status']) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'N/A';
}

function formatManagerTabLabel(tab: ManagerTab) {
  switch (tab) {
    case 'profile':
      return 'Profile';
    case 'command':
      return 'Command';
    case 'menu':
      return 'Menu';
    case 'finance':
      return 'Finance';
    case 'history':
      return 'History';
    default:
      return tab;
  }
}

function groupIngredientsByCategory(item: OrderItem) {
  return item.ingredientSnapshots.reduce<Record<string, string[]>>((acc, ingredient) => {
    const current = acc[ingredient.ingredientCategoryName] ?? [];
    current.push(ingredient.ingredientName);
    acc[ingredient.ingredientCategoryName] = current;
    return acc;
  }, {});
}

async function pickImageFromDevice(kind: 'dish' | 'banner') {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', `Media library access is required to upload a ${kind} image.`);
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 1,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return asset.uri || null;
}

function mapDishToManagerPayload(
  dish: Dish,
  ingredientCategoryDescriptions: Record<number, { name: string; description: string; sortOrder: number }>
): ManagerDishPayload {
  const categoryMap = new Map<number, EditableIngredientCategory>();

  dish.ingredients.forEach((ingredient, index) => {
    const existingCategory = categoryMap.get(ingredient.ingredientCategoryId);
    const categoryMeta = ingredientCategoryDescriptions[ingredient.ingredientCategoryId];

    if (!existingCategory) {
      categoryMap.set(ingredient.ingredientCategoryId, {
        id: ingredient.ingredientCategoryId,
        name: ingredient.ingredientCategoryName,
        description: categoryMeta?.description ?? '',
        sortOrder: categoryMeta?.sortOrder ?? index,
        ingredients: [],
      });
    }

    categoryMap.get(ingredient.ingredientCategoryId)?.ingredients.push({
      ingredientId: ingredient.ingredientId,
      name: ingredient.name,
      isMandatory: ingredient.isMandatory,
      isDefault: ingredient.isDefault,
      extraPrice: ingredient.extraPrice,
      canAdd: ingredient.canAdd,
      canRemove: ingredient.canRemove,
      sortOrder: index,
    });
  });

  const ingredientCategories = [...categoryMap.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category, categoryIndex) => ({
      ...category,
      sortOrder: categoryIndex,
      ingredients: category.ingredients.map((ingredient, ingredientIndex) => ({
        ...ingredient,
        sortOrder: ingredientIndex,
      })),
    }));

  return {
    id: dish.id,
    categoryId: dish.categoryId,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    prepTimeMinutes: dish.prepTimeMinutes,
    calories: dish.calories,
    spiceLevel: dish.spiceLevel,
    isAvailable: dish.isAvailable,
    imageUrl: dish.imageUrl,
    ingredientCategories: ingredientCategories.length > 0 ? ingredientCategories : [createEmptyIngredientCategory(0)],
  };
}

function HistoryOrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const closedAt = order.deliveredAt ?? order.rejectedAt ?? order.canceledAt ?? order.createdAt;

  return (
    <Card3D style={styles.panel}>
      <View style={styles.historyHeader}>
        <View style={styles.historyHeaderText}>
          <Text style={styles.itemTitle}>Order #{order.id}</Text>
          <View style={styles.historyStatusRow}>
            <OrderStatusBadge status={order.status} compact />
            <Text style={styles.itemMeta}>Closed: {formatDateTime(closedAt)}</Text>
          </View>
          <Text style={styles.itemMeta}>Total: ${order.total.toFixed(2)}</Text>
        </View>
        <AppButton
          // label={expanded ? 'Collapse' : 'Expand'}
          icon={expanded ? 'contract' : 'expand'}
          variant="secondary"
          onPress={() => setExpanded((current) => !current)}
        />
      </View>

      {expanded ? (
        <View style={styles.stack}>
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Order Summary</Text>
            <Text style={styles.itemMeta}>Order ID: {order.id}</Text>
            <Text style={styles.itemMeta}>Order status: {formatOrderStatus(order.status)}</Text>
            <Text style={styles.itemMeta}>Order time and date: {formatDateTime(order.createdAt)}</Text>
            {order.deliveredAt ? (
              <Text style={styles.itemMeta}>Delivery time and date: {formatDateTime(order.deliveredAt)}</Text>
            ) : null}
            {order.rejectedAt ? (
              <Text style={styles.itemMeta}>Rejected time and date: {formatDateTime(order.rejectedAt)}</Text>
            ) : null}
            {order.canceledAt ? (
              <Text style={styles.itemMeta}>Canceled time and date: {formatDateTime(order.canceledAt)}</Text>
            ) : null}
            <Text style={styles.itemMeta}>Payment status: {order.paymentStatus}</Text>
            <Text style={styles.itemMeta}>Delivery location: {order.addressLine}</Text>
            <Text style={styles.itemMeta}>
              Coordinates: {order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}
            </Text>
            <Text style={styles.itemMeta}>Delivery notes: {order.deliveryNotes || 'N/A'}</Text>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Customer Details</Text>
            <Text style={styles.itemMeta}>Customer ID: {order.customerId}</Text>
            <Text style={styles.itemMeta}>Name: {order.customerName}</Text>
            <Text style={styles.itemMeta}>Phone: {order.customerPhone}</Text>
            <Text style={styles.itemMeta}>Email: {order.customerEmail}</Text>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Rider Details</Text>
            <Text style={styles.itemMeta}>Rider ID: {order.riderId ?? 'N/A'}</Text>
            <Text style={styles.itemMeta}>Name: {order.riderName ?? 'N/A'}</Text>
            <Text style={styles.itemMeta}>Phone: {order.riderPhone ?? 'N/A'}</Text>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Dish Breakdown</Text>
            {order.items.map((item) => {
              const ingredientsByCategory = groupIngredientsByCategory(item);
              return (
                <Card3D key={item.id} style={styles.historyItemCard}>
                  <Text style={styles.itemTitle}>{item.dishName}</Text>
                  <Text style={styles.itemMeta}>Quantity: {item.quantity}</Text>
                  <Text style={styles.itemMeta}>Price: ${item.unitPrice.toFixed(2)} each</Text>
                  <Text style={styles.itemMeta}>Line total: ${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                  <Text style={styles.itemMeta}>Kitchen instruction notes: {item.instructions || 'N/A'}</Text>
                  {Object.entries(ingredientsByCategory).length > 0 ? (
                    Object.entries(ingredientsByCategory).map(([categoryName, ingredientNames]) => (
                      <Text key={`${item.id}-${categoryName}`} style={styles.itemMeta}>
                        {categoryName}: {ingredientNames.join(', ')}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.itemMeta}>Ingredients: N/A</Text>
                  )}
                </Card3D>
              );
            })}
            <Text style={styles.itemMeta}>Total price: ${order.total.toFixed(2)}</Text>
          </View>
        </View>
      ) : null}
    </Card3D>
  );
}

export function ManagerDashboard() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useSessionState();
  const { banners, categories, dishes, ingredientCategories } = useCatalogState();
  const orders = useOrdersState();
  const metrics = useMetricsState();
  const {
    logout,
    moveOrderToNextStatus,
    rejectCustomerOrder,
    removeBanner,
    removeMenuDish,
    updateRefundDecision,
    upsertBanner,
    upsertMenuDish,
  } = useAppActions();
  const { clearError, errorMessage } = useAppStatus();

  const [activeTab, setActiveTab] = useState<ManagerTab>('command');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'accepted' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'rejected' | 'canceled'
  >('all');
  const [editingDish, setEditingDish] = useState<ManagerDishPayload | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerPayload | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const filteredOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );
  const historyOrders = useMemo(
    () =>
      orders
        .filter((order) => historyStatuses.some((status) => status === order.status))
        .sort(
          (left, right) =>
            new Date(
              right.deliveredAt ?? right.rejectedAt ?? right.canceledAt ?? right.createdAt
            ).getTime() -
            new Date(left.deliveredAt ?? left.rejectedAt ?? left.canceledAt ?? left.createdAt).getTime()
        ),
    [orders]
  );
  const ingredientCategoryDescriptions = useMemo(
    () =>
      ingredientCategories.reduce<Record<number, { name: string; description: string; sortOrder: number }>>(
        (acc, category) => {
          acc[category.id] = {
            name: category.name,
            description: category.description,
            sortOrder: category.sortOrder,
          };
          return acc;
        },
        {}
      ),
    [ingredientCategories]
  );
  const managerNavigationItems = useMemo(
    () => [
      { key: 'profile', label: 'Profile', icon: 'person-circle-outline' as const, active: activeTab === 'profile', onPress: () => setActiveTab('profile') },
      { key: 'command', label: 'Command center', icon: 'grid-outline' as const, active: activeTab === 'command', onPress: () => setActiveTab('command') },
      { key: 'menu', label: 'Menu system', icon: 'restaurant-outline' as const, active: activeTab === 'menu', onPress: () => setActiveTab('menu') },
      { key: 'finance', label: 'Finance', icon: 'cash-outline' as const, active: activeTab === 'finance', onPress: () => setActiveTab('finance') },
      { key: 'history', label: 'History', icon: 'time-outline' as const, active: activeTab === 'history', onPress: () => setActiveTab('history') },
    ],
    [activeTab]
  );

  function updateEditingDish(updater: (current: ManagerDishPayload) => ManagerDishPayload) {
    setEditingDish((current) => (current ? updater(current) : current));
  }

  function setDishCategory(categoryId: number) {
    updateEditingDish((current) => ({ ...current, categoryId }));
  }

  function updateIngredientCategoryField(
    categoryIndex: number,
    field: keyof Omit<EditableIngredientCategory, 'ingredients'>,
    value: string | number
  ) {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: current.ingredientCategories.map((category, index) =>
        index === categoryIndex ? { ...category, [field]: value } : category
      ),
    }));
  }

  function addIngredientCategory() {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: [
        ...current.ingredientCategories,
        createEmptyIngredientCategory(current.ingredientCategories.length),
      ],
    }));
  }

  function removeIngredientCategory(categoryIndex: number) {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: current.ingredientCategories
        .filter((_, index) => index !== categoryIndex)
        .map((category, index) => ({ ...category, sortOrder: index })),
    }));
  }

  function updateIngredientField(
    categoryIndex: number,
    ingredientIndex: number,
    field: keyof EditableIngredient,
    value: string | number | boolean
  ) {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: current.ingredientCategories.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        return {
          ...category,
          ingredients: category.ingredients.map((ingredient, currentIngredientIndex) =>
            currentIngredientIndex === ingredientIndex ? { ...ingredient, [field]: value } : ingredient
          ),
        };
      }),
    }));
  }

  function addIngredient(categoryIndex: number) {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: current.ingredientCategories.map((category, index) =>
        index === categoryIndex
          ? {
            ...category,
            ingredients: [...category.ingredients, createEmptyIngredient(category.ingredients.length)],
          }
          : category
      ),
    }));
  }

  function removeIngredient(categoryIndex: number, ingredientIndex: number) {
    updateEditingDish((current) => ({
      ...current,
      ingredientCategories: current.ingredientCategories.map((category, index) => {
        if (index !== categoryIndex) {
          return category;
        }

        return {
          ...category,
          ingredients: category.ingredients
            .filter((_, currentIngredientIndex) => currentIngredientIndex !== ingredientIndex)
            .map((ingredient, currentIngredientIndex) => ({
              ...ingredient,
              sortOrder: currentIngredientIndex,
            })),
        };
      }),
    }));
  }

  async function pickDishImage() {
    try {
      const nextImageUrl = await pickImageFromDevice('dish');
      if (!nextImageUrl) {
        return;
      }

      setEditingDish((current) => (current ? { ...current, imageUrl: nextImageUrl } : current));
    } catch (error) {
      Alert.alert(
        'Image selection failed',
        error instanceof Error ? error.message : 'The selected image could not be loaded.'
      );
    }
  }

  async function pickBannerImage() {
    try {
      const nextImageUrl = await pickImageFromDevice('banner');
      if (!nextImageUrl) {
        return;
      }

      setEditingBanner((current) => (current ? { ...current, imageUrl: nextImageUrl } : current));
    } catch (error) {
      Alert.alert(
        'Image selection failed',
        error instanceof Error ? error.message : 'The selected image could not be loaded.'
      );
    }
  }

  function validateDishPayload(payload: ManagerDishPayload) {
    if (!payload.name.trim()) {
      return 'Dish name is required.';
    }

    if (!payload.description.trim()) {
      return 'Dish description is required.';
    }

    const namedCategories = payload.ingredientCategories.filter((category) => category.name.trim().length > 0);
    const ingredientNames = new Set<string>();

    for (const category of namedCategories) {
      const trimmedCategoryName = category.name.trim();
      if (!trimmedCategoryName) {
        return 'Ingredient category name is required.';
      }

      for (const ingredient of category.ingredients) {
        const trimmedIngredientName = ingredient.name.trim().toLowerCase();
        if (!trimmedIngredientName) {
          continue;
        }
        if (ingredientNames.has(trimmedIngredientName)) {
          return 'Ingredient names must be unique within a dish.';
        }
        ingredientNames.add(trimmedIngredientName);
      }
    }

    const defaultSelectedTotal = payload.ingredientCategories
      .flatMap((category) => category.ingredients)
      .filter((ingredient) => ingredient.isDefault || ingredient.isMandatory)
      .reduce((sum, ingredient) => sum + (Number(ingredient.extraPrice) || 0), 0);

    if (defaultSelectedTotal <= 0) {
      return 'At least one default-selected ingredient price is required so the dish price can be derived.';
    }

    return null;
  }

  async function saveDish() {
    if (!editingDish) {
      return;
    }

    const normalizedPayload: ManagerDishPayload = {
      ...editingDish,
      price: calculateEditingDishPrice(editingDish),
      ingredientCategories: editingDish.ingredientCategories
        .map((category, categoryIndex) => ({
          ...category,
          name: category.name.trim(),
          description: category.description.trim(),
          sortOrder: categoryIndex,
          ingredients: category.ingredients
            .map((ingredient, ingredientIndex) => ({
              ...ingredient,
              name: ingredient.name.trim(),
              extraPrice: Number(ingredient.extraPrice) || 0,
              sortOrder: ingredientIndex,
              canAdd: !ingredient.isMandatory,
              canRemove: !ingredient.isMandatory,
            }))
            .filter((ingredient) => ingredient.name.length > 0),
        }))
        .filter((category) => category.name.length > 0),
    };

    const validationError = validateDishPayload(normalizedPayload);
    if (validationError) {
      setMenuError(validationError);
      return;
    }

    try {
      setMenuError(null);
      await upsertMenuDish(normalizedPayload);
      setEditingDish(null);
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : 'Failed to save dish.');
    }
  }

  function openDishEditor(dish: Dish) {
    setMenuError(null);
    setEditingDish(mapDishToManagerPayload(dish, ingredientCategoryDescriptions));
  }

  async function saveBanner() {
    if (!editingBanner) {
      return;
    }

    try {
      clearError();
      await upsertBanner({
        ...editingBanner,
        imageUrl: editingBanner.imageUrl.trim(),
        title: editingBanner.title.trim(),
        description: editingBanner.description.trim(),
      });
      setEditingBanner(null);
    } catch {
      return;
    }
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Manager Command Center</Text>
          </View>
        </View>

        {activeTab === 'profile' && currentUser ? (
          <ScreenCard>
            <SectionTitle title="Profile" />
            <Card3D style={styles.panel}>
              <Text style={styles.itemTitle}>
                {currentUser.firstName} {currentUser.lastName}
              </Text>
              <Text style={styles.itemMeta}>@{currentUser.username}</Text>
              <Text style={styles.itemMeta}>{currentUser.email}</Text>
              <Text style={styles.itemMeta}>{currentUser.phone}</Text>
              <Text style={styles.itemMeta}>{currentUser.role.toUpperCase()}</Text>
            </Card3D>
            <View style={styles.centeredButtonRow}>
              <View style={styles.centeredButtonWrap}>
                <AppButton label="Logout" variant="danger" onPress={() => void logout()} />
              </View>
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'command' ? (
          <>
            <ScreenCard>
              <SectionTitle title="Incoming Orders" />
              <View style={styles.stack}>
                {pendingOrders.length === 0 ? (
                  <Text style={commonStyles.mutedText}>No pending orders.</Text>
                ) : (
                  pendingOrders.map((order) => (
                    <Card3D key={order.id} style={styles.panel}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.itemTitle}>Order #{order.id}</Text>
                        <OrderStatusBadge status={order.status} compact />
                      </View>
                      <Text style={styles.itemMeta}>
                        {order.customerName} | {order.customerPhone}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Items: {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Total ${order.total.toFixed(2)} | {order.paymentMethod.toUpperCase()}
                      </Text>
                      <View style={styles.actionRow}>
                        <AppButton label="Accept" icon='checkmark' onPress={() => void moveOrderToNextStatus(order.id)} />
                        <AppButton
                          label="Reject"
                          icon='close'
                          variant="danger"
                          onPress={() => void rejectCustomerOrder(order.id, 'Rejected by manager')}
                        />
                      </View>
                    </Card3D>
                  ))
                )}
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle title="Kitchen Status" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabRow}>
                  {(
                    ['all', 'pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'rejected', 'canceled'] as const
                  ).map((filter) => (
                    <Pill key={filter} label={filter} active={statusFilter === filter} onPress={() => setStatusFilter(filter)} />
                  ))}
                </View>
              </ScrollView>
              <View style={styles.stack}>
                {filteredOrders.map((order) => (
                  <Card3D key={order.id} style={styles.panel}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>Order #{order.id}</Text>
                      <OrderStatusBadge status={order.status} compact />
                    </View>
                    <Text style={styles.itemMeta}>
                      Items: {order.items.map((item) => `${item.dishName} x ${item.quantity}`).join(', ')}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Customer: {order.customerName} | Payment: {order.paymentStatus}
                    </Text>
                    {['accepted', 'preparing', 'ready'].includes(order.status) ? (
                      <AppButton
                        label="Advance Status"
                        icon='restaurant'
                        variant="secondary"
                        onPress={() => void moveOrderToNextStatus(order.id)}
                      />
                    ) : null}
                  </Card3D>
                ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'menu' ? (
          <ScreenCard>
            {editingDish ? (
              <View style={styles.stack}>
                <SectionTitle
                  title={editingDish.id ? 'Edit Dish' : 'Create Dish'}
                  // subtitle="Manager detail view"
                  action={<AppButton label="Menu" icon="arrow-back" variant="ghost" onPress={() => setEditingDish(null)} />}
                />

                <Card3D style={styles.dishDetailsCard}>
                  <View style={styles.imageContainer}>
                    {editingDish.imageUrl ? (
                      <Image source={{ uri: editingDish.imageUrl }} style={styles.dishImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                        <Text style={styles.placeholderText}>No image selected</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.dishContent}>
                    <View style={styles.dishHead}>
                      <View style={styles.flexOne}>
                        <Text style={styles.dishName}>{editingDish.name || 'Untitled dish'}</Text>
                        <Text style={styles.dishRating}>{renderStars(0)} 0.0 (0)</Text>
                      </View>
                      <Text style={styles.dishPrice}>${calculateEditingDishPrice(editingDish).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.dishDescription}>
                      {editingDish.description || 'Add a description to match the customer-facing menu card.'}
                    </Text>
                    <Text style={styles.dishMeta}>
                      {categories.find((category) => category.id === editingDish.categoryId)?.name ?? 'Uncategorized'} |{' '}
                      {editingDish.prepTimeMinutes} min | {editingDish.calories} kcal | {editingDish.isAvailable ? 'Available' : 'Hidden'}
                    </Text>
                  </View>
                </Card3D>

                <Card3D style={styles.panel}>
                  <SectionTitle title="Dish Basics" />
                  {menuError ? <Text style={styles.errorText}>{menuError}</Text> : null}
                  <Field
                    label="Dish image"
                    value={editingDish.imageUrl}
                    onChangeText={(value) => updateEditingDish((current) => ({ ...current, imageUrl: value }))}
                  />
                  <AppButton label="Upload" icon='images' variant="secondary" onPress={() => void pickDishImage()} />
                  <Field
                    label="Dish name"
                    value={editingDish.name}
                    onChangeText={(value) => updateEditingDish((current) => ({ ...current, name: value }))}
                  />
                  <Field
                    label="Dish description"
                    value={editingDish.description}
                    onChangeText={(value) => updateEditingDish((current) => ({ ...current, description: value }))}
                    multiline
                  />
                  <Field
                    label="Dish price (derived from default-selected ingredients)"
                    value={calculateEditingDishPrice(editingDish).toFixed(2)}
                    onChangeText={() => {}}
                    editable={false}
                  />
                  <Field
                    label="Prep time (minutes)"
                    value={String(editingDish.prepTimeMinutes)}
                    onChangeText={(value) =>
                      updateEditingDish((current) => ({ ...current, prepTimeMinutes: Number(value) || 0 }))
                    }
                    keyboardType="number-pad"
                  />
                  <Field
                    label="Calories"
                    value={String(editingDish.calories)}
                    onChangeText={(value) => updateEditingDish((current) => ({ ...current, calories: Number(value) || 0 }))}
                    keyboardType="number-pad"
                  />
                  <Field
                    label="Spice level"
                    value={editingDish.spiceLevel}
                    onChangeText={(value) => updateEditingDish((current) => ({ ...current, spiceLevel: value }))}
                  />
                  <Text style={styles.sectionLabel}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.tabRow}>
                      {categories.map((category) => (
                        <Pill
                          key={category.id}
                          label={category.name}
                          active={editingDish.categoryId === category.id}
                          onPress={() => setDishCategory(category.id)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={styles.sectionLabel}>Visibility</Text>
                  <View style={styles.tabRow}>
                    <Pill
                      label="available"
                      active={editingDish.isAvailable}
                      onPress={() => updateEditingDish((current) => ({ ...current, isAvailable: true }))}
                    />
                    <Pill
                      label="hidden"
                      active={!editingDish.isAvailable}
                      onPress={() => updateEditingDish((current) => ({ ...current, isAvailable: false }))}
                    />
                  </View>
                </Card3D>

                <Card3D style={styles.panel}>
                  <SectionTitle
                    title="Ingredient Categories"
                    // subtitle="Add or remove category groups and edit nested ingredients."
                    action={<AppButton label="Add" icon='duplicate' variant="secondary" onPress={addIngredientCategory} />}
                  />

                  {editingDish.ingredientCategories.map((category, categoryIndex) => (
                    <View key={`${category.id ?? 'new'}-${categoryIndex}`} style={styles.categoryEditor}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.itemTitle}>Category {categoryIndex + 1}</Text>
                        <AppButton
                          // label="Remove"
                          icon='trash'
                          variant="danger"
                          onPress={() => removeIngredientCategory(categoryIndex)}
                          disabled={editingDish.ingredientCategories.length === 1}
                        />
                      </View>
                      <Field
                        label="Category name"
                        value={category.name}
                        onChangeText={(value) => updateIngredientCategoryField(categoryIndex, 'name', value)}
                      />
                      <Field
                        label="Category description"
                        value={category.description}
                        onChangeText={(value) => updateIngredientCategoryField(categoryIndex, 'description', value)}
                        multiline
                      />

                      <View style={styles.stack}>
                        {category.ingredients.map((ingredient, ingredientIndex) => (
                          <Card3D key={`${ingredient.ingredientId ?? 'new'}-${ingredientIndex}`} style={styles.ingredientCard}>
                            <View style={styles.rowBetween}>
                              <Text style={styles.itemTitle}>Ingredient {ingredientIndex + 1}</Text>
                              <AppButton
                                // label="Remove"
                                icon='trash'
                                variant="danger"
                                onPress={() => removeIngredient(categoryIndex, ingredientIndex)}
                                disabled={category.ingredients.length === 1}
                              />
                            </View>
                            <Field
                              label="Ingredient name"
                              value={ingredient.name}
                              onChangeText={(value) => updateIngredientField(categoryIndex, ingredientIndex, 'name', value)}
                            />
                            <Field
                              label="Ingredient price"
                              value={String(ingredient.extraPrice)}
                              onChangeText={(value) =>
                                updateIngredientField(categoryIndex, ingredientIndex, 'extraPrice', Number(value) || 0)
                              }
                              keyboardType="decimal-pad"
                            />
                            <Text style={styles.sectionLabel}>Flags</Text>
                            <View style={styles.tabRow}>
                              <Pill
                                label="default"
                                active={ingredient.isDefault}
                                onPress={() =>
                                  updateIngredientField(categoryIndex, ingredientIndex, 'isDefault', !ingredient.isDefault)
                                }
                              />
                              <Pill
                                label="mandatory"
                                active={ingredient.isMandatory}
                                onPress={() =>
                                  updateIngredientField(
                                    categoryIndex,
                                    ingredientIndex,
                                    'isMandatory',
                                    !ingredient.isMandatory
                                  )
                                }
                              />
                            </View>
                          </Card3D>
                        ))}
                      </View>

                      <AppButton
                        label="Add"
                        icon='add'
                        variant="secondary"
                        onPress={() => addIngredient(categoryIndex)}
                      />
                    </View>
                  ))}

                  <View style={styles.actionRow}>
                    <AppButton label="Cancel" icon='close' variant="ghost" onPress={() => setEditingDish(null)} />
                    <AppButton label="Save" icon='save' onPress={() => void saveDish()} />
                  </View>
                </Card3D>
              </View>
            ) : (
              <>
                <SectionTitle
                  title="Menu"
                  // subtitle="Customer-style dish cards with manager edit actions."
                  action={
                    <AppButton
                      label="Add"
                      icon='duplicate'
                      onPress={() => {
                        setMenuError(null);
                        setEditingDish(createInitialDish(categories[0]?.id ?? 1));
                      }}
                    />
                  }
                />
                <View style={styles.stack}>
                  {dishes.map((dish) => (
                    <Card3D key={dish.id} style={styles.menuCard}>
                      {dish.imageUrl ? (
                        <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} accessibilityLabel={dish.name} />
                      ) : (
                        <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                          <Text style={styles.placeholderText}>No image</Text>
                        </View>
                      )}
                      <View style={styles.dishContent}>
                        <View style={styles.dishHead}>
                          <View style={styles.flexOne}>
                            <Text style={styles.dishName}>{dish.name}</Text>
                            <Text style={styles.dishRating}>
                              {renderStars(dish.averageRating)} {dish.averageRating.toFixed(1)} ({dish.reviewCount})
                            </Text>
                          </View>
                          <Text style={styles.dishPrice}>${calculateDisplayedDishPrice(dish).toFixed(2)}</Text>
                        </View>
                        <Text style={styles.dishDescription}>{dish.description}</Text>
                        <Text style={styles.dishMeta}>
                          {dish.categoryName} | {dish.prepTimeMinutes} min | {dish.calories} kcal |{' '}
                          {dish.isAvailable ? 'Available' : 'Hidden'}
                        </Text>
                        <View style={styles.actionRow}>
                          <AppButton label="Edit" icon='create-outline' variant="secondary" onPress={() => openDishEditor(dish)} />
                          <AppButton label="Delete" icon='trash' variant="danger" onPress={() => void removeMenuDish(dish.id)} />
                        </View>
                      </View>
                    </Card3D>
                  ))}
                </View>
              </>
            )}

            <View style={styles.divider} />

            <SectionTitle
              title="Banner System"
              action={
                <AppButton
                  label="Add"
                  icon='duplicate'
                  variant="secondary"
                  onPress={() =>
                    setEditingBanner({
                      ...initialBanner,
                      sortOrder: (banners.length > 0 ? banners[banners.length - 1].sortOrder : 0) + 1,
                    })
                  }
                />
              }
            />
            <View style={styles.stack}>
              {banners.length === 0 ? (
                <Text style={commonStyles.mutedText}>No active banner exists. Add one.</Text>
              ) : (
                banners.map((banner) => (
                  <Card3D key={banner.id} style={styles.panel}>
                    <Image source={{ uri: banner.imageUrl }} style={styles.bannerPreview} />
                    <Text style={styles.itemTitle}>{banner.title}</Text>
                    <Text style={styles.itemMeta}>{banner.description}</Text>
                    <Text style={styles.itemMeta}>Sort: {banner.sortOrder}</Text>
                    <View style={styles.actionRow}>
                      <AppButton
                        label="Edit"
                        icon='create-outline'
                        variant="secondary"
                        onPress={() =>
                          setEditingBanner({
                            id: banner.id,
                            imageUrl: banner.imageUrl,
                            title: banner.title,
                            description: banner.description,
                            isActive: banner.isActive,
                            sortOrder: banner.sortOrder,
                          })
                        }
                      />
                      <AppButton label="Remove" icon='trash' variant="danger" onPress={() => void removeBanner(banner.id)} />
                    </View>
                  </Card3D>
                ))
              )}
            </View>
          </ScreenCard>
        ) : null}

        {activeTab === 'finance' ? (
          <>
            <ScreenCard>
              <SectionTitle title="Financial Dashboard" subtitle="Revenue and COD health." />
              <View style={styles.stack}>
                <Text style={commonStyles.metricLabel}>Daily Revenue</Text>
                <Text style={commonStyles.metricValue}>${metrics.dailyRevenue.toFixed(2)}</Text>
                <Text style={commonStyles.metricLabel}>Weekly Revenue</Text>
                <Text style={commonStyles.metricValue}>${metrics.weeklyRevenue.toFixed(2)}</Text>
                <Text style={commonStyles.metricLabel}>Monthly Revenue</Text>
                <Text style={commonStyles.metricValue}>${metrics.monthlyRevenue.toFixed(2)}</Text>
                <Text style={commonStyles.metricLabel}>Outstanding COD</Text>
                <Text style={commonStyles.metricValue}>${metrics.outstandingCod.toFixed(2)}</Text>
              </View>
            </ScreenCard>

            <ScreenCard>
              <SectionTitle title="Refund Requests" subtitle="Approve or deny customer refund requests." />
              <View style={styles.stack}>
                {orders
                  .filter((order) => order.refundRequest)
                  .map((order) => (
                    <Card3D key={order.id} style={styles.panel}>
                      <Text style={styles.itemTitle}>Order #{order.id}</Text>
                      <Text style={styles.itemMeta}>{order.refundRequest?.reason}</Text>
                      <Text style={styles.itemMeta}>{order.refundRequest?.details}</Text>
                      <Text style={styles.itemMeta}>Status: {order.refundRequest?.status}</Text>
                      {order.refundRequest?.status === 'requested' ? (
                        <View style={styles.actionRow}>
                          <AppButton
                            label="Approve"
                            icon='checkmark'
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
                            icon='close'
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
                    </Card3D>
                  ))}
              </View>
            </ScreenCard>
          </>
        ) : null}

        {activeTab === 'history' ? (
          <ScreenCard>
            <SectionTitle title="Order History" subtitle="Finalized order records across all outcomes." />
            <View style={styles.stack}>
              {historyOrders.length === 0 ? (
                <Text style={commonStyles.mutedText}>No closed orders found.</Text>
              ) : (
                historyOrders.map((order) => <HistoryOrderCard key={order.id} order={order} />)
              )}
            </View>
          </ScreenCard>
        ) : null}
      </ScrollView>

      <Modal visible={editingBanner !== null} animationType="slide" transparent>
        <View
          style={[
            styles.modalBackdrop,
            {
              paddingTop: Math.max(insets.top, 60),
              paddingBottom: Math.max(insets.bottom, 120),
            },
          ]}
        >
          <ScreenCard style={styles.modalCard}>
            <SectionTitle title={editingBanner?.id ? 'Edit Banner' : 'Create Banner'}
            // subtitle="Explore banner setup"
            />
            {editingBanner ? (
              <ScrollView contentContainerStyle={styles.modalFormContent}>
                {editingBanner.imageUrl ? (
                  <Image
                    source={{ uri: editingBanner.imageUrl }}
                    style={styles.bannerPreview}
                  />
                ) : (
                  <View style={[styles.bannerPreview, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={commonStyles.mutedText}>No image selected</Text>
                  </View>
                )}
                <AppButton
                  label="Upload"
                  icon='images'
                  variant="secondary"
                  onPress={() => void pickBannerImage()}
                />
                <Field
                  label="Or enter Image URL manually"
                  value={editingBanner.imageUrl}
                  onChangeText={(value) => setEditingBanner({ ...editingBanner, imageUrl: value })}
                  autoCapitalize="none"
                />
                <Field
                  label="Title"
                  value={editingBanner.title}
                  onChangeText={(value) => setEditingBanner({ ...editingBanner, title: value })}
                />
                <Field
                  label="Description"
                  value={editingBanner.description}
                  onChangeText={(value) => setEditingBanner({ ...editingBanner, description: value })}
                  multiline
                />
                <Field
                  label="Sort Order"
                  value={String(editingBanner.sortOrder)}
                  onChangeText={(value) =>
                    setEditingBanner({ ...editingBanner, sortOrder: Math.max(1, Number(value) || 1) })
                  }
                  keyboardType="number-pad"
                />
                <Field
                  label="Active (1/0)"
                  value={editingBanner.isActive ? '1' : '0'}
                  onChangeText={(value) => setEditingBanner({ ...editingBanner, isActive: value !== '0' })}
                  keyboardType="number-pad"
                />
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <View style={styles.actionRow}>
                  <AppButton
                    label="Cancel"
                    icon='close'
                    variant="ghost"
                    onPress={() => {
                      clearError();
                      setEditingBanner(null);
                    }}
                  />
                  <AppButton
                    label="Save"
                    icon='save'
                    onPress={() => void saveBanner()}
                  />
                </View>
              </ScrollView>
            ) : null}
          </ScreenCard>
        </View>
      </Modal>

      <FloatingActionMenu
        items={managerNavigationItems}
        activeLabel={formatManagerTabLabel(activeTab)}
        accentColor="#174C4F"
        containerStyle={{ bottom: Math.max(insets.bottom, 16) + 12 }}
      />
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
    paddingBottom: 120,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#174C4F',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  stack: {
    gap: 12,

  },
  panel: {
    backgroundColor: '#FBFCF8',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  menuCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
    padding: 12,
  },
  dishDetailsCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dishImage: {
    aspectRatio: 16 / 9,
    backgroundColor: '#E3DACA',
    borderRadius: 12,
    width: '100%',
  },
  dishImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#56707B',
    fontSize: 13,
    fontWeight: '600',
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
  flexOne: {
    flex: 1,
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
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  historyHeaderText: {
    flex: 1,
    gap: 4,
  },
  historyStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historySection: {
    backgroundColor: '#F4F7F0',
    borderRadius: 14,
    gap: 6,
    padding: 12,
  },
  historySectionTitle: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '700',
  },
  historyItemCard: {
    backgroundColor: '#FBFCF8',
    borderColor: '#D4DBD1',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  centeredButtonRow: {
    alignItems: 'center',
  },
  centeredButtonWrap: {
    alignSelf: 'center',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  categoryEditor: {
    backgroundColor: '#F4F7F0',
    borderColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  ingredientCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  sectionLabel: {
    color: '#0F2529',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#9D3C2A',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    borderBottomColor: '#D4DBD1',
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  bannerPreview: {
    aspectRatio: 16 / 9,
    backgroundColor: '#ECEDE8',
    borderRadius: 12,
    width: '100%',
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
    gap: 16,
    height: '100%'
  },
  modalFormContent: {
    gap: 16,
    paddingBottom: 12,
  },
});
