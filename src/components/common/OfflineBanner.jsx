import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { subscribe } from "../../config/offlineQueue";
import { flushOfflineQueue } from "../../config/supabase";

/* ════════════════════════════════════════════════════════════
   Banner de estado de red. Muestra:
   - "Sin conexión" cuando el navegador está offline.
   - Nº de atenciones pendientes de sincronizar + botón manual.
   Se oculta cuando hay conexión y no hay pendientes.
   ════════════════════════════════════════════════════════════ */
export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const unsub = subscribe(setPendientes);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      unsub();
    };
  }, []);

  if (online && pendientes === 0) return null;

  const sincronizar = async () => {
    setSincronizando(true);
    try { await flushOfflineQueue(); } finally { setSincronizando(false); }
  };

  const offline = !online;
  const bg     = offline ? "#7c2d12" : "#1e3a5f";
  const borde  = offline ? "#ea580c" : "#3b82f6";

  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 60, display: "flex", alignItems: "center", gap: 12,
      background: bg, border: `1px solid ${borde}`, color: "#fff",
      padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 16px rgba(0,0,0,.35)", maxWidth: "92vw",
    }}>
      {offline ? <WifiOff size={16} /> : <CheckCircle2 size={16} />}
      <span>
        {offline ? "Sin conexión" : "Conectado"}
        {pendientes > 0 && ` · ${pendientes} atención(es) sin sincronizar`}
      </span>
      {pendientes > 0 && online && (
        <button
          onClick={sincronizar}
          disabled={sincronizando}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,.15)", border: "none", color: "#fff",
            padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
          }}
        >
          <RefreshCw size={13} className={sincronizando ? "animate-spin" : ""} />
          {sincronizando ? "Sincronizando..." : "Sincronizar"}
        </button>
      )}
    </div>
  );
}
