import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

interface PushNotificationContextType {
  registerForPushNotifications: () => Promise<string | null>;
  sendLocalNotification: (title: string, body: string, data?: any) => void;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

// Configurar como as notificações são tratadas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ [PUSH] Permissão de notificação negada');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Substitua pelo seu project ID
      });
      
      console.log('✅ [PUSH] Token registrado:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ [PUSH] Erro ao registrar notificações:', error);
      return null;
    }
  };

  const sendLocalNotification = (title: string, body: string, data?: any) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Enviar imediatamente
    });
  };

  // Registrar token no backend quando usuário fizer login
  useEffect(() => {
    if (user && token) {
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) {
          // Enviar token para o backend
          // TODO: Implementar envio do token para o backend
          console.log('📱 [PUSH] Token registrado para usuário:', user.name);
        }
      });
    }
  }, [user, token]);

  // Configurar listeners de notificação
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 [PUSH] Notificação recebida:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 [PUSH] Usuário interagiu com notificação:', response);
      // TODO: Navegar para tela apropriada baseada no tipo de notificação
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <PushNotificationContext.Provider value={{ registerForPushNotifications, sendLocalNotification }}>
      {children}
    </PushNotificationContext.Provider>
  );
};
