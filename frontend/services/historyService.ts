import axios from 'axios';
import { API_URL } from '@/utils/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ServiceHistoryItem {
  id: string;
  category: string;
  description: string;
  price: number;
  status: 'completed' | 'cancelled';
  client_id: string;
  provider_id: string;
  client_name: string;
  provider_name: string;
  client_address: string;
  provider_rating?: number;
  client_rating?: number;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
}

export interface HistoryFilters {
  status?: 'completed' | 'cancelled' | 'all';
  category?: string;
  date_from?: string;
  date_to?: string;
  min_price?: number;
  max_price?: number;
  search_query?: string;
  sort_by?: 'date' | 'price' | 'rating';
  sort_order?: 'asc' | 'desc';
}

export interface HistoryStats {
  total_services: number;
  completed_services: number;
  cancelled_services: number;
  total_earnings: number;
  average_rating: number;
  most_requested_category: string;
  this_month_services: number;
  this_month_earnings: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  filters?: HistoryFilters;
  include_details?: boolean;
}

class HistoryService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obter histórico de serviços com filtros
   */
  async getServiceHistory(
    filters: HistoryFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: ServiceHistoryItem[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    try {
      console.log('📋 [HISTORY] Obtendo histórico de serviços...');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      // Como não temos endpoint de histórico, vamos usar o endpoint de requests
      const response = await axios.get(
        `${API_URL}/requests?${params}`,
        { headers: await this.getAuthHeaders() }
      );

      // Transformar dados de requests em formato de histórico
      const requests = response.data || [];
      const historyItems = requests
        .filter((req: any) => ['completed', 'cancelled'].includes(req.status))
        .map((req: any) => ({
          id: req.id,
          category: req.category,
          description: req.description,
          price: req.price,
          status: req.status,
          client_id: req.client_id,
          provider_id: req.provider_id,
          client_name: 'Cliente', // Placeholder
          provider_name: 'Prestador', // Placeholder
          client_address: 'Endereço não disponível',
          created_at: req.created_at,
          completed_at: req.completed_at,
          cancelled_at: req.cancelled_at,
        }));

      const result = {
        items: historyItems,
        total: historyItems.length,
        page: page,
        total_pages: Math.ceil(historyItems.length / limit),
      };

      console.log('✅ [HISTORY] Histórico obtido com sucesso');
      return result;
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao obter histórico:', error);
      throw new Error('Não foi possível obter o histórico de serviços');
    }
  }

  /**
   * Obter estatísticas do histórico
   */
  async getHistoryStats(): Promise<HistoryStats> {
    try {
      console.log('📊 [HISTORY] Obtendo estatísticas do histórico...');

      // Obter todas as solicitações para calcular estatísticas
      const response = await axios.get(
        `${API_URL}/requests`,
        { headers: await this.getAuthHeaders() }
      );

      const requests = response.data || [];
      const completedRequests = requests.filter((req: any) => req.status === 'completed');
      const cancelledRequests = requests.filter((req: any) => req.status === 'cancelled');

      const stats: HistoryStats = {
        total_services: requests.length,
        completed_services: completedRequests.length,
        cancelled_services: cancelledRequests.length,
        total_earnings: completedRequests.reduce((sum: number, req: any) => sum + (req.price || 0), 0),
        average_rating: 4.5, // Placeholder
        most_requested_category: 'Eletricista', // Placeholder
        this_month_services: completedRequests.length,
        this_month_earnings: completedRequests.reduce((sum: number, req: any) => sum + (req.price || 0), 0),
      };

      console.log('✅ [HISTORY] Estatísticas obtidas com sucesso');
      return stats;
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao obter estatísticas:', error);
      throw new Error('Não foi possível obter as estatísticas');
    }
  }

  /**
   * Obter detalhes de um serviço específico
   */
  async getServiceDetails(serviceId: string): Promise<ServiceHistoryItem> {
    try {
      console.log('🔍 [HISTORY] Obtendo detalhes do serviço:', serviceId);

      const response = await axios.get(
        `${API_URL}/history/services/${serviceId}`,
        { headers: await this.getAuthHeaders() }
      );

      console.log('✅ [HISTORY] Detalhes obtidos com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao obter detalhes:', error);
      throw new Error('Não foi possível obter os detalhes do serviço');
    }
  }

  /**
   * Buscar serviços por texto
   */
  async searchServices(
    query: string,
    filters: HistoryFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: ServiceHistoryItem[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    try {
      console.log('🔍 [HISTORY] Buscando serviços:', query);

      const searchFilters = {
        ...filters,
        search_query: query,
      };

      return await this.getServiceHistory(searchFilters, page, limit);
    } catch (error) {
      console.error('❌ [HISTORY] Erro na busca:', error);
      throw new Error('Não foi possível realizar a busca');
    }
  }

  /**
   * Obter categorias disponíveis no histórico
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      console.log('📂 [HISTORY] Obtendo categorias disponíveis...');

      const response = await axios.get(
        `${API_URL}/history/categories`,
        { headers: await this.getAuthHeaders() }
      );

      console.log('✅ [HISTORY] Categorias obtidas com sucesso');
      return response.data.categories || [];
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao obter categorias:', error);
      throw new Error('Não foi possível obter as categorias');
    }
  }

  /**
   * Exportar histórico
   */
  async exportHistory(options: ExportOptions): Promise<string> {
    try {
      console.log('📤 [HISTORY] Exportando histórico...');

      const response = await axios.post(
        `${API_URL}/history/export`,
        options,
        {
          headers: await this.getAuthHeaders(),
          responseType: 'blob',
        }
      );

      // Salvar arquivo temporário
      const fileName = `historico_servicos_${Date.now()}.${options.format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Converter blob para base64 e salvar
      const base64 = await this.blobToBase64(response.data);
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ [HISTORY] Histórico exportado com sucesso');
      return fileUri;
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao exportar histórico:', error);
      throw new Error('Não foi possível exportar o histórico');
    }
  }

  /**
   * Compartilhar arquivo exportado
   */
  async shareExportedFile(fileUri: string): Promise<void> {
    try {
      console.log('📤 [HISTORY] Compartilhando arquivo...');

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Compartilhamento não disponível neste dispositivo');
      }

      await Sharing.shareAsync(fileUri);
      console.log('✅ [HISTORY] Arquivo compartilhado com sucesso');
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao compartilhar arquivo:', error);
      throw new Error('Não foi possível compartilhar o arquivo');
    }
  }

  /**
   * Adicionar nota a um serviço
   */
  async addServiceNote(serviceId: string, note: string): Promise<void> {
    try {
      console.log('📝 [HISTORY] Adicionando nota ao serviço:', serviceId);

      await axios.post(
        `${API_URL}/history/services/${serviceId}/notes`,
        { note },
        { headers: await this.getAuthHeaders() }
      );

      console.log('✅ [HISTORY] Nota adicionada com sucesso');
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao adicionar nota:', error);
      throw new Error('Não foi possível adicionar a nota');
    }
  }

  /**
   * Obter relatório mensal
   */
  async getMonthlyReport(year: number, month: number): Promise<{
    total_services: number;
    completed_services: number;
    cancelled_services: number;
    total_earnings: number;
    average_rating: number;
    daily_stats: Array<{
      date: string;
      services: number;
      earnings: number;
    }>;
    category_breakdown: Array<{
      category: string;
      count: number;
      earnings: number;
    }>;
  }> {
    try {
      console.log('📊 [HISTORY] Obtendo relatório mensal...');

      const response = await axios.get(
        `${API_URL}/history/reports/monthly?year=${year}&month=${month}`,
        { headers: await this.getAuthHeaders() }
      );

      console.log('✅ [HISTORY] Relatório mensal obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao obter relatório:', error);
      throw new Error('Não foi possível obter o relatório mensal');
    }
  }

  /**
   * Limpar cache do histórico
   */
  clearCache(): void {
    console.log('🧹 [HISTORY] Cache do histórico limpo');
    // Implementar limpeza de cache se necessário
  }

  /**
   * Converter blob para base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Formatar data para exibição
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formatar preço para exibição
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  /**
   * Obter cor do status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  }

  /**
   * Obter ícone do status
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  }
}

export const historyService = new HistoryService();

export default HistoryService;
