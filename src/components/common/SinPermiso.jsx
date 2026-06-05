import { C } from "../../config/theme";

export const SinPermiso = () => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    flex: 1, minHeight: 320, gap: 16,
  }}>
    <div style={{
      width: 72, height: 72, borderRadius: "50%",
      background: C.surface2, border: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width={36} height={36} viewBox="0 0 24 24" fill={C.textFaint}>
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      </svg>
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        Acceso restringido
      </div>
      <div style={{ fontSize: 14, color: C.textMuted }}>
        No tienes permisos para ver esta sección
      </div>
    </div>
  </div>
);
