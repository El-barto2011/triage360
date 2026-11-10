import { fechaLocal, hoyLocal, inicioDiaLocalISO, inicioMesLocalISO, esHoyLocal } from "./fechas";
import { estadoVenc, tieneVenc } from "./constants";

describe("fechas locales", () => {
  test("fechaLocal usa la fecha del dispositivo, no la de UTC", () => {
    // 22:30 hora local del 14 de marzo: en UTC (Chile = UTC-3) ya es día 15
    const noche = new Date(2026, 2, 14, 22, 30);
    expect(fechaLocal(noche)).toBe("2026-03-14");
  });

  test("fechaLocal acepta ISO strings y rellena con ceros", () => {
    const d = new Date(2026, 0, 5, 9, 0);
    expect(fechaLocal(d.toISOString())).toBe("2026-01-05");
  });

  test("fechaLocal devuelve vacío ante valores inválidos", () => {
    expect(fechaLocal("no-es-fecha")).toBe("");
  });

  test("hoyLocal y esHoyLocal son coherentes", () => {
    expect(hoyLocal()).toBe(fechaLocal(new Date()));
    expect(esHoyLocal(new Date())).toBe(true);
    expect(esHoyLocal(new Date(Date.now() - 3 * 86400000))).toBe(false);
  });

  test("inicioDiaLocalISO es la medianoche local expresada como instante", () => {
    const ref = new Date(2026, 5, 20, 21, 45);
    const inicio = new Date(inicioDiaLocalISO(ref));
    expect(inicio.getFullYear()).toBe(2026);
    expect(inicio.getMonth()).toBe(5);
    expect(inicio.getDate()).toBe(20);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.getMinutes()).toBe(0);
    // una atención registrada a las 20:30 de ese día queda DENTRO del día
    expect(new Date(2026, 5, 20, 20, 30).getTime()).toBeGreaterThanOrEqual(inicio.getTime());
  });

  test("inicioMesLocalISO es el día 1 a medianoche local", () => {
    const inicio = new Date(inicioMesLocalISO(new Date(2026, 10, 10, 8, 24)));
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getMonth()).toBe(10);
    expect(inicio.getHours()).toBe(0);
  });
});

describe("estadoVenc sin fecha", () => {
  test("un insumo sin fecha de vencimiento no se marca como vencido", () => {
    expect(estadoVenc(null)).toBe("ok");
    expect(estadoVenc(undefined)).toBe("ok");
    expect(estadoVenc("")).toBe("ok");
  });

  test("tieneVenc distingue fechas válidas", () => {
    expect(tieneVenc("2027-01-01")).toBe(true);
    expect(tieneVenc(null)).toBe(false);
    expect(tieneVenc("abc")).toBe(false);
  });
});
