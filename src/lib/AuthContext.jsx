import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { clearAppCaches } from './cache';
import { clearSessionHint, hasSessionHint, markSessionHint } from './session';
import { isNativeApp } from './platform';

// Load Firestore on demand. Anonymous visitors only need Auth to reach the login
// screen, so the Firestore SDK stays out of the first-paint bundle.
async function getFirestoreApi() {
  const [firestore, sdk] = await Promise.all([
    import('./firestore'),
    import('firebase/firestore/lite'),
  ]);
  return { db: firestore.db, ...sdk };
}

// Load the Auth SDK on demand too. A visitor reading the landing page never
// downloads it, so `firebase/auth` stays off the critical path; it is fetched
// the moment a session is restored, a protected route opens, or sign-in starts.
let authApiPromise = null;
function getAuthApi() {
  if (!authApiPromise) {
    authApiPromise = Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ]).then(([firebase, sdk]) => ({
      auth: firebase.auth,
      googleProvider: firebase.googleProvider,
      ...sdk,
    }));
  }
  return authApiPromise;
}

const AuthContext = createContext();

// Analytics is loaded on demand: an anonymous visitor should not fetch
// Firestore/Auth SDKs just to count an app open.
function trackEvent(name, props) {
  void import('./usageAnalytics')
    .then(({ track }) => track(name, props))
    .catch(() => {});
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  // Only block the first render on a session restore when this device may
  // actually have a session. Anonymous visitors get `loading: false` right
  // away, so the public landing page paints without waiting on Firebase.
  const [loading, setLoading] = useState(() => hasSessionHint());
  const [authError, setAuthError] = useState('');

  const unsubRef = useRef(null);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  // Auth can report the same session more than once; count each restore/sign-in
  // only once (and reset on sign-out so a later sign-in is counted again).
  const trackedSignInRef = useRef(null);

  const fetchUserData = useCallback(async (uid, firebaseUser = null) => {
    try {
      const { db, doc, getDoc, setDoc } = await getFirestoreApi();
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
  }, []);

  // Shared by popup sign-in and the native redirect handoff. Creating the
  // profile is idempotent: returning users keep their existing document.
  const ensureUserDocument = useCallback(async (u) => {
    markSessionHint();
    const { db, doc, getDoc, setDoc, serverTimestamp } = await getFirestoreApi();
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
      trackEvent('signup_completed');
    }
    await fetchUserData(u.uid, u);
  }, [fetchUserData]);

  // Attach the Firebase auth listener. Idempotent, and deliberately lazy:
  // returning visitors (a session hint exists) restore immediately, while
  // anonymous visitors only pay for the Auth SDK's network round trips when
  // they sign in or open a protected route. This keeps the auth iframe and
  // getProjectConfig calls off the landing page's critical path.
  const ensureAuth = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    getAuthApi()
      .then(({ auth, onAuthStateChanged }) => {
        if (cancelledRef.current || unsubRef.current) return;
        unsubRef.current = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            markSessionHint();
            setUser(firebaseUser);
            if (trackedSignInRef.current !== firebaseUser.uid) {
              trackedSignInRef.current = firebaseUser.uid;
              trackEvent('sign_in_completed');
            }
            await fetchUserData(firebaseUser.uid, firebaseUser);
          } else {
            clearSessionHint();
            trackedSignInRef.current = null;
            setUser(null);
            setUserData(null);
          }
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error('auth init error:', err);
        setLoading(false);
      });
  }, [fetchUserData]);

  useEffect(() => {
    cancelledRef.current = false;
    // Native has no session hint on a fresh install, but it still needs the
    // listener so a completed redirect restores the signed-in session.
    if (hasSessionHint() || isNativeApp()) ensureAuth();
    return () => {
      cancelledRef.current = true;
      unsubRef.current?.();
      unsubRef.current = null;
      startedRef.current = false;
    };
  }, [ensureAuth]);

  // A native redirect reloads the WebView. Pick up the result on the way back
  // and finish the same profile setup the popup path uses on the website.
  useEffect(() => {
    if (!isNativeApp()) return undefined;
    let cancelled = false;
    getAuthApi()
      .then(async ({ auth, getRedirectResult }) => {
        const result = await getRedirectResult(auth);
        if (cancelled || !result?.user) return;
        await ensureUserDocument(result.user);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('auth redirect error:', err);
        setAuthError('Google sign-in could not be completed. Please try again.');
      });
    return () => { cancelled = true; };
  }, [ensureUserDocument]);

  const signInWithGoogle = async () => {
    const api = await getAuthApi();
    // Start tracking auth before the handoff so the resolved session lands in
    // context (and localStorage gets the hint) even on a first-time visit.
    ensureAuth();
    setAuthError('');
    if (isNativeApp()) {
      // Firebase popups are unreliable in the Android WebView; a full-page
      // redirect survives the trip through accounts.google.com.
      await api.signInWithRedirect(api.auth, api.googleProvider);
      return null;
    }
    const result = await api.signInWithPopup(api.auth, api.googleProvider);
    const u = result.user;
    await ensureUserDocument(u);
    return u;
  };

  const clearAuthError = () => setAuthError('');

  const logout = async () => {
    const { auth, signOut } = await getAuthApi();
    await clearAppCaches();
    await signOut(auth);
    clearSessionHint();
  };

  const updateUserData = async (updates) => {
    if (!user) return;
    const { db, doc, setDoc } = await getFirestoreApi();
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, updates, { merge: true });
    setUserData(prev => ({ ...prev, ...updates }));
  };

  const refreshUserData = async () => {
    if (!user) return;
    await fetchUserData(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, authError, clearAuthError, ensureAuth, signInWithGoogle, logout, updateUserData, refreshUserData,
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
