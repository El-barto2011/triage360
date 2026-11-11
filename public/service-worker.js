/* ════════════════════════════════════════════════════════════════════
   TRIAGE360 · service worker
   Objetivo: que la app ABRA sin señal. Es deliberadamente conservador:

   - Solo toca peticiones GET del mismo dominio. Supabase, /api y todo lo
     que sea de otro origen pasa directo a la red, sin caché.
   - La página (index.html) va SIEMPRE primero a la red: con conexión, el
     usuario recibe la última versión publicada. Solo si la red falla o
     tarda más de 4 s se sirve la copia guardada.
   - Los archivos /static/ llevan un hash en el nombre (nunca cambian de
     contenido), así que se sirven desde la copia guardada.
   - No guarda datos clínicos: eso vive en la app (cola offline).

   Apagado de emergencia: abrir la app con  ?sw=off  desinstala el service
   worker y borra sus copias (ver src/serviceWorkerRegistration.js).
   ════════════════════════════════════════════════════════════════════ */

const VERSION = "v1";
const CACHE_SHELL = `t360-shell-${VERSION}`;
const CACHE_ASSETS = `t360-assets-${VERSION}`;
const INDEX = "/index.html";
const SHELL_URLS = [INDEX, "/manifest.json", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/apple-touch-icon.png"];
const ESPERA_RED_MS = 4000;

/** Lee asset-manifest.json (lo genera el build) y deja guardados los /static/ de ESTA versión. */
async function guardarAssetsDeLaVersion() {
  const res = await fetch("/asset-manifest.json", { cache: "no-store" });
  if (!res.ok) return;
  const manifest = await res.json();
  const rutas = [...new Set(Object.values(manifest.files || {}))]
    .filter((r) => typeof r === "string" && r.startsWith("/static/") && !r.endsWith(".map"));
  const cache = await caches.open(CACHE_ASSETS);
  await Promise.all(rutas.map(async (ruta) => {
    if (await cache.match(ruta)) return;
    try {
      const r = await fetch(ruta, { cache: "no-store" });
      if (r.ok) await cache.put(ruta, r);
    } catch (_) { /* se reintenta en la próxima visita con red */ }
  }));
  // Limpieza: borrar los /static/ de versiones anteriores
  const vigentes = new Set(rutas);
  const guardados = await cache.keys();
  await Promise.all(guardados.map((req) => {
    const ruta = new URL(req.url).pathname;
    return vigentes.has(ruta) ? null : cache.delete(req);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE_SHELL);
    await Promise.all(SHELL_URLS.map(async (url) => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) await shell.put(url, r);
      } catch (_) {}
    }));
    try { await guardarAssetsDeLaVersion(); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres
      .filter((n) => n.startsWith("t360-") && n !== CACHE_SHELL && n !== CACHE_ASSETS)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/** fetch con tiempo máximo: en una cancha con una rayita de señal no dejamos la pantalla en blanco. */
function fetchConLimite(request, ms) {
  return new Promise((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request).then(
      (r) => { clearTimeout(reloj); resolve(r); },
      (e) => { clearTimeout(reloj); reject(e); }
    );
  });
}

/** Navegación: red primero; si falla, la última página guardada. */
async function navegar(event) {
  const shell = await caches.open(CACHE_SHELL);
  try {
    const res = await fetchConLimite(event.request, ESPERA_RED_MS);
    const esHtml = (res.headers.get("content-type") || "").includes("text/html");
    if (res && res.ok && res.type === "basic" && esHtml) {
      await shell.put(INDEX, res.clone());
      // Con red: dejar guardados los archivos de esta versión para la próxima vez sin señal
      event.waitUntil(guardarAssetsDeLaVersion().catch(() => {}));
    }
    return res;
  } catch (_) {
    const guardada = await shell.match(INDEX);
    if (guardada) return guardada;
    return new Response(
      "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
      "<body style='font-family:sans-serif;background:#0d1117;color:#e8f0f8;padding:32px'>" +
      "<h2>TRIAGE360</h2><p>Sin conexión. Abre la app una vez con señal para que quede disponible sin red.</p></body>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** Archivos con hash: copia guardada primero; si no está, red y se guarda. */
async function assetConHash(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  const res = await fetch(request);
  if (res && res.ok && res.type === "basic") await cache.put(request, res.clone());
  return res;
}

/** Íconos y manifest: red primero, copia guardada si no hay red. */
async function redPrimero(request) {
  const shell = await caches.open(CACHE_SHELL);
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === "basic") await shell.put(new URL(request.url).pathname, res.clone());
    return res;
  } catch (e) {
    const guardado = await shell.match(new URL(request.url).pathname);
    if (guardado) return guardado;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // Supabase, fuentes, etc.: sin tocar
  if (url.pathname.startsWith("/api/")) return;               // funciones del servidor: sin tocar
  if (url.pathname === "/service-worker.js" || url.pathname === "/asset-manifest.json") return;

  if (req.mode === "navigate") { event.respondWith(navegar(event)); return; }
  if (url.pathname.startsWith("/static/")) { event.respondWith(assetConHash(req)); return; }
  if (SHELL_URLS.includes(url.pathname)) { event.respondWith(redPrimero(req)); return; }
});
