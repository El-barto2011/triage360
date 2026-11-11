/* Registro del service worker (public/service-worker.js).
   - Solo en producción y solo si el navegador lo soporta.
   - Interruptor por dispositivo, desde la URL:
       ?sw=on   lo activa en ESTE dispositivo (queda recordado)
       ?sw=off  lo desinstala, borra sus copias y lo deja apagado (apagado de emergencia)
   - SW_ACTIVO_POR_DEFECTO decide qué pasa en los dispositivos que nunca usaron el interruptor.
     Mientras esté en false, la app instalable está en PRUEBA: solo corre donde se abrió con ?sw=on.
     Para activarla para todo el equipo, cambiar a true. */

export const SW_ACTIVO_POR_DEFECTO = false;
const CLAVE = "t360_sw";            // "on" | "off" | (sin valor = usar el valor por defecto)

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

/** Decide qué hacer según la URL y lo guardado: "apagar" | "registrar" | "nada". */
export function decisionServiceWorker(search, storage, porDefecto = SW_ACTIVO_POR_DEFECTO) {
  const sw = new URLSearchParams(search || "").get("sw");
  let guardado = null;
  try {
    if (sw === "on" || sw === "off") storage.setItem(CLAVE, sw);
    guardado = storage.getItem(CLAVE);
  } catch (_) {
    guardado = sw === "on" || sw === "off" ? sw : null;
  }
  if (guardado === "off") return "apagar";
  if (guardado === "on") return "registrar";
  return porDefecto ? "registrar" : "nada";
}

/** ¿Este dispositivo tiene activa la app instalable? (para mostrar o no el aviso de instalación) */
export function appInstalableActiva() {
  try {
    if (!("serviceWorker" in navigator)) return false;
    return decisionServiceWorker("", window.localStorage) === "registrar";
  } catch (_) { return false; }
}

export function registrarServiceWorker() {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const decision = decisionServiceWorker(window.location.search, window.localStorage);
  if (decision === "apagar") { desinstalarServiceWorker(); return; }
  if (decision !== "registrar") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch((e) => console.error("No se pudo registrar el service worker:", e));
  });
}
