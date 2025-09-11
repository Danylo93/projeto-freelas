import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './auth';
import ClientHome from './client';
import ProviderHome from './provider';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Redirect based on user type
  if (user.user_type === 1) {
    // Prestador
    return <ProviderHome />;
  } else if (user.user_type === 2) {
    // Cliente
    return <ClientHome />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Erro: Tipo de usuário inválido</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
});