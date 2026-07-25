'use client';

import { useAuthStore } from '@/store/auth-store';
import type { Staff } from '@/lib/types';
import { toast } from 'sonner';

export function useAuth() {
  const { staff, setStaff, isAuthenticated, hasRole } = useAuthStore();

  function getStaff(): Staff | null {
    return staff;
  }

  async function login(email: string, password: string): Promise<Staff> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || 'Login failed');
    }

    const loggedInStaff: Staff = json.data.staff;
    setStaff(loggedInStaff);
    return loggedInStaff;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the API call fails, clear local state
    }
    setStaff(null);
    toast.success('Logged out successfully');
  }

  function checkIsAuthenticated(): boolean {
    return isAuthenticated();
  }

  function checkHasRole(roles: string[]): boolean {
    return hasRole(roles);
  }

  return {
    getStaff,
    login,
    logout,
    isAuthenticated: checkIsAuthenticated,
    hasRole: checkHasRole,
    staff,
  };
}
