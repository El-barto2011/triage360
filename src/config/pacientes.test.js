import { normIdent, cleanIdent, esPasaporte, rutVariants, identFilter, validarRut, chequearAlergias } from "./pacientes";

describe("normIdent", () => {
  it("normaliza como fn_norm_ident de la BD", () => {
    expect(normIdent("12.345.678-k")).toBe("12345678K");
    expect(normIdent(" 12345678-9 ")).toBe("123456789");
    expect(normIdent(null)).toBe("");
  });
});

describe("cleanIdent", () => {
  it("neutraliza caracteres peligrosos para PostgREST", () => {
    expect(cleanIdent("123,45)or(x")).toBe("12345orx");
    expect(cleanIdent("12.345.678-9")).toBe("12.345.678-9");
  });
});

describe("rutVariants", () => {
  it("genera variante con puntos desde RUT sin puntos", () => {
    expect(rutVariants("12345678-9")).toEqual(["12345678-9", "12.345.678-9"]);
  });
  it("genera variante sin puntos desde RUT con puntos", () => {
    expect(rutVariants("12.345.678-9")).toEqual(["12.345.678-9", "12345678-9"]);
  });
  it("soporta RUT de 7 dígitos", () => {
    expect(rutVariants("1234567-8")).toEqual(["1234567-8", "1.234.567-8"]);
  });
});

describe("identFilter", () => {
  it("construye OR con variantes", () => {
    expect(identFilter("paciente_rut", "12345678-9"))
      .toBe("or=(paciente_rut.eq.12345678-9,paciente_rut.eq.12.345.678-9)");
  });
  it("pasaporte: filtro simple", () => {
    expect(identFilter("paciente_pasaporte", "AB123456")).toBe("paciente_pasaporte=eq.AB123456");
  });
});

describe("validarRut", () => {
  it("acepta RUT con DV correcto", () => {
    expect(validarRut("11.111.111-1")).toBe(true);
    expect(validarRut("12345678-5")).toBe(true);
  });
  it("rechaza DV incorrecto", () => {
    expect(validarRut("12345678-9")).toBe(false);
    expect(validarRut("11111111-2")).toBe(false);
  });
  it("acepta DV K", () => {
    expect(validarRut("20881410-K")).toBe(validarRut("20.881.410-k"));
  });
  it("no valida pasaportes", () => {
    expect(validarRut("AB123456")).toBe(true);
  });
  it("rechaza basura", () => {
    expect(validarRut("123")).toBe(false);
  });
});

describe("chequearAlergias", () => {
  it("detecta match directo", () => {
    expect(chequearAlergias("Penicilina", [{ nombre: "Amoxicilina 500mg" }])).toHaveLength(1);
  });
  it("detecta grupo AINEs", () => {
    const c = chequearAlergias("alérgico a AINEs", [{ nombre: "Ibuprofeno 400mg" }, { nombre: "Paracetamol 500mg" }]);
    expect(c).toHaveLength(1);
    expect(c[0].medicamento).toBe("Ibuprofeno 400mg");
  });
  it("sin falsos positivos", () => {
    expect(chequearAlergias("látex", [{ nombre: "Paracetamol" }])).toHaveLength(0);
  });
  it("tolera entradas vacías", () => {
    expect(chequearAlergias(null, [{ nombre: "X" }])).toEqual([]);
    expect(chequearAlergias("penicilina", [])).toEqual([]);
  });
});
