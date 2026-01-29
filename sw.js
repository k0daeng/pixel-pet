const CACHE_NAME = "pixel-pet-v64";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./bot.js",
  "./bot_rules.json",
  "./storage.js",
  "./manifest.json",
  "./bgm/bgm.mp3",
  "./bgm/똥.mp3",
  "./bgm/샤워.mp3",
  "./bgm/행복.mp3",
  "./bgm/버튼.mp3",
  "./bgm/생성.mp3",
  "./bgm/다이.mp3",
  "./bgm/배고픔.mp3",
  "./bgm/졸림.mp3",
  "./img/192.png",
  "./img/512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/bot_rules.json") || url.pathname.endsWith("bot_rules.json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCRHJ6J-l73U5ciICENBM_MqTSm-QDK3dA",
  authDomain: "damagochi-6e46d.firebaseapp.com",
  projectId: "damagochi-6e46d",
  storageBucket: "damagochi-6e46d.firebasestorage.app",
  messagingSenderId: "406396759712",
  appId: "1:406396759712:web:ce12b49537988901ef63c5",
  measurementId: "G-R3ZDKEXMPG",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Pixel Pet";
  const body = payload?.notification?.body || "";
  self.registration.showNotification(title, {
    body,
  });
});





