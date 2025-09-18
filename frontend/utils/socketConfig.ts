import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detecta automaticamente a URL correta para Socket.IO
 * baseado no ambiente (emulador, dispositivo físico, etc.)
 */
export const getSocketURL = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  const fallbackUrl = process.env.EXPO_PUBLIC_SOCKET_FALLBACK_URL || 'http://localhost:8016';
  
  // Se URL específica foi definida (não 'auto'), usar ela
  if (envUrl && envUrl !== 'auto') {
    console.log('🔌 [SOCKET-CONFIG] Usando URL específica:', envUrl);
    return envUrl;
  }
  
  // Auto-detecção baseada no ambiente
  const isExpoGo = Constants.appOwnership === 'expo';
  const isDevice = Constants.isDevice;
  
  console.log('🔌 [SOCKET-CONFIG] Ambiente detectado:', {
    platform: Platform.OS,
    isExpoGo,
    isDevice,
    debuggerHost: Constants.debuggerHost,
  });
  
  // Para desenvolvimento com Expo Go
  if (isExpoGo) {
    if (Constants.debuggerHost) {
      // Extrair IP do debugger host
      const ip = Constants.debuggerHost.split(':')[0];
      const socketUrl = `http://${ip}:8016`;
      console.log('🔌 [SOCKET-CONFIG] Expo Go - usando IP do debugger:', socketUrl);
      return socketUrl;
    }
  }
  
  // Para emulador Android
  if (Platform.OS === 'android' && !isDevice) {
    const socketUrl = 'http://10.0.2.2:8016';
    console.log('🔌 [SOCKET-CONFIG] Emulador Android:', socketUrl);
    return socketUrl;
  }
  
  // Para emulador iOS
  if (Platform.OS === 'ios' && !isDevice) {
    const socketUrl = 'http://localhost:8016';
    console.log('🔌 [SOCKET-CONFIG] Emulador iOS:', socketUrl);
    return socketUrl;
  }
  
  // Para dispositivos físicos, tentar detectar IP da máquina host
  if (isDevice) {
    // Se temos debugger host, usar o IP dele
    if (Constants.debuggerHost) {
      const ip = Constants.debuggerHost.split(':')[0];
      const socketUrl = `http://${ip}:8016`;
      console.log('🔌 [SOCKET-CONFIG] Dispositivo físico - IP do debugger:', socketUrl);
      return socketUrl;
    }
    
    // Fallback para dispositivos físicos
    console.log('🔌 [SOCKET-CONFIG] Dispositivo físico - usando fallback:', fallbackUrl);
    return fallbackUrl;
  }
  
  // Fallback padrão
  console.log('🔌 [SOCKET-CONFIG] Usando fallback padrão:', fallbackUrl);
  return fallbackUrl;
};

/**
 * Testa conectividade com o Socket.IO
 */
export const testSocketConnection = async (url: string): Promise<boolean> => {
  try {
    console.log('🔌 [SOCKET-CONFIG] Testando conectividade:', url);
    
    // Tentar fazer uma requisição HTTP simples para o healthcheck
    const healthUrl = url.replace('/socket.io', '') + '/healthz';
    const response = await fetch(healthUrl, { 
      method: 'GET',
      timeout: 5000 
    });
    
    const isHealthy = response.ok;
    console.log('🔌 [SOCKET-CONFIG] Teste de conectividade:', isHealthy ? '✅ OK' : '❌ FALHOU');
    
    return isHealthy;
  } catch (error) {
    console.log('🔌 [SOCKET-CONFIG] Erro no teste de conectividade:', error);
    return false;
  }
};

/**
 * Configuração inteligente de Socket.IO com fallbacks
 */
export const getSmartSocketConfig = () => {
  const primaryUrl = getSocketURL();
  
  return {
    url: primaryUrl,
    options: {
      transports: ['polling', 'websocket'], // Polling primeiro para compatibilidade
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      forceNew: true,
      upgrade: true, // Permite upgrade para WebSocket
      extraHeaders: {
        'ngrok-skip-browser-warning': '1',
      },
    }
  };
};
