import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { http, setUnauthorizedHandler } from '@/services/http';
import { queryClient } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  role: string;
  branch?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser?: () => Promise<any | null>;
  accessByRole: any[];
  isAccessLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessByRole, setAccessByRole] = useState<any[]>([]);
  const [isAccessLoading, setIsAccessLoading] = useState(true);

  useEffect(() => {
    // Register global unauthorized handler (401) to logout
    setUnauthorizedHandler(() => {
      setUser(null);
      try { localStorage.removeItem('auth_user'); } catch {}
      try { localStorage.removeItem('auth_token'); } catch {}
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    // Restore from localStorage and validate session with backend
    const init = async () => {
      try {
        const savedUserRaw = (() => { try { return localStorage.getItem('auth_user'); } catch { return null; } })();
        let parsedSavedUser: any = null;
        if (savedUserRaw) {
          try { parsedSavedUser = JSON.parse(savedUserRaw); setUser(parsedSavedUser); } catch { try { localStorage.removeItem('auth_user'); } catch {} }
        }

        // Validate session and fetch authoritative user id from backend (single call)
        let me: { id?: string; role?: string } | null = null;
        try {
          me = await http.get<{ id: string; role?: string }>('/api/auth/me');
        } catch {
          me = null;
        }

        if (me?.id) {
          try {
            const UsersService = await import('@/services/users');
            const full = await UsersService.getUser(String(me.id)).catch(() => null);
            if (full) {
              setUser(full as any);
              try { localStorage.setItem('auth_user', JSON.stringify(full)); } catch {}
            }
          } catch {}
        }

        // After user is determined, fetch role access
        const uid = parsedSavedUser?.id || me?.id;
        if (uid) {
          try {
            const UsersService = await import('@/services/users');
            const fullUser = await UsersService.getUser(String(uid)).catch(() => null);
            const roleId = String((fullUser as any)?.roleId ?? (fullUser as any)?.role_id ?? '');
            const cacheKey = roleId ? `user_access_cache_${roleId}` : '';
            let cached: any[] = [];
            try { if (cacheKey) { const raw = localStorage.getItem(cacheKey); if (raw) cached = JSON.parse(raw); } } catch {}
            if (cached.length > 0) setAccessByRole(cached);
            setIsAccessLoading(true);
            const UserAccessService = await import('@/services/userAccess');
            const list = await UserAccessService.listUserAccess({ roleId }).catch(() => []);
            setAccessByRole(Array.isArray(list) ? list : []);
            try { if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(Array.isArray(list) ? list : [])); } catch {}
          } catch {}
        }
      } finally {
        setIsLoading(false);
        setIsAccessLoading(false);
      }
    };
    void init();
  }, []);

  const login = (userData: User) => {
    // Clear cached queries immediately to avoid showing previous user's data
    try {
      queryClient.clear();
    } catch (e) {}

    // Set minimal session immediately
    setUser(userData);
    try { localStorage.setItem('auth_user', JSON.stringify(userData)); } catch {}

    // Fetch full user profile and role access before UI depends on it
    (async () => {
      try {
        setIsAccessLoading(true);
        const UsersService = await import('@/services/users');
        let full: any = null;
        if (userData?.id) {
          full = await UsersService.getUser(String(userData.id)).catch(() => null);
        } else {
          try {
            const me = await http.get<{ id: string }>('/api/auth/me').catch(() => null);
            if (me?.id) full = await UsersService.getUser(String(me.id)).catch(() => null);
          } catch {}
        }
        const merged = { ...userData, ...(full || {}) } as User & any;
        setUser(merged);
        try { localStorage.setItem('auth_user', JSON.stringify(merged)); } catch {}

        const roleId = String((merged as any)?.roleId ?? (merged as any)?.role_id ?? '');
        const UserAccessService = await import('@/services/userAccess');
        const list = await UserAccessService.listUserAccess({ roleId }).catch(() => []);
        setAccessByRole(Array.isArray(list) ? list : []);
        try { if (roleId) localStorage.setItem(`user_access_cache_${roleId}`, JSON.stringify(Array.isArray(list) ? list : [])); } catch {}

        // Invalidate and refetch queries now that we have the authoritative user
        try {
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries();
        } catch (e) {}
      } catch {}
      finally {
        setIsAccessLoading(false);
      }
    })();
  };

  const logout = async () => {
    try {
      const { logout: apiLogout } = await import('@/services/auth');
      await apiLogout();
    } catch {}

    // Clear query cache on logout
    try { queryClient.clear(); } catch (e) {}

    setUser(null);
    try { localStorage.removeItem('auth_user'); } catch {}
    try { localStorage.removeItem('auth_token'); } catch {}
  };

  const refreshUser = async () => {
    try {
      if (!user?.id) return null;
      const UsersService = await import('@/services/users');
      const full = await UsersService.getUser(String(user.id));
      const merged = { ...(user as any), ...(full || {}) };
      setUser(merged);
      localStorage.setItem('auth_user', JSON.stringify(merged));
      return merged;
    } catch (err) {
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    refreshUser,
    accessByRole,
    isAccessLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
