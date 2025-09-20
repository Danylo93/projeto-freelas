import { Stack } from 'expo-router';
import { AppProviders } from '../src/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" />
        <Stack.Screen name="uber-style/index" />
      </Stack>
    </AppProviders>
  );
}