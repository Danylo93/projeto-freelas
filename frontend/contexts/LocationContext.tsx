import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const requestPermissions = async (): Promise<boolean> => {
    // Implementação simplificada para funcionar
    setHasPermission(true);
    return true;
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    // Mock de localização para desenvolvimento
    const mockLocation: LocationData = {
      latitude: -23.5505,
      longitude: -46.6333,
      accuracy: 10,
      timestamp: Date.now(),
    };
    setLocation(mockLocation);
    return mockLocation;
  };

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

