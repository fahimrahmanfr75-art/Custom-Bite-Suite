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

function sanitizeProjectId(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.startsWith('YOUR_')) {
    return null;
  }

  return trimmed;
}

function isReservedPlaceholderHost(hostname: string) {
  return (
    hostname === 'example' ||
    hostname === 'example.com' ||
    hostname.endsWith('.example') ||
    hostname.endsWith('.example.com') ||
    hostname === 'invalid' ||
    hostname.endsWith('.invalid')
  );
}

function sanitizeRemoteUrl(value: unknown, allowedProtocols: ReadonlySet<string>) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.startsWith('YOUR_')) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.has(parsed.protocol) || isReservedPlaceholderHost(parsed.hostname)) {
      return null;
    }
  } catch {
    return null;
  }

  return trimmed;
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoConfigExtra;

export const runtimeConfig: RuntimeConfig = {
  expoProjectId: sanitizeProjectId(extra.eas?.projectId),
  pushApiBaseUrl: sanitizeRemoteUrl(extra.pushApiBaseUrl, new Set(['https:', 'http:'])),
  realtimeWebSocketUrl: sanitizeRemoteUrl(extra.realtime?.webSocketUrl, new Set(['wss:', 'ws:'])),
};
