import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request notification permission, register the FCM service worker,
 * obtain a token, and persist it to Firestore under users/{uid}/fcmTokens/{token}.
 * Returns the token string, or null if permission was denied / not supported.
 */
export async function registerPushNotifications(userId) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (!VAPID_KEY) {
    console.warn('Push notifications are disabled because VITE_FIREBASE_VAPID_KEY is not set.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const messaging = getMessaging(app);

    // Register (or reuse) our dedicated SW and wait until it can receive config.
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const ready = await navigator.serviceWorker.ready;

    // Send the Firebase config to the SW so it can initialise
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    ready.active?.postMessage({ type: 'FIREBASE_CONFIG', config });

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: ready });
    if (!token) return null;

    // Persist token so Cloud Functions can target this device
    await setDoc(
      doc(db, 'users', userId, 'fcmTokens', token),
      { token, updatedAt: serverTimestamp(), platform: 'web' }
    );

    return token;
  } catch (err) {
    console.error('FCM registration error:', err);
    return null;
  }
}

/**
 * Subscribe to foreground messages. Returns an unsubscribe function.
 * Caller is responsible for displaying the notification (browsers suppress
 * service-worker notifications when the page is in the foreground).
 */
export function onForegroundMessage(callback) {
  let unsub = () => {};
  let cancelled = false;

  isSupported()
    .then(supported => {
      if (!supported || cancelled) return;
      unsub = onMessage(getMessaging(app), callback) || (() => {});
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    unsub();
  };
}
