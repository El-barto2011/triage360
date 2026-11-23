import { useState } from "react";
import { C, S } from "../../config/theme";
import { validarPassword, actualizarPassword, cerrarSesionServidor, PASSWORD_MIN } from "../../config/password";

/* ════════════════════════════════════════════════════════════
   Pantalla "Nueva contraseña" — se abre desde el enlace del correo
   de recuperación. Usa la sesión temporal del enlace SOLO para
   cambiar la contraseña: nunca entra a la app con ella. Al terminar
   la cierra y vuelve al login normal (que sigue revisando que el
   perfil esté activo).
   ════════════════════════════════════════════════════════════ */
export function RecuperarPassword({ recuperacion, onTerminar }) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState(recuperacion?.error || "");
  const [guardando, setGuardando] = useState(false);
  const enlaceInvalido = !!recuperacion?.error;

  const guardar = async () => {
    const err = validarPassword(nueva, confirmar);
    if (err) { setError(err); return; }
    setGuardando(true); setError("");
    const r = await actualizarPassword(recuperacion.access_token, nueva);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    await cerrarSesionServidor(recuperacion.access_token);
    onTerminar("Contraseña actualizada. Ingresa con tu nueva contraseña.");
  };

  const label = { display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 16 }}>
      <div style={{ width: 420, maxWidth: "100%", padding: 40, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>🔒 Nueva contraseña</div>
        {!enlaceInvalido && (
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
            Mínimo {PASSWORD_MIN} caracteres, con al menos una letra y un número.
          </div>
        )}
        {!enlaceInvalido && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="rp-nueva">Nueva contraseña</label>
              <input id="rp-nueva" style={S.input} type="password" autoComplete="new-password" value={nueva} onChange={e => setNueva(e.target.value)} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={label} htmlFor="rp-confirmar">Repite la contraseña</label>
              <input id="rp-confirmar" style={S.input} type="password" autoComplete="new-password" value={confirmar} onChange={e => setConfirmar(e.target.value)} onKeyDown={e => e.key === "Enter" && guardar()} />
            </div>
          </>
        )}
        {error && <div role="alert" style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>{error}</div>}
        {!enlaceInvalido ? (
          <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", fontSize: 15, opacity: guardando ? 0.7 : 1 }} onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar contraseña"}
          </button>
        ) : (
          <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", fontSize: 15 }} onClick={() => onTerminar(null)}>
            Volver al inicio de sesión
          </button>
        )}
      </div>
    </div>
  );
}
