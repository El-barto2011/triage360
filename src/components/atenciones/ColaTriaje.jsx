import { useState, useEffect, useRef } from "react";
import { sb } from "../../config/supabase";
import { C } from "../../config/theme";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, Clock, RefreshCw, Wifi, WifiOff, Play, Check, Ambulance } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useEvento } from "../common/SelectorEvento";
import { subscribeAtenciones } from "../../config/realtime";
import { inicioDiaLocalISO } from "../../config/fechas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Field } from "../common/FormControls";

const TRIAJE_CONFIG = {
  ROJO:     { color: "#ef4444", emoji: "🔴", label: "URGENTE",   orden: 1, maxEspera: 5   },
  AMARILLO: { color: "#f59e0b", emoji: "🟡", label: "MODERADO",  orden: 2, maxEspera: 30  },
  VERDE:    { color: "#10b981", emoji: "🟢", label: "LEVE",      orden: 3, maxEspera: 120 },
  NEGRO:    { color: "#6b7280", emoji: "⚫", label: "FALLECIDO", orden: 4, maxEspera: null },
};

export default function ColaTriaje({ usuario }) {
  const [cola,    setCola]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [enVivo,  setEnVivo]  = useState(false);
  const [cambiando, setCambiando] = useState(null);   // id de la atención cuyo estado se está guardando
  const [cierre, setCierre] = useState(null);         // { paciente, estado, diagnostico, tratamiento, observaciones, destino }
  const alertasAnteriores = useRef(0);
  const { eventoActual } = useEvento();

  useEffect(() => {
    cargarCola();

    // Realtime: refresco instantáneo al crearse/editarse una atención del evento.
    const cancelar = subscribeAtenciones(
      usuario?.token,
      eventoActual,
      () => cargarCola(),
      (estado) => setEnVivo(estado === "SUBSCRIBED"),
    );

    // Polling de respaldo (redes inestables en cancha): recalcula tiempos de espera
    // y cubre el caso de que el websocket se caiga.
    const interval = setInterval(cargarCola, 30000);

    return () => { cancelar(); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, eventoActual]);

  const cargarCola = async () => {
    try {
      // Inicio del día en hora LOCAL (antes era medianoche UTC: a las 20–21 h de Chile
      // la cola se vaciaba y los pacientes en espera desaparecían de la pantalla).
      const desde = encodeURIComponent(inicioDiaLocalISO());
      const filtroEvento = eventoActual ? `&evento_id=eq.${eventoActual}` : "";

      const atenciones = await sb(
        // Solo quienes siguen esperando o están siendo atendidos: un paciente con alta o derivado
        // sale de la cola (antes todo paciente del día terminaba en "TIEMPO EXCEDIDO").
        `atenciones_medicas?created_at=gte.${desde}&deleted_at=is.null&estado_atencion=in.(en_espera,en_atencion)&order=created_at.asc&limit=200${filtroEvento}`,
        {}, usuario?.token
      );

      if (!atenciones) { setLoading(false); return; }

      const ahora = new Date();
      const colaOrdenada = atenciones
        .filter(a => a.codigo_triaje)
        .map(a => {
          const config   = TRIAJE_CONFIG[a.codigo_triaje] || TRIAJE_CONFIG.VERDE;
          const enAtencion = a.estado_atencion === "en_atencion";
          // El reloj de espera se detiene cuando el médico toma al paciente
          const hasta    = enAtencion && a.estado_cambio_at ? new Date(a.estado_cambio_at) : ahora;
          const minutos  = Math.max(0, Math.floor((hasta - new Date(a.created_at)) / 60000));
          const urgente  = !enAtencion && config.maxEspera != null && minutos > config.maxEspera;
          return { ...a, config, minutosEspera: minutos, urgente, enAtencion };
        })
        .sort((a, b) => {
          if (a.enAtencion !== b.enAtencion) return a.enAtencion ? 1 : -1;   // primero quienes esperan
          if (a.config.orden !== b.config.orden) return a.config.orden - b.config.orden;
          return b.minutosEspera - a.minutosEspera;
        });

      const urgentesActuales = colaOrdenada.filter(a => a.urgente).length;
      if (urgentesActuales > alertasAnteriores.current) {
        toast({
          title: "⚠️ ALERTA DE TRIAJE",
          description: `${urgentesActuales} paciente(s) exceden el tiempo crítico de espera`,
          variant: "destructive",
        });
      }
      alertasAnteriores.current = urgentesActuales;

      setCola(colaOrdenada);
      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error("Error cargando cola:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (paciente, estado, extra = {}) => {
    setCambiando(paciente.id);
    try {
      const res = await sb(`atenciones_medicas?id=eq.${paciente.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...extra, estado_atencion: estado, estado_cambio_at: new Date().toISOString() }),
      }, usuario?.token);
      if (res) {
        const textos = { en_atencion: "En atención", alta: "Alta registrada", derivado: "Derivación registrada" };
        toast({ title: textos[estado] || "Estado actualizado", description: paciente.paciente_nombre });
        await cargarCola();
        return true;
      }
      return false;
    } finally {
      setCambiando(null);
    }
  };

  // Alta y derivación abren la ficha del MISMO registro para completar diagnóstico y
  // tratamiento: así el paciente que ingresó "en espera" no termina con dos atenciones.
  const abrirCierre = (paciente, estado) => setCierre({
    paciente, estado,
    diagnostico:   paciente.diagnostico   || "",
    tratamiento:   paciente.tratamiento   || "",
    observaciones: paciente.observaciones || "",
    destino: "",
  });

  const guardarCierre = async () => {
    if (!cierre) return;
    const { paciente, estado } = cierre;
    const obs = [cierre.observaciones.trim(), estado === "derivado" && cierre.destino.trim() ? `Derivado a: ${cierre.destino.trim()}` : ""]
      .filter(Boolean).join("\n");
    const extra = {
      diagnostico:   cierre.diagnostico.trim() || null,
      tratamiento:   cierre.tratamiento.trim() || null,
      observaciones: obs || null,
    };
    // Si quien cierra es médico y la atención no tenía médico, queda registrado como tratante
    if (usuario?.profesion === "Médico" && !paciente.medico_id) {
      extra.medico_id = usuario.id;
      extra.medico_nombre = usuario.nombre || usuario.email;
    }
    const ok = await cambiarEstado(paciente, estado, extra);
    if (ok) setCierre(null);
  };

  const enEspera = cola.filter(a => !a.enAtencion).length;
  const rojos    = cola.filter(a => a.codigo_triaje === "ROJO").length;
  const amarillos = cola.filter(a => a.codigo_triaje === "AMARILLO").length;
  const urgentes  = cola.filter(a => a.urgente).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.red }}>
                <AlertTriangle size={18} /> Cola de Triaje
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 999,
                  color: enVivo ? "#10b981" : C.textMuted,
                  background: enVivo ? "#10b98115" : C.surface2,
                  border: `1px solid ${enVivo ? "#10b98140" : C.border}`,
                }}>
                  {enVivo ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {enVivo ? "EN VIVO" : "Reconectando…"}
                </span>
              </h2>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                Pacientes en espera ordenados por urgencia · {enVivo ? "Actualización instantánea" : "Auto-actualiza cada 30 seg"}
                {ultimaActualizacion && ` · Última: ${ultimaActualizacion.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={cargarCola} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: C.accent }}>{enEspera}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>En espera{cola.length > enEspera ? ` · ${cola.length - enEspera} en atención` : ""}</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: rojos > 0 ? "#ef444440" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: rojos > 0 ? "#ef4444" : C.textMuted }}>{rojos}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>🔴 Urgentes</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: amarillos > 0 ? "#f59e0b40" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: amarillos > 0 ? "#f59e0b" : C.textMuted }}>{amarillos}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>🟡 Moderados</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: urgentes > 0 ? "#ef444440" : undefined, background: urgentes > 0 ? "#ef444408" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: urgentes > 0 ? "#ef4444" : C.green }}>{urgentes}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>Con retraso crítico</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Lista ordenada ─────────────────────────────────── */}
      {loading ? (
        <Card><CardContent className="p-8 text-center" style={{ color: C.textMuted }}>Cargando cola de triaje...</CardContent></Card>
      ) : cola.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div className="font-semibold" style={{ color: C.text }}>Cola vacía</div>
            <div className="text-sm mt-1" style={{ color: C.textMuted }}>No hay pacientes esperando{eventoActual ? " en este evento" : ""}. Al registrar una atención, elige <strong>En espera</strong> en "¿Cómo queda el paciente?" y aparecerá aquí ordenado por urgencia.</div>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cola.map((paciente, idx) => (
            <Card
              key={paciente.id}
              style={{
                borderLeft: `4px solid ${paciente.config.color}`,
                borderColor: paciente.urgente ? paciente.config.color : undefined,
                background: paciente.urgente ? `${paciente.config.color}08` : undefined,
                animation: paciente.codigo_triaje === "ROJO" && paciente.urgente ? "pulse 2s infinite" : undefined,
              }}
            >
              <CardContent className="p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

                  {/* Posición */}
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.border, minWidth: 36, textAlign: "center" }}>
                    {idx + 1}
                  </div>

                  {/* Badge triaje */}
                  <div style={{
                    background: `${paciente.config.color}20`,
                    border: `2px solid ${paciente.config.color}`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    minWidth: 120,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18 }}>{paciente.config.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: paciente.config.color, letterSpacing: 1 }}>
                      {paciente.config.label}
                    </div>
                  </div>

                  {/* Info paciente */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{paciente.paciente_nombre}</div>
                    {paciente.paciente_rut && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>RUT: {paciente.paciente_rut}</div>
                    )}
                    {paciente.motivo_consulta && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                        {paciente.motivo_consulta.slice(0, 60)}{paciente.motivo_consulta.length > 60 ? "…" : ""}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
                      {new Date(paciente.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      {paciente.evento && ` · ${paciente.evento}`}
                    </div>
                  </div>

                  {/* Tiempo espera */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <Clock size={14} style={{ color: paciente.urgente ? "#ef4444" : C.textMuted }} />
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: paciente.urgente ? "#ef4444" : C.text,
                      }}>
                        {paciente.minutosEspera} min
                      </span>
                    </div>
                    {paciente.config.maxEspera != null && (
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                        Máx: {paciente.config.maxEspera} min
                      </div>
                    )}
                    {paciente.urgente && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                        <AlertTriangle size={11} /> TIEMPO EXCEDIDO
                      </div>
                    )}
                    {paciente.enAtencion && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, color: "#8b5cf6" }}>EN ATENCIÓN</div>
                    )}
                  </div>

                  {/* Acciones: avanzar el estado del paciente */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%", justifyContent: "flex-end" }}>
                    {!paciente.enAtencion && (
                      <Button variant="teal" size="sm" disabled={cambiando === paciente.id} onClick={() => cambiarEstado(paciente, "en_atencion")}>
                        <Play size={13} /> Atender
                      </Button>
                    )}
                    <Button variant="outline" size="sm" disabled={cambiando === paciente.id} onClick={() => abrirCierre(paciente, "alta")}>
                      <Check size={13} /> Alta
                    </Button>
                    <Button variant="outline" size="sm" disabled={cambiando === paciente.id} onClick={() => abrirCierre(paciente, "derivado")}>
                      <Ambulance size={13} /> Derivar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cierre de la atención: completa la ficha del mismo registro */}
      <Dialog open={!!cierre} onOpenChange={(open) => { if (!open) setCierre(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {cierre?.estado === "derivado" ? "Derivar" : "Dar alta"} · {cierre?.paciente?.paciente_nombre}
            </DialogTitle>
          </DialogHeader>
          {cierre && (
            <div className="space-y-4 py-2">
              <p className="text-xs" style={{ color: C.textMuted }}>
                Motivo: {cierre.paciente.motivo_consulta || "—"} · Los campos son opcionales.
              </p>
              {cierre.estado === "derivado" && (
                <Field label="Derivado a">
                  <Input value={cierre.destino} onChange={e => setCierre(c => ({ ...c, destino: e.target.value }))} placeholder="Centro asistencial, ambulancia, acompañante" />
                </Field>
              )}
              <Field label="Diagnóstico">
                <Textarea value={cierre.diagnostico} onChange={e => setCierre(c => ({ ...c, diagnostico: e.target.value }))} placeholder="Evaluación / diagnóstico" />
              </Field>
              <Field label="Tratamiento">
                <Textarea value={cierre.tratamiento} onChange={e => setCierre(c => ({ ...c, tratamiento: e.target.value }))} placeholder="Tratamiento realizado" />
              </Field>
              <Field label="Observaciones">
                <Textarea value={cierre.observaciones} onChange={e => setCierre(c => ({ ...c, observaciones: e.target.value }))} placeholder="Indicaciones al paciente" />
              </Field>
              <p className="text-xs" style={{ color: C.textMuted }}>
                Si necesita medicamentos, regístralos en Prescripción; desde aquí solo se cierra la atención.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCierre(null)}>Cancelar</Button>
                <Button variant="teal" disabled={cambiando === cierre.paciente.id} onClick={guardarCierre}>
                  {cierre.estado === "derivado" ? "Registrar derivación" : "Registrar alta"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
