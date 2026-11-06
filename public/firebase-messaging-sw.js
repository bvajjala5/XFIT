importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// The Firebase web config is public (it identifies the project, it is not a
// secret). It is passed in the worker URL so the worker still has it after a
// browser restart, before any page has had a chance to postMessage it.
let initialized = false;

function initFirebase(config) {
  if (initialized || !config) return;
  if (!firebase.apps.length) firebase.initializeApp(config);

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification ?? {};
    self.registration.showNotification(title ?? 'Uttar Fitness', {
      body: body ?? '',
      icon: icon ?? '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data,
    });
  });

  initialized = true;
}

try {
  const raw = new URL(self.location.href).searchParams.get('config');
  if (raw) initFirebase(JSON.parse(raw));
} catch (error) {
  console.warn('Could not parse push worker config:', error);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') initFirebase(event.data.config);
});
