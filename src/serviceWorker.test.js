/* Pruebas del service worker (public/service-worker.js) con red y caché simuladas.
   Verifican la promesa central: con señal se recibe la versión nueva; sin señal la app abre. */
import fs from "fs";
import path from "path";
import { decisionServiceWorker } from "./serviceWorkerRegistration";

const FUENTE = fs.readFileSync(path.join(__dirname, "..", "public", "service-worker.js"), "utf8");
const ORIGEN = "https://app.triage360.cl";

class RespuestaFalsa {
  constructor(cuerpo, { status = 200, tipo = "basic", contentType = "text/html" } = {}) {
    this.cuerpo = cuerpo; this.status = status; this.ok = status >= 200 && status < 300; this.type = tipo;
    this.headers = { get: (k) => (k.toLowerCase() === "content-type" ? contentType : null) };
  }
  clone() { return this; }
  async json() { return JSON.parse(this.cuerpo); }
}

function montar() {
  const listeners = {};
  const almacenes = new Map();                       // nombre → Map(ruta → respuesta)
  const ruta = (r) => (typeof r === "string" ? r : new URL(r.url).pathname);
  const caches = {
    open: async (n) => {
      if (!almacenes.has(n)) almacenes.set(n, new Map());
      const m = almacenes.get(n);
      return {
        match: async (r) => m.get(ruta(r)),
        put: async (r, res) => { m.set(ruta(r), res); },
        delete: async (r) => m.delete(ruta(r)),
        keys: async () => [...m.keys()].map((p) => ({ url: ORIGEN + p })),
      };
    },
    keys: async () => [...almacenes.keys()],
    delete: async (n) => almacenes.delete(n),
  };
  const red = { conectada: true, archivos: {} };     // ruta → RespuestaFalsa
  const fetchFalso = jest.fn(async (r) => {
    if (!red.conectada) throw new TypeError("Failed to fetch");
    const p = ruta(r);
    return red.archivos[p] || new RespuestaFalsa("no existe", { status: 404 });
  });
  const self = {
    location: { origin: ORIGEN },
    addEventListener: (tipo, fn) => { listeners[tipo] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  // eslint-disable-next-line no-new-func
  new Function("self", "caches", "fetch", "Response", FUENTE)(self, caches, fetchFalso, RespuestaFalsa);

  const disparar = async (tipo, extra = {}) => {
    const pendientes = [];
    let respuesta;
    const evento = { ...extra, waitUntil: (p) => pendientes.push(p), respondWith: (p) => { respuesta = p; } };
    listeners[tipo](evento);
    const res = respuesta ? await respuesta : undefined;
    await Promise.all(pendientes);
    return { interceptado: respuesta !== undefined, res };
  };
  const pedir = (p, { mode = "cors", method = "GET", origen = ORIGEN } = {}) =>
    disparar("fetch", { request: { url: origen + p, method, mode } });

  return { red, almacenes, disparar, pedir, fetchFalso };
}

const manifestV = (js) => JSON.stringify({ files: { "main.js": js, "main.css": "/static/css/main.aaa.css", "main.js.map": js + ".map" } });

function publicar(sw, version) {
  const js = `/static/js/main.${version}.js`;
  sw.red.archivos = {
    "/": new RespuestaFalsa(`index ${version}`),
    "/index.html": new RespuestaFalsa(`index ${version}`),
    "/asset-manifest.json": new RespuestaFalsa(manifestV(js), { contentType: "application/json" }),
    [js]: new RespuestaFalsa(`js ${version}`, { contentType: "application/javascript" }),
    "/static/css/main.aaa.css": new RespuestaFalsa("css", { contentType: "text/css" }),
    "/manifest.json": new RespuestaFalsa("{}", { contentType: "application/json" }),
    "/icon-192.png": new RespuestaFalsa("png", { contentType: "image/png" }),
  };
  return js;
}

describe("service worker", () => {
  test("al instalarse guarda la página y los archivos de la versión (sin los .map)", async () => {
    const sw = montar();
    const js = publicar(sw, "v1");
    await sw.disparar("install");
    const shell = sw.almacenes.get("t360-shell-v1");
    const assets = sw.almacenes.get("t360-assets-v1");
    expect(shell.get("/index.html").cuerpo).toBe("index v1");
    expect([...assets.keys()].sort()).toEqual(["/static/css/main.aaa.css", js].sort());
  });

  test("sin señal la app abre con la última página guardada y sus archivos", async () => {
    const sw = montar();
    const js = publicar(sw, "v1");
    await sw.disparar("install");
    sw.red.conectada = false;
    const pagina = await sw.pedir("/", { mode: "navigate" });
    expect(pagina.res.cuerpo).toBe("index v1");
    const script = await sw.pedir(js);
    expect(script.res.cuerpo).toBe("js v1");
  });

  test("con señal siempre se recibe la versión recién publicada, y queda guardada para después", async () => {
    const sw = montar();
    const jsViejo = publicar(sw, "v1");
    await sw.disparar("install");
    const jsNuevo = publicar(sw, "v2");                       // nuevo deploy
    const pagina = await sw.pedir("/", { mode: "navigate" });
    expect(pagina.res.cuerpo).toBe("index v2");
    const assets = sw.almacenes.get("t360-assets-v1");
    expect(assets.has(jsNuevo)).toBe(true);
    expect(assets.has(jsViejo)).toBe(false);                  // se limpia la versión anterior
    sw.red.conectada = false;
    expect((await sw.pedir("/", { mode: "navigate" })).res.cuerpo).toBe("index v2");
    expect((await sw.pedir(jsNuevo)).res.cuerpo).toBe("js v2");
  });

  test("sin señal y sin copia previa responde una página de aviso, no un error del navegador", async () => {
    const sw = montar();
    sw.red.conectada = false;
    const pagina = await sw.pedir("/", { mode: "navigate" });
    expect(pagina.res.status).toBe(503);
    expect(pagina.res.cuerpo).toMatch(/Sin conexión/);
  });

  test("no toca Supabase, /api ni escrituras", async () => {
    const sw = montar();
    publicar(sw, "v1");
    expect((await sw.pedir("/rest/v1/atenciones_medicas", { origen: "https://dnlvzwrujosuckdzmffx.supabase.co" })).interceptado).toBe(false);
    expect((await sw.pedir("/api/send-email")).interceptado).toBe(false);
    expect((await sw.pedir("/", { method: "POST" })).interceptado).toBe(false);
    expect((await sw.pedir("/asset-manifest.json")).interceptado).toBe(false);
  });

  test("abrir una imagen en el navegador no reemplaza la página guardada", async () => {
    const sw = montar();
    publicar(sw, "v1");
    await sw.disparar("install");
    await sw.pedir("/icon-192.png", { mode: "navigate" });
    expect(sw.almacenes.get("t360-shell-v1").get("/index.html").cuerpo).toBe("index v1");
  });

  test("al activarse borra cachés de versiones antiguas del service worker", async () => {
    const sw = montar();
    sw.almacenes.set("t360-shell-v0", new Map());
    sw.almacenes.set("otra-cosa", new Map());
    await sw.disparar("activate");
    expect(sw.almacenes.has("t360-shell-v0")).toBe(false);
    expect(sw.almacenes.has("otra-cosa")).toBe(true);
  });
});

describe("interruptor por dispositivo (?sw=on / ?sw=off)", () => {
  const almacen = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };

  test("en prueba (por defecto apagado): un dispositivo cualquiera no registra nada", () => {
    expect(decisionServiceWorker("", almacen(), false)).toBe("nada");
  });
  test("?sw=on lo activa en ese dispositivo y queda recordado", () => {
    const ls = almacen();
    expect(decisionServiceWorker("?sw=on", ls, false)).toBe("registrar");
    expect(decisionServiceWorker("", ls, false)).toBe("registrar");
  });
  test("?sw=off desinstala y queda apagado aunque el valor por defecto sea activo", () => {
    const ls = almacen();
    expect(decisionServiceWorker("?sw=off", ls, true)).toBe("apagar");
    expect(decisionServiceWorker("", ls, true)).toBe("apagar");
    expect(decisionServiceWorker("?sw=on", ls, true)).toBe("registrar");
  });
  test("cuando se active para todos, un dispositivo cualquiera registra", () => {
    expect(decisionServiceWorker("", almacen(), true)).toBe("registrar");
  });
});
