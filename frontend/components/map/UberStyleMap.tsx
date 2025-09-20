import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface UberStyleMapProps {
  onMarkerPress?: (location: any) => void;
  providers?: any[];
  selectedProvider?: any;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export function UberStyleMap({ 
  onMarkerPress, 
  providers = [], 
  selectedProvider,
  currentLocation 
}: UberStyleMapProps) {
  
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>
          {Platform.OS === 'web' 
            ? 'Mapa disponível apenas no app mobile'
            : 'Mapa em desenvolvimento'
          }
        </Text>
        {providers.length > 0 && (
          <Text style={styles.providersText}>
            {providers.length} prestadores próximos
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 300,
  },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  providersText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
});
