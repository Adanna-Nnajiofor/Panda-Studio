"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearStoredSession,
  extractAuthSession,
  getStoredToken,
  getStoredUser,
  setStoredSession,
  apiFetch,
  type ApiUser,
  type NormalizedAuthSession,
  API_BASE_URL,
} from "../lib/api";

import { roleHomePath, type Role } from "../lib/roles";

export type Credentials = {
  email: string;
  password: string;
  name?: string;
  role?: Role | string;
};

export type AuthContextValue = {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<ApiUser>;
  register: (credentials: Credentials) => Promise<ApiUser>;
  signIn: (
    credentials: Pick<Credentials, "email" | "password">,
  ) => Promise<ApiUser>;
  signUp: (credentials: Credentials) => Promise<ApiUser>;
  logout: () => void;
  refreshSession: (payload: unknown) => NormalizedAuthSession | null;
  redirectAfterAuth: (fallbackRole?: string | null) => string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildAuthUrl(action: "login" | "register") {
  // FIX: now points to backend (NOT Next.js frontend)
  return `${API_BASE_URL}/auth/${action}`;
}

function normalizeRole(role?: string | null): Role | string | undefined {
  return role ?? undefined;
}

function parseAuthError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedToken = typeof window !== "undefined" ? getStoredToken() : null;

  const storedUser = typeof window !== "undefined" ? getStoredUser() : null;

  const [user, setUser] = useState<ApiUser | null>(storedUser);
  const [token, setToken] = useState<string | null>(storedToken);
  const [loading] = useState(false);

  const syncSession = useCallback((session: NormalizedAuthSession | null) => {
    if (!session) {
      clearStoredSession();
      setUser(null);
      setToken(null);
      return null;
    }

    setStoredSession(session);
    setUser(session.user);
    setToken(session.token);
    return session;
  }, []);

  const refreshSession = useCallback(
    (payload: unknown) => {
      const session = extractAuthSession(payload);
      return syncSession(session);
    },
    [syncSession],
  );

  const authenticate = useCallback(
    async (action: "login" | "register", credentials: Credentials) => {
      const response = await apiFetch(buildAuthUrl(action), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          role: normalizeRole(credentials.role),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          parseAuthError(
            payload,
            action === "login" ? "Login failed." : "Registration failed.",
          ),
        );
      }

      const session = extractAuthSession(payload);

      if (!session) {
        throw new Error("Invalid authentication response from server.");
      }

      syncSession(session);
      return session.user;
    },
    [syncSession],
  );

  const login = useCallback(
    async (credentials: Credentials) => authenticate("login", credentials),
    [authenticate],
  );

  const register = useCallback(
    async (credentials: Credentials) => authenticate("register", credentials),
    [authenticate],
  );

  const signIn = useCallback(
    async (credentials: Pick<Credentials, "email" | "password">) =>
      login(credentials),
    [login],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => register(credentials),
    [register],
  );

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      signIn,
      signUp,
      logout,
      refreshSession,
      redirectAfterAuth: (fallbackRole?: string | null) =>
        roleHomePath((user?.role as string | null) ?? fallbackRole ?? null),
    }),
    [
      loading,
      login,
      logout,
      refreshSession,
      register,
      signIn,
      signUp,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
