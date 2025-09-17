import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL, AUTH_API_URL } from '@/utils/config';

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
  isAuthenticated: boolean;
  getAuthHeaders: () => Record<string, string>;
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

// Interceptor para tratar erros de autenticação globalmente
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 [AUTH] Token inválido ou expirado, fazendo logout...');
      // Não fazer logout automático aqui para evitar loops
      // O componente pode decidir quando fazer logout
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
      
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no login:', error.response?.data || error.message);
      
      // Tratar erros específicos de autenticação
      if (error.response?.status === 403) {
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
      
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};