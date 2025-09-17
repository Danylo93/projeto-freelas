import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { RealtimeProvider } from '../contexts/RealtimeContext';
import { LocationProvider } from '../contexts/LocationContext';
import { PushNotificationProvider } from '../contexts/PushNotificationContext';
import { StatusBar } from 'expo-status-bar';
import { PaymentProvider } from '../contexts/PaymentContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function RootLayout() {
  return (
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
                  <Stack.Screen name="client/index" />
                  <Stack.Screen name="provider/index" />
                  <Stack.Screen name="profile/index" />
                </Stack>
              </NotificationsProvider>
            </PaymentProvider>
          </PushNotificationProvider>
        </RealtimeProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
