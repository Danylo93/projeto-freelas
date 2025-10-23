import { create } from 'zustand';
import { Service, ServiceStatus, ServiceCategory, Location } from '../types';

interface ServiceState {
  currentService: Service | null;
  serviceHistory: Service[];
  availableCategories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
}

interface ServiceActions {
  createService: (category: ServiceCategory, location: Location, destination?: Location) => Promise<Service>;
  updateService: (serviceId: string, updates: Partial<Service>) => Promise<void>;
  cancelService: (serviceId: string) => Promise<void>;
  completeService: (serviceId: string) => Promise<void>;
  getServiceHistory: () => Promise<Service[]>;
  loadCategories: () => Promise<void>;
  clearError: () => void;
  setCurrentService: (service: Service | null) => void;
}

type ServiceStore = ServiceState & ServiceActions;

export const useServiceStore = create<ServiceStore>((set, get) => ({
  // State
  currentService: null,
  serviceHistory: [],
  availableCategories: [],
  isLoading: false,
  error: null,

  // Actions
  createService: async (category: ServiceCategory, location: Location, destination?: Location): Promise<Service> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let distance = 0;
      let estimatedTime = 0;
      let price = category.basePrice;
      
      // Calcular distância e tempo se destino for fornecido
      if (destination) {
        console.log('Calculando direções entre:', location, 'e', destination);
        
        const { GeocodingService } = await import('../services/geocodingService');
        const directions = await GeocodingService.getDirections(
          { lat: location.latitude, lng: location.longitude },
          { lat: destination.latitude, lng: destination.longitude }
        );
        
        console.log('Direções calculadas:', directions);
        
        if (directions) {
          distance = directions.distanceValue / 1000; // converter para km
          estimatedTime = Math.round(directions.durationValue / 60); // converter para minutos
          price = GeocodingService.calculatePrice(distance, category.basePrice);
          
          console.log('Valores calculados:', {
            distance,
            estimatedTime,
            price,
            basePrice: category.basePrice
          });
        } else {
          console.log('Usando valores padrão para simulação');
          // Usar valores padrão se não conseguir calcular
          distance = 5.0; // 5km padrão
          estimatedTime = 15; // 15 min padrão
          price = GeocodingService.calculatePrice(distance, category.basePrice);
        }
      }
      
      const newService: Service = {
        id: `service_${Date.now()}`,
        clientId: 'current_user_id', // Será substituído pelo ID real do usuário
        category,
        location,
        destination,
        price,
        distance,
        estimatedTime,
        status: ServiceStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set({
        currentService: newService,
        isLoading: false,
        error: null
      });
      
      return newService;
      
    } catch (error) {
      const errorMessage = 'Erro ao criar serviço';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  updateService: async (serviceId: string, updates: Partial<Service>): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { currentService } = get();
      
      if (currentService && currentService.id === serviceId) {
        const updatedService = { ...currentService, ...updates, updatedAt: new Date() };
        set({ currentService: updatedService });
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      const errorMessage = 'Erro ao atualizar serviço';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  cancelService: async (serviceId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await get().updateService(serviceId, { 
        status: ServiceStatus.CANCELLED,
        updatedAt: new Date()
      });
      
      set({ 
        currentService: null,
        isLoading: false
      });
      
    } catch (error) {
      const errorMessage = 'Erro ao cancelar serviço';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  completeService: async (serviceId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await get().updateService(serviceId, { 
        status: ServiceStatus.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date()
      });
      
      set({ isLoading: false });
      
    } catch (error) {
      const errorMessage = 'Erro ao completar serviço';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  getServiceHistory: async (): Promise<Service[]> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de histórico
      const mockHistory: Service[] = [
        {
          id: '1',
          clientId: 'current_user_id',
          category: get().availableCategories[0] || {
            id: '1',
            name: 'freelas_pop',
            displayName: 'Freelas Pop',
            description: 'Serviço básico',
            icon: 'car',
            basePrice: 15.0,
            isActive: true
          },
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'Av. Paulista, 1000'
          },
          destination: {
            latitude: -23.5515,
            longitude: -46.6343,
            address: 'Rua Augusta, 500'
          },
          price: 18.50,
          distance: 2.5,
          estimatedTime: 15,
          status: ServiceStatus.COMPLETED,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          rating: 5
        }
      ];
      
      set({
        serviceHistory: mockHistory,
        isLoading: false,
        error: null
      });
      
      return mockHistory;
      
    } catch (error) {
      const errorMessage = 'Erro ao carregar histórico';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  loadCategories: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const categories: ServiceCategory[] = [
        {
          id: '1',
          name: 'freelas_pop',
          displayName: 'Freelas Pop',
          description: 'Serviço básico e econômico',
          icon: 'car',
          basePrice: 15.0,
          isActive: true
        },
        {
          id: '2',
          name: 'freelas_comfort',
          displayName: 'Freelas Comfort',
          description: 'Serviço confortável',
          icon: 'car',
          basePrice: 25.0,
          isActive: true
        },
        {
          id: '3',
          name: 'freelas_premium',
          displayName: 'Freelas Premium',
          description: 'Serviço premium',
          icon: 'car',
          basePrice: 35.0,
          isActive: true
        }
      ];
      
      set({
        availableCategories: categories,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      const errorMessage = 'Erro ao carregar categorias';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentService: (service: Service | null) => {
    set({ currentService: service });
  }
}));
