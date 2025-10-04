import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ModernClientApp } from '../../components/modern/ModernClientApp';

export default function HomeScreen() {
  const { user, isProvider } = useAuth();

  if (isProvider) {
    // TODO: Implementar ProviderApp quando necessário
    return <ModernClientApp />;
  }

  return <ModernClientApp />;
}
