import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';
console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🌍 EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
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
    try {
      console.log('🔑 [AUTH] Tentando login para:', email);
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Login bem-sucedido:', user_data.name, 'Token:', !!access_token);
      
      setToken(access_token);
      setUser(user_data);
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));
      console.log('💾 [AUTH] Token e usuário salvos no AsyncStorage');
      
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no login:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      console.log('🏁 [AUTH] Finalizando processo de login');
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      console.log('📝 [AUTH] Tentando registrar usuário:', userData.email, 'Tipo:', userData.user_type);
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Registro bem-sucedido:', user_data.name, 'Token:', !!access_token);
      
      setToken(access_token);
      setUser(user_data);
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));
      console.log('💾 [AUTH] Token e usuário salvos no AsyncStorage');
      
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no registro:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer registro');
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};