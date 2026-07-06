// firebase-messaging-sw.js
// This file must live in the SAME folder as index.html (the root of your site).
// It's what allows notifications to show up even when your site isn't open
// in a browser tab at all — it runs quietly in the background.

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
        icon: '/icon-192.png' // optional — replace with your actual app icon path if you have one
    };
    self.registration.showNotification(title, options);
});
