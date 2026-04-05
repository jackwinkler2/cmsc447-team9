import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "fieldcrew" | "driver" | "admin" | null;

type AuthContextType = {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  function login(role: Role) {
    setRole(role);
  }

  function logout() {
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
