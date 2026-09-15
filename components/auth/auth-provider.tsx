/**
 * @file components/auth/auth-provider.tsx
 * @description Global Client-Side Authentication State Provider & useAuth() Hook.
 * @purpose Manages user session state, auto-hydrates from HTTP-only cookie, and exposes login, register, logout methods.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/types/api.types";

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface StudentProfile {
  userId: number;
  firstName: string;
  lastName?: string | null;
  collegeId?: number | null;
  courseId?: number | null;
  semester?: number | null;
  careerGoal?: string | null;
  evaluationScheme?: string | null;
  targetSgpa?: number | null;
  programmingLevel?: string | null;
  technicalInterests?: string[] | null;
  createdAt?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Hydrates user session on mount by checking the HTTP-only cookie via /api/profile.
   */
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const profileData: StudentProfile = json.data;
          setProfile(profileData);
          setUser({
            userId: profileData.userId,
            email: "", // Profile endpoint returns profile details; user is active
            role: "student",
          });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Signs in user with email & password, sets session state.
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.message || "Invalid email or password.",
        };
      }

      if (json.data?.user) {
        setUser(json.data.user);
        if (json.data.profile) {
          setProfile(json.data.profile);
        }
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred during login. Please try again." };
    }
  };

  /**
   * Registers a new student account, initializes session, and sets state.
   */
  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          role: "student",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.message || "Registration failed.",
        };
      }

      if (json.data?.user) {
        setUser(json.data.user);
        if (json.data.profile) {
          setProfile(json.data.profile);
        }
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred during registration. Please try again." };
    }
  };

  /**
   * Terminates user session, clears HTTP-only cookie, and resets client state.
   */
  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Gracefully continue with client-side cleanup
    } finally {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
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
