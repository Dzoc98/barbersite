import { createContext } from "react";
import { User } from "@/types";

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterData) => Promise<User>;
  signIn: (username: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInAdmin: (username: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (userId: number, data: Partial<User>) => Promise<User>;
  updatePassword: (userId: number, currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (userId: number) => Promise<void>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
  password: string;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const defaultAuthContext: AuthContextType = {
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  register: async () => ({} as User),
  signIn: async () => ({} as User),
  signInWithGoogle: async () => ({} as User),
  signInAdmin: async () => ({} as User),
  signOut: async () => {},
  updateProfile: async () => ({} as User),
  updatePassword: async () => {},
  deleteAccount: async () => {},
};