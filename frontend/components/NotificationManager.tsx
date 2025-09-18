import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';

// Configurar como as notificações são tratadas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationManagerProps {
  onNewRequest?: (data: any) => void;
  onRequestAccepted?: (data: any) => void;
  onStatusUpdate?: (data: any) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  onNewRequest,
  onRequestAccepted,
  onStatusUpdate,
}) => {
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const soundObject = useRef<Audio.Sound>();

  useEffect(() => {
    // Solicitar permissões de notificação
    registerForPushNotificationsAsync();

    // Carregar som personalizado
    loadNotificationSound();

    // Listener para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [NOTIFICATION] Notificação recebida:', notification);
      handleNotificationReceived(notification);
    });

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 [NOTIFICATION] Notificação tocada:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Para receber notificações de novas solicitações, é necessário permitir notificações.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Configurar canal de notificação no Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('service-requests', {
          name: 'Solicitações de Serviço',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'notification_sound.wav', // Som personalizado
        });
      }

      console.log('✅ [NOTIFICATION] Permissões concedidas');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao solicitar permissões:', error);
    }
  };

  const loadNotificationSound = async () => {
    try {
      // Carregar som personalizado (você pode adicionar um arquivo de som aos assets)
      // soundObject.current = new Audio.Sound();
      // await soundObject.current.loadAsync(require('@/assets/sounds/notification.mp3'));
      console.log('🔊 [NOTIFICATION] Som carregado');
    } catch (error) {
      console.log('⚠️ [NOTIFICATION] Erro ao carregar som:', error);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    const { data, request } = notification;
    const { content } = request;

    // Vibrar o dispositivo
    Vibration.vibrate([0, 250, 250, 250]);

    // Tocar som personalizado se disponível
    playNotificationSound();

    // Processar diferentes tipos de notificação
    switch (data?.type) {
      case 'new_request':
        onNewRequest?.(data);
        break;
      case 'request_accepted':
        onRequestAccepted?.(data);
        break;
      case 'status_update':
        onStatusUpdate?.(data);
        break;
      default:
        console.log('🔔 [NOTIFICATION] Tipo não reconhecido:', data?.type);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request;

    console.log('👆 [NOTIFICATION] Ação:', actionIdentifier, 'Data:', data);

    // Navegar para a tela apropriada baseado no tipo
    switch (data?.type) {
      case 'new_request':
        // Navegar para tela de aceite
        console.log('Navegar para service-flow');
        break;
      case 'request_accepted':
        // Navegar para mapa
        console.log('Navegar para mapa');
        break;
      default:
        console.log('Ação padrão para notificação');
    }
  };

  const playNotificationSound = async () => {
    try {
      if (soundObject.current) {
        await soundObject.current.replayAsync();
      }
    } catch (error) {
      console.log('⚠️ [NOTIFICATION] Erro ao tocar som:', error);
    }
  };

  // Funções públicas para enviar notificações locais
  const sendNewRequestNotification = async (requestData: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Nova Solicitação!',
          body: `${requestData.category} - R$ ${requestData.price}\nCliente: ${requestData.client_name}`,
          data: {
            type: 'new_request',
            ...requestData,
          },
          sound: 'notification_sound.wav',
        },
        trigger: null, // Imediato
      });

      console.log('📱 [NOTIFICATION] Notificação de nova solicitação enviada');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao enviar notificação:', error);
    }
  };

  const sendRequestAcceptedNotification = async (data: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Solicitação Aceita!',
          body: `${data.provider_name} aceitou seu serviço\nTempo estimado: ${data.estimated_time} min`,
          data: {
            type: 'request_accepted',
            ...data,
          },
          sound: 'notification_sound.wav',
        },
        trigger: null,
      });

      console.log('📱 [NOTIFICATION] Notificação de aceite enviada');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao enviar notificação:', error);
    }
  };

  const sendStatusUpdateNotification = async (data: any) => {
    try {
      const statusMessages = {
        'in_progress': 'Prestador chegou ao local',
        'started': 'Serviço iniciado',
        'completed': 'Serviço concluído',
      };

      const message = statusMessages[data.status as keyof typeof statusMessages] || `Status: ${data.status}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Status Atualizado',
          body: message,
          data: {
            type: 'status_update',
            ...data,
          },
          sound: 'notification_sound.wav',
        },
        trigger: null,
      });

      console.log('📱 [NOTIFICATION] Notificação de status enviada');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao enviar notificação:', error);
    }
  };

  // Expor funções através de ref ou context se necessário
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    sendNewRequestNotification,
    sendRequestAcceptedNotification,
    sendStatusUpdateNotification,
  }));

  return null; // Componente invisível
};

export default NotificationManager;
