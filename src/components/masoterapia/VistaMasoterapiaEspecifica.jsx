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
import { Waves, Plus, TrendingDown, CheckCircle2 } from "lucide-react";
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

const ZONAS = [
  "Cuello", "Hombros", "Espalda alta", "Espalda baja", "Brazos",
  "Antebrazos", "Manos", "Glúteos", "Isquiotibiales", "Gemelos",
  "Cuádriceps", "Aductores", "Pies", "Zona lumbar",
];

export function VistaMasoterapiaEspecifica({ usuario }) {
  const [fichas,    setFichas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({});
  const [eventos,   setEventos]   = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);
  const [pacienteFicha, setPacienteFicha] = useState(null);
  const { eventoActual } = useEvento();

  useEffect(() => { cargarDatos(); }, [usuario, eventoActual]);

  const cargarDatos = async () => {
    setLoading(true);
    const esAdmin = usuario?.rol === "admin";
    const filtroEvento = eventoActual ? `&evento_id=eq.${eventoActual}` : "";
    const [fs, evs] = await Promise.all([
      sb(esAdmin
        ? `fichas_masoterapia?order=created_at.desc&limit=100${filtroEvento}`
        : `fichas_masoterapia?masoterapeuta_id=eq.${usuario.id}&order=created_at.desc&limit=50${filtroEvento}`,
        {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&tipo_masoterapia=eq.Específico&order=created_at.desc", {}, usuario?.token),
    ]);
    if (fs)  setFichas(fs);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const abrirNuevaFicha = () => {
    const ahora = new Date();
    setForm({
      fecha_atencion: ahora.toISOString().split("T")[0],
      hora_atencion:  ahora.toTimeString().slice(0, 5),
      paciente_nombre: "", paciente_rut: "", paciente_pasaporte: "",
      tipo_identificacion: "rut", paciente_edad: "",
      categoria_paciente: "Jugador",
      evento:    eventos.length > 0 ? eventos[0].nombre_evento : "",
      evento_id: eventos.length > 0 ? eventos[0].id : null,
      motivo_atencion: "", tipo_molestia: "", zona_afectada: "", tipo_masaje: "Relajante",
      zonas_trabajadas: [], dolor_inicial: 5, dolor_posterior: 5,
      duracion_minutos: 30, observaciones: "",
    });
    setHistorialPaciente([]);
    setModal("nueva");
  };

  const buscarPacientePorRut = async (rut) => {
    if (!rut || rut.length < 8) { setHistorialPaciente([]); setPacienteFicha(null); return; }
    const ident = (rut || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    const pacientes = await sb(`pacientes?identificacion=eq.${ident}&select=id,nombre,edad,alergias,antecedentes`, {}, usuario?.token);
    const p = pacientes?.[0] || null;
    setPacienteFicha(p);
    if (p) setForm(f => ({ ...f, paciente_nombre: p.nombre || f.paciente_nombre, paciente_edad: p.edad ?? f.paciente_edad }));
    const campo = form.tipo_identificacion === "pasaporte" ? "paciente_pasaporte" : "paciente_rut";
    const found = await sb(`fichas_masoterapia?${campo}=eq.${rut}&order=created_at.desc&limit=10`, {}, usuario?.token);
    if (found?.length > 0) {
      if (!p) { const u = found[0]; setForm(f => ({ ...f, paciente_nombre: u.paciente_nombre, paciente_edad: u.paciente_edad })); }
      setHistorialPaciente(found);
    } else {
      setHistorialPaciente([]);
    }
  };

  const toggleZona = (zona) => {
    const zonas = form.zonas_trabajadas || [];
    setForm(f => ({
      ...f,
      zonas_trabajadas: zonas.includes(zona) ? zonas.filter(z => z !== zona) : [...zonas, zona],
    }));
  };

  const guardarFicha = async () => {
    if (!form.paciente_nombre || !form.evento) {
      toast({ title: "Campos requeridos", description: "Completa el nombre del paciente y el evento.", variant: "warning" });
      return;
    }
    if (!form.zonas_trabajadas || form.zonas_trabajadas.length === 0) {
      toast({ title: "Zonas requeridas", description: "Selecciona al menos una zona trabajada.", variant: "warning" });
      return;
    }
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || "00:00"}:00`;
    const timestampPersonalizado = new Date(fechaHora).toISOString();
    const datos = {
      evento_id: form.evento_id || null,
      masoterapeuta_id:     usuario.id,
      masoterapeuta_nombre: usuario.email,
      paciente_nombre:  form.paciente_nombre,
      paciente_rut:     form.tipo_identificacion === "rut"       ? (form.paciente_rut      || null) : null,
      paciente_pasaporte: form.tipo_identificacion === "pasaporte" ? (form.paciente_pasaporte || null) : null,
      tipo_identificacion: form.tipo_identificacion || "rut",
      paciente_edad:    form.paciente_edad ? parseInt(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente || "Jugador",
      fecha_atencion:   form.fecha_atencion,
      duracion_minutos: parseInt(form.duracion_minutos) || 30,
      motivo_atencion:  form.motivo_atencion  || null,
      tipo_molestia:    form.tipo_molestia    || null,
      zona_afectada:    form.zona_afectada    || null,
      tipo_masaje:      form.tipo_masaje      || null,
      zonas_trabajadas: form.zonas_trabajadas,
      dolor_inicial:    parseInt(form.dolor_inicial)    || 5,
      dolor_posterior:  parseInt(form.dolor_posterior)  || 5,
      observaciones:    form.observaciones || null,
      created_at:       timestampPersonalizado,
    };
    setGuardando(true);
    try {
      const res = await sb("fichas_masoterapia", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) {
        setFichas(prev => [res[0], ...prev]);
        setModal(null);
        toast({ title: "Ficha registrada", description: `${form.paciente_nombre} — ${form.zonas_trabajadas?.length} zona(s) trabajada(s)`, variant: "success" });
      } else {
        toast({ title: "Error al guardar", description: "No se pudo registrar la ficha.", variant: "destructive" });
      }
    } finally {
      setGuardando(false);
    }
  };

  const verDetalleFicha = (f) => { setForm(f); setModal("detalle"); };

  if (loading) return <div className="p-10 text-center text-sm" style={{ color: C.textMuted }}>Cargando fichas...</div>;

  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <p className="font-bold text-base mb-2">No hay eventos específicos activos</p>
          <p className="text-sm" style={{ color: C.textMuted }}>Los eventos deben estar configurados con tipo de masoterapia "Específico"</p>
        </CardContent>
      </Card>
    );
  }

  const hoy = new Date().toISOString().split("T")[0];
  const fichasHoy        = fichas.filter(f => new Date(f.created_at).toISOString().split("T")[0] === hoy);
  const fichasAnteriores = fichas.filter(f => new Date(f.created_at).toISOString().split("T")[0] !== hoy);

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.blue }}>
              <Waves size={18} /> Masoterapia Específica
            </h2>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              {fichasHoy.length} fichas hoy · {fichas.length} fichas totales
            </p>
          </div>
          <Button variant="teal" size="sm" onClick={abrirNuevaFicha}><Plus size={13} /> Nueva Ficha</Button>
        </CardContent>
      </Card>

      {/* ── Fichas de hoy ─────────────────────────────────── */}
      {fichasHoy.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: C.blue }}>Fichas de Hoy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fichasHoy.map(ficha => (
              <div
                key={ficha.id}
                className="rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/10"
                style={{ borderColor: C.border }}
                onClick={() => verDetalleFicha(ficha)}
              >
                <p className="font-bold text-sm">
                  {ficha.paciente_nombre}
                  {ficha.paciente_edad && <span className="font-normal text-xs ml-2" style={{ color: C.textMuted }}>({ficha.paciente_edad} años)</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  {new Date(ficha.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} · {ficha.evento} · {ficha.duracion_minutos} min
                </p>
                <p className="text-xs mt-1"><strong>Zonas:</strong> {ficha.zonas_trabajadas?.join(", ") || "N/A"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs"><strong>Dolor:</strong> {ficha.dolor_inicial}/10 → {ficha.dolor_posterior}/10</span>
                  {ficha.dolor_posterior < ficha.dolor_inicial && (
                    <Badge variant="success" className="text-xs"><CheckCircle2 size={10} /> Mejoró</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Fichas anteriores por evento ─────────────────── */}
      {fichasAnteriores.length > 0 && (() => {
        const porEvento = fichasAnteriores.reduce((acc, f) => {
          const ev = f.evento || "Sin evento";
          if (!acc[ev]) acc[ev] = [];
          acc[ev].push(f);
          return acc;
        }, {});
        return (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: C.textMuted }}>Fichas Anteriores por Evento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(porEvento).map(([evento, evFichas]) => (
                <div key={evento} className="rounded-lg border p-4" style={{ background: C.surface2, borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.blue }}>{evento}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{evFichas.length} ficha{evFichas.length !== 1 ? "s" : ""} realizadas</p>
                    </div>
                    <span className="text-2xl font-bold px-3 py-1 rounded" style={{ color: C.blue, background: C.surface }}>{evFichas.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evFichas.slice(0, 5).map(f => (
                      <div key={f.id} className="rounded border p-2.5 cursor-pointer text-xs hover:bg-accent/10 transition-colors" style={{ background: C.surface, borderColor: C.border }} onClick={() => verDetalleFicha(f)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{f.paciente_nombre}</p>
                            <p className="mt-0.5" style={{ color: C.textMuted }}>{new Date(f.created_at).toLocaleDateString("es-CL")} · {f.duracion_minutos} min · Dolor: {f.dolor_inicial}→{f.dolor_posterior}</p>
                          </div>
                          <span className="shrink-0 rounded px-1.5 py-0.5" style={{ background: C.surface2, color: C.textMuted }}>{f.masoterapeuta_nombre?.split("@")[0] || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                    {evFichas.length > 5 && <p className="text-center text-xs py-1" style={{ color: C.textMuted }}>+{evFichas.length - 5} fichas más</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal: Nueva Ficha                                 */}
      {/* ══════════════════════════════════════════════════ */}
      <Dialog open={modal === "nueva"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Waves size={16} style={{ color: C.blue }} /> Nueva Ficha de Masoterapia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Tipo identificación */}
            <Field label="Tipo de Identificación">
              <div className="flex gap-2">
                {["rut", "pasaporte"].map(tipo => (
                  <Button
                    key={tipo}
                    variant={form.tipo_identificacion === tipo ? "teal" : "outline"}
                    className="flex-1"
                    onClick={() => setForm(f => ({ ...f, tipo_identificacion: tipo, paciente_rut: "", paciente_pasaporte: "" }))}
                  >
                    {tipo === "rut" ? "RUT" : "Pasaporte"}
                  </Button>
                ))}
              </div>
            </Field>

            <Field label={form.tipo_identificacion === "rut" ? "RUT" : "Pasaporte"}>
              {form.tipo_identificacion === "rut" ? (
                <>
                  <Input value={form.paciente_rut || ""} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, paciente_rut: v })); if (v.length >= 8) buscarPacientePorRut(v); }} placeholder="12345678-9" />
                  {pacienteFicha?.alergias && <p style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: C.red }}>⚠️ ALERGIAS: {pacienteFicha.alergias}</p>}
                </>
              ) : (
                <Input value={form.paciente_pasaporte || ""} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, paciente_pasaporte: v })); if (v.length >= 8) buscarPacientePorRut(v); }} placeholder="AB123456" />
              )}
            </Field>

            {/* Historial */}
            {historialPaciente.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2" style={{ background: C.surface2, borderColor: C.border }}>
                <p className="text-xs font-semibold" style={{ color: C.blue }}>
                  ✓ {historialPaciente.length} atención{historialPaciente.length !== 1 ? "es" : ""} previa{historialPaciente.length !== 1 ? "s" : ""}
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs" style={{ color: C.textMuted }}>
                  {historialPaciente.slice(0, 5).map((h, i) => (
                    <div key={i} className="py-1 border-b last:border-0" style={{ borderColor: C.border }}>
                      <p className="font-semibold">{new Date(h.created_at).toLocaleDateString("es-CL")} - {h.evento}</p>
                      <p>Zonas: {h.zonas_trabajadas?.join(", ") || "N/A"} · Dolor: {h.dolor_inicial}→{h.dolor_posterior}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>Por: {h.masoterapeuta_nombre?.split("@")[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <Field label="Nombre del Paciente" required>
                  <Input value={form.paciente_nombre || ""} onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} placeholder="Nombre del deportista" />
                </Field>
              </div>
              <Field label="Edad">
                <Input type="number" value={form.paciente_edad || ""} onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))} placeholder="35" />
              </Field>
              <Field label="Categoría">
                <select className={selectCls} value={form.categoria_paciente || "Jugador"} onChange={e => setForm(f => ({ ...f, categoria_paciente: e.target.value }))}>
                  <option>Jugador</option><option>Staff</option><option>Voluntario</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Evento" required>
                  <select className={selectCls} value={form.evento || ""} onChange={e => setForm(f => ({ ...f, evento: e.target.value }))}>
                    {eventos.map(ev => <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Duración (min)">
                <Input type="number" value={form.duracion_minutos || 30} onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))} placeholder="30" />
              </Field>
            </div>

            <Separator />

            {/* Anamnesis */}
            <Field label="Motivo de Atención" required>
              <Textarea
                value={form.motivo_atencion || ""}
                onChange={e => setForm(f => ({ ...f, motivo_atencion: e.target.value }))}
                placeholder="¿Por qué viene el paciente? Descripción del motivo..."
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Tipo de Molestia">
                <Input
                  value={form.tipo_molestia || ""}
                  onChange={e => setForm(f => ({ ...f, tipo_molestia: e.target.value }))}
                  placeholder="Ej: Contractura"
                />
              </Field>
              <Field label="Zona Afectada">
                <Input
                  value={form.zona_afectada || ""}
                  onChange={e => setForm(f => ({ ...f, zona_afectada: e.target.value }))}
                  placeholder="Ej: Hombro derecho"
                />
              </Field>
              <Field label="Tipo de Masaje">
                <select
                  className={selectCls}
                  value={form.tipo_masaje || "Relajante"}
                  onChange={e => setForm(f => ({ ...f, tipo_masaje: e.target.value }))}
                >
                  <option>Relajante</option>
                  <option>Deportivo</option>
                  <option>Terapéutico</option>
                  <option>Descontracturante</option>
                  <option>Drenaje linfático</option>
                </select>
              </Field>
            </div>

            <Separator />

            {/* Zonas trabajadas */}
            <div className="space-y-2">
              <Label>Zonas Trabajadas <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {ZONAS.map(zona => {
                  const activa = (form.zonas_trabajadas || []).includes(zona);
                  return (
                    <label
                      key={zona}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-xs transition-colors",
                        activa ? "border-blue-500/50" : "border-border hover:border-border/80"
                      )}
                      style={{ background: activa ? C.blueDim : "transparent" }}
                    >
                      <input type="checkbox" checked={activa} onChange={() => toggleZona(zona)} className="shrink-0" />
                      <span>{zona}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Escala de dolor */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Dolor Inicial (1–10)</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" className="flex-1" value={form.dolor_inicial || 5} onChange={e => setForm(f => ({ ...f, dolor_inicial: e.target.value }))} />
                  <span className="text-2xl font-extrabold w-10 text-center" style={{ color: C.orange }}>{form.dolor_inicial || 5}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dolor Final (1–10)</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" className="flex-1" value={form.dolor_posterior || 5} onChange={e => setForm(f => ({ ...f, dolor_posterior: e.target.value }))} />
                  <span className="text-2xl font-extrabold w-10 text-center" style={{ color: parseInt(form.dolor_posterior) < parseInt(form.dolor_inicial) ? C.green : C.orange }}>
                    {form.dolor_posterior || 5}
                  </span>
                </div>
                {parseInt(form.dolor_posterior) < parseInt(form.dolor_inicial) && (
                  <p className="text-xs flex items-center gap-1" style={{ color: C.green }}>
                    <TrendingDown size={11} /> Mejoría de {parseInt(form.dolor_inicial) - parseInt(form.dolor_posterior)} puntos
                  </p>
                )}
              </div>
            </div>

            <Field label="Observaciones">
              <Textarea value={form.observaciones || ""} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones sobre la sesión, reacciones del paciente, etc." className="min-h-[80px]" />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModal(null)} disabled={guardando}>Cancelar</Button>
              <Button variant="teal" onClick={guardarFicha} loading={guardando}>
                {guardando ? "Guardando..." : "Guardar Ficha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalle */}
      <Dialog open={modal === "detalle"} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle de Ficha</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4 py-2 text-sm">
              {/* Datos del paciente */}
              <div>
                <p className="font-bold text-base">{form.paciente_nombre}</p>
                {form.paciente_rut && <p style={{ color: C.textMuted }}>RUT: {form.paciente_rut}</p>}
                {form.paciente_pasaporte && <p style={{ color: C.textMuted }}>Pasaporte: {form.paciente_pasaporte}</p>}
                {form.paciente_edad && <p style={{ color: C.textMuted }}>Edad: {form.paciente_edad} años</p>}
                {form.categoria_paciente && <p style={{ color: C.textMuted }}>Categoría: {form.categoria_paciente}</p>}
                <p className="mt-1" style={{ color: C.textMuted }}>Evento: {form.evento} · {new Date(form.created_at).toLocaleString("es-CL")}</p>
                <p style={{ color: C.textMuted }}>Duración: {form.duracion_minutos} minutos</p>
              </div>
              <Separator />
              {/* Anamnesis */}
              {form.motivo_atencion && (
                <div><p className="font-semibold mb-1">Motivo de Atención</p><p>{form.motivo_atencion}</p></div>
              )}
              {(form.tipo_molestia || form.zona_afectada || form.tipo_masaje) && (
                <div className="grid grid-cols-3 gap-4">
                  {form.tipo_molestia && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: C.textMuted }}>Tipo de molestia</p>
                      <p>{form.tipo_molestia}</p>
                    </div>
                  )}
                  {form.zona_afectada && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: C.textMuted }}>Zona afectada</p>
                      <p>{form.zona_afectada}</p>
                    </div>
                  )}
                  {form.tipo_masaje && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: C.textMuted }}>Tipo de masaje</p>
                      <p>{form.tipo_masaje}</p>
                    </div>
                  )}
                </div>
              )}
              <Separator />
              {/* Zonas trabajadas */}
              <div>
                <p className="font-semibold mb-2">Zonas Trabajadas</p>
                <div className="flex flex-wrap gap-1.5">
                  {(form.zonas_trabajadas || []).map(z => (
                    <Badge key={z} variant="teal" className="text-xs">{z}</Badge>
                  ))}
                </div>
              </div>
              {/* Escala de dolor */}
              <div>
                <p className="font-semibold mb-3">Escala de Dolor</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ background: C.surface2 }}>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Dolor Inicial</p>
                    <p className="text-4xl font-extrabold">{form.dolor_inicial}/10</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ background: C.surface2 }}>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Dolor Final</p>
                    <p className="text-4xl font-extrabold">{form.dolor_posterior}/10</p>
                  </div>
                </div>
                {form.dolor_posterior < form.dolor_inicial && (
                  <div className="mt-3 rounded-lg p-3 text-center" style={{ background: C.greenDim }}>
                    <p className="font-semibold flex items-center justify-center gap-2" style={{ color: C.green }}>
                      <CheckCircle2 size={15} /> Mejoría de {form.dolor_inicial - form.dolor_posterior} puntos
                    </p>
                  </div>
                )}
              </div>
              {form.observaciones && <div><p className="font-semibold mb-1">Observaciones</p><p>{form.observaciones}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
