/* Sin señal: la sesión se conserva y los datos de referencia se leen de la copia local. */
import { esCacheable, guardarLectura, leerLectura, limpiarCacheLectura } from "./cacheLectura";

describe("caché de lectura", () => {
  beforeEach(() => localStorage.clear());

  test("solo datos de referencia son cacheables; nunca pacientes ni atenciones", () => {
    expect(esCacheable("equipos_evento?order=fecha_evento.desc", "GET")).toBe(true);
    expect(esCacheable("contenedores_medicamentos?deleted_at=is.null", undefined)).toBe(true);
    expect(esCacheable("medicamentos?select=nombre", "GET")).toBe(true);
    for (const t of ["atenciones_medicas", "atenciones_kinesiologia", "fichas_masoterapia", "pacientes", "administracion_medicamentos", "perfiles", "logs_auditoria", "rpc/fn_historial_paciente"]) {
      expect(esCacheable(`${t}?select=*`, "GET")).toBe(false);
    }
    expect(esCacheable("equipos_evento", "POST")).toBe(false);
  });

  test("guarda, lee y limpia", () => {
    expect(leerLectura("equipos_evento")).toBeNull();
    expect(guardarLectura("equipos_evento", [{ id: 1 }])).toBe(true);
    expect(leerLectura("equipos_evento").data).toEqual([{ id: 1 }]);
    localStorage.setItem("triage360_user", "x");
    limpiarCacheLectura();
    expect(leerLectura("equipos_evento")).toBeNull();
    expect(localStorage.getItem("triage360_user")).toBe("x");   // no borra nada ajeno
  });

  test("no guarda respuestas gigantes", () => {
    expect(guardarLectura("equipos_evento", "x".repeat(700 * 1024))).toBe(false);
  });
});

describe("sb() y sesión sin red", () => {
  let supa;
  const sinRed = () => { global.fetch = jest.fn(async () => { throw new TypeError("Failed to fetch"); }); };
  const conRespuesta = (status, cuerpo) => { global.fetch = jest.fn(async () => ({ ok: status < 300, status, text: async () => JSON.stringify(cuerpo), json: async () => cuerpo })); };

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();
    supa = require("./supabase");
    window.__toastError = jest.fn();
    window.__onSessionExpired = jest.fn();
  });
  afterEach(() => { jest.useRealTimers(); delete window.__toastError; delete window.__onSessionExpired; });

  test("una lectura de eventos sin red devuelve la última copia y no muestra error", async () => {
    conRespuesta(200, [{ id: 7, nombre_evento: "Torneo" }]);
    expect(await supa.sb("equipos_evento?order=fecha_evento.desc")).toEqual([{ id: 7, nombre_evento: "Torneo" }]);
    sinRed();
    expect(await supa.sb("equipos_evento?order=fecha_evento.desc")).toEqual([{ id: 7, nombre_evento: "Torneo" }]);
    expect(window.__toastError).not.toHaveBeenCalled();
  });

  test("una lectura de atenciones sin red NO sale de ninguna copia", async () => {
    conRespuesta(200, [{ id: 1, paciente_nombre: "X" }]);
    await supa.sb("atenciones_medicas?select=*");
    sinRed();
    expect(await supa.sb("atenciones_medicas?select=*")).toBeNull();
    expect(Object.keys(localStorage).some((k) => k.includes("atenciones"))).toBe(false);
  });

  test("renovar la sesión sin red no cierra la sesión", async () => {
    supa.saveSession({ access_token: "a", refresh_token: "r", expires_in: 3600 });
    sinRed();
    expect(await supa.refreshSession()).toBeNull();
    expect(supa.getToken()).toBe("a");
    expect(window.__onSessionExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem("triage360_session")).not.toBeNull();
  });

  test("abrir la app sin red con el token vencido mantiene al usuario dentro", async () => {
    localStorage.setItem("triage360_session", JSON.stringify({ access_token: "viejo", refresh_token: "r", expires_at: Math.floor(Date.now() / 1000) - 7200 }));
    sinRed();
    const sesion = await supa.restoreSession();
    expect(sesion?.access_token).toBe("viejo");
    expect(window.__onSessionExpired).not.toHaveBeenCalled();
  });

  test("si el servidor RECHAZA la renovación (token revocado) sí se cierra la sesión", async () => {
    supa.saveSession({ access_token: "a", refresh_token: "r", expires_in: 3600 });
    guardarLectura("equipos_evento", [{ id: 1 }]);
    conRespuesta(400, { error: "invalid_grant" });
    expect(await supa.refreshSession()).toBeNull();
    expect(supa.getToken()).toBeNull();
    expect(window.__onSessionExpired).toHaveBeenCalled();
    expect(leerLectura("equipos_evento")).toBeNull();          // al salir no quedan copias locales
  });

  test("un error 500 del servidor al renovar no cierra la sesión", async () => {
    supa.saveSession({ access_token: "a", refresh_token: "r", expires_in: 3600 });
    conRespuesta(503, {});
    expect(await supa.refreshSession()).toBeNull();
    expect(supa.getToken()).toBe("a");
  });
});
