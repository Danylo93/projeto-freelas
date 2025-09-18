import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceInterval?: number; // metros
  timeInterval?: number; // milissegundos
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    distanceInterval = 10, // 10 metros
    timeInterval = 5000, // 5 segundos
  } = options;

  useEffect(() => {
    let isMounted = true;

    const requestPermissions = async () => {
      try {
        console.log('📍 [LOCATION] Solicitando permissões...');
        
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
          setError('Permissão de localização negada');
          setHasPermission(false);
          setIsLoading(false);
          return;
        }

        // Para tracking em tempo real, solicitar permissão de background também
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        console.log('📍 [LOCATION] Background permission:', backgroundStatus);

        setHasPermission(true);
        
        // Obter localização inicial
        await getCurrentLocation();
        
        // Iniciar tracking contínuo
        await startLocationTracking();
        
      } catch (err) {
        console.error('❌ [LOCATION] Erro ao solicitar permissões:', err);
        setError('Erro ao acessar localização');
        setHasPermission(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const getCurrentLocation = async () => {
      try {
        console.log('📍 [LOCATION] Obtendo localização atual...');
        
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeout,
          maximumAge,
        });

        if (isMounted) {
          const locationData: LocationData = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy || undefined,
            timestamp: currentLocation.timestamp,
          };
          
          console.log('📍 [LOCATION] Localização obtida:', locationData);
          setLocation(locationData);
          setError(null);
        }
      } catch (err) {
        console.error('❌ [LOCATION] Erro ao obter localização:', err);
        if (isMounted) {
          setError('Erro ao obter localização atual');
        }
      }
    };

    const startLocationTracking = async () => {
      try {
        console.log('📍 [LOCATION] Iniciando tracking contínuo...');
        
        watchSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval,
            distanceInterval,
          },
          (newLocation) => {
            if (isMounted) {
              const locationData: LocationData = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                accuracy: newLocation.coords.accuracy || undefined,
                timestamp: newLocation.timestamp,
              };
              
              console.log('📍 [LOCATION] Localização atualizada:', locationData);
              setLocation(locationData);
              setError(null);
            }
          }
        );
      } catch (err) {
        console.error('❌ [LOCATION] Erro no tracking:', err);
        if (isMounted) {
          setError('Erro no tracking de localização');
        }
      }
    };

    requestPermissions();

    return () => {
      isMounted = false;
      if (watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, distanceInterval, timeInterval]);

  const refreshLocation = async () => {
    if (!hasPermission) {
      Alert.alert('Erro', 'Permissão de localização não concedida');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeout,
        maximumAge: 0, // Forçar nova leitura
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || undefined,
        timestamp: currentLocation.timestamp,
      };
      
      setLocation(locationData);
      console.log('📍 [LOCATION] Localização atualizada manualmente:', locationData);
    } catch (err) {
      console.error('❌ [LOCATION] Erro ao atualizar localização:', err);
      setError('Erro ao atualizar localização');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      console.log('📍 [LOCATION] Tracking interrompido');
    }
  };

  const startTracking = async () => {
    if (!hasPermission) {
      Alert.alert('Erro', 'Permissão de localização não concedida');
      return;
    }

    if (watchSubscription.current) {
      console.log('📍 [LOCATION] Tracking já está ativo');
      return;
    }

    try {
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval,
          distanceInterval,
        },
        (newLocation) => {
          const locationData: LocationData = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || undefined,
            timestamp: newLocation.timestamp,
          };
          
          setLocation(locationData);
          console.log('📍 [LOCATION] Tracking ativo - nova localização:', locationData);
        }
      );
    } catch (err) {
      console.error('❌ [LOCATION] Erro ao iniciar tracking:', err);
      setError('Erro ao iniciar tracking');
    }
  };

  return {
    location,
    isLoading,
    error,
    hasPermission,
    refreshLocation,
    stopTracking,
    startTracking,
    isTracking: watchSubscription.current !== null,
  };
};
