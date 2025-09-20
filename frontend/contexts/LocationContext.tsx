import React, { createContext, useContext, ReactNode } from 'react';

interface LocationContextData {
  location: null;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermissions: () => Promise<boolean>;
  getCurrentLocation: () => Promise<null>;
  watchLocation: boolean;
  setWatchLocation: (watch: boolean) => void;
  locationError: string | null;
}

const LocationContext = createContext<LocationContextData>({
  location: null,
  isLoading: false,
  hasPermission: false,
  requestPermissions: async () => false,
  getCurrentLocation: async () => null,
  watchLocation: false,
  setWatchLocation: () => {},
  locationError: null,
});

export function useLocation(): LocationContextData {
  return useContext(LocationContext);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const value = {
    location: null,
    isLoading: false,
    hasPermission: false,
    requestPermissions: async () => false,
    getCurrentLocation: async () => null,
    watchLocation: false,
    setWatchLocation: () => {},
    locationError: null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

