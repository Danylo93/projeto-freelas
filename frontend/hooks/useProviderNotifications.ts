import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert, Vibration } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/SimpleSocketIOContext';
import { usePushNotifications } from '@/contexts/PushNotificationContext';

interface NotificationData {
  request_id: string;
  client_name: string;
  category: string;
  description?: string;
  price: number;
  distance?: number;
  client_address?: string;
  client_latitude: number;
  client_longitude: number;
}

interface UseProviderNotificationsProps {
  onNewRequest?: (data: NotificationData) => void;
  onRequestUpdate?: (data: any) => void;
}

export const useProviderNotifications = ({
  onNewRequest,
  onRequestUpdate,
}: UseProviderNotificationsProps) => {
  const { user } = useAuth();
  const { isConnected } = useRealtime();
  const { sendLocalNotification } = usePushNotifications();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Configurar listeners de notificação
  useEffect(() => {
    if (!user || user.user_type !== 1) return; // Só para prestadores

    // Listener para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [PROVIDER-NOTIFICATIONS] Notificação recebida:', notification);
      
      const { data } = notification.request;
      
      // Vibrar o dispositivo
      Vibration.vibrate([0, 250, 250, 250]);
      
      // Processar diferentes tipos de notificação
      switch (data?.type) {
        case 'new_request':
          console.log('🔔 [PROVIDER-NOTIFICATIONS] Nova solicitação via notificação');
          onNewRequest?.(data as NotificationData);
          break;
        case 'request_update':
          console.log('🔔 [PROVIDER-NOTIFICATIONS] Atualização de solicitação');
          onRequestUpdate?.(data);
          break;
        default:
          console.log('🔔 [PROVIDER-NOTIFICATIONS] Tipo não reconhecido:', data?.type);
      }
    });

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 [PROVIDER-NOTIFICATIONS] Notificação tocada:', response);
      
      const { data } = response.notification.request;
      
      // Navegar baseado no tipo
      switch (data?.type) {
        case 'new_request':
          console.log('Navegar para aceitar solicitação');
          // Aqui você pode usar navigation ou router
          break;
        case 'request_update':
          console.log('Navegar para mapa de serviço');
          break;
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, onNewRequest, onRequestUpdate]);

  // Função para enviar notificação de nova solicitação
  const sendNewRequestNotification = async (data: NotificationData) => {
    try {
      console.log('📱 [PROVIDER-NOTIFICATIONS] Enviando notificação de nova solicitação');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Nova Solicitação!',
          body: `${data.category} - R$ ${data.price.toFixed(2)}\nCliente: ${data.client_name}${data.distance ? `\nDistância: ${data.distance.toFixed(1)} km` : ''}`,
          data: {
            type: 'new_request',
            ...data,
          },
          sound: 'default',
          priority: Notifications.AndroidImportance.HIGH,
        },
        trigger: null, // Imediato
      });

      // Também mostrar Alert para garantir que o prestador veja
      Alert.alert(
        '🔔 Nova Solicitação!',
        `${data.category} - R$ ${data.price.toFixed(2)}\nCliente: ${data.client_name}${data.distance ? `\nDistância: ${data.distance.toFixed(1)} km` : ''}`,
        [
          { text: 'Ignorar', style: 'cancel' },
          { 
            text: 'Ver Detalhes', 
            onPress: () => {
              console.log('🔔 [PROVIDER-NOTIFICATIONS] Usuário quer ver detalhes');
              onNewRequest?.(data);
            }
          }
        ],
        { cancelable: false }
      );

      console.log('✅ [PROVIDER-NOTIFICATIONS] Notificação enviada com sucesso');
    } catch (error) {
      console.error('❌ [PROVIDER-NOTIFICATIONS] Erro ao enviar notificação:', error);
    }
  };

  // Função para enviar notificação de atualização
  const sendUpdateNotification = async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'request_update',
            ...data,
          },
          sound: 'default',
        },
        trigger: null,
      });

      console.log('✅ [PROVIDER-NOTIFICATIONS] Notificação de atualização enviada');
    } catch (error) {
      console.error('❌ [PROVIDER-NOTIFICATIONS] Erro ao enviar notificação de atualização:', error);
    }
  };

  return {
    sendNewRequestNotification,
    sendUpdateNotification,
    isConnected,
  };
};
