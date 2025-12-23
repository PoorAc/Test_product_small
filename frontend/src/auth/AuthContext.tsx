import { createContext, useContext, useEffect, useState } from "react";
import keycloak from "./keycloak";

type AuthContextType = {
  keycloak: Keycloak.KeycloakInstance;
  authenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  if (!ready) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <AuthContext.Provider value={{ keycloak, authenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
