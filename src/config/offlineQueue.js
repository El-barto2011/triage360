/* ════════════════════════════════════════════════════════════
   COLA OFFLINE — Persistencia de escrituras clínicas sin conexión
   Guarda POSTs de atenciones en IndexedDB cuando no hay red y los
   reintenta al reconectar. Fallback en memoria si IndexedDB no está
   disponible (tests, navegadores viejos).

   Diseño de seguridad clínica:
   - Solo se encolan CREACIONES (POST) de tablas de atención (SAFELIST).
     PATCH/DELETE y descuentos de stock NO se encolan para no reordenar
     operaciones dependientes.
   - El reintento es SECUENCIAL y se detiene al primer fallo.
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

/* ── Fallback en memoria ─────────────────────────────────────── */
let _mem = [];
let _memSeq = 1;
const _hasIDB = typeof indexedDB !== "undefined";

/* ── Suscriptores del contador (para la UI) ──────────────────── */
const _subs = new Set();
function _notify() { count().then(n => _subs.forEach(cb => { try { cb(n); } catch (_) {} })); }
export function subscribe(cb) { _subs.add(cb); count().then(cb); return () => _subs.delete(cb); }

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

/* Test helper: limpiar cola en memoria. */
export function __resetMem() { _mem = []; _memSeq = 1; }
