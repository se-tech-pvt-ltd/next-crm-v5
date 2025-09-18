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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Register global unauthorized handler (401) to logout
    setUnauthorizedHandler(() => {
      setUser(null);
      localStorage.removeItem('auth_user');
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
            } catch (err) {
              // ignore
            }
          }
        } catch (e: any) {
          // http client will invoke unauthorized handler on 401
        }
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  const login = (userData: User) => {
    // Set minimal session immediately
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));

    // Fetch full user profile in background and merge
    (async () => {
      try {
        const UsersService = await import('@/services/users');
        const full = await UsersService.getUser(String(userData.id));
        const merged = { ...userData, ...(full || {}) } as User & any;
        setUser(merged);
        localStorage.setItem('auth_user', JSON.stringify(merged));
      } catch (err) {
        // ignore
      }
    })();
  };

  const logout = async () => {
    try {
      const { logout: apiLogout } = await import('@/services/auth');
      await apiLogout();
    } catch {}
    setUser(null);
    localStorage.removeItem('auth_user');
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
