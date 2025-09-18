import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL, AUTH_API_URL } from '@/utils/config';
import { notificationService } from '@/services/notificationService';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: number; // 1 = prestador, 2 = cliente
  created_at: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  getAuthHeaders: () => Record<string, string>;
  validateToken: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  user_type: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
} else {
  console.warn(
    '⚠️ Nenhuma URL para o gateway HTTP configurada. Defina EXPO_PUBLIC_API_GATEWAY_URL ou EXPO_PUBLIC_BACKEND_URL para usar o proxy /api.'
  );
}

// Configuração simples do axios

// Variável para controlar se já estamos tentando renovar o token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor para tratar erros de autenticação globalmente
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tratar erro específico do ngrok
    if (error.response?.status === 403 &&
        error.response?.data?.includes?.('ERR_NGROK_734')) {
      console.warn('🚫 [AUTH] Limite do ngrok excedido. Aguardando...');
      // Retry após 60 segundos
      setTimeout(() => {
        console.log('🔄 [AUTH] Tentando novamente após limite do ngrok...');
      }, 60000);
      return Promise.reject(error);
    }

    // Se for erro 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já estamos renovando, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tentar renovar o token
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          console.log('🔄 [AUTH] Tentando renovar token...');

          // Fazer uma nova requisição de login ou refresh se disponível
          // Por enquanto, vamos limpar o token inválido
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];

          processQueue(new Error('Token expirado'), null);

          // Redirecionar para login
          console.warn('🔒 [AUTH] Token expirado, redirecionando para login...');
          return Promise.reject(new Error('Token expirado'));
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

if (!AUTH_API_URL) {
  console.warn(
    '⚠️ URL do serviço de autenticação não configurada. Defina EXPO_PUBLIC_AUTH_SERVICE_URL ou um gateway com /api/auth.'
  );
}

console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔐 AUTH_API_URL:', AUTH_API_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': '1',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [AUTH] Token não encontrado ao criar headers de autenticação');
    }
    
    return headers;
  }, [token]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      // Sempre configurar o header ngrok-skip-browser-warning
      axios.defaults.headers.common['ngrok-skip-browser-warning'] = '1';
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Configure axios defaults
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!AUTH_API_URL) {
      throw new Error(
        'Serviço de autenticação não configurado. Defina EXPO_PUBLIC_AUTH_SERVICE_URL ou um gateway com /api/auth.'
      );
    }

    try {
      console.log('🔑 [AUTH] Tentando login para:', email, 'via', AUTH_API_URL);
      setIsLoading(true);
      const response = await axios.post(`${AUTH_API_URL}/login`, { email, password });
      
      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Login bem-sucedido:', user_data.name, 'Token:', !!access_token);

      setToken(access_token);
      setUser(user_data);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));
      console.log('💾 [AUTH] Token e usuário salvos no AsyncStorage');

      // Inicializar notificações após login bem-sucedido
      try {
        await notificationService.initialize();
        console.log('📱 [AUTH] Serviço de notificações inicializado');
      } catch (notificationError) {
        console.warn('⚠️ [AUTH] Erro ao inicializar notificações:', notificationError);
        // Não falhar o login por causa das notificações
      }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no login:', error.response?.data || error.message);
      
      // Tratar erros específicos de autenticação
      if (error.response?.status === 403) {
        // Verificar se é erro do ngrok
        if (error.response?.data?.includes?.('ERR_NGROK_734')) {
          throw new Error('Limite de requisições excedido. Aguarde 1 minuto e tente novamente.');
        }
        throw new Error('Acesso negado. Verifique suas credenciais.');
      } else if (error.response?.status === 401) {
        throw new Error('Credenciais inválidas.');
      } else if (error.response?.status === 404) {
        throw new Error('Serviço de autenticação não encontrado.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      console.log('🏁 [AUTH] Finalizando processo de login');
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    if (!AUTH_API_URL) {
      throw new Error(
        'Serviço de autenticação não configurado. Defina EXPO_PUBLIC_AUTH_SERVICE_URL ou um gateway com /api/auth.'
      );
    }

    try {
      console.log('📝 [AUTH] Tentando registrar usuário:', userData.email, 'Tipo:', userData.user_type, 'via', AUTH_API_URL);
      setIsLoading(true);
      const response = await axios.post(`${AUTH_API_URL}/register`, userData);
      
      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Registro bem-sucedido:', user_data.name, 'Token:', !!access_token);

      setToken(access_token);
      setUser(user_data);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));
      console.log('💾 [AUTH] Token e usuário salvos no AsyncStorage');
      
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no registro:', error.response?.data || error.message);
      
      // Tratar erros específicos de registro
      if (error.response?.status === 403) {
        // Verificar se é erro do ngrok
        if (error.response?.data?.includes?.('ERR_NGROK_734')) {
          throw new Error('Limite de requisições excedido. Aguarde 1 minuto e tente novamente.');
        }
        throw new Error('Acesso negado. Verifique suas permissões.');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado para criar conta.');
      } else if (error.response?.status === 400) {
        throw new Error('Dados inválidos. Verifique as informações fornecidas.');
      } else if (error.response?.status === 409) {
        throw new Error('Email já cadastrado. Tente fazer login.');
      } else if (error.response?.status === 404) {
        throw new Error('Serviço de autenticação não encontrado.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Erro ao fazer registro');
    } finally {
      console.log('🏁 [AUTH] Finalizando processo de registro');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear axios defaults
      delete axios.defaults.headers.common['Authorization'];

      // Limpar notificações
      try {
        await notificationService.clearBadge();
        notificationService.cleanup();
        console.log('📱 [AUTH] Notificações limpas no logout');
      } catch (notificationError) {
        console.warn('⚠️ [AUTH] Erro ao limpar notificações:', notificationError);
      }

    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // Salvar no AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('👤 [AUTH] Usuário atualizado no contexto');
    }
  };

  const validateToken = async (): Promise<boolean> => {
    if (!token) {
      console.warn('⚠️ [AUTH] Nenhum token para validar');
      return false;
    }

    try {
      console.log('🔍 [AUTH] Validando token...');
      const response = await axios.get(`${AUTH_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': '1',
        },
      });

      if (response.status === 200) {
        console.log('✅ [AUTH] Token válido');
        return true;
      }
    } catch (error: any) {
      console.warn('❌ [AUTH] Token inválido:', error.response?.status);
      if (error.response?.status === 401) {
        // Token expirado, fazer logout
        await logout();
      }
    }

    return false;
  };

  const refreshAuth = async (): Promise<void> => {
    console.log('🔄 [AUTH] Tentando recarregar autenticação...');
    await loadStoredAuth();

    if (token) {
      const isValid = await validateToken();
      if (!isValid) {
        console.warn('🔒 [AUTH] Token inválido após refresh, fazendo logout...');
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    getAuthHeaders,
    validateToken,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};