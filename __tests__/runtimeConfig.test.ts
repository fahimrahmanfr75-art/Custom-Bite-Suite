type ExpoExtra = {
  eas?: {
    projectId?: string;
  };
  pushApiBaseUrl?: string;
  realtime?: {
    webSocketUrl?: string;
  };
};

function loadRuntimeConfig(extra: ExpoExtra) {
  jest.resetModules();
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: {
        extra,
      },
    },
  }));

  let runtimeConfig: typeof import('../src/config/runtime').runtimeConfig;
  jest.isolateModules(() => {
    runtimeConfig = require('../src/config/runtime').runtimeConfig;
  });

  jest.dontMock('expo-constants');
  return runtimeConfig!;
}

describe('runtimeConfig', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('disables placeholder config values', () => {
    const runtimeConfig = loadRuntimeConfig({
      eas: {
        projectId: 'YOUR_EAS_PROJECT_ID',
      },
      pushApiBaseUrl: 'YOUR_PUSH_API_BASE_URL',
      realtime: {
        webSocketUrl: 'YOUR_REALTIME_WEBSOCKET_URL',
      },
    });

    expect(runtimeConfig).toEqual({
      expoProjectId: null,
      pushApiBaseUrl: null,
      realtimeWebSocketUrl: null,
    });
  });

  it('rejects reserved example hosts so fake remotes stay disabled', () => {
    const runtimeConfig = loadRuntimeConfig({
      eas: {
        projectId: 'real-project-id',
      },
      pushApiBaseUrl: 'https://api.custombite.example',
      realtime: {
        webSocketUrl: 'wss://api.custombite.example/orders/realtime',
      },
    });

    expect(runtimeConfig.expoProjectId).toBe('real-project-id');
    expect(runtimeConfig.pushApiBaseUrl).toBeNull();
    expect(runtimeConfig.realtimeWebSocketUrl).toBeNull();
  });

  it('accepts valid http and websocket endpoints', () => {
    const runtimeConfig = loadRuntimeConfig({
      eas: {
        projectId: 'real-project-id',
      },
      pushApiBaseUrl: 'https://api.custombite.app',
      realtime: {
        webSocketUrl: 'wss://ws.custombite.app/orders/realtime',
      },
    });

    expect(runtimeConfig).toEqual({
      expoProjectId: 'real-project-id',
      pushApiBaseUrl: 'https://api.custombite.app',
      realtimeWebSocketUrl: 'wss://ws.custombite.app/orders/realtime',
    });
  });
});
