/**
 * Tests de lógica pura — estados de inventario y permisos.
 * Correr con: npm test
 */
import { estadoVenc, estadoStock } from "./constants";
import { getPermisos, getIndustria, PERMISOS } from "./permisos";

const diasDesdeHoy = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

describe("estadoStock", () => {
  test("agotado cuando stock es 0", () => {
    expect(estadoStock({ stock: 0, minimo: 2 })).toBe("agotado");
  });
  test("bajo cuando stock < mínimo", () => {
    expect(estadoStock({ stock: 1, minimo: 2 })).toBe("bajo");
  });
  test("ok cuando stock == mínimo", () => {
    expect(estadoStock({ stock: 2, minimo: 2 })).toBe("ok");
  });
  test("ok cuando stock > mínimo", () => {
    expect(estadoStock({ stock: 10, minimo: 2 })).toBe("ok");
  });
});

describe("estadoVenc", () => {
  test("vencido si la fecha ya pasó", () => {
    expect(estadoVenc(diasDesdeHoy(-5))).toBe("vencido");
  });
  test("próximo si vence dentro de 60 días", () => {
    expect(estadoVenc(diasDesdeHoy(30))).toBe("proximo");
  });
  test("ok si vence después de 60 días", () => {
    expect(estadoVenc(diasDesdeHoy(120))).toBe("ok");
  });
});

describe("getPermisos", () => {
  test("admin recibe permisos de Administrador aunque tenga otra profesión", () => {
    expect(getPermisos({ rol: "admin", profesion: "Kinesiólogo/a" })).toEqual(PERMISOS["Administrador"]);
  });
  test("médico puede recetar, kinesiólogo no", () => {
    expect(getPermisos({ rol: "profesional", profesion: "Médico" }).recetarMedicamentos).toBe(true);
    expect(getPermisos({ rol: "profesional", profesion: "Kinesiólogo/a" }).recetarMedicamentos).toBe(false);
  });
  test("profesión desconocida cae al perfil más restrictivo", () => {
    expect(getPermisos({ rol: "profesional", profesion: "Otra" })).toEqual(PERMISOS["Kinesiólogo/a"]);
    expect(getPermisos(null)).toEqual(PERMISOS["Kinesiólogo/a"]);
  });
  test("solo enfermería/paramedicina/medicina/admin modifican stock", () => {
    const posibles = ["Médico", "Enfermero/a", "Paramédico"];
    posibles.forEach(p => expect(getPermisos({ profesion: p }).modificarStock).toBe(true));
    ["Kinesiólogo/a", "Masoterapeuta"].forEach(p => expect(getPermisos({ profesion: p }).modificarStock).toBe(false));
  });
});

describe("getIndustria", () => {
  test("clave inválida cae a eventos", () => {
    expect(getIndustria("no-existe").nombre).toBe(getIndustria("eventos").nombre);
  });
});
