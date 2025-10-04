import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Importação condicional do react-native-maps
let MapView: any, Marker: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    console.log('✅ [SIMPLE-MAP] react-native-maps carregado');
  } catch (error) {
    console.error('❌ [SIMPLE-MAP] Erro ao carregar react-native-maps:', error);
  }
}

interface SimpleMapViewProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  style,
  latitude = -23.5615,
  longitude = -46.656,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
}) => {
  if (!MapView) {
    return (
      <View style={[styles.container, style, styles.fallback]}>
        <Text style={styles.fallbackText}>🗺️ Mapa não disponível</Text>
        <Text style={styles.fallbackSubtext}>
          {Platform.OS === 'web' 
            ? 'Mapa não suportado no navegador' 
            : 'Instalando dependências do mapa...'
          }
        </Text>
      </View>
    );
  }

  const region = {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };

  console.log('✅ [SIMPLE-MAP] Renderizando mapa com região:', region);

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider="google"
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onMapReady={() => console.log('✅ [SIMPLE-MAP] Mapa carregado!')}
        onError={(error) => console.error('❌ [SIMPLE-MAP] Erro:', error)}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Localização"
          description="Sua localização atual"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  fallbackText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

