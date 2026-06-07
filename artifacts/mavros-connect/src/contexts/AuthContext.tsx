import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter, useLogin, useLogout, type User, type LoginInput } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    // Setup token getter for custom-fetch
    setAuthTokenGetter(() => localStorage.getItem("mavros_access_token"));

    const storedToken = localStorage.getItem("mavros_access_token");
    const storedUser = localStorage.getItem("mavros_user");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("mavros_access_token");
        localStorage.removeItem("mavros_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginInput) => {
    const response = await loginMutation.mutateAsync({ data });
    localStorage.setItem("mavros_access_token", response.accessToken);
    localStorage.setItem("mavros_user", JSON.stringify(response.user));
    setUser(response.user);
    setLocation("/dashboard");
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem("mavros_access_token");
    localStorage.removeItem("mavros_user");
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
