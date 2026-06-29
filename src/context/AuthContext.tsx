import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { AppUser, UserRole } from "@/types";

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  rollNumber?: string;
  session?: string;
  libraryId?: string;
  libraryName?: string;
  employeeId?: string;

}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAppUser = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setAppUser(snap.data() as AppUser);
    } else {
      setAppUser(null);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadAppUser(user.uid);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadAppUser(cred.user.uid);
  };

  const signup = async (data: SignupData) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const newUser: AppUser = {
      uid: cred.user.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.role === "librarian" ? "pending" : "active",
      createdAt: Date.now(),
      ...(data.role === "student" && {
        department: data.department,
        rollNumber: data.rollNumber,
        session: data.session,
      }),
      ...(data.role === "librarian" && {
        libraryId: data.libraryId,
        libraryName: data.libraryName,
        employeeId: data.employeeId,
      }),
    };

    await setDoc(doc(db, "users", cred.user.uid), newUser);
    setAppUser(newUser);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setAppUser(null);
    setFirebaseUser(null);
  };

  const refreshAppUser = async () => {
    if (firebaseUser) {
      await loadAppUser(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        login,
        signup,
        logout,
        refreshAppUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}