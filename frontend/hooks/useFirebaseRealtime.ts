import { useFirebaseRealtime } from '../contexts/FirebaseRealtimeContext';
import { useEffect, useRef } from 'react';

export const useRealtimeRequest = (requestId: string | null, callback: (data: any) => void) => {
  const { subscribeToRequest } = useFirebaseRealtime();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!requestId) return;

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to new request
    unsubscribeRef.current = subscribeToRequest(requestId, callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [requestId, subscribeToRequest, callback]);
};

export const useRealtimeProviderLocation = (providerId: string | null, callback: (data: any) => void) => {
  const { subscribeToProviderLocation } = useFirebaseRealtime();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!providerId) return;

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to provider location
    unsubscribeRef.current = subscribeToProviderLocation(providerId, callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [providerId, subscribeToProviderLocation, callback]);
};

export const useRealtimeOffers = (providerId: string | null, callback: (data: any) => void) => {
  const { subscribeToOffers } = useFirebaseRealtime();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!providerId) return;

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to offers
    unsubscribeRef.current = subscribeToOffers(providerId, callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [providerId, subscribeToOffers, callback]);
};
