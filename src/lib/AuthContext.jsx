import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid, firebaseUser = null) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        // Patch missing full_name from Google auth
        if (!data.full_name && firebaseUser?.displayName) {
          await setDoc(ref, { full_name: firebaseUser.displayName, profile_picture: firebaseUser.photoURL || '' }, { merge: true });
          data.full_name = firebaseUser.displayName;
        }
        setUserData({ id: uid, ...data });
      }
      return snap.data();
    } catch (err) {
      console.error('fetchUserData error:', err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserData(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const { user: u } = result;
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: u.email,
        full_name: u.displayName || '',
        profile_picture: u.photoURL || '',
        fitness_goal: '',
        experience_level: '',
        preferred_types: [],
        distance_unit: 'miles',
        goals: {},
        journal_entries: [],
        onboarding_complete: false,
        createdAt: serverTimestamp(),
      });
    }
    await fetchUserData(u.uid);
    return u;
  };

  const logout = () => signOut(auth);

  const updateUserData = async (updates) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, updates, { merge: true });
    setUserData(prev => ({ ...prev, ...updates }));
  };

  const refreshUserData = async () => {
    if (!user) return;
    await fetchUserData(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout, updateUserData, refreshUserData,
      // Aliases used by pages
      userDoc: userData, updateUserDoc: updateUserData, refreshUserDoc: refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
