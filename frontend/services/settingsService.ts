import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheService } from './cacheService';

interface AppSettings {
  // Notificações
  enableNotifications: boolean;
  enableSoundNotifications: boolean;
  enableVibrationNotifications: boolean;
  
  // Localização
  enableLocationTracking: boolean;
  locationAccuracy: 'high' | 'balanced' | 'low';
  locationUpdateInterval: number; // em segundos
  
  // Interface
  theme: 'light' | 'dark' | 'auto';
  language: 'pt' | 'en' | 'es';
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  
  // Performance
  enableCaching: boolean;
  cacheExpiration: number; // em horas
  enableRetry: boolean;
  maxRetryAttempts: number;
  
  // Analytics
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  
  // Específico do Prestador
  autoAcceptRadius: number; // em km
  workingHours: {
    start: string; // HH:MM
    end: string; // HH:MM
    workDays: number[]; // 0-6 (domingo-sábado)
  };
  
  // Específico do Cliente
  preferredPaymentMethod: 'cash' | 'card' | 'pix';
  autoRating: boolean;
  saveAddresses: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  // Notificações
  enableNotifications: true,
  enableSoundNotifications: true,
  enableVibrationNotifications: true,
  
  // Localização
  enableLocationTracking: true,
  locationAccuracy: 'high',
  locationUpdateInterval: 10,
  
  // Interface
  theme: 'auto',
  language: 'pt',
  enableAnimations: true,
  enableHapticFeedback: true,
  
  // Performance
  enableCaching: true,
  cacheExpiration: 24,
  enableRetry: true,
  maxRetryAttempts: 3,
  
  // Analytics
  enableAnalytics: true,
  enableCrashReporting: true,
  
  // Específico do Prestador
  autoAcceptRadius: 5,
  workingHours: {
    start: '08:00',
    end: '18:00',
    workDays: [1, 2, 3, 4, 5], // Segunda a sexta
  },
  
  // Específico do Cliente
  preferredPaymentMethod: 'pix',
  autoRating: false,
  saveAddresses: true,
};

class SettingsService {
  private static instance: SettingsService;
  private settings: AppSettings = DEFAULT_SETTINGS;
  private listeners: Array<(settings: AppSettings) => void> = [];

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  constructor() {
    this.loadSettings();
  }

  // Carregar configurações
  async loadSettings(): Promise<AppSettings> {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao carregar configurações:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // Salvar configurações
  async saveSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      
      // Notificar listeners
      this.listeners.forEach(listener => listener(this.settings));
      
      console.log('✅ [SETTINGS] Configurações salvas');
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao salvar configurações:', error);
    }
  }

  // Obter configurações atuais
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  // Obter configuração específica
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  // Atualizar configuração específica
  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<AppSettings>);
  }

  // Resetar para padrões
  async resetToDefaults(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  }

  // Adicionar listener para mudanças
  addListener(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar função para remover listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Configurações específicas por contexto
  getLocationSettings() {
    return {
      enableTracking: this.settings.enableLocationTracking,
      accuracy: this.settings.locationAccuracy,
      updateInterval: this.settings.locationUpdateInterval * 1000, // converter para ms
    };
  }

  getNotificationSettings() {
    return {
      enabled: this.settings.enableNotifications,
      sound: this.settings.enableSoundNotifications,
      vibration: this.settings.enableVibrationNotifications,
    };
  }

  getPerformanceSettings() {
    return {
      caching: this.settings.enableCaching,
      cacheExpiration: this.settings.cacheExpiration * 60 * 60 * 1000, // converter para ms
      retry: this.settings.enableRetry,
      maxRetries: this.settings.maxRetryAttempts,
    };
  }

  getUISettings() {
    return {
      theme: this.settings.theme,
      language: this.settings.language,
      animations: this.settings.enableAnimations,
      hapticFeedback: this.settings.enableHapticFeedback,
    };
  }

  // Configurações inteligentes baseadas no uso
  async optimizeForBattery(): Promise<void> {
    await this.saveSettings({
      locationAccuracy: 'balanced',
      locationUpdateInterval: 30,
      enableAnimations: false,
      cacheExpiration: 48,
    });
  }

  async optimizeForPerformance(): Promise<void> {
    await this.saveSettings({
      locationAccuracy: 'high',
      locationUpdateInterval: 5,
      enableAnimations: true,
      enableCaching: true,
      maxRetryAttempts: 5,
    });
  }

  async optimizeForDataSaving(): Promise<void> {
    await this.saveSettings({
      enableCaching: true,
      cacheExpiration: 72,
      maxRetryAttempts: 2,
      enableAnalytics: false,
    });
  }

  // Validar configurações
  validateSettings(settings: Partial<AppSettings>): boolean {
    try {
      // Validar intervalos
      if (settings.locationUpdateInterval && 
          (settings.locationUpdateInterval < 1 || settings.locationUpdateInterval > 300)) {
        return false;
      }

      // Validar raio de aceitação automática
      if (settings.autoAcceptRadius && 
          (settings.autoAcceptRadius < 0.5 || settings.autoAcceptRadius > 50)) {
        return false;
      }

      // Validar horários de trabalho
      if (settings.workingHours) {
        const { start, end } = settings.workingHours;
        const startTime = new Date(`2000-01-01T${start}:00`);
        const endTime = new Date(`2000-01-01T${end}:00`);
        
        if (startTime >= endTime) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Exportar configurações
  async exportSettings(): Promise<string> {
    return JSON.stringify(this.settings, null, 2);
  }

  // Importar configurações
  async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      if (this.validateSettings(importedSettings)) {
        await this.saveSettings(importedSettings);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao importar configurações:', error);
      return false;
    }
  }

  // Estatísticas de uso das configurações
  getUsageStats(): {
    totalChanges: number;
    lastModified: string;
    mostChangedSetting: string;
  } {
    // TODO: Implementar tracking de mudanças
    return {
      totalChanges: 0,
      lastModified: new Date().toISOString(),
      mostChangedSetting: 'enableNotifications',
    };
  }
}

export const settingsService = SettingsService.getInstance();
export default settingsService;
export type { AppSettings };
