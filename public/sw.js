// COD Unified Lifestyle Service Worker
const CACHE_NAME = 'cod-hub-v1';

self.addEventListener('install', (event) => {
  console.log('COD SW Installed');
});

self.addEventListener('fetch', (event) => {
  // Pass-through strategy for production sync
});
