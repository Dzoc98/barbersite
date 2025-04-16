import { useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  firebaseSignOut, 
  updateProfile,
  onAuthStateChanged
} from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { apiRequest } from "@/lib/queryClient";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { 
  AuthContextType, 
  RegisterData, 
  AuthProviderProps, 
  defaultAuthContext 
} from "./AuthUtils";
import { createContext } from "react";

// Using the context from AuthUtils
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            console.log("Firebase user authenticated:", firebaseUser.uid);
            
            // Try to fetch user info from backend using Firebase UID
            const response = await fetch('/api/auth/me', {
              headers: {
                'firebase-uid': firebaseUser.uid
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              setIsAdmin(userData.isAdmin);
            } else {
              console.error("User found in Firebase but not in backend");
              setUser(null);
            }
          } else {
            console.log("No Firebase user found");
            setUser(null);
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const register = async (userData: RegisterData): Promise<User> => {
    try {
      // Register user in backend
      const response = await apiRequest('POST', '/api/auth/register', userData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const newUser = await response.json();
      
      // Auto sign in after registration
      await signIn(userData.username, userData.password);
      
      return newUser;
    } catch (error: any) {
      setError(error?.message || 'Registration failed');
      throw error;
    }
  };

  const signIn = async (username: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      setError(null);
      return userData;
    } catch (error: any) {
      setError(error?.message || 'Login failed');
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      // Create a Google auth provider
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Enable one-tap sign-in
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log("Starting Google sign-in popup...");
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      
      console.log("Firebase Auth result:", result.user.uid);
      
      // Check if user exists in backend or create a new user
      const response = await apiRequest('POST', '/api/auth/google-login', { 
        firebaseUid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google login failed');
      }

      const userData = await response.json();
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      setError(null);
      return userData;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError(error?.message || 'Google login failed');
      throw error;
    }
  };

  const signInAdmin = async (username: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest('POST', '/api/auth/admin-login', { username, password });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Admin login failed');
      }

      const userData = await response.json();
      
      if (!userData.isAdmin) {
        throw new Error('Unauthorized: Not an admin account');
      }
      
      setUser(userData);
      setIsAdmin(true);
      setError(null);
      return userData;
    } catch (error: any) {
      setError(error?.message || 'Admin login failed');
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Sign out from Firebase first
      await firebaseSignOut(auth);
      
      // Then sign out from our backend
      await apiRequest('POST', '/api/auth/logout', {});
      
      // Update local state
      setUser(null);
      setIsAdmin(false);
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Logout failed');
      throw error;
    }
  };

  const updateProfile = async (userId: number, data: Partial<User>): Promise<User> => {
    try {
      const response = await apiRequest('PUT', `/api/users/${userId}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setError(null);
      return updatedUser;
    } catch (error: any) {
      setError(error?.message || 'Profile update failed');
      throw error;
    }
  };

  const updatePassword = async (userId: number, currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await apiRequest('PUT', `/api/users/${userId}/password`, {
        currentPassword,
        newPassword,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password update failed');
      }
      
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Password update failed');
      throw error;
    }
  };

  const deleteAccount = async (userId: number): Promise<void> => {
    try {
      await apiRequest('DELETE', `/api/users/${userId}`, undefined);
      setUser(null);
      setIsAdmin(false);
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Account deletion failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        error,
        register,
        signIn,
        signInWithGoogle,
        signInAdmin,
        signOut,
        updateProfile,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
