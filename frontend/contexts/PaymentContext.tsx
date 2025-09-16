import React, { createContext, useContext, useMemo } from 'react';
import { StripeProvider, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import axios from 'axios';
import { STRIPE_PUBLISHABLE_KEY, PAYMENTS_API_URL } from '@/utils/config';

interface PaymentContextType {
  startPayment: (amountInCents: number, metadata?: Record<string, any>) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const startPayment = async (amountInCents: number, metadata?: Record<string, any>) => {
    if (!PAYMENTS_API_URL) {
      console.warn('Payments API URL not configured.');
      return false;
    }
    try {
      const response = await axios.post(`${PAYMENTS_API_URL}/create-intent`, {
        amount: amountInCents,
        currency: 'brl',
        metadata,
      });
      const clientSecret = response.data?.clientSecret;
      if (!clientSecret) return false;

      const initResult = await initPaymentSheet({ paymentIntentClientSecret: clientSecret });
      if (initResult.error) {
        console.error('initPaymentSheet error', initResult.error);
        return false;
      }
      const present = await presentPaymentSheet();
      if (present.error) {
        console.error('presentPaymentSheet error', present.error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('startPayment error', e);
      return false;
    }
  };

  const value = useMemo<PaymentContextType>(() => ({ startPayment }), []);

  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
    </StripeProvider>
  );
};


