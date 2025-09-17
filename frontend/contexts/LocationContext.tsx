import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationContextType {
  location: Location.LocationObject | null;
  isLocationEnabled: boolean;
  requestLocationPermission: () => Promise<boolean>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const watchIdRef = useRef<Location.LocationSubscription | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de Localização',
          'É necessário permitir o acesso à localização para usar o aplicativo.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Permissão de Localização em Background',
          'Para receber notificações quando estiver fora do app, permita o acesso à localização em background.',
          [{ text: 'OK' }]
        );
      }

      setIsLocationEnabled(true);
      return true;
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const startLocationTracking = async () => {
    if (!isLocationEnabled) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
    }

    try {
      // Obter localização atual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      // Iniciar rastreamento contínuo
      watchIdRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Atualizar a cada 5 segundos
          distanceInterval: 10, // Atualizar a cada 10 metros
        },
        (newLocation) => {
          setLocation(newLocation);
          console.log('📍 [LOCATION] Localização atualizada:', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
          });
        }
      );

      console.log('📍 [LOCATION] Rastreamento iniciado');
    } catch (error) {
      console.error('❌ [LOCATION] Erro ao iniciar rastreamento:', error);
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
      console.log('📍 [LOCATION] Rastreamento parado');
    }
  };

  // Verificar permissões na inicialização
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setIsLocationEnabled(status === 'granted');
    };
    checkPermissions();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocationEnabled,
        requestLocationPermission,
        startLocationTracking,
        stopLocationTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
