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
import { Activity, Plus, X, ClipboardList, Backpack, AlertTriangle } from "lucide-react";
import { useEvento } from "../common/SelectorEvento";
import { toast } from "../ui/use-toast";

const selectCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

const Field = ({ label, children, hint, required }) => (
  <div className="space-y-1.5">
    <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export function VistaAtencionesKinesiologia({ usuario }) {
  const [atenciones, setAtenciones] = useState([]);
  const [insumos,    setInsumos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({});
  const [eventos,    setEventos]    = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);
  const { eventoActual } = useEvento();

  useEffect(() => { cargarDatos(); }, [usuario, eventoActual]);

  const cargarDatos = async () => {
    setLoading(true);
    const esAdmin = usuario?.rol === "admin";
    const filtroEvento = eventoActual ? `&evento_id=eq.${eventoActual}` : "";
    const [ats, ins, evs] = await Promise.all([
      sb(esAdmin
        ? `atenciones_kinesiologia?order=created_at.desc&limit=100${filtroEvento}`
        : `atenciones_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=created_at.desc&limit=50${filtroEvento}`,
        {}, usuario?.token),
      sb(`insumos_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=nombre`, {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token),
    ]);
    if (ats) setAtenciones(ats);
    if (ins) setInsumos(ins);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const buscarPacientePorRut = async (rut) => {
    if (!rut || rut.length < 8) { setHistorialPaciente([]); return; }
    const campo = form.tipo_identificacion === "pasaporte" ? "paciente_pasaporte" : "paciente_rut";
    const found = await sb(`atenciones_kinesiologia?${campo}=eq.${rut}&order=created_at.desc&limit=10`, {}, usuario?.token);
    if (found?.length > 0) {
      const u = found[0];
      setForm(f => ({ ...f, paciente_nombre: u.paciente_nombre, paciente_edad: u.paciente_edad }));
      setHistorialPaciente(found);
    } else {
      setHistorialPaciente([]);
    }
  };

  const abrirNuevaAtencion = () => {
    const ahora = new Date();
    setForm({
      fecha_atencion: ahora.toISOString().split("T")[0],
      hora_atencion:  ahora.toTimeString().slice(0, 5),
      paciente_nombre: "", paciente_rut: "", paciente_edad: "",
      categoria_paciente: "Jugador",
      evento:    eventos.length > 0 ? eventos[0].nombre_evento : "",
      evento_id: eventos.length > 0 ? eventos[0].id : null,
      motivo_consulta: "", evaluacion_inicial: "", tratamiento_realizado: "",
      observaciones: "", recomendaciones: "", insumos_usados: [],
    });
    setHistorialPaciente([]);
    setModal("nueva");
  };

  const agregarInsumo = () =>
    setForm(f => ({ ...f, insumos_usados: [...(f.insumos_usados || []), { nombre: "", cantidad: 1, unidad: "unid." }] }));

  const actualizarInsumo = (i, campo, valor) => {
    const ins = [...(form.insumos_usados || [])];
    ins[i][campo] = valor;
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const eliminarInsumo = (i) => {
    const ins = [...(form.insumos_usados || [])];
    ins.splice(i, 1);
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      toast({ title: "Campos requeridos", description: "Completa nombre del paciente, evento y motivo de consulta.", variant: "warning" });
      return;
    }
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || "00:00"}:00`;
    const timestampPersonalizado = new Date(fechaHora).toISOString();
    const datos = {
      kinesiologo_id:     usuario.id,
      kinesiologo_nombre: usuario.email,
      paciente_nombre:    form.paciente_nombre,
      paciente_rut:       form.paciente_rut || null,
      paciente_edad:      form.paciente_edad ? parseInt(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente || "Jugador",
      evento_id: form.evento_id || null,
      motivo_consulta:     form.motivo_consulta,
      evaluacion_inicial:  form.evaluacion_inicial  || null,
      tratamiento_realizado: form.tratamiento_realizado || null,
      observaciones:       form.observaciones   || null,
      recomendaciones:     form.recomendaciones || null,
      insumos_usados:      form.insumos_usados  || [],
      created_at:          timestampPersonalizado,
    };
    setGuardando(true);
    try {
      const res = await sb("atenciones_kinesiologia", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) {
        for (const insumo of form.insumos_usados || []) {
          const insumoEnBolso = insumos.find(i => i.nombre === insumo.nombre);
          if (insumoEnBolso) {
            await sb(`insumos_kinesiologia?id=eq.${insumoEnBolso.id}`, {
              method: "PATCH",
              body: JSON.stringify({ stock: insumoEnBolso.stock - insumo.cantidad }),
            }, usuario?.token);
          }
        }
        setAtenciones(prev => [res[0], ...prev]);
        setModal(null);
        toast({ title: "Atención registrada", description: `${form.paciente_nombre} — ${form.evento}`, variant: "success" });
        cargarDatos();
      } else {
        toast({ title: "Error al guardar", description: "No se pudo registrar la atención.", variant: "destructive" });
      }
    } finally {
      setGuardando(false);
    }
  };

  const verDetalleAtencion = (a) => { setForm(a); setModal("detalle"); };
  const abrirGestionBolso  = ()  => setModal("bolso");

  const agregarInsumoAlBolso = async () => {
    const nombre = prompt("Nombre del insumo:");
    if (!nombre) return;
    const stock  = prompt("Stock inicial:");
    if (!stock)  return;
    const minimo = prompt("Stock mínimo:");
    if (!minimo) return;
    const datos = { kinesiologo_id: usuario.id, nombre, stock: parseFloat(stock), minimo: parseFloat(minimo), unidad: "unid.", categoria: "General" };
    const res = await sb("insumos_kinesiologia", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
    if (res) {
      setInsumos(prev => [...prev, res[0]]);
      toast({ title: "Insumo agregado", description: `"${nombre}" agregado al bolso.`, variant: "success" });
    }
  };

  const ajustarStockInsumo = async (insumo) => {
    const nuevoStock = prompt(`Stock actual: ${insumo.stock} ${insumo.unidad}\nNuevo stock:`, insumo.stock);
    if (nuevoStock === null) return;
    const res = await sb(`insumos_kinesiologia?id=eq.${insumo.id}`, {
      method: "PATCH", body: JSON.stringify({ stock: parseFloat(nuevoStock) }),
    }, usuario?.token);
    if (res) {
      setInsumos(prev => prev.map(i => i.id === insumo.id ? { ...i, stock: parseFloat(nuevoStock) } : i));
      toast({ title: "Stock actualizado", description: `${insumo.nombre}: ${insumo.stock} → ${nuevoStock} ${insumo.unidad}`, variant: "success" });
    }
  };

  if (loading) return <div className="p-10 text-center text-sm" style={{ color: C.textMuted }}>Cargando atenciones...</div>;

  const hoy = new Date().toISOString().split("T")[0];
  const atencionesHoy      = atenciones.filter(a => new Date(a.created_at).toISOString().split("T")[0] === hoy);
  const atencionesAnteriores = atenciones.filter(a => new Date(a.created_at).toISOString().split("T")[0] !== hoy);
  const insumosAlerta      = insumos.filter(i => i.stock <= i.minimo);

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.blue }}>
              <Activity size={18} /> Atenciones de Kinesiología
            </h2>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              {atencionesHoy.length} atenciones hoy · {insumos.length} insumos en mi bolso
              {insumosAlerta.length > 0 && <span className="ml-2 font-semibold" style={{ color: C.red }}>⚠️ {insumosAlerta.length} con stock bajo</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={abrirGestionBolso}><Backpack size={13} /> Mi Bolso</Button>
            <Button variant="teal"    size="sm" onClick={abrirNuevaAtencion}><Plus size={13} /> Nueva Atención</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Atenciones de hoy ─────────────────────────────── */}
      {atencionesHoy.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: C.blue }}>Atenciones de Hoy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {atencionesHoy.map(a => (
              <div
                key={a.id}
                className="rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/10"
                style={{ borderColor: C.border }}
                onClick={() => verDetalleAtencion(a)}
              >
                <p className="font-bold text-sm">
                  {a.paciente_nombre}
                  {a.paciente_edad && <span className="font-normal text-xs ml-2" style={{ color: C.textMuted }}>({a.paciente_edad} años)</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  {new Date(a.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} · {a.evento}
                </p>
                <p className="text-xs mt-1"><strong>Motivo:</strong> {a.motivo_consulta}</p>
                {a.insumos_usados?.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: C.textMuted }}>🎒 {a.insumos_usados.length} insumo(s) utilizados</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Atenciones anteriores por evento ─────────────── */}
      {atencionesAnteriores.length > 0 && (() => {
        const porEvento = atencionesAnteriores.reduce((acc, a) => {
          const ev = a.evento || "Sin evento";
          if (!acc[ev]) acc[ev] = [];
          acc[ev].push(a);
          return acc;
        }, {});
        return (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: C.textMuted }}>Atenciones Anteriores por Evento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(porEvento).map(([evento, evAtenciones]) => (
                <div key={evento} className="rounded-lg border p-4" style={{ background: C.surface2, borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.blue }}>{evento}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{evAtenciones.length} atención{evAtenciones.length !== 1 ? "es" : ""} realizadas</p>
                    </div>
                    <span className="text-2xl font-bold px-3 py-1 rounded" style={{ color: C.blue, background: C.surface }}>{evAtenciones.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evAtenciones.slice(0, 5).map(a => (
                      <div key={a.id} className="rounded border p-2.5 cursor-pointer text-xs hover:bg-accent/10 transition-colors" style={{ background: C.surface, borderColor: C.border }} onClick={() => verDetalleAtencion(a)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{a.paciente_nombre}</p>
                            <p className="mt-0.5 truncate" style={{ color: C.textMuted }}>{new Date(a.created_at).toLocaleDateString("es-CL")} · {a.motivo_consulta?.substring(0, 30)}{a.motivo_consulta?.length > 30 ? "…" : ""}</p>
                          </div>
                          <span className="shrink-0 rounded px-1.5 py-0.5" style={{ background: C.surface2, color: C.textMuted }}>{a.kinesiologo_nombre?.split("@")[0] || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                    {evAtenciones.length > 5 && <p className="text-center text-xs py-1" style={{ color: C.textMuted }}>+{evAtenciones.length - 5} atenciones más</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal: Nueva Atención                              */}
      {/* ══════════════════════════════════════════════════ */}
      <Dialog open={modal === "nueva"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity size={16} style={{ color: C.blue }} /> Nueva Atención Kinesiológica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de Atención" required>
                <Input type="date" value={form.fecha_atencion || ""} onChange={e => setForm(f => ({ ...f, fecha_atencion: e.target.value }))} />
              </Field>
              <Field label="Hora de Atención">
                <Input type="time" value={form.hora_atencion || ""} onChange={e => setForm(f => ({ ...f, hora_atencion: e.target.value }))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre del Paciente" required>
                <Input value={form.paciente_nombre || ""} onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} placeholder="Juan Pérez" />
              </Field>
              <Field label="RUT">
                <Input value={form.paciente_rut || ""} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, paciente_rut: v })); buscarPacientePorRut(v); }} placeholder="12.345.678-9" />
                {historialPaciente.length > 0 && <p className="text-xs text-green-400 mt-1">✓ {historialPaciente.length} atención{historialPaciente.length > 1 ? "es" : ""} previa{historialPaciente.length > 1 ? "s" : ""}</p>}
              </Field>
            </div>

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
                <select className={selectCls} value={form.evento || ""} onChange={e => setForm(f => ({ ...f, evento: e.target.value }))}>
                  {eventos.map(ev => <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Motivo de Consulta" required>
              <Textarea value={form.motivo_consulta || ""} onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))} placeholder="Descripción del motivo..." />
            </Field>
            <Field label="Evaluación Inicial">
              <Textarea value={form.evaluacion_inicial || ""} onChange={e => setForm(f => ({ ...f, evaluacion_inicial: e.target.value }))} placeholder="Hallazgos de la evaluación..." />
            </Field>
            <Field label="Tratamiento Realizado">
              <Textarea value={form.tratamiento_realizado || ""} onChange={e => setForm(f => ({ ...f, tratamiento_realizado: e.target.value }))} placeholder="Descripción del tratamiento..." />
            </Field>

            <Separator />

            {/* Insumos del bolso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Insumos Utilizados (de mi bolso)</p>
                <Button variant="outline" size="sm" onClick={agregarInsumo}><Plus size={13} /> Agregar</Button>
              </div>
              {(form.insumos_usados || []).map((ins, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.border }}>
                  <select className={cn(selectCls, "flex-1")} value={ins.nombre} onChange={e => actualizarInsumo(i, "nombre", e.target.value)}>
                    <option value="">Selecciona insumo...</option>
                    {insumos.map(insumo => <option key={insumo.id} value={insumo.nombre}>{insumo.nombre} (Stock: {insumo.stock} {insumo.unidad})</option>)}
                  </select>
                  <Input type="number" className="w-20" placeholder="Cant." value={ins.cantidad} onChange={e => actualizarInsumo(i, "cantidad", parseFloat(e.target.value) || 1)} />
                  <Button variant="ghost" size="icon" onClick={() => eliminarInsumo(i)}><X size={13} /></Button>
                </div>
              ))}
            </div>

            <Field label="Observaciones">
              <Textarea value={form.observaciones || ""} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones..." />
            </Field>
            <Field label="Recomendaciones">
              <Textarea value={form.recomendaciones || ""} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} placeholder="Recomendaciones para el paciente..." />
            </Field>

            {/* Historial */}
            {historialPaciente.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2" style={{ background: C.surface2, borderColor: C.border }}>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: C.blue }}>
                  <ClipboardList size={14} /> Historial del Paciente ({historialPaciente.length} atenciones previas)
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {historialPaciente.map((at, idx) => (
                    <div key={idx} className="rounded p-2 text-xs" style={{ background: C.surface }}>
                      <p className="font-semibold">{new Date(at.created_at).toLocaleDateString("es-CL")} · {at.evento}</p>
                      <p style={{ color: C.textMuted }}>Kinesiólogo/a: {at.kinesiologo_nombre?.split("@")[0]}</p>
                      {at.motivo_consulta && <p><strong>Motivo:</strong> {at.motivo_consulta}</p>}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle de Atención</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="font-bold text-base">{form.paciente_nombre}</p>
                {form.paciente_rut && <p style={{ color: C.textMuted }}>RUT: {form.paciente_rut}</p>}
                {form.paciente_edad && <p style={{ color: C.textMuted }}>Edad: {form.paciente_edad} años</p>}
                <p className="mt-1" style={{ color: C.textMuted }}>Evento: {form.evento} · {new Date(form.created_at).toLocaleString("es-CL")}</p>
              </div>
              <Separator />
              <div><p className="font-semibold mb-1">Motivo de Consulta</p><p>{form.motivo_consulta}</p></div>
              {form.evaluacion_inicial    && <div><p className="font-semibold mb-1">Evaluación Inicial</p><p>{form.evaluacion_inicial}</p></div>}
              {form.tratamiento_realizado && <div><p className="font-semibold mb-1">Tratamiento Realizado</p><p>{form.tratamiento_realizado}</p></div>}
              {form.insumos_usados?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Insumos Utilizados</p>
                  {form.insumos_usados.map((ins, i) => <p key={i} style={{ color: C.textMuted }}>• {ins.nombre} - {ins.cantidad} {ins.unidad || "unid."}</p>)}
                </div>
              )}
              {form.observaciones  && <div><p className="font-semibold mb-1">Observaciones</p><p>{form.observaciones}</p></div>}
              {form.recomendaciones && <div><p className="font-semibold mb-1">Recomendaciones</p><p>{form.recomendaciones}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Bolso */}
      <Dialog open={modal === "bolso"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Backpack size={16} /> Mi Bolso de Insumos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button variant="teal" className="w-full" onClick={agregarInsumoAlBolso}><Plus size={14} /> Agregar Insumo al Bolso</Button>
            {insumos.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: C.textMuted }}>No tienes insumos en tu bolso. Agrega algunos para comenzar.</p>
            ) : (
              insumos.map(insumo => (
                <div key={insumo.id} className="rounded-lg border p-3" style={{ borderColor: insumo.stock <= insumo.minimo ? C.red : C.border, background: insumo.stock <= insumo.minimo ? C.redDim : C.surface }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{insumo.nombre}</p>
                      <p className="text-xs mt-1" style={{ color: C.textMuted }}>Stock: {insumo.stock} {insumo.unidad} · Mínimo: {insumo.minimo} {insumo.unidad}</p>
                      {insumo.stock <= insumo.minimo && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.red }}>
                          <AlertTriangle size={11} /> Stock bajo
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => ajustarStockInsumo(insumo)}>Ajustar Stock</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
