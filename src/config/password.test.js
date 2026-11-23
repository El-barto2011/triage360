import { validarPassword, leerRecuperacion, solicitarRecuperacion, actualizarPassword, verificarPasswordActual, PASSWORD_MIN } from "./password";

const resp = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

afterEach(() => { delete global.fetch; });

describe("validarPassword", () => {
  it("exige el largo mínimo", () => {
    expect(PASSWORD_MIN).toBe(10);
    expect(validarPassword("abc12")).toMatch(/al menos 10/);
    expect(validarPassword("abcdefgh1")).toMatch(/al menos 10/);   // 9 caracteres
  });
  it("exige letras y números", () => {
    expect(validarPassword("abcdefghijk")).toMatch(/letra y un número/);
    expect(validarPassword("12345678901")).toMatch(/letra y un número/);
  });
  it("acepta una contraseña válida", () => {
    expect(validarPassword("triage2026x")).toBeNull();
  });
  it("compara con la confirmación cuando se entrega", () => {
    expect(validarPassword("triage2026x", "triage2026y")).toMatch(/no coinciden/);
    expect(validarPassword("triage2026x", "triage2026x")).toBeNull();
  });
});

describe("leerRecuperacion", () => {
  it("reconoce el enlace de recuperación", () => {
    const r = leerRecuperacion("#access_token=AT&expires_at=2000000000&expires_in=3600&refresh_token=RT&token_type=bearer&type=recovery");
    expect(r).toEqual({ access_token: "AT", refresh_token: "RT", expires_at: 2000000000 });
  });
  it("ignora fragmentos que no son de recuperación", () => {
    expect(leerRecuperacion("")).toBeNull();
    expect(leerRecuperacion("#seccion")).toBeNull();
    expect(leerRecuperacion("#access_token=AT&type=signup")).toBeNull();
    expect(leerRecuperacion("#type=recovery")).toBeNull();
  });
  it("informa un enlace expirado o inválido", () => {
    const r = leerRecuperacion("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    expect(r.error).toMatch(/expiró/);
  });
});

describe("solicitarRecuperacion", () => {
  it("llama a /recover con la URL de vuelta y responde igual exista o no la cuenta", async () => {
    global.fetch = jest.fn(async () => resp(200));
    const r = await solicitarRecuperacion("  persona@ejemplo.cl ", "https://app.triage360.cl");
    expect(r).toEqual({ ok: true, error: null });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain("/auth/v1/recover?redirect_to=https%3A%2F%2Fapp.triage360.cl");
    expect(JSON.parse(init.body)).toEqual({ email: "persona@ejemplo.cl" });
  });
  it("avisa del límite de intentos", async () => {
    global.fetch = jest.fn(async () => resp(429));
    expect((await solicitarRecuperacion("a@b.cl", "x")).error).toMatch(/Demasiados intentos/);
  });
  it("avisa si no hay conexión", async () => {
    global.fetch = jest.fn(async () => { throw new TypeError("Failed to fetch"); });
    expect((await solicitarRecuperacion("a@b.cl", "x")).error).toMatch(/Sin conexión/);
  });
});

describe("actualizarPassword", () => {
  it("no llama al servidor si la contraseña no cumple", async () => {
    global.fetch = jest.fn();
    expect((await actualizarPassword("T", "corta")).ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("envía PUT /auth/v1/user con el token de la sesión", async () => {
    global.fetch = jest.fn(async () => resp(200));
    expect(await actualizarPassword("TOKEN", "triage2026x")).toEqual({ ok: true, error: null });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/v1\/user$/);
    expect(init.method).toBe("PUT");
    expect(init.headers.Authorization).toBe("Bearer TOKEN");
  });
  it("traduce los errores del servidor", async () => {
    global.fetch = jest.fn(async () => resp(422, { error_code: "same_password" }));
    expect((await actualizarPassword("T", "triage2026x")).error).toMatch(/distinta de la actual/);
    global.fetch = jest.fn(async () => resp(422, { error_code: "weak_password" }));
    expect((await actualizarPassword("T", "triage2026x")).error).toMatch(/requisitos/);
    global.fetch = jest.fn(async () => resp(401));
    expect((await actualizarPassword("T", "triage2026x")).error).toMatch(/expiró/);
  });
});

describe("verificarPasswordActual", () => {
  it("devuelve la sesión si la contraseña es correcta, null si no", async () => {
    global.fetch = jest.fn(async () => resp(200, { access_token: "NUEVO" }));
    expect(await verificarPasswordActual("a@b.cl", "ok")).toEqual({ access_token: "NUEVO" });
    global.fetch = jest.fn(async () => resp(400));
    expect(await verificarPasswordActual("a@b.cl", "mala")).toBeNull();
  });
});
