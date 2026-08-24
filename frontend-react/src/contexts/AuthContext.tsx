import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';

export type AuthUser = { id: string; email?: string; name?: string | null; role: 'ADMIN' | 'PATIENT'; patientId?: string | null };
type AuthContextValue = { user: AuthUser | null; loading: boolean; login: (identifier: string, password: string) => Promise<AuthUser>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<{ user: AuthUser & { userId?: string } }>('/api/auth/me').then(({ user: current }) => setUser({ ...current, id: current.id ?? current.userId! })).catch((error) => { if (!(error instanceof ApiError) || error.status !== 401) console.error(error); }).finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, loading, login: async (identifier, password) => { const result = await api<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }); setUser(result.user); return result.user; }, logout: async () => { setUser(null); try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* A saída local não depende da disponibilidade do servidor. */ } } }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.'); return context; }
