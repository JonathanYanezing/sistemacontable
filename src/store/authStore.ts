import { create } from 'zustand';
import { StorageService } from '../utils/storage';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  status?: 'active' | 'inactive';
}

interface StoredAdminUser extends User {
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

const CURRENT_USER_KEY = 'scontable_current_user';
const DEFAULT_ADMIN: StoredAdminUser = {
  id: 'admin',
  email: 'admin@scontable.com',
  first_name: 'Administrador',
  last_name: 'Principal',
  is_admin: true,
  status: 'active',
  password: 'admin123',
};

const ensureDefaultAdmin = () => {
  const admins = StorageService.getAdminUsers() as StoredAdminUser[];
  if (!admins || admins.length === 0) {
    StorageService.setAdminUsers([DEFAULT_ADMIN]);
    return;
  }

  const exists = admins.some((admin) => admin.email === DEFAULT_ADMIN.email);
  if (!exists) {
    StorageService.setAdminUsers([...admins, DEFAULT_ADMIN]);
  }
};

const sanitizeUser = (user: StoredAdminUser): User => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  is_admin: user.is_admin,
  status: user.status,
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  init: async () => {
    try {
      ensureDefaultAdmin();
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        set({
          user: parsed,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error en init:', error);
    }
  },

  login: async (email: string, password: string) => {
    try {
      ensureDefaultAdmin();
      const admins = StorageService.getAdminUsers() as StoredAdminUser[];
      const found = admins.find(
        (admin) =>
          admin.email.toLowerCase() === email.toLowerCase() && admin.password === password
      );

      if (!found) {
        throw new Error('Credenciales incorrectas');
      }

      const sanitized = sanitizeUser(found);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitized));

      set({
        user: sanitized,
        isAuthenticated: true,
      });

      return true;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error en logout:', error);
      set({ user: null, isAuthenticated: false });
    }
  },
}));
