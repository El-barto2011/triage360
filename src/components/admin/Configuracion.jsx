import { useState } from "react";
import { C, S, TEMA_ACTUAL, cambiarTema } from "../../config/theme";
import { INDUSTRIAS, getIndustria } from "../../config/permisos";
import { saveSession } from "../../config/supabase";
import { validarPassword, verificarPasswordActual, actualizarPassword, PASSWORD_MIN } from "../../config/password";

/* Cambiar la contraseña del usuario conectado. Pide la actual para que nadie
   pueda cambiarla desde una sesión abierta y desatendida. */
export function CambiarPassword({ email }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setError(""); setOk("");
    if (!actual) { setError("Ingresa tu contraseña actual."); return; }
    const err = validarPassword(nueva, confirmar);
    if (err) { setError(err); return; }
    setGuardando(true);
    const sesion = await verificarPasswordActual(email, actual);
    if (!sesion) { setGuardando(false); setError("La contraseña actual no es correcta."); return; }
    saveSession(sesion); // la verificación abre una sesión nueva: se usa en adelante
    const r = await actualizarPassword(sesion.access_token, nueva);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    setActual(""); setNueva(""); setConfirmar("");
    setOk("Contraseña actualizada. Úsala la próxima vez que ingreses.");
  };

  const label = { display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🔒 Cambiar contraseña</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
        Mínimo {PASSWORD_MIN} caracteres, con al menos una letra y un número.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={label} htmlFor="cp-actual">Contraseña actual</label>
          <input id="cp-actual" style={S.input} type="password" autoComplete="current-password" value={actual} onChange={e => setActual(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="cp-nueva">Nueva contraseña</label>
          <input id="cp-nueva" style={S.input} type="password" autoComplete="new-password" value={nueva} onChange={e => setNueva(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="cp-confirmar">Repite la nueva</label>
          <input id="cp-confirmar" style={S.input} type="password" autoComplete="new-password" value={confirmar} onChange={e => setConfirmar(e.target.value)} onKeyDown={e => e.key === "Enter" && guardar()} />
        </div>
      </div>
      {error && <div role="alert" style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</div>}
      {ok && <div role="status" style={{ background: C.accentDim, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.accent, marginBottom: 12 }}>{ok}</div>}
      <button style={{ ...S.btn("primary"), opacity: guardando ? 0.7 : 1 }} onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </div>
  );
}

export function Configuracion({ industriaKey, setIndustriaKey, usuario }) {
  const industria = getIndustria(industriaKey);
  const esAdmin = usuario?.rol === "admin";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.title}>Configuración ⚙️</div>
        <div style={S.subtitle}>{esAdmin ? "Personaliza TRIAGE360 para tu organización" : "Tu cuenta"}</div>
      </div>

      {/* Apariencia, tipo de organización y vista previa: solo administradores */}
      {esAdmin && (<>
      {/* Apariencia: modo oscuro / modo terreno */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🎨 Apariencia</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
          El <strong>modo terreno</strong> (claro, alto contraste) es más legible bajo el sol durante eventos al aire libre.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { key: "oscuro", emoji: "🌙", nombre: "Modo Oscuro", desc: "Ideal en oficina e interiores" },
            { key: "claro",  emoji: "☀️", nombre: "Modo Terreno", desc: "Alto contraste para exteriores" },
          ].map(t => (
            <div key={t.key}
              onClick={() => { if (TEMA_ACTUAL !== t.key) cambiarTema(t.key); }}
              style={{
                cursor: "pointer", flex: "1 1 200px",
                background: TEMA_ACTUAL === t.key ? C.accentDim : C.surface2,
                border: `2px solid ${TEMA_ACTUAL === t.key ? C.accent : C.border}`,
                borderRadius: 12, padding: "16px 20px",
              }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEMA_ACTUAL === t.key ? C.accent : C.text }}>{t.nombre}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{t.desc}</div>
              {TEMA_ACTUAL === t.key && <div style={{ marginTop: 6, fontSize: 11, color: C.accent, fontWeight: 700 }}>✓ Activo</div>}
            </div>
          ))}
        </div>
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

      </>)}

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

      {usuario?.email && <CambiarPassword email={usuario.email} />}
    </div>
  );
}
