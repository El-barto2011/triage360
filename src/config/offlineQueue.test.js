import { enqueue, getAll, remove, count, esEncolable, esRpcEncolable, conClientUuid, endpointIdempotente, nuevoUuid, __resetMem, SAFELIST } from "./offlineQueue";

// En el entorno de test (jsdom sin IndexedDB) la cola usa el fallback en memoria.

beforeEach(() => __resetMem());

describe("esEncolable", () => {
  it("acepta POST a tablas de atención", () => {
    expect(esEncolable("atenciones_medicas", "POST")).toBe(true);
    expect(esEncolable("fichas_masoterapia?select=*", "POST")).toBe(true);
    expect(esEncolable("atenciones_kinesiologia", "POST")).toBe(true);
  });
  it("rechaza métodos que no son POST", () => {
    expect(esEncolable("atenciones_medicas", "PATCH")).toBe(false);
    expect(esEncolable("atenciones_medicas", "DELETE")).toBe(false);
    expect(esEncolable("atenciones_medicas", "GET")).toBe(false);
  });
  it("rechaza tablas fuera de la safelist", () => {
    expect(esEncolable("contenedores_medicamentos", "POST")).toBe(false);
    expect(esEncolable("rpc/fn_descontar_stock", "POST")).toBe(false);
    expect(esEncolable("pacientes", "POST")).toBe(false);
  });
});

describe("cola FIFO", () => {
  it("encola, lista, cuenta y elimina en orden", async () => {
    expect(await count()).toBe(0);
    await enqueue({ endpoint: "atenciones_medicas", body: '{"a":1}' });
    await enqueue({ endpoint: "fichas_masoterapia", body: '{"b":2}' });
    expect(await count()).toBe(2);

    const items = await getAll();
    expect(items.map(i => i.endpoint)).toEqual(["atenciones_medicas", "fichas_masoterapia"]);
    expect(items[0].ts).toBeGreaterThan(0);

    await remove(items[0].id);
    expect(await count()).toBe(1);
    expect((await getAll())[0].endpoint).toBe("fichas_masoterapia");
  });
});

describe("SAFELIST", () => {
  it("no incluye tablas peligrosas de reordenar", () => {
    expect(SAFELIST.has("administracion_medicamentos")).toBe(false);
    expect(SAFELIST.has("consumos_evento")).toBe(false);
  });
});

describe("idempotencia offline", () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it("nuevoUuid genera UUID v4 distintos", () => {
    const a = nuevoUuid(), b = nuevoUuid();
    expect(a).toMatch(UUID_RE);
    expect(a).not.toBe(b);
  });

  it("conClientUuid agrega el identificador y respeta uno existente", () => {
    const con = JSON.parse(conClientUuid('{"paciente_nombre":"Ana"}'));
    expect(con.paciente_nombre).toBe("Ana");
    expect(con.client_uuid).toMatch(UUID_RE);
    const fijo = JSON.parse(conClientUuid('{"client_uuid":"abc"}'));
    expect(fijo.client_uuid).toBe("abc");
  });

  it("conClientUuid no toca cuerpos que no son un objeto", () => {
    expect(conClientUuid("[1,2]")).toBe("[1,2]");
    expect(conClientUuid("no-json")).toBe("no-json");
  });

  it("endpointIdempotente agrega on_conflict solo cuando hay client_uuid", () => {
    expect(endpointIdempotente("atenciones_medicas", '{"client_uuid":"x"}')).toBe("atenciones_medicas?on_conflict=client_uuid");
    expect(endpointIdempotente("fichas_masoterapia?select=*", '{"client_uuid":"x"}')).toBe("fichas_masoterapia?select=*&on_conflict=client_uuid");
    expect(endpointIdempotente("atenciones_medicas", '{"a":1}')).toBe("atenciones_medicas");
  });

  it("el descuento de stock se encola solo como RPC POST", () => {
    expect(esRpcEncolable("rpc/fn_descontar_stock", "POST")).toBe(true);
    expect(esRpcEncolable("rpc/fn_descontar_stock", "GET")).toBe(false);
    expect(esRpcEncolable("rpc/fn_fusionar_pacientes", "POST")).toBe(false);
  });
});
