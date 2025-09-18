import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface RequestDetailsModalProps {
  visible: boolean;
  request: {
    request_id: string;
    client_name: string;
    category: string;
    description?: string;
    price: number;
    distance: number;
    client_address: string;
    client_latitude: number;
    client_longitude: number;
  } | null;
  providerLocation: {
    latitude: number;
    longitude: number;
  };
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCBZOxsRUQIZXhaZ6M74VcMWIKx8RSNQVY';

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  visible,
  request,
  providerLocation,
  onAccept,
  onDecline,
  onClose,
}) => {

  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    distanceValue: number;
    durationValue: number;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (visible && request) {
      setCountdown(15);
      fetchRoute();
      
      // Timer de 15 segundos
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onDecline(); // Auto-recusar após 15 segundos
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible, request]);

  const fetchRoute = async () => {
    if (!request) return;

    // Verificar se as coordenadas são válidas
    if (!providerLocation ||
        providerLocation.latitude === 0 ||
        providerLocation.longitude === 0 ||
        !request.client_latitude ||
        !request.client_longitude) {
      console.log('🗺️ [DIRECTIONS] Coordenadas inválidas, usando rota simulada');
      createFallbackRoute();
      return;
    }

    setIsLoadingRoute(true);
    try {
      const origin = `${providerLocation.latitude},${providerLocation.longitude}`;
      const destination = `${request.client_latitude},${request.client_longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&traffic_model=best_guess&departure_time=now`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decodificar polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        // Informações da rota
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceValue: leg.distance.value / 1000, // metros para km
          durationValue: leg.duration.value / 60, // segundos para minutos
        });
        
        console.log('✅ [DIRECTIONS] Rota obtida:', {
          distance: leg.distance.text,
          duration: leg.duration.text,
          points: points.length
        });
      } else {
        console.error('❌ [DIRECTIONS] Erro na API:', data.status, data.error_message);
        // Fallback para rota simulada
        createFallbackRoute();
      }
    } catch (error) {
      console.error('❌ [DIRECTIONS] Erro na requisição:', error);
      createFallbackRoute();
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const createFallbackRoute = () => {
    if (!request) return;
    
    // Rota simulada em linha reta
    const points = [
      { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
      { latitude: request.client_latitude, longitude: request.client_longitude },
    ];
    
    setRouteCoordinates(points);
    setRouteInfo({
      distance: `${request.distance.toFixed(1)} km`,
      duration: `${Math.ceil(request.distance * 2)} min`,
      distanceValue: request.distance,
      durationValue: request.distance * 2,
    });
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

  if (!request) return null;

  const earnings = request.price * 0.8; // 80% para o prestador

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Solicitação</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Mapa */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: (providerLocation.latitude + request.client_latitude) / 2,
                longitude: (providerLocation.longitude + request.client_longitude) / 2,
                latitudeDelta: Math.abs(providerLocation.latitude - request.client_latitude) * 2 + 0.01,
                longitudeDelta: Math.abs(providerLocation.longitude - request.client_longitude) * 2 + 0.01,
              }}
            >
              {/* Marcador do prestador */}
              <Marker
                coordinate={providerLocation}
                title="Sua localização"
                pinColor="#007AFF"
              />
              
              {/* Marcador do cliente */}
              <Marker
                coordinate={{
                  latitude: request.client_latitude,
                  longitude: request.client_longitude,
                }}
                title="Local do serviço"
                pinColor="#34C759"
              />
              
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
            
            {isLoadingRoute && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Calculando rota...</Text>
              </View>
            )}
          </View>

          {/* Informações do Cliente */}
          <View style={styles.clientSection}>
            <View style={styles.clientHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{request.client_name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.rating}>4.8 • 127 avaliações</Text>
                </View>
              </View>
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{request.category}</Text>
              </View>
            </View>
          </View>

          {/* Detalhes do Serviço */}
          <View style={styles.serviceSection}>
            <Text style={styles.sectionTitle}>Detalhes do Serviço</Text>
            
            <View style={styles.locationItem}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Local do serviço</Text>
                <Text style={styles.locationAddress}>{request.client_address}</Text>
              </View>
            </View>
            
            {request.description && (
              <View style={styles.descriptionContainer}>
                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                <View style={styles.descriptionContent}>
                  <Text style={styles.descriptionTitle}>Descrição</Text>
                  <Text style={styles.description}>{request.description}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Informações da Viagem */}
          <View style={styles.tripSection}>
            <Text style={styles.sectionTitle}>Informações da Viagem</Text>
            
            <View style={styles.tripGrid}>
              <View style={styles.tripItem}>
                <Ionicons name="location-outline" size={24} color="#007AFF" />
                <Text style={styles.tripLabel}>Distância</Text>
                <Text style={styles.tripValue}>
                  {routeInfo ? routeInfo.distance : `${request.distance.toFixed(1)} km`}
                </Text>
              </View>
              
              <View style={styles.tripItem}>
                <Ionicons name="time-outline" size={24} color="#FF9500" />
                <Text style={styles.tripLabel}>Tempo estimado</Text>
                <Text style={styles.tripValue}>
                  {routeInfo ? routeInfo.duration : `${Math.ceil(request.distance * 2)} min`}
                </Text>
              </View>
              
              <View style={styles.tripItem}>
                <Ionicons name="cash-outline" size={24} color="#34C759" />
                <Text style={styles.tripLabel}>Valor do serviço</Text>
                <Text style={styles.tripValue}>R$ {request.price.toFixed(2)}</Text>
              </View>
              
              <View style={styles.tripItem}>
                <Ionicons name="wallet-outline" size={24} color="#34C759" />
                <Text style={styles.tripLabel}>Você receberá</Text>
                <Text style={[styles.tripValue, styles.earningsValue]}>R$ {earnings.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Botões de Ação */}
        <View style={styles.actionSection}>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color="#FF3B30" />
            <Text style={styles.timerText}>Responda em {countdown} segundos</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>Aceitar Solicitação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  clientSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  serviceTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  serviceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  descriptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tripSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tripItem: {
    width: (width - 56) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tripLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  tripValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  earningsValue: {
    color: '#34C759',
    fontSize: 18,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: '#F8F9FA',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
