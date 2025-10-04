import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';

// Importação mais robusta do react-native-maps
let MapView: any, Marker: any;

const loadMaps = () => {
  if (Platform.OS === 'web') {
    console.log('🌐 [MAP] Executando no web - mapa não suportado');
    return false;
  }

  try {
    console.log('🔄 [MAP] Tentando carregar react-native-maps...');
    const Maps = require('react-native-maps');
    
    if (Maps.default) {
      MapView = Maps.default;
      Marker = Maps.Marker;
      console.log('✅ [MAP] react-native-maps carregado via default export');
    } else if (Maps.MapView) {
      MapView = Maps.MapView;
      Marker = Maps.Marker;
      console.log('✅ [MAP] react-native-maps carregado via named export');
    } else {
      console.error('❌ [MAP] react-native-maps não encontrado');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ [MAP] Erro ao carregar react-native-maps:', error);
    return false;
  }
};

interface WorkingMapProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export const WorkingMap: React.FC<WorkingMapProps> = ({
  style,
  latitude = -23.5615,
  longitude = -46.656,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
}) => {
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadMaps();
    setMapsLoaded(loaded);
    
    if (loaded) {
      console.log('✅ [MAP] Maps carregados com sucesso');
    } else {
      console.log('❌ [MAP] Falha ao carregar maps');
    }
  }, []);

  // Fallback quando MapView não está disponível
  if (!mapsLoaded || !MapView) {
    return (
      <View style={[styles.container, style, styles.fallback]}>
        <Text style={styles.fallbackTitle}>🗺️ Mapa não disponível</Text>
        <Text style={styles.fallbackText}>
          {Platform.OS === 'web' 
            ? 'Mapa não suportado no navegador' 
            : 'react-native-maps não foi carregado corretamente'
          }
        </Text>
        <Text style={styles.debugText}>
          Platform: {Platform.OS}
        </Text>
        <Text style={styles.debugText}>
          Maps loaded: {mapsLoaded ? 'Sim' : 'Não'}
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
        showsUserLocation={true}
        showsMyLocationButton={true}
        onMapReady={() => {
          console.log('✅ [MAP] Mapa carregado com sucesso!');
          Alert.alert('Sucesso', 'Mapa carregado!');
        }}
        onError={(error) => {
          console.error('❌ [MAP] Erro no mapa:', error);
          setError(`Erro: ${error.message || 'Erro desconhecido'}`);
        }}
        onRegionChangeComplete={(region) => {
          console.log('✅ [MAP] Região alterada:', region);
        }}
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Localização"
          description="Sua localização atual"
          pinColor="red"
        />
      </MapView>
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
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
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
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

