import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/authStore';
import { useEffect } from 'react';

export default function RootLayout() {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Verificar status de autenticação na inicialização
    checkAuthStatus();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="client" />
        <Stack.Screen name="provider" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="rating" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="history" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}