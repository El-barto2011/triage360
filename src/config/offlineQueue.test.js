import { enqueue, getAll, remove, count, esEncolable, __resetMem, SAFELIST } from "./offlineQueue";

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
