import { enqueue, getAll, remove, esEncolable } from "./offlineQueue";

export const SUPABASE_URL = "https://dnlvzwrujosuckdzmffx.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg0MzAsImV4cCI6MjA5MDIzNDQzMH0.Bhw_ws8XNzWxJXBn1TzLjNppBD9CRWDTuEb_t92G9ZE";

/* ════════════════════════════════════════════════════════════
   GESTIÓN DE SESIÓN
   - Persiste access_token + refresh_token en localStorage
   - Renueva automáticamente 2 min antes del vencimiento
   - Reintenta con refresh ante un 401
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
};

export const getToken = () => _session?.access_token || null;

export const refreshSession = async () => {
  if (_refreshing) return _refreshing;           // ya hay un refresh en curso
  if (!_session?.refresh_token) return null;
  _refreshing = (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: _session.refresh_token }),
      });
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
    return await refreshSession();
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

export const sb = async (endpoint, options = {}, token = null, _retry = true) => {
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
      console.error(`Supabase ${options.method || "GET"} error ${res.status}:`, e);
      if (typeof window !== "undefined" && window.__toastError) {
        window.__toastError(`Error ${res.status} al ${options.method === "POST" ? "guardar" : options.method === "PATCH" ? "actualizar" : "cargar"} datos`);
      }
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (networkError) {
    console.error("Error de red Supabase:", networkError);
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
    if (typeof window !== "undefined" && window.__toastError) {
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
    for (const item of pendientes) {
      const auth = getToken();
      const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Prefer": "return=representation" };
      if (auth) headers["Authorization"] = `Bearer ${auth}`;
      let res;
      try {
        res = await fetch(`${SUPABASE_URL}/rest/v1/${item.endpoint}`, { method: "POST", headers, body: item.body });
      } catch (_) {
        break; // sigue sin conexión: detener y conservar el resto
      }
      if (res.ok) {
        await remove(item.id);
        enviados++;
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
  window.addEventListener("online", () => { flushOfflineQueue(); });
}
