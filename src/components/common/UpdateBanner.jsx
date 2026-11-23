import { useState, useEffect } from "react";
import { C } from "../../config/theme";

/* Aviso de "Nueva versión disponible". El usuario decide cuándo
   actualizar (así no pierde una ficha a medio escribir). */
export function UpdateBanner() {
  const [worker, setWorker] = useState(null);
  useEffect(() => {
    const h = (e) => setWorker(e.detail?.worker || null);
    window.addEventListener("sw-update", h);
    return () => window.removeEventListener("sw-update", h);
  }, []);
  if (!worker) return null;
  return (
    <div style={{
      position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999, display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 10,
      background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 13,
      boxShadow: "0 8px 24px rgba(0,0,0,.35)",
    }}>
      <span>Hay una nueva versión de TRIAGE360. Termina lo que estés escribiendo y actualiza.</span>
      <button
        onClick={() => worker.postMessage({ type: "SKIP_WAITING" })}
        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: C.accent, color: "#000", fontWeight: 700, cursor: "pointer" }}
      >
        Actualizar
      </button>
    </div>
  );
}
