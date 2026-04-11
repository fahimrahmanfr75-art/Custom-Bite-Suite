import 'react-native-gesture-handler';

import React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './src/context/AppContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { CustomerDashboard } from './src/screens/CustomerDashboard';
import { ManagerDashboard } from './src/screens/ManagerDashboard';
import { RiderDashboard } from './src/screens/RiderDashboard';

function AppRoot() {
  const { isReady, session, errorMessage } = useApp();

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
      <AppProvider>
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="dark-content" />
          <AppRoot />
        </SafeAreaView>
      </AppProvider>
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
});
