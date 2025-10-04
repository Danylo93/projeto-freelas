import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';

// Importação condicional do react-native-maps
let MapView: any, Marker: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    console.log('✅ [TEST-MAP] react-native-maps carregado');
  } catch (error) {
    console.error('❌ [TEST-MAP] Erro ao carregar react-native-maps:', error);
  }
}

export const TestMap: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMapReady = () => {
    console.log('✅ [TEST-MAP] Mapa carregado com sucesso!');
    setMapLoaded(true);
  };

  const handleMapError = (error: any) => {
    console.error('❌ [TEST-MAP] Erro no mapa:', error);
    setError(`Erro: ${error.message || 'Erro desconhecido'}`);
  };

  if (!MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>🗺️ Mapa não disponível</Text>
          <Text style={styles.fallbackText}>
            {Platform.OS === 'web' 
              ? 'Mapa não suportado no navegador' 
              : 'react-native-maps não foi carregado'
            }
          </Text>
          <Text style={styles.debugText}>
            Platform: {Platform.OS}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teste do Mapa</Text>
        <Text style={styles.subtitle}>
          {mapLoaded ? '✅ Mapa carregado' : '⏳ Carregando...'}
        </Text>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
      
      <MapView
        style={styles.map}
        provider="google"
        initialRegion={{
          latitude: -23.5615,
          longitude: -46.656,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onMapReady={handleMapReady}
        onError={handleMapError}
        onRegionChangeComplete={(region) => {
          console.log('✅ [TEST-MAP] Região alterada:', region);
        }}
      >
        <Marker
          coordinate={{
            latitude: -23.5615,
            longitude: -46.656,
          }}
          title="São Paulo"
          description="Centro de São Paulo"
          pinColor="red"
        />
      </MapView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            Alert.alert('Teste', 'Botão funcionando!');
          }}
        >
          <Text style={styles.buttonText}>Testar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
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
  },
  footer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

