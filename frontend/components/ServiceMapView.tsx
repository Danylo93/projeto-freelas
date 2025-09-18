import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ChatModal } from './ChatModal';
import { RatingModal } from './RatingModal';

interface ServiceMapViewProps {
  userType: 'client' | 'provider';
  clientLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  providerLocation?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  request: {
    id: string;
    category: string;
    price: number;
    status: string;
    distance?: number;
    estimatedTime?: number;
  };
  clientInfo?: {
    id: string;
    name: string;
    phone?: string;
  };
  providerInfo?: {
    id: string;
    name: string;
    phone?: string;
  };
  onStatusUpdate?: (status: string) => void;
}

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCBZOxsRUQIZXhaZ6M74VcMWIKx8RSNQVY';

export const ServiceMapView: React.FC<ServiceMapViewProps> = ({
  userType,
  clientLocation,
  providerLocation,
  request,
  clientInfo,
  providerInfo,
  onStatusUpdate,
}) => {
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [showChat, setShowChat] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar entrada do painel inferior
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Ajustar visualização do mapa
    if (clientLocation && providerLocation) {
      const coordinates = [
        { latitude: clientLocation.latitude, longitude: clientLocation.longitude },
        { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
      ];
      
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });

      // Simular rota (em produção, usar Google Directions API)
      generateMockRoute();
    }
  }, [clientLocation, providerLocation]);

  const generateMockRoute = async () => {
    if (!clientLocation || !providerLocation) return;

    try {
      // Usar Google Directions API
      const origin = `${providerLocation.latitude},${providerLocation.longitude}`;
      const destination = `${clientLocation.latitude},${clientLocation.longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&traffic_model=best_guess&departure_time=now`;

      console.log('🗺️ [ROUTE] Buscando rota real do Google Maps...');

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];

        // Decodificar polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        console.log('✅ [ROUTE] Rota real obtida:', {
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
          points: points.length
        });
      } else {
        console.error('❌ [ROUTE] Erro na API:', data.status, data.error_message);
        // Fallback para rota simulada
        const route = generateRealisticRoute(providerLocation, clientLocation);
        setRouteCoordinates(route);
      }

    } catch (error) {
      console.log('📍 [ROUTE] Erro, usando rota simulada:', error);
      // Fallback para rota simulada
      const route = generateRealisticRoute(providerLocation, clientLocation);
      setRouteCoordinates(route);
    }
  };

  const generateRealisticRoute = (start: any, end: any) => {
    // Gerar rota mais realista com curvas
    const points = [];
    const steps = 8; // Número de pontos intermediários

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;

      // Interpolação com pequenas variações para simular ruas
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;

      // Adicionar pequenas variações para simular curvas de rua
      const variation = 0.001 * Math.sin(ratio * Math.PI * 3);

      points.push({
        latitude: lat + variation,
        longitude: lng + variation * 0.5,
      });
    }

    return points;
  };

  // Função para decodificar polyline do Google
  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const handleStatusUpdate = (newStatus: string) => {
    setCurrentStatus(newStatus);
    onStatusUpdate?.(newStatus);

    // Mostrar modal de avaliação quando o serviço for concluído
    if (newStatus === 'completed') {
      setTimeout(() => {
        setShowRating(true);
      }, 1000); // Aguardar 1 segundo após conclusão
    }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    try {
      console.log('⭐ [RATING] Enviando avaliação:', { rating, comment, requestId: request.id });

      // Em produção, enviar para o backend
      // await fetch(`${API_URL}/requests/${request.id}/rating`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ rating, comment, user_type: userType })
      // });

      console.log('✅ [RATING] Avaliação enviada com sucesso');
    } catch (error) {
      console.error('❌ [RATING] Erro ao enviar avaliação:', error);
      throw error;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'accepted':
        return userType === 'client' ? 'Prestador a caminho' : 'Indo até o cliente';
      case 'in_progress':
        return userType === 'client' ? 'Prestador chegou' : 'Chegou ao local';
      case 'started':
        return 'Serviço em andamento';
      case 'completed':
        return 'Serviço concluído';
      default:
        return 'Aguardando...';
    }
  };

  const getActionButtons = () => {
    if (userType === 'provider') {
      switch (currentStatus) {
        case 'accepted':
          return (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('in_progress')}
            >
              <Text style={styles.actionButtonText}>Cheguei ao local</Text>
            </TouchableOpacity>
          );
        case 'in_progress':
          return (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('started')}
            >
              <Text style={styles.actionButtonText}>Iniciar serviço</Text>
            </TouchableOpacity>
          );
        case 'started':
          return (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#34C759' }]}
              onPress={() => handleStatusUpdate('completed')}
            >
              <Text style={styles.actionButtonText}>Finalizar serviço</Text>
            </TouchableOpacity>
          );
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Marcador do cliente */}
        <Marker
          coordinate={{
            latitude: clientLocation.latitude,
            longitude: clientLocation.longitude,
          }}
          title="Local do serviço"
          description={clientLocation.address}
        >
          <View style={styles.clientMarker}>
            <Ionicons name="location" size={24} color="#fff" />
          </View>
        </Marker>

        {/* Marcador do prestador */}
        {providerLocation && (
          <Marker
            coordinate={{
              latitude: providerLocation.latitude,
              longitude: providerLocation.longitude,
            }}
            title={providerLocation.name}
            description="Prestador"
          >
            <View style={styles.providerMarker}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Rota */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Painel de informações */}
      <Animated.View
        style={[
          styles.infoPanel,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          {request.estimatedTime && (
            <Text style={styles.estimatedTime}>{request.estimatedTime} min</Text>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceCategory}>{request.category}</Text>
            <Text style={styles.servicePrice}>R$ {request.price.toFixed(2)}</Text>
          </View>
          {request.distance && (
            <Text style={styles.distance}>{request.distance.toFixed(1)} km</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.address}>{clientLocation.address}</Text>
        </View>

        {/* Action Buttons */}
        {getActionButtons()}

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              const phone = userType === 'client' ? providerInfo?.phone : clientInfo?.phone;
              if (phone) {
                Linking.openURL(`tel:${phone}`);
              }
            }}
          >
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.contactText}>Ligar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => setShowChat(true)}
          >
            <Ionicons name="chatbubble" size={20} color="#007AFF" />
            <Text style={styles.contactText}>Mensagem</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Modal */}
        {(clientInfo || providerInfo) && (
          <ChatModal
            visible={showChat}
            onClose={() => setShowChat(false)}
            requestId={request.id}
            otherUser={{
              id: userType === 'client' ? (providerInfo?.id || '') : (clientInfo?.id || ''),
              name: userType === 'client' ? (providerInfo?.name || 'Prestador') : (clientInfo?.name || 'Cliente'),
              type: userType === 'client' ? 'provider' : 'client',
            }}
          />
        )}

        {/* Rating Modal */}
        <RatingModal
          visible={showRating}
          onClose={() => setShowRating(false)}
          userType={userType}
          otherUserName={userType === 'client' ? (providerInfo?.name || 'Prestador') : (clientInfo?.name || 'Cliente')}
          requestId={request.id}
          onSubmitRating={handleSubmitRating}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  clientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  providerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  estimatedTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
});
