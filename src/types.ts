export type Role = 'customer' | 'manager' | 'rider';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'rejected'
  | 'canceled';

export type PaymentMethod = 'card' | 'cod';
export type PaymentStatus = 'paid' | 'cod_pending' | 'cod_collected';
export type RefundStatus = 'requested' | 'approved' | 'denied';
export type IngredientAction = 'add' | 'remove';
export type NotificationAudience = 'user' | 'role';
export type NotificationKind = 'new_order' | 'order_status_changed';

export type User = {
  id: number;
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  notes: string;
  createdAt: string;
};

export type CurrentUserProfile = {
  id: number;
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  notes: string;
  createdAt: string;
};

export type RestaurantLocation = {
  latitude: number;
  longitude: number;
};

export type Offer = {
  id: number;
  title: string;
  description: string;
  discountPercent: number;
  activeFrom: string;
  activeTo: string;
  bannerColor: string;
};

export type Category = {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
};

export type IngredientCategory = {
  id: number;
  dishId: number;
  name: string;
  description: string;
  sortOrder: number;
};

export type Ingredient = {
  id: number;
  name: string;
};

export type DishIngredient = {
  ingredientId: number;
  ingredientCategoryId: number;
  ingredientCategoryName: string;
  name: string;
  isDefault: boolean;
  isMandatory: boolean;
  extraPrice: number;
  canAdd: boolean;
  canRemove: boolean;
};

export type Review = {
  id: number;
  dishId: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Dish = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  prepTimeMinutes: number;
  calories: number;
  spiceLevel: string;
  isAvailable: boolean;
  imageUrl: string;
  ingredients: DishIngredient[];
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
};

export type BannerImage = {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type BannerPayload = {
  id?: number;
  imageUrl: string;
  title: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export type OrderItemCustomization = {
  ingredientId: number;
  name: string;
  action: IngredientAction;
  priceDelta: number;
};

export type OrderItemIngredientSnapshot = {
  ingredientId: number;
  ingredientName: string;
  ingredientCategoryName: string;
  price: number;
};

export type OrderItem = {
  id: number;
  orderId: number;
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  instructions: string;
  customizations: OrderItemCustomization[];
  ingredientSnapshots: OrderItemIngredientSnapshot[];
};

export type RefundRequest = {
  id: number;
  orderId: number;
  customerId: number;
  reason: string;
  details: string;
  status: RefundStatus;
  resolutionNote: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;
};

export type Order = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  riderId: number | null;
  riderName: string | null;
  riderPhone: string | null;
  riderLatitude: number | null;
  riderLongitude: number | null;
  addressLine: string;
  latitude: number;
  longitude: number;
  deliveryNotes: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  rejectedAt: string | null;
  canceledAt: string | null;
  cashCollectedAt: string | null;
  items: OrderItem[];
  refundRequest: RefundRequest | null;
};

export type AuditLog = {
  id: number;
  actorUserId: number;
  actorName: string;
  actorRole: Role;
  entityType: string;
  entityId: number;
  action: string;
  details: string;
  createdAt: string;
};

export type AppNotification = {
  id: number;
  audience: NotificationAudience;
  recipientUserId: number | null;
  recipientRole: Role | null;
  orderId: number | null;
  kind: NotificationKind;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type Session = {
  userId: number;
  role: Role;
};

export type CartItem = {
  id: string;
  dishId: number;
  dishName: string;
  quantity: number;
  basePrice: number;
  instructions: string;
  customizations: OrderItemCustomization[];
};

export type RegisterPayload = {
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  addressLine: string;
  notes: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
  role: Role;
};

export type SubmitReviewPayload = {
  dishId: number;
  orderId: number;
  rating: number;
  comment: string;
};

export type SubmitRefundPayload = {
  orderId: number;
  reason: string;
  details: string;
};

export type PlaceOrderPayload = {
  deliveryNotes: string;
  paymentMethod: PaymentMethod;
  latitude: number;
  longitude: number;
  deliveryAddressLine?: string;
};

export type ManagerDishPayload = {
  id?: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  prepTimeMinutes: number;
  calories: number;
  spiceLevel: string;
  isAvailable: boolean;
  imageUrl: string;
  ingredientCategories: Array<{
    id?: number;
    name: string;
    description: string;
    sortOrder: number;
    ingredients: Array<{
      ingredientId?: number;
      name: string;
      isMandatory: boolean;
      isDefault: boolean;
      extraPrice: number;
      canAdd: boolean;
      canRemove: boolean;
      sortOrder: number;
    }>;
  }>;
};

export type DashboardMetrics = {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  deliveredOrders: number;
  averageOrderValue: number;
  pendingRefunds: number;
  outstandingCod: number;
};

export type AppSnapshot = {
  currentUser: CurrentUserProfile | null;
  restaurantLocation: RestaurantLocation | null;
  users: User[];
  offers: Offer[];
  banners: BannerImage[];
  categories: Category[];
  ingredientCategories: IngredientCategory[];
  ingredients: Ingredient[];
  dishes: Dish[];
  orders: Order[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  metrics: DashboardMetrics;
  session: Session | null;
};
