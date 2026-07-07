import { mensajeError } from "./supabase";

describe("mensajeError", () => {
  it("mapea unique_violation (23505)", () => {
    expect(mensajeError(409, '{"code":"23505"}', "POST")).toMatch(/duplicado/i);
  });
  it("mapea foreign_key_violation (23503)", () => {
    expect(mensajeError(409, '{"code":"23503"}', "POST")).toMatch(/relacionado/i);
  });
  it("mapea check_violation (23514) con detalle", () => {
    const msg = mensajeError(400, '{"code":"23514","message":"saturacion fuera de rango"}', "POST");
    expect(msg).toMatch(/fuera de rango/i);
  });
  it("mapea permiso denegado por código o 403", () => {
    expect(mensajeError(403, "{}", "POST")).toMatch(/permiso/i);
    expect(mensajeError(400, '{"code":"42501"}', "POST")).toMatch(/permiso/i);
  });
  it("mapea sesión expirada (401)", () => {
    expect(mensajeError(401, "{}", "GET")).toMatch(/sesión/i);
  });
  it("mapea error de servidor (5xx)", () => {
    expect(mensajeError(500, "", "GET")).toMatch(/servidor/i);
    expect(mensajeError(503, "", "GET")).toMatch(/servidor/i);
  });
  it("usa el detalle en 400 de validación", () => {
    expect(mensajeError(400, '{"message":"campo x inválido"}', "PATCH")).toBe("campo x inválido");
  });
  it("trunca detalles muy largos", () => {
    const largo = "x".repeat(200);
    expect(mensajeError(400, JSON.stringify({ message: largo }), "POST").length).toBeLessThanOrEqual(141);
  });
  it("fallback con verbo según método", () => {
    expect(mensajeError(418, "{}", "DELETE")).toMatch(/eliminar/i);
    expect(mensajeError(418, "{}", "POST")).toMatch(/guardar/i);
    expect(mensajeError(418, "{}", "GET")).toMatch(/cargar/i);
  });
  it("tolera cuerpo no-JSON", () => {
    expect(typeof mensajeError(500, "<html>error</html>", "GET")).toBe("string");
  });
});
