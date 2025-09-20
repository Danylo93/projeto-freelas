import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { LocationProvider } from '../contexts/LocationContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { PaymentProvider } from '../contexts/PaymentContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <NotificationsProvider>
            <PaymentProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
                <Stack.Screen name="auth/register" options={{ title: 'Registro' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </PaymentProvider>
          </NotificationsProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}