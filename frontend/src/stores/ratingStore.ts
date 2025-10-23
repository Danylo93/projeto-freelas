import { create } from 'zustand';
import { ServiceRating, RatingCategory, RatingRequest, RatingResponse, Service } from '../types';

interface RatingState {
  categories: RatingCategory[];
  ratingHistory: ServiceRating[];
  isSubmitting: boolean;
  error: string | null;
}

interface RatingActions {
  loadCategories: () => Promise<void>;
  submitRating: (request: RatingRequest) => Promise<RatingResponse>;
  getRatingHistory: () => Promise<ServiceRating[]>;
  clearError: () => void;
}

type RatingStore = RatingState & RatingActions;

export const useRatingStore = create<RatingStore>((set, get) => ({
  // State
  categories: [],
  ratingHistory: [],
  isSubmitting: false,
  error: null,

  // Actions
  loadCategories: async (): Promise<void> => {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const categories: RatingCategory[] = [
        // Categorias positivas
        {
          id: 'punctual',
          name: 'Pontual',
          description: 'Chegou no horário',
          isPositive: true
        },
        {
          id: 'friendly',
          name: 'Educado',
          description: 'Muito educado e simpático',
          isPositive: true
        },
        {
          id: 'clean_vehicle',
          name: 'Veículo limpo',
          description: 'Carro limpo e organizado',
          isPositive: true
        },
        {
          id: 'safe_driving',
          name: 'Dirigiu com segurança',
          description: 'Condução segura e responsável',
          isPositive: true
        },
        {
          id: 'good_route',
          name: 'Rota otimizada',
          description: 'Escolheu a melhor rota',
          isPositive: true
        },
        // Categorias negativas
        {
          id: 'late',
          name: 'Atrasado',
          description: 'Chegou atrasado',
          isPositive: false
        },
        {
          id: 'rude',
          name: 'Mal educado',
          description: 'Foi grosseiro ou mal educado',
          isPositive: false
        },
        {
          id: 'dirty_vehicle',
          name: 'Veículo sujo',
          description: 'Carro sujo ou desorganizado',
          isPositive: false
        },
        {
          id: 'unsafe_driving',
          name: 'Dirigiu perigosamente',
          description: 'Condução perigosa ou imprudente',
          isPositive: false
        },
        {
          id: 'bad_route',
          name: 'Rota ruim',
          description: 'Escolheu uma rota ruim',
          isPositive: false
        }
      ];
      
      set({ categories });
      
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  },

  submitRating: async (request: RatingRequest): Promise<RatingResponse> => {
    set({ isSubmitting: true, error: null });
    
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { categories } = get();
      const selectedCategories = categories.filter(cat => 
        request.categoryIds.includes(cat.id)
      );
      
      const rating: ServiceRating = {
        id: `rating_${Date.now()}`,
        serviceId: request.serviceId,
        clientId: 'current_user_id',
        providerId: 'provider_001',
        rating: request.rating,
        comment: request.comment,
        categories: selectedCategories,
        createdAt: new Date(),
        isCompleted: true
      };
      
      // Adicionar ao histórico
      set(state => ({
        ratingHistory: [rating, ...state.ratingHistory],
        isSubmitting: false,
        error: null
      }));
      
      return {
        ratingId: rating.id,
        success: true,
        message: 'Avaliação enviada com sucesso!'
      };
      
    } catch (error) {
      const errorMessage = 'Erro ao enviar avaliação';
      set({ 
        isSubmitting: false, 
        error: errorMessage
      });
      return {
        ratingId: '',
        success: false,
        message: errorMessage
      };
    }
  },

  getRatingHistory: async (): Promise<ServiceRating[]> => {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { ratingHistory } = get();
      return ratingHistory;
      
    } catch (error) {
      console.error('Erro ao carregar histórico de avaliações:', error);
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
