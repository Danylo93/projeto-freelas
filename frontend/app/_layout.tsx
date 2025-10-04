import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { FirebaseRealtimeProvider } from '../contexts/FirebaseRealtimeContext';
import { MatchingProvider } from '../contexts/UberStyleMatchingContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FirebaseRealtimeProvider>
          <MatchingProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
            <Stack.Screen name="auth/register" options={{ title: 'Registro' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
          </MatchingProvider>
        </FirebaseRealtimeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}