import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // Por enquanto vou simular o login - depois conectarei com a API
      const mockUser: User = {
        id: '1',
        name: 'Usuário Teste',
        email: email,
        phone: '(11) 99999-9999',
        user_type: 2, // Cliente por padrão
      };

      const mockToken = 'mock_token_' + Date.now();
      
      await AsyncStorage.multiSet([
        ['@ServicoApp:token', mockToken],
        ['@ServicoApp:user', JSON.stringify(mockUser)],
      ]);

      setToken(mockToken);
      setUser(mockUser);

    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  }

  async function register(userData: RegisterData) {
    try {
      setIsLoading(true);
      
      // Simular registro - depois conectarei com a API
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        user_type: userData.user_type,
      };

      const newToken = 'mock_token_' + Date.now();
      
      await AsyncStorage.multiSet([
        ['@ServicoApp:token', newToken],
        ['@ServicoApp:user', JSON.stringify(newUser)],
      ]);

      setToken(newToken);
      setUser(newUser);

    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw new Error('Erro ao criar conta');
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