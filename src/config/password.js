import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";

/* ════════════════════════════════════════════════════════════
   CONTRASEÑAS — reglas y llamadas a Supabase Auth
   - Mínimo 10 caracteres, con al menos una letra y un número.
     (La misma regla debe estar configurada en Supabase Auth; el
     servidor es la barrera real, esto solo avisa antes.)
   - Recuperación por correo: el enlace vuelve a la app con
     #...&type=recovery y los tokens de una sesión temporal.
   ════════════════════════════════════════════════════════════ */

export const PASSWORD_MIN = 10;

/** Devuelve un mensaje de error en español, o null si la contraseña es válida. */
export function validarPassword(password, confirmacion) {
  const p = String(password || "");
  if (p.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "La contraseña debe incluir al menos una letra y un número.";
  if (confirmacion !== undefined && p !== confirmacion) return "Las contraseñas no coinciden.";
  return null;
}

/** Lee el fragmento (#...) con el que vuelve el enlace de recuperación.
    Devuelve null si no es un enlace de recuperación,
    { error } si el enlace no es válido o expiró,
    o { access_token, refresh_token, expires_at } si es válido. */
export function leerRecuperacion(hash) {
  const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  if (params.get("error") || params.get("error_code")) {
    return { error: "El enlace no es válido o ya expiró. Solicita uno nuevo." };
  }
  if (params.get("type") !== "recovery" || !params.get("access_token")) return null;
  const expiresIn = Number(params.get("expires_in")) || 3600;
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token") || null,
    expires_at: Number(params.get("expires_at")) || Math.floor(Date.now() / 1000) + expiresIn,
  };
}

/** Traduce los errores de Supabase Auth al cambiar contraseña. */
function mensajeErrorAuth(status, body) {
  const code = body?.error_code || body?.code || "";
  if (code === "same_password") return "La nueva contraseña debe ser distinta de la actual.";
  if (code === "weak_password" || status === 422) {
    return "La contraseña no cumple los requisitos (mínimo 10 caracteres, con letras y números).";
  }
  if (status === 401 || status === 403) return "El enlace o la sesión expiró. Solicita uno nuevo.";
  if (status === 429) return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
  return "No se pudo actualizar la contraseña. Intenta nuevamente.";
}

/** Pide el correo de recuperación. Siempre responde igual exista o no la cuenta
    (no revela qué correos están registrados). Devuelve { ok, error }. */
export async function solicitarRecuperacion(email, redirectTo) {
  try {
    const url = `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email: String(email || "").trim() }),
    });
    if (res.status === 429) return { ok: false, error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
    return { ok: true, error: null };
  } catch (_) {
    return { ok: false, error: "Sin conexión. Verifica tu red e intenta nuevamente." };
  }
}

/** Fija una nueva contraseña para la sesión del token dado. Devuelve { ok, error }. */
export async function actualizarPassword(token, nueva) {
  const err = validarPassword(nueva);
  if (err) return { ok: false, error: err };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ password: nueva }),
    });
    if (res.ok) return { ok: true, error: null };
    let body = {};
    try { body = await res.json(); } catch (_) {}
    return { ok: false, error: mensajeErrorAuth(res.status, body) };
  } catch (_) {
    return { ok: false, error: "Sin conexión. Verifica tu red e intenta nuevamente." };
  }
}

/** Comprueba la contraseña actual iniciando sesión con ella.
    Devuelve los datos de la sesión nueva si es correcta, o null. */
export async function verificarPasswordActual(email, actual) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email, password: actual }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

/** Cierra en el servidor la sesión temporal del enlace de recuperación. */
export async function cerrarSesionServidor(token) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
    });
  } catch (_) {}
}
