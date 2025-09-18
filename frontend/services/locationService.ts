import * as Location from 'expo-location';
import { Platform } from 'react-native';
import axios from 'axios';
import { REQUESTS_API_URL } from '@/utils/config';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationUpdate {
  user_id: string;
  request_id?: string;
  location: LocationData;
  status: 'active' | 'inactive' | 'offline';
  updated_at: string;
}

export interface TrackingSession {
  id: string;
  request_id: string;
  provider_id: string;
  client_id: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  route_points: LocationData[];
  total_distance?: number;
  total_duration?: number;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private currentSession: TrackingSession | null = null;
  private locationUpdateCallback: ((location: LocationData) => void) | null = null;

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getLocationApiUrl() {
    return REQUESTS_API_URL.replace('/requests', '/location');
  }

  /**
   * Solicitar permissões de localização
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📍 [LOCATION] Solicitando permissões de localização...');

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('⚠️ [LOCATION] Permissão de localização em foreground negada');
        return false;
      }

      // Para rastreamento em tempo real, também precisamos de permissão de background
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus !== 'granted') {
          console.warn('⚠️ [LOCATION] Permissão de localização em background negada');
          // Ainda podemos funcionar sem background, mas com limitações
        }
      }

      console.log('✅ [LOCATION] Permissões de localização concedidas');
      return true;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao solicitar permissões:', error);
      return false;
    }
  }

  /**
   * Obter localização atual
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      console.log('📍 [LOCATION] Obtendo localização atual...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Cache por 10 segundos
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      console.log('✅ [LOCATION] Localização obtida:', locationData);
      return locationData;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao obter localização:', error);
      return null;
    }
  }

  /**
   * Iniciar rastreamento em tempo real
   */
  async startTracking(
    requestId: string,
    updateCallback?: (location: LocationData) => void
  ): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.warn('⚠️ [LOCATION] Rastreamento já está ativo');
        return true;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      console.log('📍 [LOCATION] Iniciando rastreamento para request:', requestId);

      this.locationUpdateCallback = updateCallback || null;
      this.isTracking = true;

      // Criar sessão de rastreamento
      await this.createTrackingSession(requestId);

      // Configurar watch de localização
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Atualizar a cada 5 segundos
          distanceInterval: 10, // Ou quando mover 10 metros
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      console.log('✅ [LOCATION] Rastreamento iniciado');
      return true;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao iniciar rastreamento:', error);
      this.isTracking = false;
      return false;
    }
  }

  /**
   * Parar rastreamento
   */
  async stopTracking(): Promise<void> {
    try {
      console.log('📍 [LOCATION] Parando rastreamento...');

      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      this.isTracking = false;
      this.locationUpdateCallback = null;

      // Finalizar sessão de rastreamento
      if (this.currentSession) {
        await this.endTrackingSession();
      }

      console.log('✅ [LOCATION] Rastreamento parado');
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao parar rastreamento:', error);
    }
  }

  /**
   * Lidar com atualização de localização
   */
  private async handleLocationUpdate(location: Location.LocationObject) {
    try {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      console.log('📍 [LOCATION] Atualização de localização:', locationData);

      // Chamar callback local
      if (this.locationUpdateCallback) {
        this.locationUpdateCallback(locationData);
      }

      // Enviar para o backend
      await this.sendLocationUpdate(locationData);

      // Adicionar à sessão atual
      if (this.currentSession) {
        this.currentSession.route_points.push(locationData);
      }
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao processar atualização:', error);
    }
  }

  /**
   * Enviar atualização de localização para o backend
   */
  private async sendLocationUpdate(location: LocationData): Promise<void> {
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      if (!userId) return;

      const update: LocationUpdate = {
        user_id: userId,
        request_id: this.currentSession?.request_id,
        location,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      await axios.post(
        `${this.getLocationApiUrl()}/updates`,
        update,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [LOCATION] Localização enviada para backend');
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao enviar localização:', error);
    }
  }

  /**
   * Criar sessão de rastreamento
   */
  private async createTrackingSession(requestId: string): Promise<void> {
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      if (!userId) return;

      const response = await axios.post(
        `${this.getLocationApiUrl()}/tracking-sessions`,
        {
          request_id: requestId,
          provider_id: userId,
          status: 'active',
          start_time: new Date().toISOString(),
        },
        { headers: this.getAuthHeaders() }
      );

      this.currentSession = {
        ...response.data,
        route_points: [],
      };

      console.log('✅ [LOCATION] Sessão de rastreamento criada:', this.currentSession.id);
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao criar sessão:', error);
    }
  }

  /**
   * Finalizar sessão de rastreamento
   */
  private async endTrackingSession(): Promise<void> {
    try {
      if (!this.currentSession) return;

      const totalDistance = this.calculateTotalDistance(this.currentSession.route_points);
      const totalDuration = Date.now() - new Date(this.currentSession.start_time).getTime();

      await axios.patch(
        `${this.getLocationApiUrl()}/tracking-sessions/${this.currentSession.id}`,
        {
          status: 'completed',
          end_time: new Date().toISOString(),
          total_distance: totalDistance,
          total_duration: totalDuration,
          route_points: this.currentSession.route_points,
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [LOCATION] Sessão de rastreamento finalizada');
      this.currentSession = null;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao finalizar sessão:', error);
    }
  }

  /**
   * Calcular distância total percorrida
   */
  private calculateTotalDistance(points: LocationData[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Calcular distância entre dois pontos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Retornar em metros
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Obter localização de um usuário específico
   */
  async getUserLocation(userId: string): Promise<LocationData | null> {
    try {
      const response = await axios.get(
        `${this.getLocationApiUrl()}/users/${userId}/current`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.location || null;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao obter localização do usuário:', error);
      return null;
    }
  }

  /**
   * Obter sessão de rastreamento ativa
   */
  async getActiveTrackingSession(requestId: string): Promise<TrackingSession | null> {
    try {
      const response = await axios.get(
        `${this.getLocationApiUrl()}/tracking-sessions/active?request_id=${requestId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data || null;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao obter sessão ativa:', error);
      return null;
    }
  }

  /**
   * Verificar se está rastreando
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Obter sessão atual
   */
  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }
}

export const locationService = new LocationService();

export default LocationService;
