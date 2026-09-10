import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type UserRole = "citizen" | "centre" | "driver" | "admin";
export type AuthUser = { id: string; name: string; email: string; role: UserRole };
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Exclude<UserRole, "admin">) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const userKey = "plastic-loop-user";
const tokenKey = "plastic-loop-token";

const displayRole = (role: UserRole) => role === "admin" ? "Administrator" : role === "centre" ? "Centre staff" : role === "driver" ? "Driver" : "Citizen";

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as { token?: string; user?: AuthUser; error?: string };
  if (!response.ok || !data.token || !data.user) throw new Error(data.error ?? "Unable to sign in.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(userKey);
    return stored ? JSON.parse(stored) as AuthUser : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(tokenKey));
  }, []);

  const saveSession = (nextUser: AuthUser, token: string) => {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(nextUser));
    localStorage.setItem("plastic-loop-role", displayRole(nextUser.role));
    setUser(nextUser);
    setError(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, error,
    async login(email, password) {
      setLoading(true);
      try {
        const result = await requestAuth("login", { email, password });
        saveSession(result.user!, result.token!);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to sign in.");
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    async register(name, email, password, role) {
      setLoading(true);
      try {
        const result = await requestAuth("register", { name, email, password, role });
        saveSession(result.user!, result.token!);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to create account.");
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    logout() {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      localStorage.removeItem("plastic-loop-role");
      setUser(null);
    },
  }), [error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}