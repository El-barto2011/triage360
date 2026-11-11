import {
  alternarMotivo, aplicarPlantilla, faltanSignosVitales, tieneSignosVitales, limpiarExtra,
  limpiarDerivacion, resumenDerivacion,
} from "./CamposAtencion";

jest.mock("../../config/supabase", () => ({ sb: async () => [] }));

describe("motivos de un toque", () => {
  test("agrega, combina y quita", () => {
    expect(alternarMotivo("", "Esguince")).toBe("Esguince");
    expect(alternarMotivo("Esguince", "Contusión / golpe")).toBe("Esguince, Contusión / golpe");
    expect(alternarMotivo("Esguince, Contusión / golpe", "esguince")).toBe("Contusión / golpe");
  });
  test("respeta el texto libre ya escrito", () => {
    expect(alternarMotivo("cayó en la curva 3", "Laceración / herida")).toBe("cayó en la curva 3, Laceración / herida");
  });
});

describe("signos vitales", () => {
  test("se piden en rojo y amarillo cuando la atención se cierra sin ninguno", () => {
    expect(faltanSignosVitales({ codigo_triaje: "ROJO", estado_atencion: "alta" })).toBe(true);
    expect(faltanSignosVitales({ codigo_triaje: "AMARILLO", estado_atencion: "derivado" })).toBe(true);
  });
  test("no se piden en verde, ni si el paciente queda en espera, ni si ya hay alguno", () => {
    expect(faltanSignosVitales({ codigo_triaje: "VERDE", estado_atencion: "alta" })).toBe(false);
    expect(faltanSignosVitales({ codigo_triaje: "ROJO", estado_atencion: "en_espera" })).toBe(false);
    expect(faltanSignosVitales({ codigo_triaje: "ROJO", estado_atencion: "alta", saturacion_oxigeno: "97" })).toBe(false);
    expect(tieneSignosVitales({ frecuencia_cardiaca: "" })).toBe(false);
  });
});

describe("plantillas", () => {
  const plantilla = { diagnostico: "Esguince grado I", tratamiento: "Hielo", motivo_consulta: "Esguince", insumos: [{ nombre: "Venda", cantidad: 1 }] };
  test("llena lo vacío", () => {
    const f = aplicarPlantilla({ motivo_consulta: "", insumos_medico: [] }, plantilla);
    expect(f).toMatchObject({ motivo_consulta: "Esguince", diagnostico: "Esguince grado I", tratamiento: "Hielo" });
    expect(f.insumos_medico).toEqual([{ nombre: "Venda", cantidad: 1 }]);
  });
  test("nunca pisa lo que el profesional ya escribió", () => {
    const f = aplicarPlantilla({ diagnostico: "Fractura probable", insumos_medico: [{ nombre: "Férula", cantidad: 1 }] }, plantilla);
    expect(f.diagnostico).toBe("Fractura probable");
    expect(f.insumos_medico).toEqual([{ nombre: "Férula", cantidad: 1 }]);
    expect(f.tratamiento).toBe("Hielo");
  });
});

describe("datos extra y derivación", () => {
  test("limpiarExtra descarta campos vacíos", () => {
    expect(limpiarExtra({ "Número de dorsal": " 12 ", "Disciplina deportiva": "" })).toEqual({ "Número de dorsal": "12" });
    expect(limpiarExtra(null)).toEqual({});
  });
  test("derivación vacía es null; con datos se resume en una línea", () => {
    expect(limpiarDerivacion({ destino: "", medio: "" })).toBeNull();
    const d = limpiarDerivacion({ destino: "Clínica X", medio: "Ambulancia", hora_salida: "15:40", acompanante: "" });
    expect(d).toEqual({ destino: "Clínica X", medio: "Ambulancia", hora_salida: "15:40" });
    expect(resumenDerivacion(d)).toBe("a Clínica X · en ambulancia · salida 15:40");
  });
});
