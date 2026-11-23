import { saveSession, clearSession, usuarioActual, sb, flushOfflineQueue, prepararCierreSesion, descartarPendientesUsuario } from "./supabase";
import { enqueue, getAll, count, __resetMem } from "./offlineQueue";

// Dos usuarios ficticios en el mismo navegador. jsdom no tiene IndexedDB: la cola usa memoria.
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const b64url = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const tokenDe = (sub) => `${b64url({ alg: "HS256" })}.${b64url({ sub, role: "authenticated" })}.firma`;
const loginComo = (sub) => saveSession({ access_token: tokenDe(sub), refresh_token: "r", expires_in: 3600 });

let enviados;
const redOk = () => {
  global.fetch = jest.fn(async (url, init) => {
    enviados.push({ url, body: init?.body, auth: init?.headers?.Authorization });
    return { ok: true, status: 201, text: async () => "[]" };
  });
};
const sinRed = () => { global.fetch = jest.fn(async () => { throw new TypeError("Failed to fetch"); }); };

beforeEach(() => {
  __resetMem();
  enviados = [];
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  clearSession();
  console.error.mockRestore();
});

describe("usuarioActual", () => {
  it("lee el id del usuario desde el token de la sesión", () => {
    loginComo(A);
    expect(usuarioActual()).toBe(A);
    clearSession();
    expect(usuarioActual()).toBeNull();
  });
});

describe("encolado sin red", () => {
  it("guarda el user_id de quien registró la atención", async () => {
    loginComo(A);
    sinRed();
    const res = await sb("atenciones_medicas", { method: "POST", body: JSON.stringify({ paciente_nombre: "Paciente Ficticio" }) });
    expect(res[0].__offline).toBe(true);
    const [item] = await getAll();
    expect(item.user_id).toBe(A);
  });
});

describe("reenvío al reconectar", () => {
  it("cada usuario envía solo lo suyo y los registros de otros se conservan", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: '{"de":"B"}', user_id: B });
    await enqueue({ endpoint: "atenciones_medicas", body: '{"de":"A"}', user_id: A });
    loginComo(A);
    redOk();
    const r = await flushOfflineQueue();
    expect(r).toEqual({ enviados: 1, pendientes: 0 });
    expect(enviados.map(e => e.body)).toEqual(['{"de":"A"}']);
    expect(enviados[0].auth).toBe(`Bearer ${tokenDe(A)}`);
    expect((await getAll()).map(i => i.user_id)).toEqual([B]);

    clearSession();
    loginComo(B);
    enviados = [];
    await flushOfflineQueue();
    expect(enviados.map(e => e.body)).toEqual(['{"de":"B"}']);
    expect(await count()).toBe(0);
  });

  it("sin sesión no se envía nada", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: A });
    redOk();
    await flushOfflineQueue();
    expect(enviados).toEqual([]);
    expect(await count()).toBe(1);
  });
});

describe("cierre de sesión con pendientes", () => {
  it("sin pendientes deja salir de inmediato", async () => {
    loginComo(A);
    redOk();
    expect(await prepararCierreSesion()).toEqual({ pendientes: 0, atenciones: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("con red: envía los pendientes y deja salir", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: A });
    await enqueue({ endpoint: "rpc/fn_descontar_stock", body: "{}", rpc: true, user_id: A });
    loginComo(A);
    redOk();
    expect(await prepararCierreSesion()).toEqual({ pendientes: 0, atenciones: 0 });
    expect(enviados).toHaveLength(2);
  });

  it("sin red: informa lo pendiente y NO borra nada", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: A });
    await enqueue({ endpoint: "rpc/fn_descontar_stock", body: "{}", rpc: true, user_id: A });
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: B });
    loginComo(A);
    sinRed();
    expect(await prepararCierreSesion()).toEqual({ pendientes: 2, atenciones: 1 });
    expect(await count()).toBe(3);
  });

  it("descartar (tras confirmación) borra solo los del usuario conectado", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: A });
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: B });
    loginComo(A);
    await descartarPendientesUsuario();
    expect((await getAll()).map(i => i.user_id)).toEqual([B]);
  });

  it("si la red no responde, no se queda colgado: vence el tope de tiempo", async () => {
    await enqueue({ endpoint: "atenciones_medicas", body: "{}", user_id: A });
    loginComo(A);
    let soltar;
    global.fetch = jest.fn(() => new Promise((_, reject) => { soltar = () => reject(new TypeError("timeout")); }));
    const r = await prepararCierreSesion(50);
    expect(r).toEqual({ pendientes: 1, atenciones: 1 });
    soltar(); // libera el envío colgado para no afectar otros tests
    await new Promise(res => setTimeout(res, 0));
  });
});
