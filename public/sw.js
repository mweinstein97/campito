// Este service worker es generado/sobrescrito por vite-plugin-pwa en producción.
// En desarrollo sirve como placeholder.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
