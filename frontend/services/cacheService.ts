import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, CacheItem<any>>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Cache em memória para dados frequentemente acessados
  setMemoryCache<T>(key: string, data: T, expiresInMs: number = 5 * 60 * 1000): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    });
  }

  getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.expiresIn;
    if (isExpired) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  // Cache persistente para dados importantes
  async setPersistentCache<T>(key: string, data: T, expiresInMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresInMs,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('❌ [CACHE] Erro ao salvar cache persistente:', error);
    }
  }

  async getPersistentCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() - item.timestamp > item.expiresIn;
      
      if (isExpired) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('❌ [CACHE] Erro ao recuperar cache persistente:', error);
      return null;
    }
  }

  // Cache para localização do usuário
  async cacheUserLocation(location: { latitude: number; longitude: number; address?: string }): Promise<void> {
    await this.setPersistentCache('user_location', location, 10 * 60 * 1000); // 10 minutos
  }

  async getCachedUserLocation(): Promise<{ latitude: number; longitude: number; address?: string } | null> {
    return await this.getPersistentCache('user_location');
  }

  // Cache para configurações do prestador
  async cacheProviderSettings(settings: any): Promise<void> {
    await this.setPersistentCache('provider_settings', settings, 7 * 24 * 60 * 60 * 1000); // 7 dias
  }

  async getCachedProviderSettings(): Promise<any> {
    return await this.getPersistentCache('provider_settings');
  }

  // Cache para histórico de serviços
  async cacheServiceHistory(history: any[]): Promise<void> {
    await this.setPersistentCache('service_history', history, 60 * 60 * 1000); // 1 hora
  }

  async getCachedServiceHistory(): Promise<any[] | null> {
    return await this.getPersistentCache('service_history');
  }

  // Limpar cache expirado
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const item = JSON.parse(cached);
          const isExpired = Date.now() - item.timestamp > item.expiresIn;
          if (isExpired) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('❌ [CACHE] Erro ao limpar cache expirado:', error);
    }
  }

  // Limpar todo o cache
  async clearAllCache(): Promise<void> {
    try {
      this.memoryCache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('❌ [CACHE] Erro ao limpar todo o cache:', error);
    }
  }

  // Estatísticas do cache
  getCacheStats(): { memoryItems: number; memorySize: string } {
    const memoryItems = this.memoryCache.size;
    const memorySize = `${Math.round(JSON.stringify([...this.memoryCache.entries()]).length / 1024)} KB`;
    
    return { memoryItems, memorySize };
  }
}

export const cacheService = CacheService.getInstance();
export default cacheService;
