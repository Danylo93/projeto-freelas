import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { AUTH_API_URL } from '@/utils/config';

interface NotificationsContextType {
  pushToken: string | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('❌ [PUSH] Permissão de notificação negada');
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        // Verificar se o projectId é válido antes de tentar obter o token
        if (!projectId || projectId === 'ab536686-5f95-4eaf-bdfb-a80e4d7d9dec' || projectId.length < 10) {
          console.warn('⚠️ [PUSH] ProjectId não configurado ou inválido, pulando registro de push token');
          return;
        }

        const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
        const expoToken = tokenRes.data;
        setPushToken(expoToken);

        if (token && AUTH_API_URL && expoToken) {
          try {
            await axios.post(`${AUTH_API_URL}/push-token`, { token: expoToken }, {
              headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': '1'
              },
            });
            console.log('✅ [PUSH] Token registrado com sucesso');
          } catch (e) {
            console.warn('❌ [PUSH] Falha ao registrar push token:', e);
          }
        }
      } catch (error) {
        console.error('❌ [PUSH] Erro ao registrar notificações:', error);
      }
    })();
  }, [token]);

  const value = useMemo(() => ({ pushToken }), [pushToken]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};


