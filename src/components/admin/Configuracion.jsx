import { C, S } from "../../config/theme";
import { INDUSTRIAS, getIndustria } from "../../config/permisos";

export function Configuracion({ industriaKey, setIndustriaKey, usuario }) {
  const industria = getIndustria(industriaKey);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.title}>Configuración ⚙️</div>
        <div style={S.subtitle}>Personaliza TRIAGE360 para tu organización</div>
      </div>

      {/* Selección de industria */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🏭 Tipo de Organización</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          Define tu industria para adaptar los tipos de atención, nomenclatura y campos del sistema.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {Object.entries(INDUSTRIAS).map(([key, ind]) => (
            <div
              key={key}
              onClick={() => setIndustriaKey(key)}
              style={{
                cursor: "pointer",
                background: industriaKey === key ? ind.color + "15" : C.surface2,
                border: `2px solid ${industriaKey === key ? ind.color : C.border}`,
                borderRadius: 12, padding: "18px 20px",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{ind.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: industriaKey === key ? ind.color : C.text }}>{ind.nombre}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                {ind.paciente} · {ind.unidad}
              </div>
              {industriaKey === key && (
                <div style={{ marginTop: 8, fontSize: 11, color: ind.color, fontWeight: 700 }}>✓ Seleccionada</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vista previa de la configuración actual */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          {industria.emoji} Configuración activa — {industria.nombre}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Nomenclatura</div>
            {[
              ["Persona atendida", industria.paciente],
              ["Unidad clínica", industria.unidad],
              ["Tipos de atención", `${industria.tipos_atencion.length} tipos`],
              ["Campos adicionales", `${industria.campos_extra.length} campos`],
            ].map(([label, valor]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                <span style={{ color: C.textMuted }}>{label}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{valor}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tipos de Atención</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {industria.tipos_atencion.slice(0, 8).map(t => (
                <span key={t} style={{ background: industria.color + "15", color: industria.color, border: `1px solid ${industria.color}30`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  {t}
                </span>
              ))}
              {industria.tipos_atencion.length > 8 && (
                <span style={{ color: C.textMuted, fontSize: 11, padding: "3px 6px" }}>
                  +{industria.tipos_atencion.length - 8} más
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info cuenta */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>👤 Información de Cuenta</div>
        {[
          ["Email", usuario?.email],
          ["Nombre", usuario?.nombre],
          ["Rol", usuario?.rol === "admin" ? "👑 Administrador" : "👤 Profesional"],
          ["Profesión", usuario?.profesion],
        ].map(([label, valor]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
            <span style={{ color: C.textMuted }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{valor || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
