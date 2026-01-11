import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthUser {
  id: string;
  user_id: string;
  email: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  login: (user: AuthUser, session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedUser = parsed?.user;
        const storedSession = parsed?.session;

        const accessToken = storedSession?.access_token;
        if (storedUser && storedSession && typeof accessToken === 'string' && accessToken.length > 0) {
          setUser(storedUser);
          setSession(storedSession);
          await AsyncStorage.setItem('auth_token', accessToken);
        } else {
          // 兼容旧版本/损坏数据：避免启动时崩溃
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          await AsyncStorage.removeItem('auth_token');
        }
      }
    } catch (e) {
      console.error('Failed to load auth:', e);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (user: AuthUser, session: AuthSession) => {
    setUser(user);
    setSession(session);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, session }));
    await AsyncStorage.setItem('auth_token', session.access_token);
  };

  const logout = async () => {
    setUser(null);
    setSession(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
