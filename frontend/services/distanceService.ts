import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface DistanceInfo {
  distance: number; // em metros
  duration: number; // em segundos
  formattedDistance: string;
  formattedDuration: string;
}

export interface RouteInfo {
  distance: DistanceInfo;
  coordinates: LocationCoords[];
  instructions?: string[];
}

class DistanceService {
  private readonly EARTH_RADIUS = 6371000; // metros

  /**
   * Calcula a distância em linha reta entre dois pontos (Haversine)
   */
  calculateStraightDistance(point1: LocationCoords, point2: LocationCoords): number {
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLngRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS * c;
  }

  /**
   * Estima o tempo de viagem baseado na distância
   * Assume velocidade média de 30 km/h no trânsito urbano
   */
  estimateTravelTime(distanceInMeters: number): number {
    const averageSpeedKmh = 30;
    const averageSpeedMs = averageSpeedKmh / 3.6;
    return Math.round(distanceInMeters / averageSpeedMs);
  }

  /**
   * Formata distância para exibição
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Formata duração para exibição
   */
  formatDuration(durationInSeconds: number): string {
    if (durationInSeconds < 60) {
      return `${Math.round(durationInSeconds)}s`;
    } else if (durationInSeconds < 3600) {
      const minutes = Math.round(durationInSeconds / 60);
      return `${minutes}min`;
    } else {
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.round((durationInSeconds % 3600) / 60);
      return `${hours}h ${minutes}min`;
    }
  }

  /**
   * Calcula informações completas de distância
   */
  calculateDistanceInfo(point1: LocationCoords, point2: LocationCoords): DistanceInfo {
    const distance = this.calculateStraightDistance(point1, point2);
    const duration = this.estimateTravelTime(distance);

    return {
      distance,
      duration,
      formattedDistance: this.formatDistance(distance),
      formattedDuration: this.formatDuration(duration),
    };
  }

  /**
   * Obtém a localização atual do usuário
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('❌ [DISTANCE] Permissão de localização negada');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('❌ [DISTANCE] Erro ao obter localização:', error);
      return null;
    }
  }

  /**
   * Monitora mudanças de localização
   */
  async watchLocation(
    callback: (location: LocationCoords) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('❌ [DISTANCE] Permissão de localização negada');
        return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 5000,
          distanceInterval: options?.distanceInterval || 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('❌ [DISTANCE] Erro ao monitorar localização:', error);
      return null;
    }
  }

  /**
   * Calcula o centro geográfico entre dois pontos
   */
  calculateCenter(point1: LocationCoords, point2: LocationCoords): LocationCoords {
    return {
      latitude: (point1.latitude + point2.latitude) / 2,
      longitude: (point1.longitude + point2.longitude) / 2,
    };
  }

  /**
   * Calcula a região do mapa que inclui ambos os pontos
   */
  calculateMapRegion(
    point1: LocationCoords, 
    point2: LocationCoords,
    padding: number = 0.01
  ): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } {
    const center = this.calculateCenter(point1, point2);
    const latitudeDelta = Math.abs(point1.latitude - point2.latitude) + padding;
    const longitudeDelta = Math.abs(point1.longitude - point2.longitude) + padding;

    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    };
  }

  /**
   * Verifica se um ponto está dentro de um raio específico
   */
  isWithinRadius(
    center: LocationCoords,
    point: LocationCoords,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateStraightDistance(center, point);
    return distance <= radiusInMeters;
  }

  /**
   * Encontra o ponto mais próximo de uma lista
   */
  findClosestPoint(
    reference: LocationCoords,
    points: (LocationCoords & { id: string })[]
  ): (LocationCoords & { id: string; distance: number }) | null {
    if (points.length === 0) return null;

    let closest = points[0];
    let minDistance = this.calculateStraightDistance(reference, closest);

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateStraightDistance(reference, points[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = points[i];
      }
    }

    return {
      ...closest,
      distance: minDistance,
    };
  }

  /**
   * Ordena pontos por distância
   */
  sortByDistance(
    reference: LocationCoords,
    points: (LocationCoords & { id: string })[]
  ): (LocationCoords & { id: string; distance: number })[] {
    return points
      .map(point => ({
        ...point,
        distance: this.calculateStraightDistance(reference, point),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Converte coordenadas para string legível
   */
  coordinatesToString(coords: LocationCoords): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  /**
   * Valida se as coordenadas são válidas
   */
  isValidCoordinates(coords: LocationCoords): boolean {
    return (
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number' &&
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180 &&
      !isNaN(coords.latitude) &&
      !isNaN(coords.longitude)
    );
  }
}

export const distanceService = new DistanceService();
export default DistanceService;
