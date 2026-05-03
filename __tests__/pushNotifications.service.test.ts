describe('registerDeviceForPushNotificationsAsync', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('treats a missing Expo projectId as push-disabled instead of an error', async () => {
    const setNotificationChannelAsync = jest.fn();
    const getPermissionsAsync = jest.fn();
    const requestPermissionsAsync = jest.fn();
    const getExpoPushTokenAsync = jest.fn();
    const setNotificationHandler = jest.fn();

    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
      },
    }));

    jest.doMock('expo-notifications', () => ({
      __esModule: true,
      AndroidImportance: {
        HIGH: 'HIGH',
      },
      AndroidNotificationVisibility: {
        PUBLIC: 'PUBLIC',
      },
      getExpoPushTokenAsync,
      getPermissionsAsync,
      requestPermissionsAsync,
      setNotificationChannelAsync,
      setNotificationHandler,
    }));

    jest.doMock('../src/config/runtime', () => ({
      runtimeConfig: {
        expoProjectId: null,
        pushApiBaseUrl: null,
        realtimeWebSocketUrl: null,
      },
    }));

    let registerDeviceForPushNotificationsAsync: typeof import('../src/services/pushNotifications').registerDeviceForPushNotificationsAsync;
    jest.isolateModules(() => {
      registerDeviceForPushNotificationsAsync =
        require('../src/services/pushNotifications').registerDeviceForPushNotificationsAsync;
    });

    const result = await registerDeviceForPushNotificationsAsync!();

    expect(result).toEqual({
      token: null,
      error: null,
    });
    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(getPermissionsAsync).not.toHaveBeenCalled();
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});
