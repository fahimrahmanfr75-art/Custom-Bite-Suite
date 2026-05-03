import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { runtimeConfig } from '../config/runtime';
import type { Session } from '../types';

type PushRegistrationResult = {
  token: string | null;
  error: string | null;
};

let isNotificationHandlerConfigured = false;

export function ensureNotificationHandlerConfigured() {
  if (isNotificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isNotificationHandlerConfigured = true;
}

export async function registerDeviceForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  ensureNotificationHandlerConfigured();

  if (!runtimeConfig.expoProjectId) {
    return {
      token: null,
      error: null,
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D45D31',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return {
      token: null,
      error: 'Push notification permission was not granted.',
    };
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: runtimeConfig.expoProjectId,
  });

  return {
    token: tokenResponse.data,
    error: null,
  };
}

export async function syncPushTokenWithServer(
  session: Session,
  token: string
): Promise<void> {
  if (!runtimeConfig.pushApiBaseUrl) {
    return;
  }

  const response = await fetch(`${runtimeConfig.pushApiBaseUrl}/push-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: session.userId,
      role: session.role,
      token,
      platform: Platform.OS,
      provider: Platform.OS === 'ios' ? 'apns-expo' : 'fcm-expo',
    }),
  });

  if (!response.ok) {
    throw new Error(`Push token sync failed with status ${response.status}.`);
  }
}

export function addPushNotificationReceivedListener(
  listener: Parameters<typeof Notifications.addNotificationReceivedListener>[0]
) {
  ensureNotificationHandlerConfigured();
  return Notifications.addNotificationReceivedListener(listener);
}

export function addPushNotificationResponseListener(
  listener: Parameters<typeof Notifications.addNotificationResponseReceivedListener>[0]
) {
  ensureNotificationHandlerConfigured();
  return Notifications.addNotificationResponseReceivedListener(listener);
}
