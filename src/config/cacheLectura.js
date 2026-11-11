/* ════════════════════════════════════════════════════════════
   CACHÉ DE LECTURA — datos de referencia para trabajar sin señal
   Guarda la última respuesta de las tablas que un formulario
   necesita para funcionar (eventos, catálogos, carros). Si la red
   falla, sb() devuelve esa copia y el profesional puede seguir
   registrando; la atención queda en la cola offline.

   NUNCA se guardan datos de pacientes ni atenciones: en un teléfono
   personal solo quedan catálogos y la lista de eventos.
   ════════════════════════════════════════════════════════════ */

const PREFIJO = "t360_cache:";
const MAX_BYTES = 600 * 1024;   // por respuesta

/** Tablas de referencia que se pueden leer desde la copia local. */
export const TABLAS_CACHEABLES = new Set([
  "equipos_evento",
  "asignaciones_evento",
  "medicamentos",
  "contenedores_medicamentos",
  "catalogo_insumos",
  "catalogo_insumos_kines",
  "catalogo_alias",
  "insumos_kinesiologia",
  "plantillas_atencion",
]);

export function esCacheable(endpoint, method) {
  if ((method || "GET").toUpperCase() !== "GET") return false;
  return TABLAS_CACHEABLES.has(String(endpoint).split("?")[0]);
}

const store = () => (typeof localStorage !== "undefined" ? localStorage : null);

export function limpiarCacheLectura() {
  const ls = store();
  if (!ls) return;
  try {
    const claves = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIJO)) claves.push(k);
    }
    claves.forEach((k) => ls.removeItem(k));
  } catch (_) {}
}

export function guardarLectura(endpoint, data) {
  const ls = store();
  if (!ls) return false;
  let texto;
  try { texto = JSON.stringify({ t: Date.now(), d: data }); } catch (_) { return false; }
  if (texto.length > MAX_BYTES) return false;
  try {
    ls.setItem(PREFIJO + endpoint, texto);
    return true;
  } catch (_) {
    // Sin espacio: se vacía la caché y se intenta una vez más
    limpiarCacheLectura();
    try { ls.setItem(PREFIJO + endpoint, texto); return true; } catch (_e) { return false; }
  }
}

/** Devuelve { data, guardadoEn } o null si no hay copia. */
export function leerLectura(endpoint) {
  const ls = store();
  if (!ls) return null;
  try {
    const raw = ls.getItem(PREFIJO + endpoint);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw);
    return { data: d, guardadoEn: t };
  } catch (_) {
    return null;
  }
}
