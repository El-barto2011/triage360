/* Registro del service worker (public/service-worker.js).
   - Solo en producción y solo si el navegador lo soporta.
   - Apagado de emergencia: abrir la app con ?sw=off lo desinstala y borra sus copias;
     queda apagado en ese dispositivo hasta abrirla con ?sw=on. */

const CLAVE_APAGADO = "t360_sw_off";

export async function desinstalarServiceWorker() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch (_) {}
  try {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter((n) => n.startsWith("t360-")).map((n) => caches.delete(n)));
  } catch (_) {}
}

/** Decide qué hacer según la URL y lo guardado: "apagar" | "registrar". */
export function decisionServiceWorker(search, storage) {
  const params = new URLSearchParams(search || "");
  const sw = params.get("sw");
  try {
    if (sw === "off") storage.setItem(CLAVE_APAGADO, "1");
    if (sw === "on") storage.removeItem(CLAVE_APAGADO);
    if (storage.getItem(CLAVE_APAGADO) === "1") return "apagar";
  } catch (_) {
    if (sw === "off") return "apagar";
  }
  return "registrar";
}

export function registrarServiceWorker() {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const decision = decisionServiceWorker(window.location.search, window.localStorage);
  if (decision === "apagar") { desinstalarServiceWorker(); return; }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch((e) => console.error("No se pudo registrar el service worker:", e));
  });
}
