import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { MatchingProvider } from '@/contexts/UberStyleMatchingContext';
import { RealtimeProvider } from '@/contexts/SimpleSocketIOContext';
import { ModernClientApp } from '@/components/modern/ModernClientApp';
import { ModernProviderApp } from '@/components/modern/ModernProviderApp';

const UberStyleApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // Será redirecionado para login pelo AuthContext
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      <RealtimeProvider>
        <MatchingProvider>
          <View style={styles.content}>
          
            {user.user_type === 2 ? (
              <ModernClientApp />
            ) : (
              <ModernProviderApp />
            )}
          </View>
        </MatchingProvider>
      </RealtimeProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
});

export default UberStyleApp;
