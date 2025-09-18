import axios from 'axios';
import { REQUESTS_API_URL } from '@/utils/config';

export interface Rating {
  id: string;
  request_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface RatingData {
  request_id: string;
  rating: number;
  comment?: string;
}

export interface UserRating {
  user_id: string;
  user_name: string;
  user_type: 'client' | 'provider';
  average_rating: number;
  total_ratings: number;
  recent_ratings: Rating[];
}

class RatingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Criar uma nova avaliação
   */
  async createRating(ratingData: RatingData): Promise<Rating> {
    try {
      console.log('⭐ [RATING] Enviando avaliação:', ratingData);
      
      const response = await axios.post(
        `${REQUESTS_API_URL.replace('/requests', '')}/ratings`,
        ratingData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [RATING] Avaliação criada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [RATING] Erro ao criar avaliação:', error);
      throw error;
    }
  }

  /**
   * Buscar avaliações de um usuário específico
   */
  async getUserRatings(userId: string, userType: 'client' | 'provider'): Promise<Rating[]> {
    try {
      const field = userType === 'client' ? 'client_id' : 'provider_id';
      const response = await axios.get(
        `${REQUESTS_API_URL.replace('/requests', '')}/ratings?${field}=${userId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [RATING] Erro ao buscar avaliações:', error);
      return [];
    }
  }

  /**
   * Buscar avaliação de uma solicitação específica
   */
  async getRequestRating(requestId: string): Promise<Rating | null> {
    try {
      const response = await axios.get(
        `${REQUESTS_API_URL.replace('/requests', '')}/ratings?request_id=${requestId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('❌ [RATING] Erro ao buscar avaliação da solicitação:', error);
      return null;
    }
  }

  /**
   * Calcular estatísticas de avaliação de um usuário
   */
  async getUserRatingStats(userId: string, userType: 'client' | 'provider'): Promise<{
    average: number;
    total: number;
    distribution: { [key: number]: number };
  }> {
    try {
      const ratings = await this.getUserRatings(userId, userType);
      
      if (ratings.length === 0) {
        return { average: 0, total: 0, distribution: {} };
      }

      const total = ratings.length;
      const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      const average = sum / total;

      // Distribuição por estrelas
      const distribution: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        distribution[i] = ratings.filter(r => r.rating === i).length;
      }

      return { average: Math.round(average * 10) / 10, total, distribution };
    } catch (error) {
      console.error('❌ [RATING] Erro ao calcular estatísticas:', error);
      return { average: 0, total: 0, distribution: {} };
    }
  }

  /**
   * Verificar se uma solicitação já foi avaliada
   */
  async isRequestRated(requestId: string): Promise<boolean> {
    try {
      const rating = await this.getRequestRating(requestId);
      return rating !== null;
    } catch (error) {
      console.error('❌ [RATING] Erro ao verificar avaliação:', error);
      return false;
    }
  }

  /**
   * Buscar avaliações recentes de um prestador (para exibir no perfil)
   */
  async getProviderRecentRatings(providerId: string, limit: number = 5): Promise<Rating[]> {
    try {
      const response = await axios.get(
        `${REQUESTS_API_URL.replace('/requests', '')}/ratings?provider_id=${providerId}&limit=${limit}&sort=created_at:desc`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [RATING] Erro ao buscar avaliações recentes:', error);
      return [];
    }
  }
}

export const ratingService = new RatingService();
