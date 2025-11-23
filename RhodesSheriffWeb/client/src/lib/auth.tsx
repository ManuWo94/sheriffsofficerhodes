import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, Rank } from "@shared/schema";
import { DELETE_PERMISSIONS, TASK_ASSIGN_PERMISSIONS } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  canDelete: () => boolean;
  canAssignTasks: () => boolean;
  isAdmin: () => boolean;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sheriff_user");
    const token = localStorage.getItem("sheriff_session");
    if (stored && token) {
      setUser(JSON.parse(stored));
      setSessionToken(token);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || "Login fehlgeschlagen" };
      }

      const data = await response.json();
      const { sessionToken: token, ...userData } = data;
      
      setUser(userData as User);
      setSessionToken(token);
      localStorage.setItem("sheriff_user", JSON.stringify(userData));
      localStorage.setItem("sheriff_session", token);
      
      return { 
        success: true, 
        mustChangePassword: userData.mustChangePassword === 1 
      };
    } catch (error) {
      return { success: false, error: "Verbindungsfehler" };
    }
  };

  const logout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem("sheriff_user");
    localStorage.removeItem("sheriff_session");
  };

  const changePassword = async (newPassword: string) => {
    if (!user || !sessionToken) return { success: false, error: "Nicht angemeldet" };

    try {
      const currentToken = localStorage.getItem("sheriff_session");
      
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(currentToken && { "x-session-token": currentToken }),
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        return { success: false, error: "Passwortänderung fehlgeschlagen" };
      }

      const data = await response.json();
      
      // Update session token after password change
      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
        localStorage.setItem("sheriff_session", data.sessionToken);
      }

      const updatedUser = { ...user, mustChangePassword: 0 };
      setUser(updatedUser);
      localStorage.setItem("sheriff_user", JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: "Verbindungsfehler" };
    }
  };

  const canDelete = () => {
    if (!user) return false;
    return DELETE_PERMISSIONS.includes(user.rank as Rank);
  };

  const canAssignTasks = () => {
    if (!user) return false;
    return TASK_ASSIGN_PERMISSIONS.includes(user.rank as Rank);
  };

  const isAdmin = () => {
    return user?.rank === "Sheriff";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, canDelete, canAssignTasks, isAdmin, sessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
