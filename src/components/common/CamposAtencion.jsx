import { useState, useEffect, useMemo } from "react";
import { C } from "../../config/theme";
import { sb } from "../../config/supabase";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Field, selectCls } from "./FormControls";
import { getIndustria } from "../../config/permisos";

/* ════════════════════════════════════════════════════════════
   Campos compartidos por los formularios de atención médica y
   de enfermería/paramédicos: estado del paciente, identificación
   (RUT o pasaporte) y lista de insumos reales del evento.
   ════════════════════════════════════════════════════════════ */

export const ESTADOS_ATENCION = [
  { id: "alta",      label: "Atendido",  desc: "La atención terminó: no pasa a la Cola de Triaje",        color: "#10b981" },
  { id: "en_espera", label: "En espera", desc: "Queda en la Cola de Triaje hasta que un médico lo atienda", color: "#f59e0b" },
  { id: "derivado",  label: "Derivado",  desc: "Fue trasladado a un centro asistencial",                   color: "#3b82f6" },
];

export const estadoAtencionInfo = (id) =>
  ESTADOS_ATENCION.find(e => e.id === id) ||
  (id === "en_atencion"
    ? { id, label: "En atención", desc: "Un médico lo está atendiendo", color: "#8b5cf6" }
    : ESTADOS_ATENCION[0]);

/** ¿Cómo queda el paciente al guardar? */
export function EstadoPaciente({ value, onChange }) {
  const actual = value || "alta";
  return (
    <div className="space-y-2">
      <Label>¿Cómo queda el paciente?</Label>
      <div className="grid grid-cols-3 gap-2">
        {ESTADOS_ATENCION.map(e => (
          <button
            key={e.id}
            type="button"
            className="rounded-lg py-2.5 text-xs font-semibold border transition-all"
            style={{
              border: actual === e.id ? `2px solid ${e.color}` : `1px solid ${C.border}`,
              background: actual === e.id ? `${e.color}20` : "transparent",
              color: actual === e.id ? e.color : C.textMuted,
            }}
            onClick={() => onChange(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>
      <p className="text-xs" style={{ color: C.textMuted }}>{estadoAtencionInfo(actual).desc}</p>
    </div>
  );
}

/** RUT o pasaporte, con búsqueda de atenciones previas al escribir. */
export function IdentificacionPaciente({ form, setForm, onBuscar, previas = 0 }) {
  const esPasaporte = form.tipo_identificacion === "pasaporte";
  const campo = esPasaporte ? "paciente_pasaporte" : "paciente_rut";
  return (
    <Field label={esPasaporte ? "Pasaporte" : "RUT"}>
      <div className="flex gap-2">
        <div className="flex gap-1 shrink-0">
          {["rut", "pasaporte"].map(tipo => (
            <Button
              key={tipo}
              type="button"
              size="sm"
              variant={(form.tipo_identificacion || "rut") === tipo ? "teal" : "outline"}
              onClick={() => { setForm(f => ({ ...f, tipo_identificacion: tipo, paciente_rut: "", paciente_pasaporte: "" })); onBuscar("", tipo); }}
            >
              {tipo === "rut" ? "RUT" : "Pasap."}
            </Button>
          ))}
        </div>
        <Input
          value={form[campo] || ""}
          onChange={e => { const v = e.target.value; setForm(f => ({ ...f, [campo]: v })); onBuscar(v, esPasaporte ? "pasaporte" : "rut"); }}
          placeholder={esPasaporte ? "AB1234567" : "12.345.678-9"}
        />
      </div>
      {previas > 0 && (
        <p className="text-xs text-green-400 mt-1">✓ {previas} atención{previas > 1 ? "es" : ""} previa{previas > 1 ? "s" : ""}</p>
      )}
    </Field>
  );
}

/** Insumos reales de carros y bolsos. Si el evento tiene contenedores asignados, solo esos.
    Devuelve [{ nombre, stock, unidad }] ordenado por nombre. */
export function useInsumosEvento(evento, token) {
  const [filas, setFilas] = useState([]);
  useEffect(() => {
    let vivo = true;
    sb("contenedores_medicamentos?deleted_at=is.null&select=nombre,nombre_insumo,stock,unidad", { _silent: true }, token)
      .then(d => { if (vivo && Array.isArray(d)) setFilas(d); });
    return () => { vivo = false; };
  }, [token]);

  return useMemo(() => {
    const asignados = new Set([
      ...(Array.isArray(evento?.carros_asignados) ? evento.carros_asignados : []),
      ...(Array.isArray(evento?.bolsos_asignados) ? evento.bolsos_asignados : []),
    ]);
    const delEvento = asignados.size > 0 ? filas.filter(f => asignados.has(f.nombre)) : [];
    const base = delEvento.length > 0 ? delEvento : filas;
    const porNombre = new Map();
    for (const f of base) {
      const nombre = (f.nombre_insumo || "").trim();
      if (!nombre) continue;
      const previo = porNombre.get(nombre) || { nombre, stock: 0, unidad: f.unidad || "" };
      previo.stock += Number(f.stock) || 0;
      porNombre.set(nombre, previo);
    }
    return [...porNombre.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [filas, evento]);
}

/** <datalist> para autocompletar el nombre del insumo con su stock a la vista. */
export function DatalistInsumos({ id, insumos }) {
  return (
    <datalist id={id}>
      {insumos.map(i => (
        <option key={i.nombre} value={i.nombre} label={`stock ${i.stock}${i.unidad ? " " + i.unidad : ""}`} />
      ))}
    </datalist>
  );
}

/* ════════════════════════════════════════════════════════════
   Turno en terreno: piezas para registrar más rápido
   ════════════════════════════════════════════════════════════ */

export const TRIAJE_OPCIONES = [
  { codigo: "VERDE",    color: "#10b981", emoji: "🟢", espera: 60,   desc: "Leve — puede esperar" },
  { codigo: "AMARILLO", color: "#f59e0b", emoji: "🟡", espera: 30,   desc: "Moderado — atención pronto" },
  { codigo: "ROJO",     color: "#ef4444", emoji: "🔴", espera: 0,    desc: "URGENTE — atención inmediata" },
  { codigo: "NEGRO",    color: "#374151", emoji: "⚫", espera: null, desc: "Sin signos vitales" },
];

export const SIN_ALERGIAS = "Sin alergias conocidas";

/** Industria elegida en Configuración (define motivos frecuentes y campos extra). */
export const industriaActual = () => {
  let key = null;
  try { key = localStorage.getItem("industriaKey"); } catch (_) {}
  return getIndustria(key);
};

const incluye = (texto, parte) => (texto || "").toLowerCase().includes(parte.toLowerCase());

/** Agrega o quita un motivo frecuente del texto libre. */
export function alternarMotivo(texto, motivo) {
  const partes = (texto || "").split(",").map(p => p.trim()).filter(Boolean);
  const i = partes.findIndex(p => p.toLowerCase() === motivo.toLowerCase());
  if (i >= 0) partes.splice(i, 1); else partes.push(motivo);
  return partes.join(", ");
}

/** Motivos frecuentes de la industria: un toque en vez de escribir. */
export function MotivosRapidos({ value, onChange, industria }) {
  const ind = industria || industriaActual();
  return (
    <div className="flex flex-wrap gap-1.5">
      {(ind.tipos_atencion || []).map(m => {
        const activo = incluye(value, m);
        return (
          <button
            key={m}
            type="button"
            className="rounded-full px-2.5 py-1 text-xs border transition-all"
            style={{
              border: `1px solid ${activo ? C.accent : C.border}`,
              background: activo ? C.accentDim : "transparent",
              color: activo ? C.accent : C.textMuted,
              fontWeight: activo ? 600 : 400,
            }}
            onClick={() => onChange(alternarMotivo(value, m))}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/** Campos propios de la industria (dorsal, disciplina, empresa contratista…). Se guardan en datos_extra. */
export function CamposExtra({ value, onChange, industria }) {
  const ind = industria || industriaActual();
  // No repetir lo que el formulario ya pide
  const campos = (ind.campos_extra || []).filter(c => !/^rut\b/i.test(c) && !/^edad$/i.test(c));
  if (campos.length === 0) return null;
  const datos = value || {};
  return (
    <div className={`grid gap-4 ${campos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {campos.map(c => (
        <Field key={c} label={c}>
          <Input value={datos[c] || ""} onChange={e => onChange({ ...datos, [c]: e.target.value })} />
        </Field>
      ))}
    </div>
  );
}

/** Quita los campos vacíos antes de guardar. */
export const limpiarExtra = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, String(v ?? "").trim()]).filter(([, v]) => v));

/** Alergias: se preguntan al ingresar. Si el paciente ya tiene ficha, se traen de ahí. */
export function CampoAlergias({ value, onChange, ficha }) {
  const deFicha = ficha?.alergias || "";
  useEffect(() => {
    if (deFicha && !value) onChange(deFicha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deFicha]);
  return (
    <Field label="Alergias">
      <div className="flex gap-2">
        <Input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="Ej: penicilina, AINEs, látex" />
        <Button type="button" size="sm" variant={value === SIN_ALERGIAS ? "teal" : "outline"} className="shrink-0"
          onClick={() => onChange(value === SIN_ALERGIAS ? "" : SIN_ALERGIAS)}>
          Sin alergias
        </Button>
      </div>
    </Field>
  );
}

const CAMPOS_VITALES = ["presion_sistolica", "presion_diastolica", "frecuencia_cardiaca", "temperatura", "saturacion_oxigeno", "frecuencia_respiratoria"];
export const tieneSignosVitales = (form) => CAMPOS_VITALES.some(c => form?.[c] !== undefined && form?.[c] !== null && String(form[c]).trim() !== "");
export const triajeExigeVitales = (codigo) => codigo === "ROJO" || codigo === "AMARILLO";
/** En rojo y amarillo se espera al menos un signo vital (salvo que el paciente quede "en espera"). */
export const faltanSignosVitales = (form) =>
  triajeExigeVitales(form?.codigo_triaje) && form?.estado_atencion !== "en_espera" && !tieneSignosVitales(form);

/** Signos vitales: abiertos en rojo y amarillo, plegados en verde. */
export function SignosVitales({ form, setForm }) {
  const [abierto, setAbierto] = useState(false);
  const exigido = triajeExigeVitales(form.codigo_triaje);
  const visible = abierto || exigido || tieneSignosVitales(form);
  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  if (!visible) {
    return (
      <button type="button" onClick={() => setAbierto(true)}
        className="w-full rounded-lg border border-dashed py-2.5 text-xs font-semibold"
        style={{ borderColor: C.border, color: C.textMuted }}>
        + Agregar signos vitales
      </button>
    );
  }
  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: exigido && !tieneSignosVitales(form) ? "#f59e0b" : C.border }}>
      <p className="text-sm font-semibold" style={{ color: C.blue }}>
        Signos Vitales
        {exigido && <span className="ml-2 text-xs font-normal" style={{ color: "#f59e0b" }}>recomendados en rojo y amarillo</span>}
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Presión Arterial (mmHg)</Label>
          <div className="flex items-center gap-1.5">
            <Input type="number" placeholder="120" className="w-20" value={form.presion_sistolica || ""} onChange={set("presion_sistolica")} />
            <span className="text-muted-foreground">/</span>
            <Input type="number" placeholder="80" className="w-20" value={form.presion_diastolica || ""} onChange={set("presion_diastolica")} />
          </div>
        </div>
        <Field label="Frec. Cardíaca (lpm)">
          <Input type="number" placeholder="72" value={form.frecuencia_cardiaca || ""} onChange={set("frecuencia_cardiaca")} />
        </Field>
        <Field label="Temperatura (°C)">
          <Input type="number" step="0.1" placeholder="36.5" value={form.temperatura || ""} onChange={set("temperatura")} />
        </Field>
        <Field label="Sat. Oxígeno (%)">
          <Input type="number" placeholder="98" value={form.saturacion_oxigeno || ""} onChange={set("saturacion_oxigeno")} />
        </Field>
        <Field label="Frec. Respiratoria (rpm)">
          <Input type="number" placeholder="16" value={form.frecuencia_respiratoria || ""} onChange={set("frecuencia_respiratoria")} />
        </Field>
      </div>
    </div>
  );
}

export const MEDIOS_DERIVACION = ["Ambulancia", "Vehículo particular", "Vehículo del evento", "Por sus medios"];
export const horaAhora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
/** Devuelve la derivación lista para guardar, o null si no hay ningún dato. */
export const limpiarDerivacion = (d) => {
  const limpio = limpiarExtra(d);
  return Object.keys(limpio).length > 0 ? limpio : null;
};
export const resumenDerivacion = (d) => {
  if (!d) return "";
  return [d.destino && `a ${d.destino}`, d.medio && `en ${d.medio.toLowerCase()}`, d.hora_salida && `salida ${d.hora_salida}`, d.acompanante && `acompaña ${d.acompanante}`]
    .filter(Boolean).join(" · ");
};

/** Derivación: destino, hora de salida, medio y quién acompaña. */
export function CamposDerivacion({ value, onChange }) {
  const d = value || {};
  const set = (campo) => (e) => onChange({ ...d, [campo]: e.target.value });
  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#3b82f6" }}>
      <p className="text-sm font-semibold" style={{ color: "#3b82f6" }}>Derivación</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Destino">
          <Input value={d.destino || ""} onChange={set("destino")} placeholder="Centro asistencial" />
        </Field>
        <Field label="Hora de salida">
          <Input type="time" value={d.hora_salida || ""} onChange={set("hora_salida")} />
        </Field>
        <Field label="Medio de traslado">
          <select className={selectCls} value={d.medio || ""} onChange={set("medio")}>
            <option value="">—</option>
            {MEDIOS_DERIVACION.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Quién acompaña">
          <Input value={d.acompanante || ""} onChange={set("acompanante")} placeholder="Nombre y relación" />
        </Field>
      </div>
    </div>
  );
}

/** Plantillas de atención definidas por el equipo: un toque llena diagnóstico, tratamiento e insumos. */
export function PlantillasAtencion({ usuario, form, onAplicar }) {
  const [plantillas, setPlantillas] = useState([]);
  const [nombre, setNombre] = useState(null);     // null = cerrado; string = nombre en edición
  const [guardando, setGuardando] = useState(false);
  const puedeEditar = usuario?.rol === "admin" || usuario?.profesion === "Médico";

  const cargar = () =>
    sb("plantillas_atencion?activa=eq.true&order=nombre", { _silent: true }, usuario?.token)
      .then(d => { if (Array.isArray(d)) setPlantillas(d); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const limpio = (nombre || "").trim();
    if (limpio.length < 2) return;
    setGuardando(true);
    try {
      const res = await sb("plantillas_atencion", {
        method: "POST",
        body: JSON.stringify({
          nombre: limpio,
          motivo_consulta: form.motivo_consulta || null,
          diagnostico: form.diagnostico || null,
          tratamiento: form.tratamiento || null,
          observaciones: form.observaciones || null,
          insumos: (form.insumos_medico || []).filter(i => i.nombre?.trim()),
        }),
      }, usuario?.token);
      if (res) { setNombre(null); await cargar(); }
    } finally { setGuardando(false); }
  };

  const quitar = async (p) => {
    const res = await sb(`plantillas_atencion?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ activa: false }) }, usuario?.token);
    if (res) cargar();
  };

  if (plantillas.length === 0 && !puedeEditar) return null;

  return (
    <div className="space-y-2">
      <Label>Plantillas</Label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {plantillas.map(p => (
          <span key={p.id} className="inline-flex items-center rounded-full border text-xs" style={{ borderColor: C.border }}>
            <button type="button" className="px-2.5 py-1 font-semibold" style={{ color: C.text }} onClick={() => onAplicar(p)}>
              {p.nombre}
            </button>
            {puedeEditar && (
              <button type="button" aria-label={`Quitar plantilla ${p.nombre}`} className="pr-2 pl-0.5" style={{ color: C.textMuted }} onClick={() => quitar(p)}>×</button>
            )}
          </span>
        ))}
        {plantillas.length === 0 && (
          <span className="text-xs" style={{ color: C.textMuted }}>Aún no hay plantillas. Llena una atención típica y guárdala como plantilla.</span>
        )}
        {puedeEditar && nombre === null && (
          <button type="button" className="rounded-full border border-dashed px-2.5 py-1 text-xs" style={{ borderColor: C.border, color: C.textMuted }} onClick={() => setNombre("")}>
            + Guardar esta como plantilla
          </button>
        )}
      </div>
      {puedeEditar && nombre !== null && (
        <div className="flex gap-2">
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la plantilla (ej: Esguince de tobillo)" maxLength={60} />
          <Button type="button" size="sm" variant="teal" disabled={guardando || nombre.trim().length < 2} onClick={guardar}>Guardar</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setNombre(null)}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}

/** Aplica una plantilla al formulario sin pisar lo que el profesional ya escribió. */
export function aplicarPlantilla(form, p) {
  const insumosActuales = (form.insumos_medico || []).filter(i => i.nombre?.trim());
  return {
    ...form,
    motivo_consulta: form.motivo_consulta?.trim() ? form.motivo_consulta : (p.motivo_consulta || ""),
    diagnostico:     form.diagnostico?.trim()     ? form.diagnostico     : (p.diagnostico || ""),
    tratamiento:     form.tratamiento?.trim()     ? form.tratamiento     : (p.tratamiento || ""),
    observaciones:   form.observaciones?.trim()   ? form.observaciones   : (p.observaciones || ""),
    insumos_medico:  insumosActuales.length > 0 ? form.insumos_medico : (Array.isArray(p.insumos) ? p.insumos.map(i => ({ ...i })) : []),
  };
}
