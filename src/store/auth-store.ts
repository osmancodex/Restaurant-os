import { create } from 'zustand';
import type { Staff } from '@/lib/types';

interface AuthStore {
  staff: Staff | null;
  setStaff: (staff: Staff | null) => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  staff: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('staff');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),

  setStaff: (staff) => {
    set({ staff });
    if (typeof window !== 'undefined') {
      if (staff) {
        localStorage.setItem('staff', JSON.stringify(staff));
      } else {
        localStorage.removeItem('staff');
      }
    }
  },

  isAuthenticated: () => {
    return get().staff !== null;
  },

  hasRole: (roles: string[]) => {
    const staff = get().staff;
    if (!staff) return false;
    return roles.includes(staff.role);
  },
}));
