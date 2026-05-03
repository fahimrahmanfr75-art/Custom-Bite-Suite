import 'react-native-gesture-handler';

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  AppProvider,
  useAppActions,
  useAppStatus,
  useNotificationsState,
  useSessionState,
} from './src/context/AppContext';
import {
  addPushNotificationReceivedListener,
  addPushNotificationResponseListener,
  ensureNotificationHandlerConfigured,
} from './src/services/pushNotifications';
import { AuthScreen } from './src/screens/AuthScreen';
import { CustomerDashboard } from './src/screens/CustomerDashboard';
import { ManagerDashboard } from './src/screens/ManagerDashboard';
import { RiderDashboard } from './src/screens/RiderDashboard';
import type { AppNotification } from './src/types';

function NotificationToasts({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (notificationId: number) => void;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.toastLayer}>
      {notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => onDismiss(notification.id)}
          style={styles.toastCard}
        >
          <Text style={styles.toastTitle}>{notification.title}</Text>
          <Text style={styles.toastMessage}>{notification.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AppRoot() {
  const { session } = useSessionState();
  const { notifications } = useNotificationsState();
  const { readNotification, refresh } = useAppActions();
  const { errorMessage, isReady } = useAppStatus();
  const [visibleNotifications, setVisibleNotifications] = useState<AppNotification[]>([]);
  const displayedRef = useRef<Set<number>>(new Set());
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead && !displayedRef.current.has(notification.id)
    );

    unreadNotifications.forEach((notification) => {
      displayedRef.current.add(notification.id);
      setVisibleNotifications((current) => [notification, ...current].slice(0, 3));

      const timer = setTimeout(() => {
        setVisibleNotifications((current) =>
          current.filter((entry) => entry.id !== notification.id)
        );
        timersRef.current.delete(notification.id);
        void readNotification(notification.id).catch(() => undefined);
      }, 5000);

      timersRef.current.set(notification.id, timer);
    });
  }, [notifications, readNotification]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  useEffect(() => {
    ensureNotificationHandlerConfigured();

    const receivedSubscription = addPushNotificationReceivedListener(() => {
      void refresh().catch(() => undefined);
    });
    const responseSubscription = addPushNotificationResponseListener(() => {
      void refresh().catch(() => undefined);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [refresh]);

  function dismissNotification(notificationId: number) {
    const timer = timersRef.current.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(notificationId);
    }
    setVisibleNotifications((current) => current.filter((entry) => entry.id !== notificationId));
    void readNotification(notificationId).catch(() => undefined);
  }

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D45D31" />
        <Text style={styles.loadingText}>Preparing Custom-Bite Suite...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <>
      <NotificationToasts
        notifications={visibleNotifications}
        onDismiss={dismissNotification}
      />
      {errorMessage ? <Text style={styles.banner}>{errorMessage}</Text> : null}
      {session.role === 'customer' ? <CustomerDashboard /> : null}
      {session.role === 'manager' ? <ManagerDashboard /> : null}
      {session.role === 'rider' ? <RiderDashboard /> : null}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2EDE2" translucent={false} />
            <AppRoot />
          </SafeAreaView>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    backgroundColor: '#F2EDE2',
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#0B1E21',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#F6F1E5',
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: '#FBE4DD',
    color: '#9D3C2A',
    padding: 10,
    textAlign: 'center',
  },
  toastLayer: {
    gap: 10,
    left: 12,
    position: 'absolute',
    right: 12,
    top: 30,
    zIndex: 1000,
  },
  toastCard: {
    backgroundColor: '#153B3E',
    borderColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastTitle: {
    color: '#FFF7ED',
    fontSize: 14,
    fontWeight: '800',
  },
  toastMessage: {
    color: '#E6ECE6',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
