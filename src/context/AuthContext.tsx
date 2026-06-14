import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  jobTitle: string;
}

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: FirebaseUser | MockUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | MockUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage session first
    const localSession = localStorage.getItem('tasksync_session');
    if (localSession) {
      try {
        const user = JSON.parse(localSession);
        setCurrentUser(user);
        
        const storedProfile = localStorage.getItem(`tasksync_profile_${user.uid}`);
        const extraData = storedProfile ? JSON.parse(storedProfile) : { jobTitle: 'Developer' };
        
        setUserProfile({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          jobTitle: extraData.jobTitle || 'Developer'
        });
        setLoading(false);
        return; // Skip Firebase listener if we have an active local session
      } catch (e) {
        console.error("Error parsing local session", e);
      }
    }

    // 2. Otherwise listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Load extra profile data from local storage to augment firebase user
        const storedProfile = localStorage.getItem(`tasksync_profile_${user.uid}`);
        const extraData = storedProfile ? JSON.parse(storedProfile) : { jobTitle: 'Developer' };
        
        setUserProfile({
          displayName: user.displayName || 'สมชาย ใจดี',
          email: user.email,
          photoURL: user.photoURL,
          jobTitle: extraData.jobTitle || 'Developer'
        });
      } else {
        // Reset state
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    // Try Firebase first if configured
    const hasFirebase = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "dummy-key";
    if (hasFirebase) {
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        // Clean up any old local session
        localStorage.removeItem('tasksync_session');
        return;
      } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
          console.warn("Firebase email/password auth is disabled. Falling back to local authentication.");
        } else {
          throw error;
        }
      }
    }

    // Local authentication fallback
    const localUsersStr = localStorage.getItem('tasksync_local_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    
    const user = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid email or password)');
    }

    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null
    };

    localStorage.setItem('tasksync_session', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);

    const storedProfile = localStorage.getItem(`tasksync_profile_${user.uid}`);
    const extraData = storedProfile ? JSON.parse(storedProfile) : { jobTitle: 'Developer' };

    setUserProfile({
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || null,
      jobTitle: extraData.jobTitle || 'Developer'
    });
  };

  const registerWithEmail = async (email: string, password: string) => {
    // Try Firebase first if configured
    const hasFirebase = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "dummy-key";
    if (hasFirebase) {
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(auth, email, password);
        // Clean up any old local session
        localStorage.removeItem('tasksync_session');
        return;
      } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
          console.warn("Firebase email/password auth is disabled. Falling back to local registration.");
        } else {
          throw error;
        }
      }
    }

    // Local authentication fallback
    const localUsersStr = localStorage.getItem('tasksync_local_users');
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    
    if (localUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว (Email already in use)');
    }

    const uid = `local_${Date.now()}`;
    const displayName = email.split('@')[0];
    const newUser = {
      uid,
      email,
      password,
      displayName,
      photoURL: null
    };

    localUsers.push(newUser);
    localStorage.setItem('tasksync_local_users', JSON.stringify(localUsers));

    const sessionUser = {
      uid,
      email,
      displayName,
      photoURL: null
    };

    localStorage.setItem('tasksync_session', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);

    setUserProfile({
      displayName,
      email,
      photoURL: null,
      jobTitle: 'Developer'
    });
  };

  const loginWithGoogle = async () => {
    const hasFirebase = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "dummy-key";
    if (hasFirebase) {
      try {
        const { signInWithPopup } = await import('firebase/auth');
        const { googleProvider } = await import('../lib/firebase');
        await signInWithPopup(auth, googleProvider);
        localStorage.removeItem('tasksync_session');
        return;
      } catch (error: any) {
        console.error("Firebase Google Sign-In failed, falling back to mock login:", error);
      }
    }

    // Mock Google Sign-in fallback
    const mockUser = {
      uid: 'google_mock_12345',
      email: 'somchai@company.com',
      displayName: 'สมชาย ใจดี',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    };

    localStorage.setItem('tasksync_session', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    setUserProfile({
      displayName: mockUser.displayName,
      email: mockUser.email,
      photoURL: mockUser.photoURL,
      jobTitle: 'Developer'
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to log out of Firebase", error);
    }
    localStorage.removeItem('tasksync_session');
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      const key = currentUser ? `tasksync_profile_${currentUser.uid}` : `tasksync_profile_demo`;
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userProfile, 
      loading, 
      logout, 
      updateUserProfile,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle
    }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-6">
            <div className="three-body">
              <div className="three-body__dot"></div>
              <div className="three-body__dot"></div>
              <div className="three-body__dot"></div>
            </div>
            <span className="text-slate-500 font-medium animate-pulse mt-2">Authenticating...</span>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
