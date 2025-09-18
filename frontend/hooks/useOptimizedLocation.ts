import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { cacheService } from '../services/cacheService';
import { retryService } from '../services/retryService';
import { analyticsService } from '../services/analyticsService';
import { feedbackService } from '../services/feedbackService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  address?: string;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceInterval?: number;
  timeInterval?: number;
  enableCaching?: boolean;
  enableRetry?: boolean;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permission: Location.LocationPermissionResponse | null;
  isTracking: boolean;
}

export const useOptimizedLocation = (options: LocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 60000,
    distanceInterval = 10,
    timeInterval = 5000,
    enableCaching = true,
    enableRetry = true,
  } = options;

  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permission: null,
    isTracking: false,
  });

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastLocationTime = useRef<number>(0);
  const locationCache = useRef<LocationData | null>(null);

  // Verificar e solicitar permissões
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Permissão de localização negada',
          permission: { status: foregroundStatus } as Location.LocationPermissionResponse,
        }));
        return false;
      }

      // Para tracking contínuo, solicitar permissão de background
      if (timeInterval > 0) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        setState(prev => ({
          ...prev,
          permission: { status: backgroundStatus } as Location.LocationPermissionResponse,
        }));
      }

      setState(prev => ({
        ...prev,
        loading: false,
        permission: { status: foregroundStatus } as Location.LocationPermissionResponse,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erro ao solicitar permissões: ${error.message}`,
      }));
      analyticsService.trackError(error, 'location_permissions');
      return false;
    }
  }, [timeInterval]);

  // Obter localização atual
  const getCurrentLocation = useCallback(async (forceRefresh: boolean = false): Promise<LocationData | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verificar cache se não forçar refresh
      if (!forceRefresh && enableCaching) {
        const cached = await cacheService.getCachedUserLocation();
        if (cached && Date.now() - lastLocationTime.current < maximumAge) {
          setState(prev => ({ ...prev, location: cached, loading: false }));
          return cached;
        }
      }

      const locationOperation = async (): Promise<LocationData> => {
        const locationResult = await Location.getCurrentPositionAsync({
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeout,
          maximumAge,
        });

        const locationData: LocationData = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          accuracy: locationResult.coords.accuracy || undefined,
          altitude: locationResult.coords.altitude || undefined,
          heading: locationResult.coords.heading || undefined,
          speed: locationResult.coords.speed || undefined,
          timestamp: locationResult.timestamp,
        };

        // Tentar obter endereço
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });

          if (address) {
            locationData.address = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
          }
        } catch (addressError) {
          console.warn('⚠️ [LOCATION] Erro ao obter endereço:', addressError);
        }

        return locationData;
      };

      const location = enableRetry
        ? await retryService.locationRetry(locationOperation)
        : await locationOperation();

      // Cache da localização
      if (enableCaching) {
        await cacheService.cacheUserLocation(location);
      }

      locationCache.current = location;
      lastLocationTime.current = Date.now();

      setState(prev => ({ ...prev, location, loading: false }));
      
      // Feedback de sucesso
      await feedbackService.locationFound();
      
      // Analytics
      analyticsService.track('location_obtained', {
        accuracy: location.accuracy,
        method: 'getCurrentLocation',
      });

      return location;
    } catch (error: any) {
      const errorMessage = `Erro ao obter localização: ${error.message}`;
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      analyticsService.trackError(error, 'get_current_location');
      await feedbackService.error();
      
      return null;
    }
  }, [enableHighAccuracy, timeout, maximumAge, enableCaching, enableRetry]);

  // Iniciar tracking de localização
  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      if (watchSubscription.current) {
        console.warn('⚠️ [LOCATION] Tracking já está ativo');
        return true;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) return false;

      setState(prev => ({ ...prev, isTracking: true, error: null }));

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval,
          distanceInterval,
        },
        async (locationResult) => {
          const locationData: LocationData = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy || undefined,
            altitude: locationResult.coords.altitude || undefined,
            heading: locationResult.coords.heading || undefined,
            speed: locationResult.coords.speed || undefined,
            timestamp: locationResult.timestamp,
          };

          // Cache da nova localização
          if (enableCaching) {
            await cacheService.cacheUserLocation(locationData);
          }

          locationCache.current = locationData;
          lastLocationTime.current = Date.now();

          setState(prev => ({ ...prev, location: locationData }));

          // Analytics para tracking
          analyticsService.track('location_updated', {
            accuracy: locationData.accuracy,
            method: 'tracking',
          });
        }
      );

      analyticsService.track('location_tracking_started');
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isTracking: false,
        error: `Erro ao iniciar tracking: ${error.message}`,
      }));
      
      analyticsService.trackError(error, 'start_location_tracking');
      return false;
    }
  }, [requestPermissions, enableHighAccuracy, timeInterval, distanceInterval, enableCaching]);

  // Parar tracking de localização
  const stopTracking = useCallback((): void => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setState(prev => ({ ...prev, isTracking: false }));
      analyticsService.track('location_tracking_stopped');
    }
  }, []);

  // Calcular distância entre duas localizações
  const calculateDistance = useCallback((
    location1: { latitude: number; longitude: number },
    location2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Verificar se localização está atualizada
  const isLocationFresh = useCallback((maxAgeMs: number = maximumAge): boolean => {
    return locationCache.current !== null && 
           Date.now() - lastLocationTime.current < maxAgeMs;
  }, [maximumAge]);

  // Limpar cache de localização
  const clearLocationCache = useCallback(async (): Promise<void> => {
    locationCache.current = null;
    lastLocationTime.current = 0;
    await cacheService.clearAllCache();
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Carregar localização do cache ao inicializar
  useEffect(() => {
    const loadCachedLocation = async () => {
      if (enableCaching) {
        const cached = await cacheService.getCachedUserLocation();
        if (cached) {
          setState(prev => ({ ...prev, location: cached }));
          locationCache.current = cached;
        }
      }
    };

    loadCachedLocation();
  }, [enableCaching]);

  return {
    ...state,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermissions,
    calculateDistance,
    isLocationFresh,
    clearLocationCache,
    refreshLocation: () => getCurrentLocation(true),
  };
};
