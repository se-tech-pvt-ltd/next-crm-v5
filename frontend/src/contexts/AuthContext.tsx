import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { http, setUnauthorizedHandler } from '@/services/http';

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
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem('auth_user');
          }
        }

        // Validate session and fetch authoritative user id from backend
        try {
          const me = await http.get<{ id: string; role?: string }>('/api/auth/me');
          if (me?.id) {
            try {
              const UsersService = await import('@/services/users');
              const full = await UsersService.getUser(String(me.id));
              if (full) {
                setUser(full as any);
                localStorage.setItem('auth_user', JSON.stringify(full));
              }
            } catch {}
          }
        } catch {}

        // After user is determined, fetch role access
        const uid = (savedUser ? (JSON.parse(savedUser)?.id) : undefined) || (await (async () => {
          try { const me = await http.get<{ id: string }>('/api/auth/me'); return me?.id; } catch { return undefined; }
        })());
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
            const all = await UserAccessService.listUserAccess();
            const filtered = (Array.isArray(all) ? all : []).filter((a: any) => String(a.roleId ?? a.role_id) === roleId);
            setAccessByRole(filtered);
            try { if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(filtered)); } catch {}
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
    // Set minimal session immediately
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));

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
        localStorage.setItem('auth_user', JSON.stringify(merged));

        const roleId = String((merged as any)?.roleId ?? (merged as any)?.role_id ?? '');
        const UserAccessService = await import('@/services/userAccess');
        const all = await UserAccessService.listUserAccess();
        const filtered = (Array.isArray(all) ? all : []).filter((a: any) => String(a.roleId ?? a.role_id) === roleId);
        setAccessByRole(filtered);
        try { if (roleId) localStorage.setItem(`user_access_cache_${roleId}`, JSON.stringify(filtered)); } catch {}
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
