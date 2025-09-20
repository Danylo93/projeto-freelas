/**
 * AppProviders Unificado - Freelas
 * Ordem correta de providers seguindo as melhores práticas
 */

import React, { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Providers internos
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '../../contexts/AuthContext';
import { LocationProvider } from '../../contexts/LocationContext';
import { FirebaseRealtimeProvider } from '../../contexts/FirebaseRealtimeContext';
import { PushNotificationProvider } from '../../contexts/PushNotificationContext';
import { PaymentProvider } from '../../contexts/PaymentContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext';

// Hooks para tema
import { useTheme } from './ThemeProvider';
import { getNavigationTheme, getStatusBarStyle, getStatusBarBackgroundColor } from '../theme';

interface AppProvidersProps {
  children: ReactNode;
}

// Componente interno para usar o tema
const ThemedStatusBar: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <StatusBar 
      style={getStatusBarStyle(theme)}
      backgroundColor={getStatusBarBackgroundColor(theme)}
    />
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider>
              <FirebaseRealtimeProvider>
                <PushNotificationProvider>
                  <PaymentProvider>
                    <NotificationsProvider>
                      <ThemedStatusBar />
                      {children}
                    </NotificationsProvider>
                  </PaymentProvider>
                </PushNotificationProvider>
              </FirebaseRealtimeProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
