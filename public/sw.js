// Minimal service worker: makes Wave installable and handles notification clicks.
// Only static assets are cached; data always comes from the network (Supabase).
const CACHE = "wave-static-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/_next/static/")) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(e.request);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok) c.put(e.request, res.clone());
    return res;
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.taskId;
  const target = id ? `/app/tasks?open=${id}` : "/app";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if ("focus" in c) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
