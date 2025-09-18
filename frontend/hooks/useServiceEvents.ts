import { useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceRequest {
  request_id: string;
  client_name: string;
  category: string;
  description?: string;
  price: number;
  distance: number;
  client_address: string;
  client_latitude: number;
  client_longitude: number;
}

interface ServiceEventHandlers {
  onNewRequest?: (request: ServiceRequest) => void;
  onRequestAccepted?: (data: any) => void;
  onStatusUpdated?: (data: any) => void;
  onLocationUpdated?: (data: any) => void;
  onShowDetails?: (data: ServiceRequest) => void;
}

export const useServiceEvents = (handlers: ServiceEventHandlers) => {
  const { user } = useAuth();

  const handleNewRequest = useCallback((data: ServiceRequest) => {
    if (user?.user_type === 1) {
      if (handlers.onShowDetails) {
        handlers.onShowDetails(data);
      } else if (handlers.onNewRequest) {
        handlers.onNewRequest(data);
      }
    }
  }, [user?.user_type, handlers]);

  const handleRequestAccepted = useCallback((data: any) => {
    if (user?.user_type === 2 && handlers.onRequestAccepted) {
      handlers.onRequestAccepted(data);
    }
  }, [user, handlers.onRequestAccepted]);

  const handleStatusUpdated = useCallback((data: any) => {
    if (handlers.onStatusUpdated) {
      handlers.onStatusUpdated(data);
    }
  }, [handlers.onStatusUpdated]);

  const handleLocationUpdated = useCallback((data: any) => {
    if (handlers.onLocationUpdated) {
      handlers.onLocationUpdated(data);
    }
  }, [handlers.onLocationUpdated]);

  useEffect(() => {
    // Adicionar listeners para eventos usando DeviceEventEmitter (React Native)
    const newRequestListener = DeviceEventEmitter.addListener('new-request', handleNewRequest);
    const requestAcceptedListener = DeviceEventEmitter.addListener('request-accepted', handleRequestAccepted);
    const statusUpdatedListener = DeviceEventEmitter.addListener('status-updated', handleStatusUpdated);
    const locationUpdatedListener = DeviceEventEmitter.addListener('location-updated', handleLocationUpdated);

    return () => {
      // Cleanup listeners
      newRequestListener.remove();
      requestAcceptedListener.remove();
      statusUpdatedListener.remove();
      locationUpdatedListener.remove();
    };
  }, [handleNewRequest, handleRequestAccepted, handleStatusUpdated, handleLocationUpdated]);

  // Funções de utilidade removidas - agora usa eventos reais do Socket.IO
  return {};
};
