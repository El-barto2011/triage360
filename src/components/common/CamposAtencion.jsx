import { useState, useEffect, useMemo, useRef } from "react";
import { C } from "../../config/theme";
import { sb } from "../../config/supabase";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Field } from "./FormControls";

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

/* ── Autocompletar insumos ─────────────────────────────────────
   Búsqueda sin tildes ni mayúsculas, por todas las palabras
   escritas (en cualquier orden), con stock visible. Elegir una
   opción fija el nombre exacto del catálogo (evita duplicados
   por escritura distinta). Se puede escribir un insumo libre. */
const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function InsumoCombobox({ value, onChange, onSelect, insumos, placeholder = "Buscar insumo…", className }) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const cajaRef = useRef(null);

  const opciones = useMemo(() => {
    const palabras = norm(value).split(/\s+/).filter(Boolean);
    const lista = palabras.length
      ? insumos.filter(i => { const n = norm(i.nombre); return palabras.every(w => n.includes(w)); })
      : insumos;
    // primero los que empiezan con lo escrito, luego el resto
    const q = norm(value);
    return [...lista].sort((a, b) => (norm(b.nombre).startsWith(q) ? 1 : 0) - (norm(a.nombre).startsWith(q) ? 1 : 0)).slice(0, 30);
  }, [value, insumos]);

  useEffect(() => { setActivo(0); }, [value]);
  useEffect(() => {
    const fuera = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const elegir = (ins) => {
    onChange(ins.nombre);
    onSelect?.(ins);
    setAbierto(false);
  };

  const onKeyDown = (e) => {
    if (!abierto && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setAbierto(true); return; }
    if (!abierto) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActivo(a => Math.min(a + 1, opciones.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActivo(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && opciones[activo]) { e.preventDefault(); elegir(opciones[activo]); }
    else if (e.key === "Escape") setAbierto(false);
  };

  return (
    <div ref={cajaRef} className={className} style={{ position: "relative" }}>
      <Input
        placeholder={placeholder}
        value={value || ""}
        autoComplete="off"
        onFocus={() => setAbierto(true)}
        onChange={e => { onChange(e.target.value); setAbierto(true); }}
        onKeyDown={onKeyDown}
      />
      {abierto && (
        <div style={{
          position: "absolute", zIndex: 60, left: 0, right: 0, top: "100%", marginTop: 4,
          maxHeight: 220, overflowY: "auto", background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        }}>
          {opciones.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: 12, color: C.textMuted }}>
              Sin coincidencias en el carro/bolso del evento{value ? " — se registrará como insumo libre" : ""}
            </div>
          ) : opciones.map((ins, idx) => (
            <div
              key={ins.nombre}
              onMouseDown={(e) => { e.preventDefault(); elegir(ins); }}
              onMouseEnter={() => setActivo(idx)}
              style={{
                padding: "8px 12px", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8,
                background: idx === activo ? C.surface2 : "transparent", color: C.text,
              }}
            >
              <span>{ins.nombre}</span>
              <span style={{ fontSize: 11, color: ins.stock > 0 ? C.textMuted : C.red, whiteSpace: "nowrap" }}>
                stock {ins.stock}{ins.unidad ? " " + ins.unidad : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Cantidad editable ─────────────────────────────────────────
   Permite borrar y escribir libremente (antes el campo volvía a
   "1" al vaciarlo). Al salir del campo queda como entero ≥ 1. */
export function CantidadInput({ value, onChange, className = "w-20", placeholder = "Cant." }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
      onFocus={e => e.target.select()}
      onBlur={() => onChange(String(Math.max(1, parseInt(value, 10) || 1)))}
    />
  );
}
