import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { REQUESTS_API_URL } from '@/utils/config';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  created_at: string;
  read: boolean;
  type: 'request' | 'payment' | 'rating' | 'system' | 'chat';
}

export interface PushToken {
  token: string;
  device_id: string;
  platform: 'ios' | 'android' | 'web';
  app_version?: string;
  created_at: string;
  updated_at: string;
}

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getNotificationApiUrl() {
    return REQUESTS_API_URL.replace('/requests', '/notifications');
  }

  /**
   * Inicializar o serviço de notificações
   */
  async initialize(): Promise<string | null> {
    try {
      console.log('📱 [NOTIFICATION] Inicializando serviço de notificações...');

      // Verificar se é um dispositivo físico
      if (!Device.isDevice) {
        console.warn('⚠️ [NOTIFICATION] Push notifications não funcionam no simulador');
        return null;
      }

      // Solicitar permissões
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ [NOTIFICATION] Permissão para notificações negada');
        return null;
      }

      // Obter token de push
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.pushToken = tokenData.data;
      console.log('✅ [NOTIFICATION] Token obtido:', this.pushToken);

      // Registrar token no backend
      await this.registerPushToken(this.pushToken);

      // Configurar listeners
      this.setupListeners();

      return this.pushToken;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao inicializar:', error);
      return null;
    }
  }

  /**
   * Configurar listeners de notificações
   */
  private setupListeners() {
    // Listener para notificações recebidas enquanto o app está em foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 [NOTIFICATION] Notificação recebida:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener para quando o usuário toca na notificação
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📱 [NOTIFICATION] Notificação tocada:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Registrar token de push no backend
   */
  async registerPushToken(token: string): Promise<void> {
    try {
      console.log('📱 [NOTIFICATION] Registrando token no backend...');

      const deviceId = await this.getDeviceId();
      const platform = Platform.OS as 'ios' | 'android';

      await axios.post(
        `${this.getNotificationApiUrl()}/tokens`,
        {
          token,
          device_id: deviceId,
          platform,
          app_version: '1.0.0', // Poderia vir do app.json
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [NOTIFICATION] Token registrado com sucesso');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao registrar token:', error);
    }
  }

  /**
   * Obter ID único do dispositivo
   */
  private async getDeviceId(): Promise<string> {
    try {
      // Em produção, você poderia usar uma biblioteca como expo-application
      // para obter um ID único do dispositivo
      return `device-${Platform.OS}-${Date.now()}`;
    } catch (error) {
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Lidar com notificação recebida
   */
  private handleNotificationReceived(notification: Notifications.Notification) {
    // Aqui você pode implementar lógica personalizada
    // como atualizar badges, mostrar alertas customizados, etc.
    
    const { title, body, data } = notification.request.content;
    console.log('📱 [NOTIFICATION] Processando notificação:', { title, body, data });

    // Exemplo: atualizar badge do app
    if (data?.badge) {
      Notifications.setBadgeCountAsync(Number(data.badge));
    }
  }

  /**
   * Lidar com resposta à notificação (quando usuário toca)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    if (data) {
      this.navigateBasedOnNotification(data);
    }
  }

  /**
   * Navegar baseado no tipo de notificação
   */
  private navigateBasedOnNotification(data: any) {
    console.log('📱 [NOTIFICATION] Navegando baseado na notificação:', data);

    // Aqui você implementaria a navegação baseada no tipo de notificação
    // Exemplo:
    switch (data.type) {
      case 'request':
        // Navegar para tela de solicitações
        console.log('📱 [NOTIFICATION] Navegando para solicitação:', data.request_id);
        break;
      case 'payment':
        // Navegar para tela de pagamentos
        console.log('📱 [NOTIFICATION] Navegando para pagamento:', data.payment_id);
        break;
      case 'chat':
        // Navegar para chat
        console.log('📱 [NOTIFICATION] Navegando para chat:', data.chat_id);
        break;
      case 'rating':
        // Navegar para avaliações
        console.log('📱 [NOTIFICATION] Navegando para avaliação:', data.rating_id);
        break;
      default:
        console.log('📱 [NOTIFICATION] Tipo de notificação desconhecido:', data.type);
    }
  }

  /**
   * Enviar notificação local (para testes)
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Enviar imediatamente
      });

      console.log('✅ [NOTIFICATION] Notificação local enviada');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao enviar notificação local:', error);
    }
  }

  /**
   * Buscar histórico de notificações do backend
   */
  async getNotifications(limit: number = 20, offset: number = 0): Promise<NotificationData[]> {
    try {
      const response = await axios.get(
        `${this.getNotificationApiUrl()}?limit=${limit}&offset=${offset}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.patch(
        `${this.getNotificationApiUrl()}/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [NOTIFICATION] Notificação marcada como lida:', notificationId);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao marcar como lida:', error);
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(): Promise<void> {
    try {
      await axios.patch(
        `${this.getNotificationApiUrl()}/read-all`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [NOTIFICATION] Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao marcar todas como lidas:', error);
    }
  }

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.getNotificationApiUrl()}/unread-count`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.count || 0;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao buscar contagem não lidas:', error);
      return 0;
    }
  }

  /**
   * Atualizar badge do app
   */
  async updateBadge(count?: number): Promise<void> {
    try {
      const badgeCount = count !== undefined ? count : await this.getUnreadCount();
      await Notifications.setBadgeCountAsync(badgeCount);
      console.log('✅ [NOTIFICATION] Badge atualizado:', badgeCount);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao atualizar badge:', error);
    }
  }

  /**
   * Limpar badge do app
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('✅ [NOTIFICATION] Badge limpo');
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao limpar badge:', error);
    }
  }

  /**
   * Cleanup - remover listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🧹 [NOTIFICATION] Listeners removidos');
  }

  /**
   * Obter token atual
   */
  getCurrentToken(): string | null {
    return this.pushToken;
  }
}

export const notificationService = new NotificationService();
