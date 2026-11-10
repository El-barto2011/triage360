/* Pruebas de humo: las pantallas clínicas se dibujan y sus controles nuevos responden.
   La base de datos se simula; no se toca ningún dato real. */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ColaTriaje from "./ColaTriaje";
import { VistaAtencionesEnfermeria } from "./VistaAtencionesEnfermeria";
import { VistaAtencionesMedicas } from "./VistaAtencionesMedicas";

const EVENTO = { id: 7, nombre_evento: "Torneo Prueba", estado: "activo", carros_asignados: ["Carro 1"], bolsos_asignados: [] };
const HACE = (min) => new Date(Date.now() - min * 60000).toISOString();

const mockSb = jest.fn();
const respuestaSb = async (endpoint, options = {}) => {
  const ep = String(endpoint);
  if (options.method === "PATCH") return [{ id: 1 }];
  if (ep.startsWith("equipos_evento")) return [EVENTO];
  if (ep.startsWith("contenedores_medicamentos")) {
    return [
      { nombre: "Carro 1", nombre_insumo: "Gasa estéril", stock: 12, unidad: "unid." },
      { nombre: "Carro 2", nombre_insumo: "Suero fisiológico", stock: 4, unidad: "ml" },
    ];
  }
  if (ep.startsWith("atenciones_medicas") && ep.includes("estado_atencion=in.")) {
    return [
      { id: 1, paciente_nombre: "Paciente Espera", codigo_triaje: "ROJO", estado_atencion: "en_espera", created_at: HACE(30), motivo_consulta: "dolor torácico" },
      { id: 2, paciente_nombre: "Paciente Atendiendo", codigo_triaje: "VERDE", estado_atencion: "en_atencion", created_at: HACE(200), estado_cambio_at: HACE(190), motivo_consulta: "esguince" },
    ];
  }
  return [];
};

jest.mock("../../config/supabase", () => ({
  sb: (...args) => mockSb(...args),
  getToken: () => "token",
  flushOfflineQueue: async () => {},
}));
jest.mock("../../config/realtime", () => ({
  subscribeAtenciones: () => () => {},
}));
// El contexto de evento se reemplaza por uno fijo (sin evento filtrado)
jest.mock("../common/SelectorEvento", () => ({
  useEvento: () => ({ eventoActual: null, eventos: [], cambiarEvento: () => {} }),
}));

const usuario = { id: "u-1", nombre: "Dra. Prueba", profesion: "Médico", rol: "admin", token: "token" };

// CRA reinicia los mocks antes de cada prueba: se vuelve a instalar la respuesta simulada
beforeEach(() => { mockSb.mockReset(); mockSb.mockImplementation(respuestaSb); });

describe("Cola de Triaje", () => {
  test("muestra solo pacientes en espera o en atención y pide ese filtro a la base", async () => {
    render(<ColaTriaje usuario={usuario} />);
    expect(await screen.findByText("Paciente Espera")).toBeInTheDocument();
    expect(screen.getByText("Paciente Atendiendo")).toBeInTheDocument();
    const consulta = mockSb.mock.calls.map(c => String(c[0])).find(e => e.startsWith("atenciones_medicas"));
    expect(consulta).toContain("estado_atencion=in.(en_espera,en_atencion)");
    expect(consulta).toContain("deleted_at=is.null");
  });

  test("el paciente en atención no marca tiempo excedido; el rojo en espera sí", async () => {
    render(<ColaTriaje usuario={usuario} />);
    await screen.findByText("Paciente Espera");
    expect(screen.getAllByText(/TIEMPO EXCEDIDO/)).toHaveLength(1);
    expect(screen.getByText("EN ATENCIÓN")).toBeInTheDocument();
    // "Atender" solo aparece para quien todavía espera
    expect(screen.getAllByRole("button", { name: /Atender/ })).toHaveLength(1);
  });

  test("dar alta completa la ficha del mismo registro y guarda el estado", async () => {
    render(<ColaTriaje usuario={usuario} />);
    await screen.findByText("Paciente Espera");
    fireEvent.click(screen.getAllByRole("button", { name: /Alta$/ })[0]);
    fireEvent.change(await screen.findByPlaceholderText("Evaluación / diagnóstico"), { target: { value: "Dolor muscular" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar alta" }));
    await waitFor(() => {
      const patch = mockSb.mock.calls.find(c => c[1]?.method === "PATCH");
      expect(patch).toBeTruthy();
      expect(String(patch[0])).toBe("atenciones_medicas?id=eq.1");
      const body = JSON.parse(patch[1].body);
      expect(body.estado_atencion).toBe("alta");
      expect(body.diagnostico).toBe("Dolor muscular");
      expect(body.medico_id).toBe("u-1");          // quien cierra es médico: queda como tratante
    });
  });

  test("derivar guarda el destino en las observaciones", async () => {
    render(<ColaTriaje usuario={usuario} />);
    await screen.findByText("Paciente Espera");
    fireEvent.click(screen.getAllByRole("button", { name: /Derivar$/ })[0]);
    fireEvent.change(await screen.findByPlaceholderText(/Centro asistencial/), { target: { value: "Clínica X en ambulancia" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar derivación" }));
    await waitFor(() => {
      const patch = mockSb.mock.calls.find(c => c[1]?.method === "PATCH");
      expect(patch).toBeTruthy();
      const body = JSON.parse(patch[1].body);
      expect(body.estado_atencion).toBe("derivado");
      expect(body.observaciones).toBe("Derivado a: Clínica X en ambulancia");
    });
  });
});

describe("Formularios de atención", () => {
  test("enfermería: el formulario trae estado del paciente, pasaporte e insumos del evento", async () => {
    render(<VistaAtencionesEnfermeria usuario={{ ...usuario, profesion: "Paramédico", rol: "profesional" }} />);
    fireEvent.click(await screen.findByRole("button", { name: /Nueva Atención/i }));
    expect(await screen.findByText("¿Cómo queda el paciente?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "En espera" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pasap." }));
    expect(screen.getByPlaceholderText("AB1234567")).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('#dl-insumos-evento-enf option[value="Gasa estéril"]')).not.toBeNull());
    // el evento tiene asignado solo el Carro 1: no se ofrecen insumos de otros carros
    expect(document.querySelector('#dl-insumos-evento-enf option[value="Suero fisiológico"]')).toBeNull();
  });

  test("médico: el formulario trae estado del paciente y selector RUT/Pasaporte", async () => {
    render(<VistaAtencionesMedicas usuario={usuario} />);
    fireEvent.click(await screen.findByRole("button", { name: /Nueva/i }));
    expect(await screen.findByText("¿Cómo queda el paciente?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pasap." })).toBeInTheDocument();
  });
});
