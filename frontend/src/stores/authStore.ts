import { create } from 'zustand';
import { User, UserType, AuthRequest, AuthResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (request: AuthRequest) => Promise<AuthResponse>;
  register: (request: AuthRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const STORAGE_KEY = '@freelas_auth';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (request: AuthRequest): Promise<AuthResponse> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sistema de login mock igual ao Android - baseado no email
      const mockUser = createMockUser(request.email, request.password);
      
      if (!mockUser) {
        set({ 
          isLoading: false, 
          error: 'Credenciais inválidas',
          isAuthenticated: false,
          user: null
        });
        return { success: false, message: 'Credenciais inválidas' };
      }
      
      // Verificar se o tipo de usuário corresponde ao esperado
      if (mockUser.userType !== request.userType) {
        set({ 
          isLoading: false, 
          error: 'Tipo de usuário incorreto',
          isAuthenticated: false,
          user: null
        });
        return { success: false, message: 'Tipo de usuário incorreto' };
      }
      
      const token = `mock_token_${mockUser.id}_${Date.now()}`;
      
      // Salvar no AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: mockUser,
        token,
        timestamp: Date.now()
      }));
      
      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user: mockUser, token };
      
    } catch (error) {
      const errorMessage = 'Erro ao fazer login';
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null
      });
      return { success: false, message: errorMessage };
    }
  },

  register: async (request: AuthRequest): Promise<AuthResponse> => {
    set({ isLoading: true, error: null });
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock de registro
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: request.email.split('@')[0],
        email: request.email,
        phone: '11999999999',
        userType: request.userType,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const token = `mock_token_${newUser.id}_${Date.now()}`;
      
      // Salvar no AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: newUser,
        token,
        timestamp: Date.now()
      }));
      
      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user: newUser, token };
      
    } catch (error) {
      const errorMessage = 'Erro ao criar conta';
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null
      });
      return { success: false, message: errorMessage };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  },

  checkAuthStatus: async (): Promise<void> => {
    set({ isLoading: true });
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const { user, token, timestamp } = JSON.parse(stored);
        
        // Verificar se o token não expirou (24 horas)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return;
        }
      }
      
      // Se chegou aqui, não há usuário autenticado
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));

// Função auxiliar para criar usuário mock igual ao Android
function createMockUser(email: string, password: string): User | null {
  // Sistema de login mock baseado no email - igual ao Android
  if (email.includes('cliente')) {
    return {
      id: 'mock_client_1',
      name: 'Cliente Teste',
      email: email,
      phone: '11987654321',
      userType: UserType.CLIENT,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  if (email.includes('prestador') || 
      email.includes('joao') || 
      email.includes('carlos') || 
      email.includes('maria') || 
      email.includes('pedro') || 
      email.includes('ana')) {
    return {
      id: 'mock_provider_1',
      name: 'Prestador Teste',
      email: email,
      phone: '11999887766',
      userType: UserType.PROVIDER,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  return null;
}
