/* Registro del service worker. Solo en producción.
   Cuando hay una versión nueva esperando, emite el evento "sw-update"
   (lo escucha UpdateBanner) en vez de recargar la app sin avisar. */
export function register() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((reg) => {
        const avisar = (worker) =>
          window.dispatchEvent(new CustomEvent("sw-update", { detail: { worker } }));
        if (reg.waiting && navigator.serviceWorker.controller) avisar(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nuevo = reg.installing;
          if (!nuevo) return;
          nuevo.addEventListener("statechange", () => {
            if (nuevo.state === "installed" && navigator.serviceWorker.controller) avisar(nuevo);
          });
        });
        // Buscar versión nueva al volver a abrir la app
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch((e) => console.error("No se pudo registrar el service worker:", e));
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    });
  });
}
