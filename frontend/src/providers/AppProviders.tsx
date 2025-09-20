/**
 * AppProviders Simplificado - Freelas
 * Versão reduzida para debug
 */

import React, { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Providers essenciais
import { AuthProvider } from '../../contexts/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          {children}
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
