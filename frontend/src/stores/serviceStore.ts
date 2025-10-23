import { create } from 'zustand';
import { Service, ServiceStatus, ServiceCategory, Location } from '../types';

interface ServiceState {
  currentService: Service | null;
  serviceHistory: Service[];
  completedServices: Service[];
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
  loadCompletedServices: () => Promise<void>;
  loadCategories: () => Promise<void>;
  clearError: () => void;
  setCurrentService: (service: Service | null) => void;
}

type ServiceStore = ServiceState & ServiceActions;

export const useServiceStore = create<ServiceStore>((set, get) => ({
  // State
  currentService: null,
  serviceHistory: [],
  completedServices: [],
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
          // Calcular preço: valor fixo da categoria + (distância × R$ 2,50) + taxa de serviço
          price = category.basePrice + (distance * 2.50) + 5.00;
          
          console.log('Valores calculados:', {
            distance,
            estimatedTime,
            price,
            basePrice: category.basePrice,
            distancePrice: distance * 2.50
          });
        } else {
          console.log('Usando valores padrão para simulação');
          // Usar valores padrão se não conseguir calcular
          distance = 5.0; // 5km padrão
          estimatedTime = 15; // 15 min padrão
          price = category.basePrice + (distance * 2.50) + 5.00;
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
          name: 'manutencao',
          displayName: 'Manutenção',
          description: 'Serviços de manutenção geral',
          icon: 'wrench',
          basePrice: 120.0, // R$ 120,00 fixo + R$ 2,50/km
          isActive: true
        },
        {
          id: '2',
          name: 'limpeza',
          displayName: 'Limpeza',
          description: 'Serviços de limpeza',
          icon: 'sparkles',
          basePrice: 80.0, // R$ 80,00 fixo + R$ 2,50/km
          isActive: true
        },
        {
          id: '3',
          name: 'reparo',
          displayName: 'Reparo',
          description: 'Serviços de reparo',
          icon: 'hammer',
          basePrice: 150.0, // R$ 150,00 fixo + R$ 2,50/km
          isActive: true
        },
        {
          id: '4',
          name: 'instalacao',
          displayName: 'Instalação',
          description: 'Serviços de instalação',
          icon: 'car',
          basePrice: 200.0, // R$ 200,00 fixo + R$ 2,50/km
          isActive: true
        },
        {
          id: '5',
          name: 'consultoria',
          displayName: 'Consultoria',
          description: 'Serviços de consultoria técnica',
          icon: 'lightbulb',
          basePrice: 100.0, // R$ 100,00 fixo + R$ 2,50/km
          isActive: true
        },
        {
          id: '6',
          name: 'emergencia',
          displayName: 'Emergência',
          description: 'Serviços de emergência 24h',
          icon: 'alert',
          basePrice: 300.0, // R$ 300,00 fixo + R$ 2,50/km
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
  },

  loadCompletedServices: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dados simulados de serviços completados
      const mockCompletedServices: Service[] = [
        {
          id: 'service_1',
          clientId: 'current_user_id',
          category: {
            id: '1',
            name: 'manutencao',
            displayName: 'Manutenção',
            description: 'Serviços de manutenção geral',
            icon: 'wrench',
            basePrice: 25.0,
            isActive: true
          },
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'Rua das Flores, 123 - São Paulo, SP'
          },
          destination: {
            latitude: -23.5515,
            longitude: -46.6343,
            address: 'Av. Paulista, 1000 - São Paulo, SP'
          },
          price: 125.75, // R$ 120,00 + (2,3km × R$ 2,50) + R$ 5,00
          distance: 2.3,
          estimatedTime: 25,
          status: ServiceStatus.COMPLETED,
          createdAt: new Date('2024-01-15T10:30:00'),
          updatedAt: new Date('2024-01-15T11:00:00'),
          rating: 5
        },
        {
          id: 'service_2',
          clientId: 'current_user_id',
          category: {
            id: '2',
            name: 'limpeza',
            displayName: 'Limpeza',
            description: 'Serviços de limpeza',
            icon: 'sparkles',
            basePrice: 20.0,
            isActive: true
          },
          location: {
            latitude: -23.5605,
            longitude: -46.6433,
            address: 'Rua Augusta, 456 - São Paulo, SP'
          },
          destination: {
            latitude: -23.5515,
            longitude: -46.6343,
            address: 'Av. Paulista, 1000 - São Paulo, SP'
          },
          price: 89.50, // R$ 80,00 + (1,8km × R$ 2,50) + R$ 5,00
          distance: 1.8,
          estimatedTime: 20,
          status: ServiceStatus.COMPLETED,
          createdAt: new Date('2024-01-10T14:15:00'),
          updatedAt: new Date('2024-01-10T14:45:00'),
          rating: 4
        },
        {
          id: 'service_3',
          clientId: 'current_user_id',
          category: {
            id: '3',
            name: 'reparo',
            displayName: 'Reparo',
            description: 'Serviços de reparo',
            icon: 'hammer',
            basePrice: 30.0,
            isActive: true
          },
          location: {
            latitude: -23.5705,
            longitude: -46.6533,
            address: 'Rua Consolação, 789 - São Paulo, SP'
          },
          destination: {
            latitude: -23.5515,
            longitude: -46.6343,
            address: 'Av. Paulista, 1000 - São Paulo, SP'
          },
          price: 163.00, // R$ 150,00 + (3,2km × R$ 2,50) + R$ 5,00
          distance: 3.2,
          estimatedTime: 35,
          status: ServiceStatus.CANCELLED,
          createdAt: new Date('2024-01-05T09:00:00'),
          updatedAt: new Date('2024-01-05T09:30:00')
        }
      ];
      
      set({
        completedServices: mockCompletedServices,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      const errorMessage = 'Erro ao carregar histórico';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }
}));
