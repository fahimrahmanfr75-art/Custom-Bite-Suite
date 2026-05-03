import { runtimeConfig } from '../config/runtime';
import type { OrderStatus } from '../types';

export type TrackingConnectionState =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type OrderTrackingSnapshot = {
  orderId: number;
  status: OrderStatus;
  riderId: number | null;
  riderName: string | null;
  riderPhone: string | null;
  riderLatitude: number | null;
  riderLongitude: number | null;
  updatedAt: string;
};

type TrackingConnectionEvent = {
  type: 'connection';
  state: TrackingConnectionState;
};

type TrackingSnapshotEvent = {
  type: 'snapshot';
  snapshot: OrderTrackingSnapshot;
};

type TrackingEvent = TrackingConnectionEvent | TrackingSnapshotEvent;

type SubscriptionListener = (event: TrackingEvent) => void;

type SocketInboundMessage =
  | {
      type: 'connection_state';
      state: Exclude<TrackingConnectionState, 'disabled'>;
    }
  | {
      type: 'order_tracking_snapshot';
      payload: OrderTrackingSnapshot;
    };

type SocketOutboundMessage =
  | {
      type: 'subscribe_order';
      orderId: number;
    }
  | {
      type: 'unsubscribe_order';
      orderId: number;
    }
  | {
      type: 'rider_location';
      payload: {
        orderId: number;
        riderId: number;
        riderLatitude: number;
        riderLongitude: number;
        updatedAt: string;
      };
    }
  | {
      type: 'order_status';
      payload: {
        orderId: number;
        status: OrderStatus;
        riderId: number | null;
        riderName: string | null;
        riderPhone: string | null;
        riderLatitude: number | null;
        riderLongitude: number | null;
        updatedAt: string;
      };
    };

class OrderTrackingSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Map<number, Set<SubscriptionListener>>();
  private connectionListeners = new Set<SubscriptionListener>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private connectionState: TrackingConnectionState = runtimeConfig.realtimeWebSocketUrl
    ? 'disconnected'
    : 'disabled';

  private emit(event: TrackingEvent, orderId?: number) {
    if (event.type === 'connection') {
      this.connectionListeners.forEach((listener) => listener(event));
    }

    if (typeof orderId === 'number') {
      this.listeners.get(orderId)?.forEach((listener) => listener(event));
    }
  }

  private setConnectionState(state: TrackingConnectionState) {
    this.connectionState = state;
    this.emit({ type: 'connection', state });
  }

  private connect() {
    const url = runtimeConfig.realtimeWebSocketUrl;
    if (!url || this.socket || this.intentionalClose) {
      return;
    }

    this.setConnectionState(this.connectionState === 'disconnected' ? 'connecting' : 'reconnecting');

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.setConnectionState('connected');
      this.flushSubscriptions();
    };

    this.socket.onmessage = (event) => {
      const parsed = this.parseInboundMessage(event.data);
      if (!parsed) {
        return;
      }

      if (parsed.type === 'connection_state') {
        this.setConnectionState(parsed.state);
        return;
      }

      this.emit(
        {
          type: 'snapshot',
          snapshot: parsed.payload,
        },
        parsed.payload.orderId
      );
    };

    this.socket.onerror = () => {
      this.setConnectionState('disconnected');
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.intentionalClose || !runtimeConfig.realtimeWebSocketUrl) {
        this.setConnectionState(runtimeConfig.realtimeWebSocketUrl ? 'disconnected' : 'disabled');
        return;
      }

      this.setConnectionState('reconnecting');
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, 3000);
    };
  }

  private parseInboundMessage(raw: unknown): SocketInboundMessage | null {
    if (typeof raw !== 'string') {
      return null;
    }

    try {
      return JSON.parse(raw) as SocketInboundMessage;
    } catch {
      return null;
    }
  }

  private send(message: SocketOutboundMessage) {
    if (this.connectionState === 'disabled') {
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  private flushSubscriptions() {
    this.listeners.forEach((_listeners, orderId) => {
      this.send({
        type: 'subscribe_order',
        orderId,
      });
    });
  }

  subscribe(orderId: number, listener: SubscriptionListener) {
    if (!runtimeConfig.realtimeWebSocketUrl) {
      listener({ type: 'connection', state: 'disabled' });
      return () => undefined;
    }

    const orderListeners = this.listeners.get(orderId) ?? new Set<SubscriptionListener>();
    orderListeners.add(listener);
    this.listeners.set(orderId, orderListeners);
    this.connectionListeners.add(listener);

    listener({ type: 'connection', state: this.connectionState });
    this.connect();
    this.send({
      type: 'subscribe_order',
      orderId,
    });

    return () => {
      orderListeners.delete(listener);
      this.connectionListeners.delete(listener);

      if (orderListeners.size === 0) {
        this.listeners.delete(orderId);
        this.send({
          type: 'unsubscribe_order',
          orderId,
        });
      }

      if (this.listeners.size === 0) {
        this.close();
      }
    };
  }

  publishRiderLocation(payload: {
    orderId: number;
    riderId: number;
    riderLatitude: number;
    riderLongitude: number;
    updatedAt?: string;
  }) {
    this.send({
      type: 'rider_location',
      payload: {
        ...payload,
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
      },
    });
  }

  publishOrderStatus(payload: {
    orderId: number;
    status: OrderStatus;
    riderId: number | null;
    riderName: string | null;
    riderPhone: string | null;
    riderLatitude: number | null;
    riderLongitude: number | null;
    updatedAt?: string;
  }) {
    this.send({
      type: 'order_status',
      payload: {
        ...payload,
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
      },
    });
  }

  close() {
    this.intentionalClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setConnectionState(runtimeConfig.realtimeWebSocketUrl ? 'disconnected' : 'disabled');
    this.intentionalClose = false;
  }
}

export const orderTrackingSocket = new OrderTrackingSocketClient();
