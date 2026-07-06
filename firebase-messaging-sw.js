// firebase-messaging-sw.js
// This file must live in the SAME folder as index.html (the root of your site).
// It's what allows notifications to show up even when your site isn't open
// in a browser tab at all — it runs quietly in the background.
// It ALSO now handles offline app-shell caching for the installable PWA/app.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCUrbsJh9jER3Rhl-YX44598OKTcky5Ncw",
    authDomain: "the-awakening-f0aee.firebaseapp.com",
    projectId: "the-awakening-f0aee",
    storageBucket: "the-awakening-f0aee.appspot.com",
    messagingSenderId: "774133878054",
    appId: "1:774133878054:web:d660a991da47df1a3105e7"
});

const messaging = firebase.messaging();

// This runs when a notification arrives while the site is CLOSED or in the background.
messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
    const title = payload.notification?.title || 'THE AWAKENING';
    const options = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/icon.png'
    };
    self.registration.showNotification(title, options);
});

// ===== PWA APP-SHELL CACHING =====
// Bump this version any time index.html/manifest/icon change, so old
// installs pick up the new files instead of serving a stale cached copy.
const CACHE_VERSION = 'awakening-shell-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch((err) => {
            console.warn('App shell caching failed (non-fatal):', err);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only handle same-origin GET requests. Everything else (Firestore, Auth,
    // FCM, your notification endpoint, cross-origin CDN scripts) passes straight
    // through to the network untouched — this is critical so live game data,
    // logins, and real-time listeners never get served from a stale cache.
    if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin){
        return;
    }

    // Navigations (loading the page itself): try the network first so players
    // always get your latest game logic when online, falling back to the
    // cached shell only if they're offline.
    if(req.mode === 'navigate'){
        event.respondWith(
            fetch(req).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Static assets (manifest, icons): cache-first, network as a fallback.
    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req))
    );
});
