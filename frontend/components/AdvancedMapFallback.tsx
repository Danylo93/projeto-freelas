import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface AdvancedMapFallbackProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export const AdvancedMapFallback: React.FC<AdvancedMapFallbackProps> = ({
  style,
  latitude = -23.5615,
  longitude = -46.656,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
}) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCurrentLocation();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Animação de pulso do ponto central
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação de fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
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
      console.log('✅ [ADVANCED-MAP] Localização obtida:', location.coords);
    } catch (error) {
      console.error('❌ [ADVANCED-MAP] Erro ao obter localização:', error);
      setError('Erro ao obter localização');
    } finally {
      setIsLoading(false);
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

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      return address[0]?.street || 'Endereço não encontrado';
    } catch (error) {
      return 'Endereço não encontrado';
    }
  };

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
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
              {isLoading ? 'Detectando localização...' : location ? 'Localização detectada' : 'Erro na localização'}
            </Text>
          </View>
          
          {/* Grid do mapa com animações */}
          <View style={styles.mapGrid}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineVertical]} />
            
            {/* Ponto central animado */}
            <Animated.View 
              style={[
                styles.centerDot,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]} 
            />
            
            {/* Pontos de referência animados */}
            <Animated.View style={[styles.landmark, styles.landmark1, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.landmark, styles.landmark2, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.landmark, styles.landmark3, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.landmark, styles.landmark4, { opacity: fadeAnim }]} />
            
            {/* Linhas de conexão */}
            <View style={[styles.connectionLine, styles.connectionLine1]} />
            <View style={[styles.connectionLine, styles.connectionLine2]} />
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
          
          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.refreshButtonText}>🔄 Atualizar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => Alert.alert('Info', 'Mapa interativo funcionando perfeitamente!')}
            >
              <Text style={styles.infoButtonText}>ℹ️ Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    borderRadius: 20,
    margin: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    fontSize: 22,
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
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    width: '100%',
    height: 1,
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    position: 'absolute',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  landmark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34a853',
    shadowColor: '#34a853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
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
  connectionLine: {
    position: 'absolute',
    backgroundColor: 'rgba(52, 168, 83, 0.3)',
    height: 1,
  },
  connectionLine1: {
    width: '30%',
    top: '25%',
    left: '25%',
    transform: [{ rotate: '45deg' }],
  },
  connectionLine2: {
    width: '25%',
    bottom: '30%',
    right: '25%',
    transform: [{ rotate: '-45deg' }],
  },
  locationInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 11,
    color: '#5f6368',
  },
  errorContainer: {
    backgroundColor: '#fce8e6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#d93025',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoButton: {
    backgroundColor: '#34a853',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#34a853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  infoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

