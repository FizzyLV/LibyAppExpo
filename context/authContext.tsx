import { GetUserData } from '@/utils/authUtility';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<{
    token: string | null;
    isAuthenticated: boolean;
  }>({
    token: null,
    isAuthenticated: false,
  });

  // Load auth state on mount
  useEffect(() => {
    const userData = GetUserData();
    setAuthState({
      token: userData.token,
      isAuthenticated: !!userData.token,
    });
    setIsLoading(false);
  }, []);

  const signIn = (token: string) => {
    setAuthState({
      token,
      isAuthenticated: true,
    });
  };

  const signOut = () => {
    setAuthState({
      token: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isLoading,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}