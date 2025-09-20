import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';
import axios from 'axios';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: number; // 1 = provider, 2 = client
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_type: number;
  user_data: User;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isProvider: boolean;
  isClient: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  user_type: number;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar interceptor do axios para incluir token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Carregar dados do usuário ao iniciar
  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem('@ServicoApp:token');
      const storedUser = await AsyncStorage.getItem('@ServicoApp:user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verificar se o token ainda é válido
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        } catch (error) {
          // Token inválido, limpar dados
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const authData: AuthToken = response.data;
      
      await AsyncStorage.multiSet([
        ['@ServicoApp:token', authData.access_token],
        ['@ServicoApp:user', JSON.stringify(authData.user_data)],
      ]);

      setToken(authData.access_token);
      setUser(authData.user_data);

    } catch (error: any) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(userData: RegisterData) {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

      const authData: AuthToken = response.data;
      
      await AsyncStorage.multiSet([
        ['@ServicoApp:token', authData.access_token],
        ['@ServicoApp:user', JSON.stringify(authData.user_data)],
      ]);

      setToken(authData.access_token);
      setUser(authData.user_data);

    } catch (error: any) {
      console.error('Erro no registro:', error);
      const message = error.response?.data?.detail || 'Erro ao criar conta';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await clearAuth();
  }

  async function clearAuth() {
    await AsyncStorage.multiRemove([
      '@ServicoApp:token',
      '@ServicoApp:user',
    ]);
    
    setToken(null);
    setUser(null);
  }

  const isProvider = user?.user_type === 1;
  const isClient = user?.user_type === 2;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isProvider,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}