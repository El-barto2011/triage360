import { enqueue, getAll, remove, esEncolable, esRpcEncolable, conClientUuid, endpointIdempotente } from "./offlineQueue";
import { esCacheable, guardarLectura, leerLectura, limpiarCacheLectura } from "./cacheLectura";

export const SUPABASE_URL = "https://dnlvzwrujosuckdzmffx.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg0MzAsImV4cCI6MjA5MDIzNDQzMH0.Bhw_ws8XNzWxJXBn1TzLjNppBD9CRWDTuEb_t92G9ZE";

/* ════════════════════════════════════════════════════════════
   GESTIÓN DE SESIÓN
   - Persiste access_token + refresh_token en localStorage
   - Renueva automáticamente 2 min antes del vencimiento
   - Reintenta con refresh ante un 401
   - SIN RED no se cierra la sesión: se conserva y se reintenta al volver
     la conexión (antes, pasar una hora sin señal sacaba al usuario al login)
   ════════════════════════════════════════════════════════════ */

const SESSION_KEY = "triage360_session";
let _session = null;        // { access_token, refresh_token, expires_at (epoch seg) }
let _refreshTimer = null;
let _refreshing = null;     // promesa en curso para evitar refreshes paralelos

const _persist = () => {
  try {
    if (_session) localStorage.setItem(SESSION_KEY, JSON.stringify(_session));
    else localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
};

const _scheduleRefresh = () => {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  if (!_session?.expires_at) return;
  const ms = Math.max((_session.expires_at - 120) * 1000 - Date.now(), 5000);
  _refreshTimer = setTimeout(() => { refreshSession(); }, ms);
};

export const saveSession = (data) => {
  _session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  };
  _persist();
  _scheduleRefresh();
};

export const clearSession = () => {
  _session = null;
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _persist();
  limpiarCacheLectura();   // al salir no quedan copias locales de catálogos ni eventos
};

const REINTENTO_SIN_RED_MS = 30000;

export const getToken = () => _session?.access_token || null;

export const refreshSession = async () => {
  if (_refreshing) return _refreshing;           // ya hay un refresh en curso
  if (!_session?.refresh_token) return null;
  _refreshing = (async () => {
    let res;
    try {
      res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: _session.refresh_token }),
      });
    } catch (sinRed) {
      // No hay conexión: la sesión NO se toca. Se reintenta en 30 s y al volver la red.
      if (_refreshTimer) clearTimeout(_refreshTimer);
      _refreshTimer = setTimeout(() => { refreshSession(); }, REINTENTO_SIN_RED_MS);
      _refreshing = null;
      return null;
    }
    try {
      // Error del servidor (5xx): tampoco es un rechazo de la sesión; reintentar más tarde
      if (res.status >= 500) {
        if (_refreshTimer) clearTimeout(_refreshTimer);
        _refreshTimer = setTimeout(() => { refreshSession(); }, REINTENTO_SIN_RED_MS);
        return null;
      }
      if (!res.ok) throw new Error(`refresh ${res.status}`);
      const data = await res.json();
      saveSession(data);
      return _session;
    } catch (e) {
      console.error("No se pudo renovar la sesión:", e);
      clearSession();
      if (typeof window !== "undefined" && window.__onSessionExpired) window.__onSessionExpired();
      return null;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
};

/** Restaura la sesión guardada al cargar la app. Devuelve la sesión o null. */
export const restoreSession = async () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    _session = JSON.parse(raw);
  } catch (_) { return null; }
  if (!_session?.refresh_token) { clearSession(); return null; }
  // Si vence en menos de 5 min (o ya venció), renovar de inmediato
  if (!_session.expires_at || _session.expires_at * 1000 - Date.now() < 5 * 60 * 1000) {
    const renovada = await refreshSession();
    // Sin red la renovación no se pudo intentar: se abre igual con la sesión guardada
    // (las escrituras quedan en la cola offline y la sesión se renueva al reconectar).
    return renovada || _session;
  }
  _scheduleRefresh();
  return _session;
};

/* ════════════════════════════════════════════════════════════
   HELPER REST
   Mantiene la firma sb(endpoint, options, token): el token
   recibido queda como respaldo, pero siempre se prefiere el
   de la sesión activa (que se renueva sola).
   ════════════════════════════════════════════════════════════ */

/* Traduce un error de PostgREST/Postgres a un mensaje claro en español. */
const _verbo = (m) => m === "POST" ? "guardar" : m === "PATCH" || m === "PUT" ? "actualizar" : m === "DELETE" ? "eliminar" : "cargar";
export function mensajeError(status, bodyText, method) {
  let body = {};
  try { body = JSON.parse(bodyText) || {}; } catch (_) {}
  const code = body.code || "";
  const detalle = (body.message || body.details || body.hint || "").trim();

  // Códigos de Postgres (SQLSTATE)
  if (code === "23505") return "Ya existe un registro con ese dato (posible duplicado).";
  if (code === "23503") return "No se puede completar: falta un registro relacionado.";
  if (code === "23502") return "Falta un campo obligatorio.";
  if (code === "23514") return detalle
    ? `Valor fuera de rango: ${detalle}`
    : "Un valor ingresado está fuera del rango permitido.";
  if (code === "42501" || status === 403) return "No tienes permiso para realizar esta acción.";

  // Estados HTTP
  if (status === 401) return "Sesión expirada. Vuelve a iniciar sesión.";
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 409) return "Conflicto: el registro ya existe o fue modificado por otra persona.";
  if (status === 413) return "El contenido es demasiado grande.";
  if (status >= 500) return "Error del servidor. Intenta nuevamente en unos momentos.";
  if (status === 400 && detalle) return detalle.length > 140 ? detalle.slice(0, 140) + "…" : detalle;

  return `No se pudo ${_verbo(method)} la información (error ${status}).`;
}

export const sb = async (endpoint, options = {}, token = null, _retry = true) => {
  // Toda creación de atención viaja con un client_uuid propio: si la respuesta se pierde
  // y la atención se reenvía desde la cola offline, no se duplica.
  if (esEncolable(endpoint, options.method) && options.body) {
    options = { ...options, body: conClientUuid(options.body) };
  }
  const auth = getToken() || token;
  const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Prefer": "return=representation" };
  if (auth) headers["Authorization"] = `Bearer ${auth}`;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
    if (res.status === 401 && _retry && _session?.refresh_token) {
      // Token vencido: renovar y reintentar una vez
      const renewed = await refreshSession();
      if (renewed) return sb(endpoint, options, token, false);
    }
    if (!res.ok) {
      const e = await res.text();
      const metodo = options.method || "GET";
      console.error(`Supabase ${metodo} error ${res.status}:`, e);
      // No molestar con toasts en lecturas de fondo silenciosas (polling/realtime)
      if (!(metodo === "GET" && options._silent) && typeof window !== "undefined" && window.__toastError) {
        window.__toastError(mensajeError(res.status, e, metodo));
      }
      return null;
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    // Datos de referencia: se guarda la última copia para poder trabajar sin señal
    if (esCacheable(endpoint, options.method)) guardarLectura(endpoint, data);
    return data;
  } catch (networkError) {
    console.error("Error de red Supabase:", networkError);
    // ── Lectura sin red: devolver la última copia de catálogos / eventos ──
    if (esCacheable(endpoint, options.method)) {
      const copia = leerLectura(endpoint);
      if (copia) return copia.data;
    }
    // ── Cola offline: si es una creación de atención, guardar local y reintentar al reconectar ──
    if (esEncolable(endpoint, options.method) && options.body) {
      try {
        await enqueue({ endpoint, body: options.body });
        if (typeof window !== "undefined" && window.__toastOffline) {
          window.__toastOffline("Sin conexión — atención guardada localmente, se sincronizará al reconectar");
        }
        // Respuesta optimista: la UI sigue funcionando; id temporal marca el registro offline
        let parsed = {};
        try { parsed = JSON.parse(options.body); } catch (_) {}
        return [{ ...parsed, id: `offline-${Date.now()}`, __offline: true }];
      } catch (e) {
        console.error("No se pudo encolar offline:", e);
      }
    }
    // ── Descuento de stock sin red: se encola detrás de su atención y se aplica al reconectar ──
    if (esRpcEncolable(endpoint, options.method) && options.body) {
      try {
        await enqueue({ endpoint, body: options.body, rpc: true });
        return [{ __offline: true }];
      } catch (e) {
        console.error("No se pudo encolar el descuento de stock:", e);
      }
    }
    // Sin señal las lecturas fallan en cadena: el banner "Sin conexión" ya lo avisa,
    // así que no se muestra un error por cada una. Las escrituras sí avisan.
    const metodo = (options.method || "GET").toUpperCase();
    const sinSenal = typeof navigator !== "undefined" && navigator.onLine === false;
    const silenciar = metodo === "GET" && (sinSenal || options._silent);
    if (!silenciar && typeof window !== "undefined" && window.__toastError) {
      window.__toastError("Sin conexión — verifica tu red e intenta nuevamente");
    }
    return null;
  }
};

/* ════════════════════════════════════════════════════════════
   REPLAY DE LA COLA OFFLINE
   Reintenta secuencialmente las escrituras encoladas. Se detiene
   al primer fallo (probablemente sigue sin red). Devuelve
   { enviados, pendientes }.
   ════════════════════════════════════════════════════════════ */
let _flushing = false;
export const flushOfflineQueue = async () => {
  if (_flushing) return { enviados: 0, pendientes: null };
  _flushing = true;
  let enviados = 0;
  try {
    const pendientes = await getAll();
    // Tras horas sin señal el token está vencido: renovarlo antes de reenviar
    if (pendientes.length > 0 && _session?.expires_at && _session.expires_at * 1000 - Date.now() < 60 * 1000) {
      await refreshSession();
    }
    for (const item of pendientes) {
      const auth = getToken();
      const esRpc = !!item.rpc;
      // Atenciones: si ya llegó antes (misma client_uuid), la base la ignora y no se duplica.
      const headers = {
        "Content-Type": "application/json", "apikey": SUPABASE_KEY,
        "Prefer": esRpc ? "return=representation" : "return=representation,resolution=ignore-duplicates",
      };
      if (auth) headers["Authorization"] = `Bearer ${auth}`;
      const destino = esRpc ? item.endpoint : endpointIdempotente(item.endpoint, item.body);
      let res;
      try {
        res = await fetch(`${SUPABASE_URL}/rest/v1/${destino}`, { method: "POST", headers, body: item.body });
      } catch (_) {
        break; // sigue sin conexión: detener y conservar el resto
      }
      if (res.ok) {
        await remove(item.id);
        if (!esRpc) enviados++;
      } else if (res.status >= 400 && res.status < 500 && res.status !== 401) {
        // Error de datos (no de red): descartar para no bloquear la cola indefinidamente
        console.error(`Descartando item offline por error ${res.status}`);
        await remove(item.id);
      } else {
        break; // 401/5xx: reintentar más tarde
      }
    }
    const restantes = await getAll();
    if (enviados > 0 && typeof window !== "undefined" && window.__toastOffline) {
      window.__toastOffline(`${enviados} atención(es) sincronizada(s)${restantes.length ? `, ${restantes.length} pendiente(s)` : ""}`);
    }
    return { enviados, pendientes: restantes.length };
  } finally {
    _flushing = false;
  }
};

// Auto-sincronizar al recuperar conexión
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    // Al volver la red: primero renovar la sesión si hace falta, después sincronizar
    if (_session?.refresh_token && (!_session.expires_at || _session.expires_at * 1000 - Date.now() < 5 * 60 * 1000)) {
      await refreshSession();
    }
    flushOfflineQueue();
  });
}
