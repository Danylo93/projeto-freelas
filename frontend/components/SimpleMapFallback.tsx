import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';

interface SimpleMapFallbackProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export const SimpleMapFallback: React.FC<SimpleMapFallbackProps> = ({
  style,
  latitude = -23.5615,
  longitude = -46.656,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
}) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      console.log('✅ [FALLBACK-MAP] Localização obtida:', location.coords);
    } catch (error) {
      console.error('❌ [FALLBACK-MAP] Erro ao obter localização:', error);
      setError('Erro ao obter localização');
    }
  };

  const handleMapPress = () => {
    Alert.alert(
      'Mapa Interativo',
      `Sua localização: ${location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Não disponível'}`,
      [
        { text: 'OK' },
        { text: 'Atualizar', onPress: getCurrentLocation }
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.mapContainer}
        onPress={handleMapPress}
        activeOpacity={0.8}
      >
        <View style={styles.mapContent}>
          {/* Header do mapa */}
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>🗺️ Mapa Interativo</Text>
            <Text style={styles.mapSubtitle}>
              {location ? 'Localização detectada' : 'Detectando localização...'}
            </Text>
          </View>
          
          {/* Grid do mapa */}
          <View style={styles.mapGrid}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineVertical]} />
            <View style={styles.centerDot} />
            
            {/* Pontos de referência */}
            <View style={[styles.landmark, styles.landmark1]} />
            <View style={[styles.landmark, styles.landmark2]} />
            <View style={[styles.landmark, styles.landmark3]} />
            <View style={[styles.landmark, styles.landmark4]} />
          </View>
          
          {/* Informações de localização */}
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationSubtext}>
                Toque para mais informações
              </Text>
            </View>
          )}
          
          {/* Erro */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          
          {/* Botão de atualizar */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={getCurrentLocation}
          >
            <Text style={styles.refreshButtonText}>🔄 Atualizar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    borderRadius: 16,
    margin: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  mapHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(26, 115, 232, 0.2)',
    width: '100%',
    height: 1,
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a73e8',
    position: 'absolute',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  landmark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34a853',
  },
  landmark1: {
    top: '20%',
    left: '25%',
  },
  landmark2: {
    top: '30%',
    right: '20%',
  },
  landmark3: {
    bottom: '25%',
    left: '30%',
  },
  landmark4: {
    bottom: '35%',
    right: '25%',
  },
  locationInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 10,
    color: '#5f6368',
  },
  errorContainer: {
    backgroundColor: '#fce8e6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d93025',
    fontSize: 12,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
