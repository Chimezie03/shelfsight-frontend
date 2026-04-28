"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  loginApi,
  logoutApi,
  fetchCurrentUser,
  signupApi,
  acceptInviteApi,
  type AuthUser,
} from "@/lib/auth";

interface SignupInput {
  orgName: string;
  name: string;
  email: string;
  password: string;
}

interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  acceptInvite: (input: AcceptInviteInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        // No valid session — stay logged out
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authedUser = await loginApi(email, password);
    setUser(authedUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const authedUser = await signupApi(input);
    setUser(authedUser);
  }, []);

  const acceptInvite = useCallback(async (input: AcceptInviteInput) => {
    const authedUser = await acceptInviteApi(input);
    setUser(authedUser);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    acceptInvite,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
