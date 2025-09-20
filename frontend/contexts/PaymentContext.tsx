import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'money';
  name: string;
  details: string;
  isDefault: boolean;
}

interface PaymentContextData {
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  processPayment: (amount: number, methodId: string) => Promise<boolean>;
  isProcessing: boolean;
}

const PaymentContext = createContext<PaymentContextData>({} as PaymentContextData);

export function usePayment(): PaymentContextData {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment deve ser usado dentro de um PaymentProvider');
  }
  return context;
}

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'money',
      name: 'Dinheiro',
      details: 'Pagamento em espécie',
      isDefault: true,
    },
    {
      id: '2',
      type: 'pix',
      name: 'PIX',
      details: 'Pagamento instantâneo',
      isDefault: false,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
    };

    setPaymentMethods(prev => {
      // Se é o primeiro método ou foi marcado como padrão, desmarcar outros
      if (newMethod.isDefault || prev.length === 0) {
        return [
          newMethod,
          ...prev.map(m => ({ ...m, isDefault: false }))
        ];
      }
      return [newMethod, ...prev];
    });
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => {
      const filtered = prev.filter(method => method.id !== id);
      
      // Se removeu o método padrão, marcar o primeiro como padrão
      const removedWasDefault = prev.find(m => m.id === id)?.isDefault;
      if (removedWasDefault && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      
      return filtered;
    });
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const processPayment = async (amount: number, methodId: string): Promise<boolean> => {
    try {
      setIsProcessing(true);

      const method = paymentMethods.find(m => m.id === methodId);
      if (!method) {
        Alert.alert('Erro', 'Método de pagamento não encontrado');
        return false;
      }

      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (method.type) {
        case 'card':
          // TODO: Integrar com Stripe ou outro processador de cartão
          console.log(`Processando pagamento de R$ ${amount} no cartão`);
          break;
        
        case 'pix':
          // TODO: Integrar com sistema PIX
          console.log(`Processando pagamento de R$ ${amount} via PIX`);
          break;
        
        case 'money':
          // Pagamento em dinheiro - apenas registrar
          console.log(`Pagamento de R$ ${amount} em dinheiro registrado`);
          break;
      }

      Alert.alert('Sucesso', `Pagamento de R$ ${amount.toFixed(2)} processado com sucesso!`);
      return true;

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      Alert.alert('Erro', 'Não foi possível processar o pagamento');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        processPayment,
        isProcessing,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}