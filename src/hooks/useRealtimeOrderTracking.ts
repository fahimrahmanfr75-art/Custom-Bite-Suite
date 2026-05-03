import { useEffect, useMemo, useState } from 'react';

import { orderTrackingSocket, type OrderTrackingSnapshot, type TrackingConnectionState } from '../services/orderTrackingSocket';
import type { Order } from '../types';

function buildFallbackSnapshot(order: Order): OrderTrackingSnapshot {
  return {
    orderId: order.id,
    status: order.status,
    riderId: order.riderId,
    riderName: order.riderName,
    riderPhone: order.riderPhone,
    riderLatitude: order.riderLatitude,
    riderLongitude: order.riderLongitude,
    updatedAt:
      order.deliveredAt ??
      order.pickedUpAt ??
      order.readyAt ??
      order.preparingAt ??
      order.acceptedAt ??
      order.createdAt,
  };
}

export function useRealtimeOrderTracking(order: Order) {
  const [snapshot, setSnapshot] = useState<OrderTrackingSnapshot>(() => buildFallbackSnapshot(order));
  const [connectionState, setConnectionState] = useState<TrackingConnectionState>('disabled');

  useEffect(() => {
    setSnapshot(buildFallbackSnapshot(order));
  }, [order]);

  useEffect(() => {
    const unsubscribe = orderTrackingSocket.subscribe(order.id, (event) => {
      if (event.type === 'connection') {
        setConnectionState(event.state);
        return;
      }

      setSnapshot(event.snapshot);
    });

    return unsubscribe;
  }, [order.id]);

  const liveOrder = useMemo(
    () => ({
      ...order,
      riderId: snapshot.riderId,
      riderName: snapshot.riderName,
      riderPhone: snapshot.riderPhone,
      riderLatitude: snapshot.riderLatitude,
      riderLongitude: snapshot.riderLongitude,
      status: snapshot.status,
    }),
    [order, snapshot]
  );

  return {
    connectionState,
    liveOrder,
    liveUpdatedAt: snapshot.updatedAt,
  };
}
