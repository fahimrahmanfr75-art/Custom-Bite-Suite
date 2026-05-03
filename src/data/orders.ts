import { db } from './schema';
import { logAudit } from './audit';
import { createNotification } from './notifications';
import type { Order, OrderItem, OrderItemCustomization, PlaceOrderPayload, PaymentMethod, PaymentStatus, RefundRequest } from '../types';
import { calculateOrderTotals, nextOrderStatus } from '../utils/orderMath';
import {
  buildCustomerOrderStatusNotification,
  buildManagerNewOrderNotification,
  shouldNotifyRoleForNewOrder,
} from '../utils/notifications';

type OrderRow = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  rider_id: number | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_latitude: number | null;
  rider_longitude: number | null;
  last_location_update: string | null;
  address_line: string;
  latitude: number;
  longitude: number;
  delivery_notes: string;
  status: Order['status'];
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
  cash_collected_at: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  dish_id: number;
  dish_name: string;
  quantity: number;
  unit_price: number;
  instructions: string;
};

type CustomizationRow = {
  order_item_id: number;
  ingredient_id: number;
  ingredient_name: string;
  action: 'add' | 'remove';
  price_delta: number;
};

type RefundRow = {
  id: number;
  order_id: number;
  customer_id: number;
  reason: string;
  details: string;
  status: 'requested' | 'approved' | 'denied';
  resolution_note: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
};

type UserRow = {
  id: number;
  address_line: string;
  latitude: number;
  longitude: number;
};

function nowIso() {
  return new Date().toISOString();
}

export async function getOrders() {
  const [orderRows, itemRows, customizationRows, refundRows] = await Promise.all([
    db.getAllAsync<OrderRow>(
      `SELECT
         o.*,
         customer.first_name || ' ' || customer.last_name AS customer_name,
         customer.phone AS customer_phone,
         rider.first_name || ' ' || rider.last_name AS rider_name,
         rider.phone AS rider_phone
       FROM orders o
       JOIN users customer ON customer.id = o.customer_id
       LEFT JOIN users rider ON rider.id = o.rider_id
       ORDER BY o.created_at DESC`
    ),
    db.getAllAsync<OrderItemRow>(
      `SELECT
         oi.id,
         oi.order_id,
         oi.dish_id,
         d.name AS dish_name,
         oi.quantity,
         oi.unit_price,
         oi.instructions
       FROM order_items oi
       JOIN dishes d ON d.id = oi.dish_id
       ORDER BY oi.id`
    ),
    db.getAllAsync<CustomizationRow>(
      `SELECT
         oic.order_item_id,
         oic.ingredient_id,
         i.name AS ingredient_name,
         oic.action,
         oic.price_delta
       FROM order_item_customizations oic
       JOIN ingredients i ON i.id = oic.ingredient_id
       ORDER BY oic.id`
    ),
    db.getAllAsync<RefundRow>(`SELECT * FROM refund_requests ORDER BY created_at DESC`),
  ]);

  const customizationMap = customizationRows.reduce<Record<number, OrderItemCustomization[]>>(
    (acc, row) => {
      const current = acc[row.order_item_id] ?? [];
      current.push({
        ingredientId: row.ingredient_id,
        name: row.ingredient_name,
        action: row.action,
        priceDelta: row.price_delta,
      });
      acc[row.order_item_id] = current;
      return acc;
    },
    {}
  );

  const itemMap = itemRows.reduce<Record<number, OrderItem[]>>((acc, row) => {
    const current = acc[row.order_id] ?? [];
    current.push({
      id: row.id,
      orderId: row.order_id,
      dishId: row.dish_id,
      dishName: row.dish_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      instructions: row.instructions,
      customizations: customizationMap[row.id] ?? [],
      ingredientSnapshots: [],
    });
    acc[row.order_id] = current;
    return acc;
  }, {});

  const refundMap = refundRows.reduce<Record<number, RefundRequest>>((acc, row) => {
    acc[row.order_id] = {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      reason: row.reason,
      details: row.details,
      status: row.status,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
    };
    return acc;
  }, {});

  return orderRows.map<Order>((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: '',
    riderId: row.rider_id,
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
    riderLatitude: row.rider_latitude,
    riderLongitude: row.rider_longitude,
    addressLine: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
    deliveryNotes: row.delivery_notes,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    discount: row.discount,
    deliveryFee: row.delivery_fee,
    total: row.total,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    preparingAt: row.preparing_at,
    readyAt: row.ready_at,
    pickedUpAt: row.picked_up_at,
    deliveredAt: row.delivered_at,
    rejectedAt: row.rejected_at,
    canceledAt: row.canceled_at,
    cashCollectedAt: row.cash_collected_at,
    items: itemMap[row.id] ?? [],
    refundRequest: refundMap[row.id] ?? null,
  }));
}

export async function placeOrder(
  customerId: number,
  cartItems: Array<{
    dishId: number;
    quantity: number;
    basePrice: number;
    instructions: string;
    customizations: OrderItemCustomization[];
  }>,
  payload: PlaceOrderPayload,
  discountPercent: number
) {
  if (cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  const customer = await db.getFirstAsync<UserRow>(`SELECT * FROM users WHERE id = ?`, customerId);
  if (!customer) {
    throw new Error('Customer account not found');
  }

  const totals = calculateOrderTotals(
    cartItems.map((item, index) => ({
      id: String(index),
      dishId: item.dishId,
      dishName: '',
      quantity: item.quantity,
      basePrice: item.basePrice,
      instructions: item.instructions,
      customizations: item.customizations,
    })),
    discountPercent
  );

  const createdAt = nowIso();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const orderResult = await txn.runAsync(
      `INSERT INTO orders
        (customer_id, rider_id, address_line, latitude, longitude, delivery_notes, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      customerId,
      customer.address_line,
      customer.latitude,
      customer.longitude,
      payload.deliveryNotes.trim(),
      payload.paymentMethod,
      payload.paymentMethod === 'cod' ? 'cod_pending' : 'paid',
      totals.subtotal,
      totals.discount,
      totals.deliveryFee,
      totals.total,
      createdAt
    );

    const orderId = Number(orderResult.lastInsertRowId);
    for (const cartItem of cartItems) {
      const customDelta = cartItem.customizations.reduce(
        (sum, customization) => sum + customization.priceDelta,
        0
      );
      const orderItemResult = await txn.runAsync(
        `INSERT INTO order_items (order_id, dish_id, quantity, unit_price, instructions)
         VALUES (?, ?, ?, ?, ?)`,
        orderId,
        cartItem.dishId,
        cartItem.quantity,
        Number((cartItem.basePrice + customDelta).toFixed(2)),
        cartItem.instructions.trim()
      );

      const orderItemId = Number(orderItemResult.lastInsertRowId);
      for (const customization of cartItem.customizations) {
        await txn.runAsync(
          `INSERT INTO order_item_customizations (order_item_id, ingredient_id, action, price_delta)
           VALUES (?, ?, ?, ?)`,
          orderItemId,
          customization.ingredientId,
          customization.action,
          customization.priceDelta
        );
      }
    }

    await logAudit(
      txn,
      customerId,
      'order',
      orderId,
      'create',
      `Order submitted with ${payload.paymentMethod.toUpperCase()} payment`
    );

    if (shouldNotifyRoleForNewOrder('manager')) {
      const notification = buildManagerNewOrderNotification(orderId);
      await createNotification(
        {
          audience: 'role',
          recipientRole: 'manager',
          orderId,
          kind: notification.kind,
          title: notification.title,
          message: notification.message,
          createdAt,
        },
        txn
      );
    }
  });
}

export async function advanceOrder(actorUserId: number, orderId: number) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const next = nextOrderStatus(order.status);
  if (!next) {
    throw new Error('Order is already at its final status');
  }

  const timestamp = nowIso();
  const acceptedAt = next === 'accepted' ? timestamp : order.accepted_at;
  const preparingAt = next === 'preparing' ? timestamp : order.preparing_at;
  const readyAt = next === 'ready' ? timestamp : order.ready_at;
  const pickedUpAt = next === 'on_the_way' ? timestamp : order.picked_up_at;
  const deliveredAt = next === 'delivered' ? timestamp : order.delivered_at;

  await db.runAsync(
    `UPDATE orders
     SET status = ?, accepted_at = ?, preparing_at = ?, ready_at = ?, picked_up_at = ?, delivered_at = ?
     WHERE id = ?`,
    next,
    acceptedAt,
    preparingAt,
    readyAt,
    pickedUpAt,
    deliveredAt,
    orderId
  );

  await logAudit(db, actorUserId, 'order', orderId, next, `Order moved to ${next}`);
  const notification = buildCustomerOrderStatusNotification(orderId, next);
  await createNotification({
    audience: 'user',
    recipientUserId: order.customer_id,
    orderId,
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
  });
}

export async function assignOrderRider(actorUserId: number, orderId: number, riderId: number) {
  await db.runAsync(`UPDATE orders SET rider_id = ? WHERE id = ?`, riderId, orderId);
  await logAudit(db, actorUserId, 'order', orderId, 'assign_rider', `Assigned rider ${riderId}`);
}

export async function confirmCash(actorUserId: number, orderId: number) {
  const order = await db.getFirstAsync<{ id: number }>(`SELECT id FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  await db.runAsync(
    `UPDATE orders SET payment_status = 'cod_collected', cash_collected_at = ? WHERE id = ?`,
    nowIso(),
    orderId
  );
  await logAudit(
    db,
    actorUserId,
    'order',
    orderId,
    'cash_collected',
    'COD amount marked as collected'
  );
}

export async function cancelOrderByCustomer(customerId: number, orderId: number) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.customer_id !== customerId) {
    throw new Error('Not authorized to cancel this order');
  }
  if (order.status === 'ready' || order.status === 'on_the_way' || order.status === 'delivered') {
    throw new Error('Order cannot be canceled at this stage');
  }
  if (order.status === 'canceled' || order.status === 'rejected') {
    throw new Error('Order is already canceled or rejected');
  }

  await db.runAsync(
    `UPDATE orders SET status = 'canceled', canceled_at = ? WHERE id = ?`,
    nowIso(),
    orderId
  );
  await logAudit(db, customerId, 'order', orderId, 'cancel', 'Customer canceled order');
  const notification = buildCustomerOrderStatusNotification(orderId, 'canceled');
  await createNotification({
    audience: 'user',
    recipientUserId: order.customer_id,
    orderId,
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
  });
}

export async function claimOrderByRider(
  riderId: number,
  orderId: number,
  riderLatitude: number,
  riderLongitude: number
) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'on_the_way') {
    throw new Error('Order is not ready for pickup');
  }
  if (order.rider_id && order.rider_id !== riderId) {
    throw new Error('Order is already assigned to another rider');
  }

  const timestamp = nowIso();
  await db.runAsync(
    `UPDATE orders SET rider_id = ?, rider_latitude = ?, rider_longitude = ?, last_location_update = ? WHERE id = ?`,
    riderId,
    riderLatitude,
    riderLongitude,
    timestamp,
    orderId
  );
  await logAudit(db, riderId, 'order', orderId, 'claim', 'Rider claimed delivery order with location');
}

export async function updateRiderLocation(
  orderId: number,
  riderLatitude: number,
  riderLongitude: number
) {
  const timestamp = nowIso();
  await db.runAsync(
    `UPDATE orders SET rider_latitude = ?, rider_longitude = ?, last_location_update = ? WHERE id = ?`,
    riderLatitude,
    riderLongitude,
    timestamp,
    orderId
  );
}

export async function rejectOrder(actorUserId: number, orderId: number, reason: string) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'pending' && order.status !== 'accepted') {
    throw new Error('Order cannot be rejected at this stage');
  }

  await db.runAsync(
    `UPDATE orders SET status = 'rejected', rejected_at = ? WHERE id = ?`,
    nowIso(),
    orderId
  );
  await logAudit(db, actorUserId, 'order', orderId, 'reject', `Order rejected: ${reason}`);
  const notification = buildCustomerOrderStatusNotification(orderId, 'rejected');
  await createNotification({
    audience: 'user',
    recipientUserId: order.customer_id,
    orderId,
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
  });
}
