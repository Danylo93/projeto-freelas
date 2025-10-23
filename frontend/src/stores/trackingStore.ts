import { create } from 'zustand';
import { VehicleLocation, DriverInfo, RouteUpdate, RouteInstruction, Service } from '../types';

interface TrackingState {
  vehicleLocation: VehicleLocation | null;
  driverInfo: DriverInfo | null;
  routeUpdate: RouteUpdate | null;
  isTracking: boolean;
  error: string | null;
}

interface TrackingActions {
  startTracking: (service: Service) => Promise<void>;
  stopTracking: () => void;
  updateVehicleLocation: (location: VehicleLocation) => void;
  updateRouteUpdate: (update: RouteUpdate) => void;
  clearError: () => void;
  resetTracking: () => void;
}

type TrackingStore = TrackingState & TrackingActions;

export const useTrackingStore = create<TrackingStore>((set, get) => ({
  // State
  vehicleLocation: null,
  driverInfo: null,
  routeUpdate: null,
  isTracking: false,
  error: null,

  // Actions
  startTracking: async (service: Service): Promise<void> => {
    set({ isTracking: true, error: null });
    
    try {
      // Simular delay de inicialização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de informações do motorista
      const driverInfo: DriverInfo = {
        id: 'driver_001',
        name: 'João Silva',
        phone: '11999887766',
        vehicleModel: 'Honda Civic',
        vehiclePlate: 'ABC-1234',
        rating: 4.8,
        photo: undefined
      };
      
      // Mock de localização inicial do veículo
      const initialVehicleLocation: VehicleLocation = {
        vehicleId: `vehicle_${service.id}`,
        location: service.location,
        speed: 0,
        heading: 0,
        timestamp: Date.now(),
        status: 'APPROACHING' as any
      };
      
      set({
        driverInfo,
        vehicleLocation: initialVehicleLocation,
        isTracking: true,
        error: null
      });
      
      // Iniciar simulação de movimento
      get().simulateVehicleMovement(service);
      
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
    set({ 
      isTracking: false,
      vehicleLocation: null,
      driverInfo: null,
      routeUpdate: null
    });
  },

  updateVehicleLocation: (location: VehicleLocation) => {
    set({ vehicleLocation: location });
  },

  updateRouteUpdate: (update: RouteUpdate) => {
    set({ routeUpdate: update });
  },

  clearError: () => {
    set({ error: null });
  },

  resetTracking: () => {
    set({
      vehicleLocation: null,
      driverInfo: null,
      routeUpdate: null,
      isTracking: false,
      error: null
    });
  },

  // Função privada para simular movimento do veículo
  simulateVehicleMovement: (service: Service) => {
    const { destination } = service;
    if (!destination) return;
    
    const startLat = service.location.latitude;
    const startLng = service.location.longitude;
    const endLat = destination.latitude;
    const endLng = destination.longitude;
    
    const totalDistance = calculateDistance(startLat, startLng, endLat, endLng);
    const totalSteps = Math.max(50, Math.min(200, Math.floor(totalDistance * 10)));
    
    let currentStep = 0;
    const baseSpeed = 25 + Math.random() * 20; // 25-45 km/h
    
    const moveInterval = setInterval(() => {
      const { isTracking } = get();
      if (!isTracking) {
        clearInterval(moveInterval);
        return;
      }
      
      currentStep++;
      const progress = currentStep / totalSteps;
      
      if (progress >= 1) {
        // Chegou ao destino
        const finalLocation: VehicleLocation = {
          vehicleId: `vehicle_${service.id}`,
          location: destination,
          speed: 0,
          heading: 0,
          timestamp: Date.now(),
          status: 'ARRIVED' as any
        };
        
        const finalRouteUpdate: RouteUpdate = {
          vehicleLocation: finalLocation,
          remainingDistance: 0,
          estimatedArrival: 0,
          nextInstruction: {
            instruction: 'Você chegou ao destino',
            distance: 0,
            duration: 0,
            location: destination
          }
        };
        
        set({
          vehicleLocation: finalLocation,
          routeUpdate: finalRouteUpdate
        });
        
        clearInterval(moveInterval);
        return;
      }
      
      // Calcular nova posição
      const newLat = startLat + (endLat - startLat) * easeInOutCubic(progress);
      const newLng = startLng + (endLng - startLng) * easeInOutCubic(progress);
      
      // Adicionar pequenas variações para simular movimento real
      const variation = 0.0001;
      const latVariation = (Math.random() - 0.5) * variation;
      const lngVariation = (Math.random() - 0.5) * variation;
      
      const newLocation = {
        latitude: newLat + latVariation,
        longitude: newLng + lngVariation,
        address: progress < 0.3 ? 'Saindo do local' : 
                 progress < 0.7 ? 'Em trânsito' : 'Próximo ao destino'
      };
      
      // Calcular velocidade realista
      const speed = progress < 0.1 ? baseSpeed * 0.7 :
                   progress > 0.9 ? baseSpeed * 0.5 :
                   baseSpeed + (Math.random() * 10 - 5);
      
      // Calcular direção
      const heading = calculateHeading(
        { latitude: startLat, longitude: startLng },
        { latitude: newLat, longitude: newLng }
      );
      
      const vehicleLocation: VehicleLocation = {
        vehicleId: `vehicle_${service.id}`,
        location: newLocation,
        speed: Math.max(0, speed),
        heading,
        timestamp: Date.now(),
        status: progress > 0.95 ? 'ARRIVED' as any :
                progress > 0.8 ? 'APPROACHING' as any :
                'EN_ROUTE' as any
      };
      
      const remainingDistance = totalDistance * (1 - progress);
      const remainingTime = Math.max(1, Math.floor(remainingDistance / (speed / 3.6) / 60));
      
      const routeUpdate: RouteUpdate = {
        vehicleLocation,
        remainingDistance,
        estimatedArrival: remainingTime,
        nextInstruction: {
          instruction: generateInstruction(progress, remainingDistance),
          distance: remainingDistance,
          duration: remainingTime,
          location: newLocation
        }
      };
      
      set({
        vehicleLocation,
        routeUpdate
      });
      
    }, 800); // Atualizar a cada 800ms
  }
}));

// Funções auxiliares
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function calculateHeading(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const deltaLng = (to.longitude - from.longitude) * Math.PI / 180;
  
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

function generateInstruction(progress: number, remainingDistance: number): string {
  if (remainingDistance < 0.1) return 'Você chegou ao destino';
  if (remainingDistance < 0.3) return 'Próximo ao destino';
  if (progress < 0.1) return 'Saindo do local de partida';
  if (progress < 0.2) return 'Siga em frente';
  if (progress < 0.3) return 'Continue reto pela avenida';
  if (progress < 0.4) return 'Mantenha-se na faixa da direita';
  if (progress < 0.5) return 'Vire à direita na próxima rua';
  if (progress < 0.6) return 'Siga em frente';
  if (progress < 0.7) return 'Continue reto';
  if (progress < 0.8) return 'Mantenha-se na rota';
  if (progress < 0.9) return 'Próximo ao destino, reduza a velocidade';
  return 'Chegando ao destino';
}
