/* Service worker dasar: menyimpan cangkang aplikasi agar bisa dipasang (PWA).
 * Sesuai batasan penelitian, input data saat luring (offline) TIDAK didukung;
 * ubin peta OpenStreetMap selalu diambil dari jaringan. */
const CACHE = 'siapj-shell-v1';
const SHELL = [
  './', './index.html', './css/style.css', './js/data.js', './js/app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('tile.openstreetmap.org')) return;
  // Network-first untuk berkas aplikasi agar perubahan prototipe langsung terlihat
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
