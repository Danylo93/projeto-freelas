import { create } from 'zustand';
import { User } from '../../domain/entities/User';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const authRepo = new AuthRepositoryImpl();

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, pass) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.login(email, pass);
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  logout: () => set({ user: null }),
}));
