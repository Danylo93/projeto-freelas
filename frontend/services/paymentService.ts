import axios from 'axios';
import { REQUESTS_API_URL } from '@/utils/config';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'bank_transfer';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
  created_at: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  payment_method?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  payment_method_type: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentIntentRequest {
  request_id: string;
  amount: number;
  currency?: string;
  payment_method_types?: string[];
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
  payment_method_id?: string;
  return_url?: string;
}

class PaymentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getPaymentApiUrl() {
    return REQUESTS_API_URL.replace('/requests', '/payments');
  }

  /**
   * Criar um Payment Intent para processar pagamento
   */
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    try {
      console.log('💳 [PAYMENT] Criando Payment Intent:', data);
      
      const response = await axios.post(
        `${this.getPaymentApiUrl()}/payment-intents`,
        {
          ...data,
          currency: data.currency || 'brl',
          payment_method_types: data.payment_method_types || ['card', 'pix'],
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Payment Intent criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao criar Payment Intent:', error);
      throw error;
    }
  }

  /**
   * Confirmar um pagamento
   */
  async confirmPayment(data: ConfirmPaymentRequest): Promise<PaymentIntent> {
    try {
      console.log('💳 [PAYMENT] Confirmando pagamento:', data);
      
      const response = await axios.post(
        `${this.getPaymentApiUrl()}/payment-intents/${data.payment_intent_id}/confirm`,
        {
          payment_method: data.payment_method_id,
          return_url: data.return_url,
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Pagamento confirmado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  /**
   * Buscar métodos de pagamento do usuário
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(
        `${this.getPaymentApiUrl()}/payment-methods`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao buscar métodos de pagamento:', error);
      return [];
    }
  }

  /**
   * Adicionar novo método de pagamento
   */
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      console.log('💳 [PAYMENT] Adicionando método de pagamento:', paymentMethodId);
      
      const response = await axios.post(
        `${this.getPaymentApiUrl()}/payment-methods`,
        { payment_method_id: paymentMethodId },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Método de pagamento adicionado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao adicionar método de pagamento:', error);
      throw error;
    }
  }

  /**
   * Remover método de pagamento
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Removendo método de pagamento:', paymentMethodId);
      
      await axios.delete(
        `${this.getPaymentApiUrl()}/payment-methods/${paymentMethodId}`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Método de pagamento removido');
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao remover método de pagamento:', error);
      throw error;
    }
  }

  /**
   * Definir método de pagamento padrão
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Definindo método padrão:', paymentMethodId);
      
      await axios.patch(
        `${this.getPaymentApiUrl()}/payment-methods/${paymentMethodId}/default`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Método padrão definido');
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao definir método padrão:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico de transações
   */
  async getTransactions(limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    try {
      const response = await axios.get(
        `${this.getPaymentApiUrl()}/transactions?limit=${limit}&offset=${offset}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao buscar transações:', error);
      return [];
    }
  }

  /**
   * Buscar transação específica
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const response = await axios.get(
        `${this.getPaymentApiUrl()}/transactions/${transactionId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao buscar transação:', error);
      return null;
    }
  }

  /**
   * Cancelar pagamento
   */
  async cancelPayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      console.log('💳 [PAYMENT] Cancelando pagamento:', paymentIntentId);
      
      const response = await axios.post(
        `${this.getPaymentApiUrl()}/payment-intents/${paymentIntentId}/cancel`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Pagamento cancelado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao cancelar pagamento:', error);
      throw error;
    }
  }

  /**
   * Solicitar reembolso
   */
  async requestRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<any> {
    try {
      console.log('💳 [PAYMENT] Solicitando reembolso:', { paymentIntentId, amount, reason });
      
      const response = await axios.post(
        `${this.getPaymentApiUrl()}/refunds`,
        {
          payment_intent_id: paymentIntentId,
          amount,
          reason,
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [PAYMENT] Reembolso solicitado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao solicitar reembolso:', error);
      throw error;
    }
  }

  /**
   * Formatar valor monetário
   */
  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe usa centavos
  }

  /**
   * Converter valor para centavos (formato Stripe)
   */
  toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Converter centavos para valor real
   */
  fromCents(amount: number): number {
    return amount / 100;
  }
}

export const paymentService = new PaymentService();
