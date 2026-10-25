// Shopeazy Merchant Admin Service Worker
// Strictly scoped to merchant dashboard and login - Never intercepts customer storefronts
const CACHE_NAME = "shopeazy-admin-v3";
const STATIC_ASSETS = [
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/apple-touch-icon.png",
  "/admin-manifest.json",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache addAll failed:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Ignore non-GET requests
  if (req.method !== "GET") {
    return;
  }

  // 2. Never intercept external requests (Meta Pixel, CDN, APIs)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Never intercept API routes or Next.js server actions
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) {
    return;
  }

  // 4. STRICT MERCHANT ISOLATION:
  // If the request is for a customer storefront or product page (not admin and not login), DO NOT INTERCEPT!
  const isAdminOrLogin =
    url.pathname.includes("/admin") ||
    url.pathname.startsWith("/login") ||
    url.pathname === "/admin-manifest.json";

  const isStaticPwaIcon =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-touch-icon.png";

  if (!isAdminOrLogin && !isStaticPwaIcon) {
    // Let browser handle customer storefront requests directly
    return;
  }

  // 5. Static assets for admin PWA -> Cache first
  if (isStaticPwaIcon) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 6. Admin HTML navigation -> Network first with cache fallback
  event.respondWith(
    fetch(req).catch(() => {
      return caches.match(req);
    })
  );
});

// Native Push Notifications for orders
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Shopeazy Vendeur", body: event.data ? event.data.text() : "Nouvelle mise à jour" };
  }

  const title = data.title || "Nouvelle commande reçue !";
  const options = {
    body: data.body || "Une nouvelle commande a été passée sur votre boutique.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/admin/orders"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
