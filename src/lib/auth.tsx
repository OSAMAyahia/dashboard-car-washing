import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, setAccessToken } from './api';

export interface AuthUser {
  id: string;
  type: 'customer' | 'staff' | 'platform';
  name: string | null;
  tenantId: string | null;
  role: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** staff / platform password login */
  loginPassword: (kind: 'staff' | 'platform', email: string, password: string) => Promise<AuthUser>;
  /** try platform, then staff — returns the resolved user */
  loginSmart: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function applySession(body: { accessToken: string; user: AuthUser }) {
  setAccessToken(body.accessToken);
  return body.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const body = await api.post<{ accessToken: string; user: AuthUser }>(
          '/auth/refresh',
          undefined,
          { auth: false },
        );
        setUser(applySession(body));
      } catch {
        /* not logged in */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginPassword = useCallback(
    async (kind: 'staff' | 'platform', email: string, password: string) => {
      const body = await api.post<{ accessToken: string; user: AuthUser }>(
        `/auth/${kind}/login`,
        { email, password },
        { auth: false },
      );
      const u = applySession(body);
      setUser(u);
      return u;
    },
    [],
  );

  const loginSmart = useCallback(
    async (email: string, password: string) => {
      try {
        return await loginPassword('platform', email, password);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 404)) {
          return await loginPassword('staff', email, password);
        }
        throw e;
      }
    },
    [loginPassword],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout', undefined, { auth: false }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, loginPassword, loginSmart, logout }),
    [user, loading, loginPassword, loginSmart, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { ApiError };
