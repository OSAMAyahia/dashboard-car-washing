import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, setAccessToken, getStoredRefreshToken, storeRefreshToken } from './api';

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

function applySession(body: { accessToken: string; refreshToken?: string; user: AuthUser }) {
  setAccessToken(body.accessToken);
  if (body.refreshToken) storeRefreshToken(body.refreshToken);
  return body.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // restore session from the refresh cookie on mount — falls back to a
  // locally-stored refresh token when the browser dropped the cross-site cookie
  useEffect(() => {
    (async () => {
      try {
        const stored = getStoredRefreshToken();
        const body = await api.post<{ accessToken: string; refreshToken?: string; user: AuthUser }>(
          '/auth/refresh',
          stored ? { refreshToken: stored } : undefined,
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
      const body = await api.post<{ accessToken: string; refreshToken?: string; user: AuthUser }>(
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
    const stored = getStoredRefreshToken();
    await api.post('/auth/logout', stored ? { refreshToken: stored } : undefined, { auth: false }).catch(() => {});
    storeRefreshToken(null);
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
