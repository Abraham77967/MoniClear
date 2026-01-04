import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  signInAsGuest: () => void;
  logout: () => Promise<void>;
  migrateUserData: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for guest user in localStorage
    const guestUser = localStorage.getItem('moniclear_guest_user');
    if (guestUser === 'true') {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      // Migrate data when user signs in
      if (user && !isGuest) {
        try {
          await firestoreService.migrateLocalDataToFirestore(user.uid);
        } catch (error) {
          console.error('Data migration failed:', error);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isGuest]);

  const migrateUserData = async (): Promise<boolean> => {
    if (user && !isGuest) {
      return await firestoreService.migrateLocalDataToFirestore(user.uid);
    }
    return true;
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem('moniclear_guest_user');
      // Data migration will happen in useEffect when user state changes
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      localStorage.removeItem('moniclear_guest_user');
      // Data migration will happen in useEffect when user state changes
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      setIsGuest(false);
      localStorage.removeItem('moniclear_guest_user');
      // Data migration will happen in useEffect when user state changes
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setLoading(true);

      // Initialize reCAPTCHA verifier if it doesn't exist
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      // In a real app, you'd want to return this confirmationResult to handle the verification code
      // For now, we'll assume the sign-in is successful
      setIsGuest(false);
      localStorage.removeItem('moniclear_guest_user');
      // Data migration will happen in useEffect when user state changes
    } catch (error) {
      console.error('Phone sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem('moniclear_guest_user', 'true');
    setLoading(false);
  };

  const logout = async () => {
    try {
      // Clean up Firestore listeners
      firestoreService.cleanup();

      if (!isGuest) {
        await signOut(auth);
      }
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem('moniclear_guest_user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    signInAsGuest,
    logout,
    migrateUserData,
    resetPassword,
    sendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
