import { create } from 'zustand';
import { PaymentMethod, PaymentMethodType, Payment, PaymentStatus, Service } from '../types';

interface PaymentState {
  availableMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  paymentHistory: Payment[];
  isProcessing: boolean;
  error: string | null;
}

interface PaymentActions {
  loadPaymentMethods: () => Promise<void>;
  selectPaymentMethod: (methodId: string) => void;
  processPayment: (service: Service, amount: number) => Promise<Payment>;
  getPaymentHistory: () => Promise<Payment[]>;
  clearError: () => void;
  resetPayment: () => void;
}

type PaymentStore = PaymentState & PaymentActions;

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  // State
  availableMethods: [],
  selectedMethod: null,
  paymentHistory: [],
  isProcessing: false,
  error: null,

  // Actions
  loadPaymentMethods: async (): Promise<void> => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const methods: PaymentMethod[] = [
        {
          id: '1',
          type: PaymentMethodType.PIX,
          name: 'PIX',
          description: 'Pagamento instantâneo',
          icon: 'pix',
          isDefault: true,
          isActive: true
        },
        {
          id: '2',
          type: PaymentMethodType.CREDIT_CARD,
          name: 'Cartão de Crédito',
          description: 'Visa, Mastercard, Elo',
          icon: 'credit-card',
          isDefault: false,
          isActive: true
        },
        {
          id: '3',
          type: PaymentMethodType.DEBIT_CARD,
          name: 'Cartão de Débito',
          description: 'Débito em conta',
          icon: 'debit-card',
          isDefault: false,
          isActive: true
        },
        {
          id: '4',
          type: PaymentMethodType.CASH,
          name: 'Dinheiro',
          description: 'Pagamento em dinheiro',
          icon: 'cash',
          isDefault: false,
          isActive: true
        }
      ];
      
      set({
        availableMethods: methods,
        selectedMethod: methods.find(m => m.isDefault) || methods[0],
        isProcessing: false,
        error: null
      });
      
    } catch (error) {
      const errorMessage = 'Erro ao carregar métodos de pagamento';
      set({ 
        isProcessing: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  selectPaymentMethod: (methodId: string) => {
    const { availableMethods } = get();
    const method = availableMethods.find(m => m.id === methodId);
    
    if (method) {
      set({ selectedMethod: method });
    }
  },

  processPayment: async (service: Service, amount: number): Promise<Payment> => {
    set({ isProcessing: true, error: null });
    
    try {
      const { selectedMethod } = get();
      
      if (!selectedMethod) {
        throw new Error('Método de pagamento não selecionado');
      }
      
      // Simular delay baseado no tipo de pagamento
      const delay = selectedMethod.type === PaymentMethodType.PIX ? 300 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simular falha ocasional (5% de chance)
      if (Math.random() < 0.05) {
        throw new Error('Falha no processamento do pagamento');
      }
      
      const payment: Payment = {
        id: `payment_${Date.now()}`,
        serviceId: service.id,
        amount,
        paymentMethodId: selectedMethod.id,
        status: PaymentStatus.COMPLETED,
        transactionId: `txn_${Date.now()}`,
        createdAt: new Date(),
        completedAt: new Date()
      };
      
      // Adicionar ao histórico
      set(state => ({
        paymentHistory: [payment, ...state.paymentHistory],
        isProcessing: false,
        error: null
      }));
      
      return payment;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      set({ 
        isProcessing: false, 
        error: errorMessage
      });
      throw error;
    }
  },

  getPaymentHistory: async (): Promise<Payment[]> => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock de histórico de pagamentos
      const mockHistory: Payment[] = [
        {
          id: '1',
          serviceId: 'service_1',
          amount: 18.50,
          paymentMethodId: '1',
          status: PaymentStatus.COMPLETED,
          transactionId: 'txn_123456',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          serviceId: 'service_2',
          amount: 25.00,
          paymentMethodId: '2',
          status: PaymentStatus.COMPLETED,
          transactionId: 'txn_123457',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];
      
      set({
        paymentHistory: mockHistory,
        isProcessing: false,
        error: null
      });
      
      return mockHistory;
      
    } catch (error) {
      const errorMessage = 'Erro ao carregar histórico de pagamentos';
      set({ 
        isProcessing: false, 
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  resetPayment: () => {
    set({
      selectedMethod: null,
      isProcessing: false,
      error: null
    });
  }
}));
