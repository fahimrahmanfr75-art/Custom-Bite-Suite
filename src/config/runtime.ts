import Constants from 'expo-constants';

type RuntimeConfig = {
  expoProjectId: string | null;
  pushApiBaseUrl: string | null;
  realtimeWebSocketUrl: string | null;
};

type ExpoConfigExtra = {
  eas?: {
    projectId?: string;
  };
  pushApiBaseUrl?: string;
  realtime?: {
    webSocketUrl?: string;
  };
};

function sanitizeUrl(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.startsWith('YOUR_')) {
    return null;
  }
  return trimmed;
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoConfigExtra;

export const runtimeConfig: RuntimeConfig = {
  expoProjectId: sanitizeUrl(extra.eas?.projectId),
  pushApiBaseUrl: sanitizeUrl(extra.pushApiBaseUrl),
  realtimeWebSocketUrl: sanitizeUrl(extra.realtime?.webSocketUrl),
};
