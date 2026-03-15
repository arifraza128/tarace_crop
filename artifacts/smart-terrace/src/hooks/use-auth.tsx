import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useRegister, type LoginBody, type RegisterBody, type User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('stf_token'));
  
  const { data: user, isLoading: isMeLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const login = async (data: LoginBody) => {
    const res = await loginMutation.mutateAsync({ data });
    localStorage.setItem('stf_token', res.token);
    setToken(res.token);
    await refetch();
    setLocation('/dashboard');
  };

  const registerUser = async (data: RegisterBody) => {
    const res = await registerMutation.mutateAsync({ data });
    localStorage.setItem('stf_token', res.token);
    setToken(res.token);
    await refetch();
    setLocation('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('stf_token');
    setToken(null);
    setLocation('/login');
  };

  // Check auth requirement for routes
  useEffect(() => {
    const path = window.location.pathname;
    const isPublic = path === '/login' || path === '/register';
    
    if (!token && !isPublic) {
      setLocation('/login');
    } else if (token && isPublic) {
      setLocation('/dashboard');
    }
  }, [token, setLocation]);

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading: isMeLoading || loginMutation.isPending || registerMutation.isPending,
      login,
      register: registerUser,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
