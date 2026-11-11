import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { appInstalableActiva } from "../../serviceWorkerRegistration";

/* ════════════════════════════════════════════════════════════
   Invitación a instalar TRIAGE360 en el teléfono.
   - Android / Chrome / Edge: botón "Instalar" (usa el aviso nativo).
   - iPhone / iPad: Safari no tiene aviso, se explica el camino manual.
   No aparece si ya está instalada o si la persona la cerró.
   ════════════════════════════════════════════════════════════ */

const CLAVE_CERRADO = "t360_instalar_cerrado";

export const yaInstalada = () => {
  try {
    return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  } catch (_) { return false; }
};

export const esIOS = (ua = (typeof navigator !== "undefined" ? navigator.userAgent : "")) =>
  /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document);

export function InstalarApp() {
  const [aviso, setAviso] = useState(null);       // evento beforeinstallprompt
  const [cerrado, setCerrado] = useState(() => {
    try { return localStorage.getItem(CLAVE_CERRADO) === "1"; } catch (_) { return false; }
  });
  const [instalada, setInstalada] = useState(yaInstalada);

  useEffect(() => {
    const alAvisar = (e) => { e.preventDefault(); setAviso(e); };
    const alInstalar = () => { setInstalada(true); setAviso(null); };
    window.addEventListener("beforeinstallprompt", alAvisar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alAvisar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  const ios = esIOS();
  // Solo se invita a instalar donde la app instalable está activa (abre sin señal de verdad)
  if (!appInstalableActiva()) return null;
  if (instalada || cerrado || (!aviso && !ios)) return null;

  const cerrar = () => {
    try { localStorage.setItem(CLAVE_CERRADO, "1"); } catch (_) {}
    setCerrado(true);
  };

  const instalar = async () => {
    if (!aviso) return;
    aviso.prompt();
    try { await aviso.userChoice; } catch (_) {}
    setAviso(null);
  };

  return (
    <div style={{
      position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 55,
      display: "flex", alignItems: "center", gap: 10, maxWidth: "94vw",
      background: "#0f2a3a", border: "1px solid #00c2a8", color: "#fff",
      padding: "10px 12px", borderRadius: 10, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,.35)",
    }}>
      {ios ? <Share size={16} style={{ flexShrink: 0 }} /> : <Download size={16} style={{ flexShrink: 0 }} />}
      <span style={{ lineHeight: 1.35 }}>
        {ios
          ? <>Instala TRIAGE360: toca <strong>Compartir</strong> y luego <strong>Agregar a inicio</strong>. Así abre aunque no haya señal.</>
          : <>Instala TRIAGE360 en este equipo para abrirla aunque no haya señal.</>}
      </span>
      {!ios && (
        <button onClick={instalar} style={{
          background: "#00c2a8", border: "none", color: "#06231f", fontWeight: 700,
          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", flexShrink: 0,
        }}>Instalar</button>
      )}
      <button onClick={cerrar} aria-label="Cerrar aviso de instalación" style={{
        background: "transparent", border: "none", color: "#9fb3c8", cursor: "pointer", padding: 2, flexShrink: 0,
      }}><X size={16} /></button>
    </div>
  );
}
