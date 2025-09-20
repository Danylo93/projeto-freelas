import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationContextData {
  location: LocationData | null;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermissions: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  watchLocation: boolean;
  setWatchLocation: (watch: boolean) => void;
  locationError: string | null;
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData);

export function useLocation(): LocationContextData {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [watchLocation, setWatchLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Solicitar permissões de localização
  const requestPermissions = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permission = status === 'granted';
      
      setHasPermission(permission);
      
      if (!permission) {
        Alert.alert(
          'Permissão Negada',
          'A permissão de localização é necessária para encontrar prestadores próximos a você.',
          [{ text: 'OK' }]
        );
        setLocationError('Permissão de localização negada');
      } else {
        setLocationError(null);
      }

      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      setLocationError('Erro ao solicitar permissões');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Obter localização atual
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      setIsLoading(true);
      setLocationError(null);

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy,
        timestamp: locationResult.timestamp,
      };

      setLocation(locationData);
      return locationData;

    } catch (error: any) {
      console.error('Erro ao obter localização:', error);
      setLocationError('Não foi possível obter sua localização');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Efeitos
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        hasPermission,
        requestPermissions,
        getCurrentLocation,
        watchLocation,
        setWatchLocation,
        locationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
