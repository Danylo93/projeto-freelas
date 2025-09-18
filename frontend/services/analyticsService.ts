import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheService } from './cacheService';

interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  userType?: number;
  sessionId: string;
}

interface UserMetrics {
  totalSessions: number;
  totalTimeSpent: number;
  lastActiveDate: string;
  featuresUsed: string[];
  errorsEncountered: number;
  successfulActions: number;
}

interface PerformanceMetric {
  action: string;
  duration: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private sessionStartTime: number;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 segundos

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.startPeriodicFlush();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Rastrear eventos de usuário
  track(event: string, properties: Record<string, any> = {}, userId?: string, userType?: number): void {
    const analyticsEvent: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      properties: {
        ...properties,
        platform: 'react-native',
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
      userId,
      userType,
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    console.log(`📊 [ANALYTICS] Event tracked: ${event}`, properties);

    // Flush automático quando atingir o batch size
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  // Rastrear performance de ações
  async trackPerformance<T>(
    action: string,
    operation: () => Promise<T>,
    additionalProperties: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;

    try {
      const result = await operation();
      success = true;
      return result;
    } catch (error: any) {
      success = false;
      errorMessage = error.message || 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      this.performanceMetrics.push({
        action,
        duration,
        timestamp: Date.now(),
        success,
        errorMessage,
      });

      // Rastrear como evento também
      this.track('performance_metric', {
        action,
        duration,
        success,
        errorMessage,
        ...additionalProperties,
      });

      console.log(`⏱️ [PERFORMANCE] ${action}: ${duration}ms (${success ? 'success' : 'failed'})`);
    }
  }

  // Eventos específicos do app
  trackUserAction(action: string, details: Record<string, any> = {}): void {
    this.track('user_action', { action, ...details });
  }

  trackScreenView(screenName: string, additionalData: Record<string, any> = {}): void {
    this.track('screen_view', { screen: screenName, ...additionalData });
  }

  trackServiceRequest(serviceType: string, location: { latitude: number; longitude: number }): void {
    this.track('service_request', {
      service_type: serviceType,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  trackServiceCompletion(serviceId: string, rating: number, duration: number): void {
    this.track('service_completion', {
      service_id: serviceId,
      rating,
      duration_minutes: Math.round(duration / 60000),
    });
  }

  trackError(error: any, context: string, additionalData: Record<string, any> = {}): void {
    this.track('error', {
      error_message: error.message || 'Unknown error',
      error_stack: error.stack,
      context,
      ...additionalData,
    });
  }

  trackNotificationReceived(notificationType: string, opened: boolean = false): void {
    this.track('notification', {
      type: notificationType,
      opened,
      received_at: new Date().toISOString(),
    });
  }

  // Métricas de usuário
  async updateUserMetrics(userId: string, action: string): Promise<void> {
    try {
      const key = `user_metrics_${userId}`;
      const cached = await cacheService.getPersistentCache<UserMetrics>(key);
      
      const metrics: UserMetrics = cached || {
        totalSessions: 0,
        totalTimeSpent: 0,
        lastActiveDate: new Date().toISOString(),
        featuresUsed: [],
        errorsEncountered: 0,
        successfulActions: 0,
      };

      // Atualizar métricas baseado na ação
      switch (action) {
        case 'session_start':
          metrics.totalSessions += 1;
          break;
        case 'error':
          metrics.errorsEncountered += 1;
          break;
        case 'success':
          metrics.successfulActions += 1;
          break;
        default:
          if (!metrics.featuresUsed.includes(action)) {
            metrics.featuresUsed.push(action);
          }
      }

      metrics.lastActiveDate = new Date().toISOString();
      await cacheService.setPersistentCache(key, metrics, 30 * 24 * 60 * 60 * 1000); // 30 dias
    } catch (error) {
      console.error('❌ [ANALYTICS] Erro ao atualizar métricas do usuário:', error);
    }
  }

  // Flush eventos para storage/servidor
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const eventsToFlush = [...this.events];
      this.events = [];

      // Salvar no storage local
      await this.saveEventsLocally(eventsToFlush);

      // TODO: Enviar para servidor de analytics quando disponível
      // await this.sendEventsToServer(eventsToFlush);

      console.log(`📊 [ANALYTICS] Flushed ${eventsToFlush.length} events`);
    } catch (error) {
      console.error('❌ [ANALYTICS] Erro ao fazer flush dos eventos:', error);
      // Recolocar eventos na fila em caso de erro
      this.events.unshift(...this.events);
    }
  }

  private async saveEventsLocally(events: AnalyticsEvent[]): Promise<void> {
    try {
      const existingEvents = await AsyncStorage.getItem('analytics_events');
      const allEvents = existingEvents ? JSON.parse(existingEvents) : [];
      allEvents.push(...events);

      // Manter apenas os últimos 1000 eventos
      const recentEvents = allEvents.slice(-1000);
      await AsyncStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('❌ [ANALYTICS] Erro ao salvar eventos localmente:', error);
    }
  }

  // Relatórios e estatísticas
  async getSessionReport(): Promise<{
    sessionId: string;
    duration: number;
    eventsCount: number;
    performanceMetrics: PerformanceMetric[];
  }> {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      eventsCount: this.events.length,
      performanceMetrics: [...this.performanceMetrics],
    };
  }

  async getUserMetrics(userId: string): Promise<UserMetrics | null> {
    return await cacheService.getPersistentCache<UserMetrics>(`user_metrics_${userId}`);
  }

  getPerformanceStats(): {
    averageResponseTime: number;
    successRate: number;
    slowestActions: Array<{ action: string; avgDuration: number }>;
  } {
    if (this.performanceMetrics.length === 0) {
      return { averageResponseTime: 0, successRate: 0, slowestActions: [] };
    }

    const totalDuration = this.performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const successCount = this.performanceMetrics.filter(metric => metric.success).length;
    
    // Agrupar por ação e calcular média
    const actionGroups = this.performanceMetrics.reduce((groups, metric) => {
      if (!groups[metric.action]) {
        groups[metric.action] = { total: 0, count: 0 };
      }
      groups[metric.action].total += metric.duration;
      groups[metric.action].count += 1;
      return groups;
    }, {} as Record<string, { total: number; count: number }>);

    const slowestActions = Object.entries(actionGroups)
      .map(([action, data]) => ({
        action,
        avgDuration: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      averageResponseTime: Math.round(totalDuration / this.performanceMetrics.length),
      successRate: Math.round((successCount / this.performanceMetrics.length) * 100),
      slowestActions,
    };
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Limpar dados antigos
  async clearOldData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('analytics_events');
      this.events = [];
      this.performanceMetrics = [];
      console.log('🧹 [ANALYTICS] Dados antigos limpos');
    } catch (error) {
      console.error('❌ [ANALYTICS] Erro ao limpar dados antigos:', error);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;
