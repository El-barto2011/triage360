/* ════════════════════════════════════════════════════════════
   COLA OFFLINE — Persistencia de escrituras clínicas sin conexión
   Guarda POSTs de atenciones en IndexedDB cuando no hay red y los
   reintenta al reconectar. Fallback en memoria si IndexedDB no está
   disponible (tests, navegadores viejos).

   Diseño de seguridad clínica:
   - Solo se encolan CREACIONES (POST) de tablas de atención (SAFELIST) y el
     descuento de stock que las acompaña (RPC_ENCOLABLES). PATCH/DELETE NO se
     encolan para no reordenar operaciones dependientes.
   - Cada creación lleva un client_uuid: si se reenvía dos veces, la base
     ignora la segunda (índice único) en vez de duplicar la atención.
   - El reintento es SECUENCIAL y se detiene al primer fallo.
   - Cada registro guarda el user_id de quien lo creó: solo ese usuario lo
     reenvía, ve su contador o puede descartarlo (equipos compartidos).
   ════════════════════════════════════════════════════════════ */

const DB_NAME = "t360_offline";
const STORE   = "cola";
const VERSION = 1;

/** Tablas cuya creación es seguro encolar offline. */
export const SAFELIST = new Set([
  "atenciones_medicas",
  "atenciones_kinesiologia",
  "fichas_masoterapia",
]);

/** ¿El endpoint (posiblemente con querystring) apunta a una tabla safelist? */
export function esEncolable(endpoint, method) {
  if ((method || "GET").toUpperCase() !== "POST") return false;
  const tabla = String(endpoint).split("?")[0].split("/")[0];
  return SAFELIST.has(tabla);
}

/** RPC que también se encolan: el descuento de stock de una atención registrada sin red.
    Va en la misma cola FIFO, DESPUÉS de su atención, así el orden se conserva. */
export const RPC_ENCOLABLES = new Set(["rpc/fn_descontar_stock"]);

export function esRpcEncolable(endpoint, method) {
  if ((method || "GET").toUpperCase() !== "POST") return false;
  return RPC_ENCOLABLES.has(String(endpoint).split("?")[0]);
}

/** Identificador único generado en el dispositivo (idempotencia al sincronizar). */
export function nuevoUuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Agrega client_uuid al cuerpo de una creación (si no lo trae). Devuelve el body como string. */
export function conClientUuid(body) {
  try {
    const obj = JSON.parse(body);
    if (!obj || Array.isArray(obj) || typeof obj !== "object") return body;
    if (!obj.client_uuid) obj.client_uuid = nuevoUuid();
    return JSON.stringify(obj);
  } catch (_) {
    return body;
  }
}

/** Endpoint de reenvío: si el cuerpo trae client_uuid, un duplicado se ignora en vez de fallar. */
export function endpointIdempotente(endpoint, body) {
  let tieneUuid = false;
  try { tieneUuid = !!JSON.parse(body)?.client_uuid; } catch (_) {}
  if (!tieneUuid || String(endpoint).includes("on_conflict=")) return endpoint;
  return `${endpoint}${String(endpoint).includes("?") ? "&" : "?"}on_conflict=client_uuid`;
}

/* ── Fallback en memoria ─────────────────────────────────────── */
let _mem = [];
let _memSeq = 1;
const _hasIDB = typeof indexedDB !== "undefined";

/* ── Dueño de cada registro ──────────────────────────────────── */
/** Campos de autor que usan las vistas al crear una atención (= id del usuario). */
const AUTOR_CAMPOS = ["medico_id", "enfermero_id", "paramedico_id", "kinesiologo_id", "masoterapeuta_id"];

/** Filtra (en orden FIFO) los registros que pertenecen a userId.
    - Con user_id: pertenece si coincide.
    - Atención antigua sin user_id: pertenece si userId figura como autor en el cuerpo.
    - Descuento de stock antiguo sin user_id: sigue al dueño de la atención anterior. */
export function filtrarDe(items, userId) {
  if (!userId) return [];
  let previoEsDe = false;
  return items.filter((it) => {
    let es;
    if (it.user_id) es = it.user_id === userId;
    else if (it.rpc) es = previoEsDe;
    else {
      try { const b = JSON.parse(it.body) || {}; es = AUTOR_CAMPOS.some((c) => b[c] === userId); }
      catch (_) { es = false; }
    }
    if (!it.rpc) previoEsDe = es;
    return es;
  });
}

/** Usuario cuya cola muestra el contador de la UI (lo fija supabase.js al cambiar la sesión). */
let _usuarioCola = null;
export function setUsuarioCola(userId) { _usuarioCola = userId || null; _notify(); }

/* ── Suscriptores del contador (para la UI) ──────────────────── */
const _subs = new Set();
const _countMio = async () => (await pendientesDe(_usuarioCola)).length;
function _notify() { _countMio().then(n => _subs.forEach(cb => { try { cb(n); } catch (_) {} })).catch(() => {}); }
export function subscribe(cb) { _subs.add(cb); _countMio().then(cb).catch(() => {}); return () => _subs.delete(cb); }

/* ── Acceso IndexedDB ────────────────────────────────────────── */
function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function _tx(mode, fn) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const out = fn(store);
    tx.oncomplete = () => { db.close(); resolve(out._result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Encola una escritura. item: { endpoint, body, meta } */
export async function enqueue(item) {
  const registro = { ...item, ts: Date.now() };
  if (_hasIDB) {
    await _tx("readwrite", (store) => { const h = {}; store.add(registro); return h; });
  } else {
    _mem.push({ ...registro, id: _memSeq++ });
  }
  _notify();
  return registro;
}

/** Devuelve todos los pendientes ordenados por inserción (FIFO). */
export async function getAll() {
  if (!_hasIDB) return [..._mem];
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Elimina un pendiente por id. */
export async function remove(id) {
  if (_hasIDB) {
    await _tx("readwrite", (store) => { store.delete(id); return {}; });
  } else {
    _mem = _mem.filter(x => x.id !== id);
  }
  _notify();
}

/** Cantidad de pendientes. */
export async function count() {
  if (!_hasIDB) return _mem.length;
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Pendientes del usuario, en orden FIFO. */
export async function pendientesDe(userId) {
  return filtrarDe(await getAll(), userId);
}

/** Descarta SOLO los pendientes del usuario (los de otros usuarios no se tocan). */
export async function descartarDe(userId) {
  for (const it of await pendientesDe(userId)) await remove(it.id);
}

/* Test helper: limpiar cola en memoria. */
export function __resetMem() { _mem = []; _memSeq = 1; _usuarioCola = null; }
