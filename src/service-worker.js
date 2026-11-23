/* eslint-disable no-restricted-globals */
/* ════════════════════════════════════════════════════════════
   Service worker de TRIAGE360 (CRA + Workbox InjectManifest).
   - Guarda en el teléfono la "cáscara" de la app (JS/CSS/HTML) para
     que abra aun sin señal.
   - NUNCA guarda respuestas de Supabase ni de /api: son datos
     clínicos de pacientes y no deben quedar en caché del navegador.
     Las escrituras sin red las maneja la cola offline de la app.
   - Las actualizaciones esperan a que el usuario las acepte, para no
     recargar la app a mitad de una ficha.
   ════════════════════════════════════════════════════════════ */
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

// Navegación (abrir la app / recargar): servir index.html desde caché
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(process.env.PUBLIC_URL + "/index.html"), {
    denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
  })
);

// Datos: siempre a la red, jamás a caché
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/") || url.hostname.endsWith(".supabase.co"),
  new NetworkOnly()
);

// Imágenes estáticas de la app
registerRoute(
  ({ request, url }) => request.destination === "image" && url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: "imagenes",
    plugins: [new ExpirationPlugin({ maxEntries: 40 })],
  })
);

// La app avisa cuando el usuario acepta actualizar
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
