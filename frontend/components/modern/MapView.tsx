import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Componente placeholder para substituir MapView
export default function MapView(props: any) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webMapContainer, props.style]}>
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapIcon}>🗺️</Text>
          <Text style={styles.webMapText}>
            Mapa disponível apenas no app mobile
          </Text>
        </View>
      </View>
    );
  }

  // No mobile, usar um placeholder simples por enquanto
  return (
    <View style={[styles.webMapContainer, props.style]}>
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapIcon}>🗺️</Text>
        <Text style={styles.webMapText}>
          Mapa em desenvolvimento
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  webMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
