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
          try {
            await http.get<{ id: string; role?: string }>('/api/auth/me');
          } catch (e: any) {
            // http client will invoke unauthorized handler on 401
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
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
