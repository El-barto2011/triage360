import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";

/* ════════════════════════════════════════════════════════════
   Cliente ligero SOLO para Realtime. El resto de la app usa
   REST vía sb(). El RLS event-scoped aplica también a Realtime:
   cada usuario solo recibe cambios de sus eventos asignados.
   ════════════════════════════════════════════════════════════ */
const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 5 } },
});

/**
 * Suscribe a cambios (INSERT/UPDATE/DELETE) de atenciones_medicas.
 * Devuelve una función para cancelar la suscripción.
 *   onChange(payload)  — se llama en cada cambio
 *   onStatus(estado)   — 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'
 */
export function subscribeAtenciones(token, eventoId, onChange, onStatus) {
  if (token) client.realtime.setAuth(token);
  const cfg = { event: "*", schema: "public", table: "atenciones_medicas" };
  if (eventoId) cfg.filter = `evento_id=eq.${eventoId}`;

  const canal = client
    .channel(`triaje-${eventoId || "all"}-${Date.now()}`)
    .on("postgres_changes", cfg, (payload) => { try { onChange?.(payload); } catch (_) {} })
    .subscribe((estado) => { try { onStatus?.(estado); } catch (_) {} });

  return () => { try { client.removeChannel(canal); } catch (_) {} };
}
