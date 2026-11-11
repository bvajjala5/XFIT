import { doc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { app } from './firebase';
import { db } from './firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Keep the FCM worker on its own scope. Registering it at `/` would replace the
// Vite PWA worker (same scope) and break offline support / precaching.
const FCM_SCOPE = '/firebase-push/';

function waitForActivation(registration) {
  const worker = registration.active || registration.waiting || registration.installing;
  if (!worker || worker.state === 'activated') return Promise.resolve(registration);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.removeEventListener('statechange', onState);
      reject(new Error('Service worker activation timed out'));
    }, 10_000);
    const onState = () => {
      if (worker.state !== 'activated') return;
      clearTimeout(timer);
      worker.removeEventListener('statechange', onState);
      resolve(registration);
    };
    worker.addEventListener('statechange', onState);
  });
}

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
    const { getToken, getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const messaging = getMessaging(app);

    // Older builds registered this worker at `/`, where it competed with the PWA
    // worker. Remove that registration before installing the scoped one.
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(async (registration) => {
      const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || '';
      if (script.endsWith('/firebase-messaging-sw.js') && new URL(registration.scope).pathname === '/') {
        await registration.unregister();
      }
    }));

    // The Firebase web config is public. Passing it in the worker URL keeps the
    // worker initialised after a browser restart, before a page can postMessage.
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const swUrl = `/firebase-messaging-sw.js?config=${encodeURIComponent(JSON.stringify(config))}`;

    const registration = await waitForActivation(
      await navigator.serviceWorker.register(swUrl, { scope: FCM_SCOPE })
    );

    if (!registration.active) throw new Error('Push service worker is not active');
    registration.active.postMessage({ type: 'FIREBASE_CONFIG', config });

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
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

  import('firebase/messaging')
    .then(async ({ getMessaging, isSupported, onMessage }) => {
      if (cancelled) return;
      const supported = await isSupported().catch(() => false);
      if (!supported || cancelled) return;
      unsub = onMessage(getMessaging(app), callback) || (() => {});
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    unsub();
  };
}
