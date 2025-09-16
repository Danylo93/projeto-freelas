import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { StatusBar } from 'expo-status-bar';
import { PaymentProvider } from '../contexts/PaymentContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <NotificationsProvider>
        <SocketProvider>
          <StatusBar style="auto" />
          <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="client" />
          <Stack.Screen name="provider" />
          <Stack.Screen name="profile" />
          </Stack>
        </SocketProvider>
        </NotificationsProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
