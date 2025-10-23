import { create } from 'zustand';
import { Location } from '../types';
import * as LocationService from 'expo-location';

interface LocationState {
  currentLocation: Location | null;
  hasPermission: boolean;
  isTracking: boolean;
  error: string | null;
}

interface LocationActions {
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Location | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  clearError: () => void;
}

type LocationStore = LocationState & LocationActions;

export const useLocationStore = create<LocationStore>((set, get) => ({
  // State
  currentLocation: null,
  hasPermission: false,
  isTracking: false,
  error: null,

  // Actions
  requestPermission: async (): Promise<boolean> => {
    try {
      const { status } = await LocationService.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      
      set({ hasPermission });
      
      if (hasPermission) {
        await get().getCurrentLocation();
      }
      
      return hasPermission;
      
    } catch (error) {
      const errorMessage = 'Erro ao solicitar permissão de localização';
      set({ error: errorMessage });
      return false;
    }
  },

  getCurrentLocation: async (): Promise<Location | null> => {
    try {
      const { hasPermission } = get();
      
      if (!hasPermission) {
        const granted = await get().requestPermission();
        if (!granted) {
          return null;
        }
      }
      
      const location = await LocationService.getCurrentPositionAsync({
        accuracy: LocationService.Accuracy.High
      });
      
      // Geocodificação reversa para obter o endereço
      const addressResponse = await LocationService.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      const address = addressResponse[0];
      const fullAddress = [
        address.street,
        address.district,
        address.city,
        address.region
      ].filter(Boolean).join(', ');
      
      const currentLocation: Location = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: fullAddress || 'Localização atual',
        city: address.city,
        state: address.region,
        country: address.country
      };
      
      set({ currentLocation, error: null });
      return currentLocation;
      
    } catch (error) {
      const errorMessage = 'Erro ao obter localização atual';
      set({ error: errorMessage });
      return null;
    }
  },

  startTracking: async (): Promise<void> => {
    try {
      const { hasPermission } = get();
      
      if (!hasPermission) {
        const granted = await get().requestPermission();
        if (!granted) {
          throw new Error('Permissão de localização negada');
        }
      }
      
      set({ isTracking: true, error: null });
      
      // Iniciar tracking de localização em background
      await LocationService.startLocationUpdatesAsync('location-tracking', {
        accuracy: LocationService.Accuracy.High,
        timeInterval: 5000, // 5 segundos
        distanceInterval: 10, // 10 metros
        foregroundService: {
          notificationTitle: 'FreelasApp',
          notificationBody: 'Rastreando sua localização',
          notificationColor: '#2196F3'
        }
      });
      
    } catch (error) {
      const errorMessage = 'Erro ao iniciar rastreamento';
      set({ 
        isTracking: false, 
        error: errorMessage 
      });
      throw new Error(errorMessage);
    }
  },

  stopTracking: () => {
    try {
      LocationService.stopLocationUpdatesAsync('location-tracking');
      set({ isTracking: false });
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
