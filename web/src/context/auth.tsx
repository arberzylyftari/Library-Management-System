import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On load, if we have a token, resolve the current user (or drop a stale token).
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const applyAuth = (res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
  };

  const login = async (email: string, password: string) => {
    applyAuth(await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }));
  };

  const register = async (name: string, email: string, password: string) => {
    applyAuth(
      await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      }),
    );
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
