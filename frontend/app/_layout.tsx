import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RealtimeProvider } from '../contexts/SimpleSocketIOContext';
import { LocationProvider } from '../contexts/LocationContext';
import { PushNotificationProvider } from '../contexts/PushNotificationContext';
import { StatusBar } from 'expo-status-bar';
import { PaymentProvider } from '../contexts/PaymentContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function RootLayout() {
  return (
     <SafeAreaProvider>
    <AuthProvider>
      <LocationProvider>
        <RealtimeProvider>
          <PushNotificationProvider>
            <PaymentProvider>
              <NotificationsProvider>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth/index" />
                  <Stack.Screen name="uber-style/index" />
                </Stack>
              </NotificationsProvider>
            </PaymentProvider>
          </PushNotificationProvider>
        </RealtimeProvider>
      </LocationProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
