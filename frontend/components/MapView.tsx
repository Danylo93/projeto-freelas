import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';

// Importação condicional do react-native-maps
let MapView: any, Marker: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    console.log('✅ [MAP] react-native-maps carregado com sucesso');
  } catch (error) {
    console.error('❌ [MAP] Erro ao carregar react-native-maps:', error);
  }
}

interface MapViewProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
}

export const MapViewComponent: React.FC<MapViewProps> = ({
  style,
  latitude = -23.5615,
  longitude = -46.656,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
  showsUserLocation = true,
  showsMyLocationButton = true,
}) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('✅ [MAP] Localização obtida:', location.coords);
      } catch (error) {
        console.error('❌ [MAP] Erro ao obter localização:', error);
        setErrorMsg('Erro ao obter localização');
      }
    })();
  }, []);

  // Fallback quando MapView não está disponível
  if (!MapView) {
    return (
      <View style={[styles.container, style, styles.fallback]}>
        <Text style={styles.fallbackTitle}>🗺️ Mapa não disponível</Text>
        <Text style={styles.fallbackText}>
          {Platform.OS === 'web' 
            ? 'Mapa não suportado no navegador' 
            : 'Instalando dependências do mapa...'
          }
        </Text>
        <Text style={styles.fallbackSubtext}>
          Verifique se o react-native-maps está instalado corretamente
        </Text>
      </View>
    );
  }

  const region = {
    latitude: location?.latitude || latitude,
    longitude: location?.longitude || longitude,
    latitudeDelta,
    longitudeDelta,
  };

  console.log('✅ [MAP] Renderizando mapa com região:', region);

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider="google"
        initialRegion={region}
        region={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        onMapReady={() => {
          console.log('✅ [MAP] Mapa carregado com sucesso!');
        }}
        onError={(error) => {
          console.error('❌ [MAP] Erro no mapa:', error);
          Alert.alert('Erro no Mapa', 'Ocorreu um erro ao carregar o mapa');
        }}
        onRegionChangeComplete={(region) => {
          console.log('✅ [MAP] Região alterada:', region);
        }}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Sua localização"
            description="Você está aqui"
            pinColor="blue"
          />
        )}
      </MapView>
      
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
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
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    opacity: 0.9,
  },
  errorText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

