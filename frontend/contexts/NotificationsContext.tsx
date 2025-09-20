import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../utils/config';

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextData {
  notifications: NotificationData[];
  unreadCount: number;
  requestPermissions: () => Promise<boolean>;
  sendPushToken: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  isConnected: boolean;
}

const NotificationsContext = createContext<NotificationsContextData>({} as NotificationsContextData);

export function useNotifications(): NotificationsContextData {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationsProvider');
  }
  return context;
}

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const { user, token } = useAuth();

  // Solicitar permissões de notificação
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permissão de notificação não concedida');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de notificação:', error);
      return false;
    }
  };

  // Enviar token push para o backend
  const sendPushToken = async () => {
    try {
      if (!user || !token) return;

      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Obter token push
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Substitua pelo seu project ID
      });

      console.log('Token push obtido:', tokenData.data);

      // Enviar token para o backend
      // TODO: Implementar envio do token para a API
      // await axios.post(`${API_BASE_URL}/auth/push-token`, {
      //   token: tokenData.data
      // });

    } catch (error) {
      console.error('Erro ao enviar token push:', error);
    }
  };

  // Conectar WebSocket para notificações em tempo real
  const connectWebSocket = () => {
    if (!user || !token) return;

    try {
      const wsUrl = `${SOCKET_URL.replace('http', 'ws')}/ws?user_id=${user.id}&user_type=${user.user_type}&token=${token}`;
      console.log('Conectando WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Mensagem WebSocket recebida:', data);

          // Criar notificação local
          const notification: NotificationData = {
            id: Date.now().toString(),
            title: getNotificationTitle(data.type),
            body: getNotificationBody(data),
            data: data,
            timestamp: new Date(),
            read: false,
          };

          setNotifications(prev => [notification, ...prev]);

          // Mostrar notificação push se o app estiver em background
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
              data: notification.data,
            },
            trigger: null, // Imediatamente
          }).catch(console.error);

        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);
        
        // Tentar reconectar após 3 segundos
        setTimeout(() => {
          if (user && token) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setIsConnected(false);
      };

      setWebSocket(ws);

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  };

  // Desconectar WebSocket
  const disconnectWebSocket = () => {
    if (webSocket) {
      webSocket.close();
      setWebSocket(null);
    }
    setIsConnected(false);
  };

  // Efeitos
  useEffect(() => {
    if (user && token) {
      sendPushToken();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token]);

  // Marcar notificação como lida
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Limpar todas as notificações
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        requestPermissions,
        sendPushToken,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        isConnected,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// Funções auxiliares para gerar títulos e corpos das notificações
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'new_request':
      return 'Nova Solicitação';
    case 'request_accepted':
      return 'Solicitação Aceita';
    case 'offer_received':
      return 'Nova Oferta';
    case 'service_completed':
      return 'Serviço Concluído';
    default:
      return 'Notificação';
  }
}

function getNotificationBody(data: any): string {
  switch (data.type) {
    case 'new_request':
      return `${data.client_name} solicitou um serviço de ${data.category}`;
    case 'request_accepted':
      return `Sua solicitação foi aceita por ${data.provider_name}`;
    case 'offer_received':
      return `Você recebeu uma oferta de R$ ${data.price}`;
    case 'service_completed':
      return 'Seu serviço foi concluído com sucesso';
    default:
      return data.message || 'Você tem uma nova notificação';
  }
}