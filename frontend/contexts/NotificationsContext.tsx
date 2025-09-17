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
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
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
        } catch (e) {
          console.warn('Failed to register push token', e);
        }
      }
    })();
  }, [token]);

  const value = useMemo(() => ({ pushToken }), [pushToken]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};


