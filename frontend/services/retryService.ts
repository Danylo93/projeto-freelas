import { Alert } from 'react-native';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
}

class RetryService {
  private static instance: RetryService;

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = true,
      onRetry,
      shouldRetry = this.defaultShouldRetry,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        console.warn(`🔄 [RETRY] Tentativa ${attempt}/${maxAttempts} falhou:`, error);

        if (attempt === maxAttempts || !shouldRetry(error)) {
          throw error;
        }

        onRetry?.(attempt, error);

        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await this.sleep(waitTime);
      }
    }

    throw lastError;
  }

  private defaultShouldRetry(error: any): boolean {
    // Não tentar novamente para erros de autenticação
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false;
    }

    // Não tentar novamente para erros de validação
    if (error.response?.status === 400 || error.response?.status === 422) {
      return false;
    }

    // Tentar novamente para erros de rede e servidor
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      !error.response ||
      error.response?.status >= 500
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry específico para requisições de API
  async apiRetry<T>(
    apiCall: () => Promise<T>,
    context: string = 'API'
  ): Promise<T> {
    return this.executeWithRetry(apiCall, {
      maxAttempts: 3,
      delay: 1000,
      backoff: true,
      onRetry: (attempt, error) => {
        console.log(`🔄 [${context}] Tentativa ${attempt} - ${error.message}`);
      },
      shouldRetry: (error) => {
        // Lógica específica para APIs
        if (error.response?.status === 429) { // Rate limit
          return true;
        }
        return this.defaultShouldRetry(error);
      },
    });
  }

  // Retry para operações críticas com feedback ao usuário
  async criticalOperationRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    showUserFeedback: boolean = true
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      maxAttempts: 5,
      delay: 2000,
      backoff: true,
      onRetry: (attempt, error) => {
        console.log(`🔄 [CRITICAL] ${operationName} - Tentativa ${attempt}`);
        
        if (showUserFeedback && attempt === 2) {
          Alert.alert(
            'Conectando...',
            `Tentando ${operationName.toLowerCase()}. Tentativa ${attempt}/5`,
            [{ text: 'OK' }]
          );
        }
      },
    });
  }

  // Retry para conexões Socket.IO
  async socketRetry<T>(
    socketOperation: () => Promise<T>,
    maxAttempts: number = 5
  ): Promise<T> {
    return this.executeWithRetry(socketOperation, {
      maxAttempts,
      delay: 3000,
      backoff: true,
      onRetry: (attempt) => {
        console.log(`🔌 [SOCKET] Tentativa de reconexão ${attempt}/${maxAttempts}`);
      },
      shouldRetry: () => true, // Sempre tentar reconectar socket
    });
  }

  // Retry para operações de localização
  async locationRetry<T>(
    locationOperation: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(locationOperation, {
      maxAttempts: 3,
      delay: 2000,
      backoff: false,
      onRetry: (attempt) => {
        console.log(`📍 [LOCATION] Tentativa de localização ${attempt}/3`);
      },
      shouldRetry: (error) => {
        // Tentar novamente para erros de timeout ou rede
        return error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR';
      },
    });
  }

  // Operação com fallback
  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryOperation, {
        maxAttempts: 2,
        delay: 1000,
      });
    } catch (primaryError) {
      console.warn(`⚠️ [FALLBACK] ${context} primário falhou, usando fallback:`, primaryError);
      
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        console.error(`❌ [FALLBACK] ${context} fallback também falhou:`, fallbackError);
        throw primaryError; // Lançar o erro original
      }
    }
  }

  // Batch retry para múltiplas operações
  async batchRetry<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {}
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const operation of operations) {
      try {
        const result = await this.executeWithRetry(operation, options);
        results.push(result);
      } catch (error) {
        console.error('❌ [BATCH] Operação em lote falhou:', error);
        throw error;
      }
    }
    
    return results;
  }
}

export const retryService = RetryService.getInstance();
export default retryService;
