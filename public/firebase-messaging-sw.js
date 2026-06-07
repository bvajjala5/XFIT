importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Config is injected at runtime via query params on the SW URL (see notifications.js)
self.addEventListener('message', event => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(payload => {
      const { title, body, icon } = payload.notification ?? {};
      self.registration.showNotification(title ?? 'XFit', {
        body: body ?? '',
        icon: icon ?? '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data,
      });
    });
  }
});
