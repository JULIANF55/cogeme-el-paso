// sw.js - Service Worker para Cógeme el paso

const CACHE_NAME = 'cogeme-el-paso-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/tasks.js',
    '/js/timer.js',
    '/js/calendar.js',
    '/js/reminders.js',
    '/js/goals.js',
    '/js/reports.js',
    '/data/tutorial-content.json',
    '/images/logo.png',
    '/manifest.json'
];

// Evento 'install': se ejecuta cuando el Service Worker se instala por primera vez
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching de activos de la aplicación');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Forzar la activación del nuevo Service Worker
    );
});

// Evento 'activate': se ejecuta cuando el Service Worker se activa
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Eliminar cachés antiguas que no coincidan con el CACHE_NAME actual
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            ).then(() => self.clients.claim()); // Tomar control de las páginas existentes
        })
    );
});

// Evento 'fetch': se ejecuta cada vez que la aplicación intenta obtener un recurso
self.addEventListener('fetch', (event) => {
    // Solo cachear solicitudes GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si el recurso está en caché, devolverlo
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en caché, intentar obtenerlo de la red
                return fetch(event.request)
                    .then((response) => {
                        // Verificar si la respuesta es válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonar la respuesta porque la corriente de la respuesta solo se puede leer una vez
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache); // Almacenar la respuesta en caché
                            });

                        return response;
                    })
                    .catch(() => {
                        // Si la red falla y no hay caché, puedes devolver una página offline
                        // Por ejemplo, para la navegación principal, puedes devolver index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        // Para otros recursos, puedes devolver un fallback o un error
                        return new Response('Offline Content', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

// Evento 'message': para comunicación entre la aplicación y el Service Worker
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
