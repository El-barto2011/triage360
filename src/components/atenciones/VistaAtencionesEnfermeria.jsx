import { useState, useEffect } from "react";
import { C } from "../../config/theme";
import { sb } from "../../config/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import { Stethoscope, Plus, X, ClipboardList, Heart } from "lucide-react";
import { toast } from "../ui/use-toast";
import { useEvento } from "../common/SelectorEvento";

const selectCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

const Field = ({ label, children, hint, required }) => (
  <div className="space-y-1.5">
    <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const TRIAJE = [
  { codigo: "VERDE",    color: "#10b981", emoji: "🟢", label: "VERDE",    espera: 60   },
  { codigo: "AMARILLO", color: "#f59e0b", emoji: "🟡", label: "AMARILLO", espera: 30   },
  { codigo: "ROJO",     color: "#ef4444", emoji: "🔴", label: "ROJO",     espera: 0    },
  { codigo: "NEGRO",    color: "#374151", emoji: "⚫", label: "NEGRO",    espera: null },
];

function rolLabel(profesion) {
  if (profesion === "Enfermero/a") return "Enfermería";
  if (profesion === "Paramédico")  return "Paramédico";
  if (profesion === "Kinesiólogo/a") return "Kinesiología";
  return profesion;
}

export function VistaAtencionesEnfermeria({ usuario }) {
  const [atenciones, setAtenciones]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [guardando, setGuardando]           = useState(false);
  const [modal, setModal]                   = useState(null);
  const [form, setForm]                     = useState({});
  const [eventos, setEventos]               = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);
  const [pacienteFicha, setPacienteFicha]   = useState(null);

  const { eventoActual } = useEvento();

  useEffect(() => { cargarDatos(); }, [usuario, eventoActual]);

  const cargarDatos = async () => {
    setLoading(true);
    const filtro = eventoActual ? `&evento_id=eq.${eventoActual}` : "";

    // Filtrar por el profesional según su tipo
    const prof = usuario?.profesion;
    let campoProfFiltro = "";
    if (prof === "Enfermero/a")    campoProfFiltro = `&enfermero_id=eq.${usuario.id}`;
    if (prof === "Paramédico")     campoProfFiltro = `&paramedico_id=eq.${usuario.id}`;
    if (prof === "Kinesiólogo/a")  campoProfFiltro = `&kinesiologo_id=eq.${usuario.id}`;

    const [ats, evs] = await Promise.all([
      sb(`atenciones_medicas?order=created_at.desc&limit=100${filtro}${campoProfFiltro}`, {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token),
    ]);
    if (ats) setAtenciones(ats);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const buscarPacientePorRut = async (rut) => {
    if (!rut || rut.length < 8) { setHistorialPaciente([]); setPacienteFicha(null); return; }
    const ident = rut.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const pacientes = await sb(
      `pacientes?identificacion=eq.${ident}&select=id,nombre,edad,alergias,antecedentes`,
      {}, usuario?.token
    );
    const p = pacientes?.[0] || null;
    setPacienteFicha(p);
    if (p) setForm(f => ({ ...f, paciente_nombre: p.nombre || f.paciente_nombre, paciente_edad: p.edad ?? f.paciente_edad }));
    const found = await sb(`atenciones_medicas?paciente_rut=eq.${rut}&order=created_at.desc&limit=10`, {}, usuario?.token);
    setHistorialPaciente(found?.length > 0 ? found : []);
    if (found?.length > 0 && !p) setForm(f => ({ ...f, paciente_nombre: found[0].paciente_nombre, paciente_edad: found[0].paciente_edad }));
  };

  const abrirNuevaAtencion = () => {
    const ahora = new Date();
    const eventoPresel = eventoActual ? eventos.find(e => e.id === eventoActual) : eventos[0];
    setForm({
      fecha_atencion: ahora.toISOString().split("T")[0],
      hora_atencion:  ahora.toTimeString().slice(0, 5),
      paciente_nombre: "", paciente_rut: "", paciente_edad: "",
      categoria_paciente: "Jugador",
      evento: eventoPresel?.nombre_evento || "",
      evento_id: eventoPresel?.id || null,
      motivo_consulta: "", diagnostico: "", tratamiento: "", observaciones: "",
      insumos_medico: [],
    });
    setHistorialPaciente([]);
    setPacienteFicha(null);
    setModal("nueva");
  };

  const agregarInsumo = () =>
    setForm(f => ({ ...f, insumos_medico: [...(f.insumos_medico || []), { nombre: "", cantidad: 1, unidad: "unid." }] }));

  const actualizarInsumo = (i, campo, valor) => {
    const ins = [...(form.insumos_medico || [])];
    ins[i][campo] = valor;
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const eliminarInsumo = (i) => {
    const ins = [...(form.insumos_medico || [])];
    ins.splice(i, 1);
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      toast({ title: "Campos requeridos", description: "Completa nombre del paciente, evento y motivo de consulta.", variant: "warning" });
      return;
    }
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || "00:00"}:00`;
    const prof = usuario?.profesion;

    const datos = {
      ...(prof === "Enfermero/a"   ? { enfermero_id:   usuario.id, enfermero_nombre:   usuario.email } : {}),
      ...(prof === "Paramédico"    ? { paramedico_id:  usuario.id, paramedico_nombre:  usuario.email } : {}),
      ...(prof === "Kinesiólogo/a" ? { kinesiologo_id: usuario.id, kinesiologo_nombre: usuario.email } : {}),
      codigo_triaje:           form.codigo_triaje || "VERDE",
      es_emergencia:           form.codigo_triaje === "ROJO" || form.codigo_triaje === "NEGRO",
      tiempo_espera_minutos:   form.tiempo_espera_minutos ?? 60,
      presion_sistolica:       form.presion_sistolica       ? parseInt(form.presion_sistolica)       : null,
      presion_diastolica:      form.presion_diastolica      ? parseInt(form.presion_diastolica)      : null,
      frecuencia_cardiaca:     form.frecuencia_cardiaca     ? parseInt(form.frecuencia_cardiaca)     : null,
      temperatura:             form.temperatura             ? parseFloat(form.temperatura)            : null,
      saturacion_oxigeno:      form.saturacion_oxigeno      ? parseInt(form.saturacion_oxigeno)      : null,
      frecuencia_respiratoria: form.frecuencia_respiratoria ? parseInt(form.frecuencia_respiratoria) : null,
      paciente_nombre:         form.paciente_nombre,
      paciente_rut:            form.paciente_rut   || null,
      paciente_edad:           form.paciente_edad  ? parseInt(form.paciente_edad) : null,
      categoria_paciente:      form.categoria_paciente || "Jugador",
      evento_id:               form.evento_id || null,
      evento:                  form.evento,
      motivo_consulta:         form.motivo_consulta,
      diagnostico:             form.diagnostico   || null,
      tratamiento:             form.tratamiento   || null,
      observaciones:           form.observaciones || null,
      medicamentos_prescritos: [],
      insumos_medico:          form.insumos_medico || [],
      requiere_administracion: false,
      administracion_completada: false,
      created_at: new Date(fechaHora).toISOString(),
    };

    setGuardando(true);
    try {
      const res = await sb("atenciones_medicas", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) {
        setAtenciones(prev => [res[0], ...prev]);
        // Descontar insumos del carro
        for (const ins of form.insumos_medico || []) {
          if (!ins.nombre?.trim()) continue;
          try {
            const encontrados = await sb(`contenedores_medicamentos?nombre=ilike.*${ins.nombre.trim()}*&limit=1`, {}, usuario?.token);
            if (encontrados?.length > 0) {
              const item = encontrados[0];
              await sb(`contenedores_medicamentos?id=eq.${item.id}`, {
                method: "PATCH", body: JSON.stringify({ stock: Math.max(0, (item.stock || 0) - (parseInt(ins.cantidad) || 1)) })
              }, usuario?.token);
            }
          } catch (e) { console.error(e); }
        }
        setModal(null);
        toast({ title: "Atención registrada", description: `${form.paciente_nombre} — ${form.evento}`, variant: "success" });
      } else {
        toast({ title: "Error al guardar", description: "No se pudo registrar la atención.", variant: "destructive" });
      }
    } finally {
      setGuardando(false);
    }
  };

  const verDetalle = (a) => { setForm(a); setModal("detalle"); };

  if (loading) return <div className="p-10 text-center text-sm" style={{ color: C.textMuted }}>Cargando atenciones...</div>;

  const hoy = new Date().toISOString().split("T")[0];
  const atencionesHoy        = atenciones.filter(a => new Date(a.created_at).toISOString().split("T")[0] === hoy);
  const atencionesAnteriores = atenciones.filter(a => new Date(a.created_at).toISOString().split("T")[0] !== hoy);
  const triajeColor = (c) => c === "ROJO" ? "#ef4444" : c === "AMARILLO" ? "#f59e0b" : c === "NEGRO" ? "#374151" : "#10b981";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.blue }}>
              <Stethoscope size={18} /> Mis Atenciones · {rolLabel(usuario?.profesion)}
            </h2>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              {atencionesHoy.length} atenciones hoy
            </p>
          </div>
          <Button variant="teal" size="sm" onClick={abrirNuevaAtencion}>
            <Plus size={14} /> Nueva Atención
          </Button>
        </CardContent>
      </Card>

      {/* Atenciones de hoy */}
      {atencionesHoy.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: C.blue }}>Atenciones de Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atencionesHoy.map(a => (
              <div key={a.id} className="rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/10"
                style={{ borderColor: C.border }} onClick={() => verDetalle(a)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">
                      {a.paciente_nombre}
                      {a.paciente_edad && <span className="font-normal text-xs ml-2" style={{ color: C.textMuted }}>({a.paciente_edad} años)</span>}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                      {new Date(a.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} · {a.evento}
                    </p>
                    <p className="text-xs mt-1"><strong>Motivo:</strong> {a.motivo_consulta}</p>
                    {a.diagnostico && <p className="text-xs mt-0.5" style={{ color: C.blue }}><strong>Dx:</strong> {a.diagnostico}</p>}
                  </div>
                  {a.codigo_triaje && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold text-white shrink-0" style={{ background: triajeColor(a.codigo_triaje) }}>
                      {a.codigo_triaje === "VERDE" && "🟢"}{a.codigo_triaje === "AMARILLO" && "🟡"}
                      {a.codigo_triaje === "ROJO" && "🔴"}{a.codigo_triaje === "NEGRO" && "⚫"}
                      {" "}{a.codigo_triaje}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Atenciones anteriores por evento */}
      {atencionesAnteriores.length > 0 && (() => {
        const porEvento = atencionesAnteriores.reduce((acc, a) => {
          const ev = a.evento || "Sin evento";
          if (!acc[ev]) acc[ev] = [];
          acc[ev].push(a);
          return acc;
        }, {});
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: C.textMuted }}>Atenciones Anteriores por Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(porEvento).map(([evento, evAtenciones]) => (
                <div key={evento} className="rounded-lg border p-4" style={{ background: C.surface2, borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.blue }}>{evento}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{evAtenciones.length} atención{evAtenciones.length !== 1 ? "es" : ""}</p>
                    </div>
                    <span className="text-2xl font-bold px-3 py-1 rounded" style={{ color: C.blue, background: C.surface }}>{evAtenciones.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evAtenciones.slice(0, 5).map(a => (
                      <div key={a.id} className="rounded border p-2.5 cursor-pointer text-xs hover:bg-accent/10 transition-colors"
                        style={{ background: C.surface, borderColor: C.border }} onClick={() => verDetalle(a)}>
                        <p className="font-semibold truncate">{a.paciente_nombre}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>
                          {new Date(a.created_at).toLocaleDateString("es-CL")} · {a.diagnostico?.substring(0, 30)}{a.diagnostico?.length > 30 ? "…" : ""}
                        </p>
                      </div>
                    ))}
                    {evAtenciones.length > 5 && (
                      <p className="text-center text-xs py-1" style={{ color: C.textMuted }}>+{evAtenciones.length - 5} más</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* Modal: Nueva Atención */}
      <Dialog open={modal === "nueva"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope size={16} style={{ color: C.blue }} /> Nueva Atención · {rolLabel(usuario?.profesion)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de Atención" required>
                <Input type="date" value={form.fecha_atencion || ""} onChange={e => setForm(f => ({ ...f, fecha_atencion: e.target.value }))} />
              </Field>
              <Field label="Hora de Atención">
                <Input type="time" value={form.hora_atencion || ""} onChange={e => setForm(f => ({ ...f, hora_atencion: e.target.value }))} />
              </Field>
            </div>

            {/* Triaje */}
            <div className="space-y-2">
              <Label>Código de Triaje <span className="text-destructive ml-0.5">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {TRIAJE.map(t => (
                  <button key={t.codigo} type="button"
                    className="rounded-lg py-2.5 text-xs font-semibold border transition-all"
                    style={{
                      border: form.codigo_triaje === t.codigo ? `2px solid ${t.color}` : `1px solid ${C.border}`,
                      background: form.codigo_triaje === t.codigo ? `${t.color}20` : "transparent",
                      color: form.codigo_triaje === t.codigo ? t.color : C.textMuted,
                    }}
                    onClick={() => setForm(f => ({ ...f, codigo_triaje: t.codigo, es_emergencia: t.codigo === "ROJO" || t.codigo === "NEGRO", tiempo_espera_minutos: t.espera }))}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              {form.codigo_triaje && (
                <p className="text-xs" style={{ color: TRIAJE.find(t => t.codigo === form.codigo_triaje)?.color }}>
                  {form.codigo_triaje === "VERDE" && "Leve — puede esperar"}
                  {form.codigo_triaje === "AMARILLO" && "Moderado — atención pronto"}
                  {form.codigo_triaje === "ROJO" && "⚠️ URGENTE — atención inmediata"}
                  {form.codigo_triaje === "NEGRO" && "Sin signos vitales"}
                  {form.tiempo_espera_minutos != null && ` · ⏱️ ${form.tiempo_espera_minutos === 0 ? "INMEDIATO" : `${form.tiempo_espera_minutos} min`}`}
                </p>
              )}
            </div>

            <Separator />

            {/* Paciente */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre del Paciente" required>
                <Input value={form.paciente_nombre || ""} onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} placeholder="Juan Pérez" />
              </Field>
              <Field label="RUT">
                <Input value={form.paciente_rut || ""}
                  onChange={e => { const v = e.target.value; setForm(f => ({ ...f, paciente_rut: v })); buscarPacientePorRut(v); }}
                  placeholder="12.345.678-9" />
                {historialPaciente.length > 0 && (
                  <p className="text-xs text-green-400 mt-1">✓ {historialPaciente.length} atención{historialPaciente.length > 1 ? "es" : ""} previa{historialPaciente.length > 1 ? "s" : ""}</p>
                )}
              </Field>
            </div>

            {pacienteFicha && (pacienteFicha.alergias || pacienteFicha.antecedentes) && (
              <div style={{ borderRadius: 8, padding: "10px 14px", background: pacienteFicha.alergias ? C.redDim : C.surface2, border: `1px solid ${pacienteFicha.alergias ? C.red : C.border}` }}>
                {pacienteFicha.alergias && <div style={{ fontSize: 13, fontWeight: 800, color: C.red }}>⚠️ ALERGIAS: {pacienteFicha.alergias}</div>}
                {pacienteFicha.antecedentes && <div style={{ fontSize: 12, color: C.textMuted, marginTop: pacienteFicha.alergias ? 4 : 0 }}>Antecedentes: <span style={{ color: C.text }}>{pacienteFicha.antecedentes}</span></div>}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Field label="Edad">
                <Input type="number" value={form.paciente_edad || ""} onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))} placeholder="35" />
              </Field>
              <Field label="Categoría">
                <select className={selectCls} value={form.categoria_paciente || "Jugador"} onChange={e => setForm(f => ({ ...f, categoria_paciente: e.target.value }))}>
                  <option>Jugador</option><option>Staff</option><option>Voluntario</option>
                </select>
              </Field>
              <Field label="Evento" required>
                <select className={selectCls} value={form.evento || ""}
                  onChange={e => { const ev = eventos.find(ev => ev.nombre_evento === e.target.value); setForm(f => ({ ...f, evento: e.target.value, evento_id: ev?.id || null })); }}>
                  {eventos.map(ev => <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>)}
                </select>
              </Field>
            </div>

            <Separator />

            {/* Signos Vitales */}
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: C.border }}>
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: C.blue }}>
                <Heart size={14} /> Signos Vitales
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Presión Arterial (mmHg)</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" placeholder="120" className="w-20" value={form.presion_sistolica || ""} onChange={e => setForm(f => ({ ...f, presion_sistolica: e.target.value }))} />
                    <span className="text-muted-foreground">/</span>
                    <Input type="number" placeholder="80" className="w-20" value={form.presion_diastolica || ""} onChange={e => setForm(f => ({ ...f, presion_diastolica: e.target.value }))} />
                  </div>
                </div>
                <Field label="Frec. Cardíaca (lpm)">
                  <Input type="number" placeholder="72" value={form.frecuencia_cardiaca || ""} onChange={e => setForm(f => ({ ...f, frecuencia_cardiaca: e.target.value }))} />
                </Field>
                <Field label="Temperatura (°C)">
                  <Input type="number" step="0.1" placeholder="36.5" value={form.temperatura || ""} onChange={e => setForm(f => ({ ...f, temperatura: e.target.value }))} />
                </Field>
                <Field label="Sat. Oxígeno (%)">
                  <Input type="number" placeholder="98" value={form.saturacion_oxigeno || ""} onChange={e => setForm(f => ({ ...f, saturacion_oxigeno: e.target.value }))} />
                </Field>
                <Field label="Frec. Respiratoria (rpm)">
                  <Input type="number" placeholder="16" value={form.frecuencia_respiratoria || ""} onChange={e => setForm(f => ({ ...f, frecuencia_respiratoria: e.target.value }))} />
                </Field>
              </div>
            </div>

            {/* Clínico */}
            <Field label="Motivo de Consulta" required>
              <Textarea value={form.motivo_consulta || ""} onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))} placeholder="Descripción del motivo de consulta..." />
            </Field>
            <Field label="Diagnóstico">
              <Textarea value={form.diagnostico || ""} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} placeholder="Evaluación / Diagnóstico..." />
            </Field>
            <Field label="Tratamiento">
              <Textarea value={form.tratamiento || ""} onChange={e => setForm(f => ({ ...f, tratamiento: e.target.value }))} placeholder="Tratamiento realizado..." />
            </Field>

            <Separator />

            {/* Insumos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Insumos Utilizados</p>
                <Button variant="outline" size="sm" onClick={agregarInsumo}><Plus size={13} /> Agregar</Button>
              </div>
              {(form.insumos_medico || []).map((ins, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.border }}>
                  <Input className="flex-1" placeholder="Nombre del insumo" value={ins.nombre} onChange={e => actualizarInsumo(i, "nombre", e.target.value)} />
                  <Input type="number" className="w-20" placeholder="Cant." value={ins.cantidad} onChange={e => actualizarInsumo(i, "cantidad", parseInt(e.target.value) || 1)} />
                  <select className={cn(selectCls, "w-24")} value={ins.unidad} onChange={e => actualizarInsumo(i, "unidad", e.target.value)}>
                    <option>unid.</option><option>ml</option><option>mg</option><option>amp.</option>
                  </select>
                  <Button variant="ghost" size="icon" onClick={() => eliminarInsumo(i)}><X size={13} /></Button>
                </div>
              ))}
            </div>

            <Separator />

            <Field label="Observaciones">
              <Textarea value={form.observaciones || ""} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones adicionales..." />
            </Field>

            {historialPaciente.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2" style={{ background: C.surface2, borderColor: C.border }}>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: C.blue }}>
                  <ClipboardList size={14} /> Historial del Paciente ({historialPaciente.length} atenciones previas)
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {historialPaciente.map((at, idx) => (
                    <div key={idx} className="rounded p-2 text-xs" style={{ background: C.surface }}>
                      <p className="font-semibold">{new Date(at.created_at).toLocaleDateString("es-CL")} · {at.evento}</p>
                      {at.diagnostico && <p><strong>Dx:</strong> {at.diagnostico}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModal(null)} disabled={guardando}>Cancelar</Button>
              <Button variant="teal" onClick={guardarAtencion} loading={guardando}>
                {guardando ? "Guardando..." : "Guardar Atención"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalle */}
      <Dialog open={modal === "detalle"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Atención</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="font-bold text-base">{form.paciente_nombre}</p>
                {form.paciente_rut && <p style={{ color: C.textMuted }}>RUT: {form.paciente_rut}</p>}
                {form.paciente_edad && <p style={{ color: C.textMuted }}>Edad: {form.paciente_edad} años</p>}
                <p className="mt-1" style={{ color: C.textMuted }}>{form.evento} · {form.created_at ? new Date(form.created_at).toLocaleString("es-CL") : ""}</p>
                <p style={{ color: C.textMuted }}>
                  {form.enfermero_nombre || form.paramedico_nombre || form.kinesiologo_nombre || ""}
                </p>
              </div>
              <Separator />
              {form.codigo_triaje && (
                <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: triajeColor(form.codigo_triaje) }}>
                  {form.codigo_triaje}
                </span>
              )}
              <div><p className="font-semibold mb-1">Motivo de Consulta</p><p>{form.motivo_consulta}</p></div>
              {form.diagnostico  && <div><p className="font-semibold mb-1">Diagnóstico</p><p>{form.diagnostico}</p></div>}
              {form.tratamiento  && <div><p className="font-semibold mb-1">Tratamiento</p><p>{form.tratamiento}</p></div>}
              {form.insumos_medico?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Insumos Utilizados</p>
                  {form.insumos_medico.map((ins, i) => <p key={i} style={{ color: C.textMuted }}>• {ins.nombre} — {ins.cantidad} {ins.unidad}</p>)}
                </div>
              )}
              {form.observaciones && <div><p className="font-semibold mb-1">Observaciones</p><p>{form.observaciones}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
