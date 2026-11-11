import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { C } from "../../config/theme";
import { sb } from "../../config/supabase";
import { hoyLocal } from "../../config/fechas";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "../ui/use-toast";
import { Field, selectCls } from "../common/FormControls";
import { TRIAJE_OPCIONES, MotivosRapidos, CampoAlergias, industriaActual, limpiarExtra, horaAhora } from "../common/CamposAtencion";

/* ════════════════════════════════════════════════════════════
   INGRESO RÁPIDO DE TRIAJE
   Recibir al paciente en segundos: nombre o dorsal, color y motivo.
   Queda "En espera" en la Cola de Triaje; el resto de la ficha se
   completa al atenderlo (Alta / Derivar en la cola).
   ════════════════════════════════════════════════════════════ */

const CAMPO_DORSAL = "Número de dorsal";

export function BotonIngresoRapido({ onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
      <Zap size={14} /> Ingreso rápido
    </Button>
  );
}

export function IngresoRapido({ abierto, onCerrar, usuario, eventos = [], eventoActual = null, onGuardado }) {
  const industria = industriaActual();
  const usaDorsal = (industria.campos_extra || []).includes(CAMPO_DORSAL);
  const vacio = () => {
    const activos = eventos.filter(e => e.estado === "activo");
    const pre = eventos.find(e => e.id === eventoActual) || (activos.length === 1 ? activos[0] : activos[0]) || eventos[0] || null;
    return { evento_id: pre?.id || "", nombre: "", dorsal: "", codigo: "", motivo: "", alergias: "" };
  };
  const [f, setF] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  // Cada vez que se abre parte limpio, con el evento del turno ya elegido
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (abierto) setF(vacio()); }, [abierto]);

  const evento = eventos.find(e => String(e.id) === String(f.evento_id));
  const falta = !evento ? "Elige el evento"
    : !(f.nombre.trim() || f.dorsal.trim()) ? (usaDorsal ? "Escribe el nombre o el dorsal" : "Escribe el nombre")
    : !f.codigo ? "Elige el color de triaje"
    : !f.motivo.trim() ? "Indica el motivo"
    : null;

  const guardar = async (otro) => {
    if (falta) { toast({ title: "Falta un dato", description: falta, variant: "warning" }); return; }
    const prof = usuario?.profesion;
    const nombreProf = usuario?.nombre || usuario?.email;
    const triaje = TRIAJE_OPCIONES.find(t => t.codigo === f.codigo);
    const datos = {
      ...(prof === "Médico"      ? { medico_id:     usuario.id, medico_nombre:     nombreProf } : {}),
      ...(prof === "Enfermero/a" ? { enfermero_id:  usuario.id, enfermero_nombre:  nombreProf } : {}),
      ...(prof === "Paramédico"  ? { paramedico_id: usuario.id, paramedico_nombre: nombreProf } : {}),
      paciente_nombre: f.nombre.trim() || `Dorsal ${f.dorsal.trim()}`,
      tipo_identificacion: "rut",
      evento_id: evento.id,
      evento: evento.nombre_evento,
      codigo_triaje: f.codigo,
      es_emergencia: f.codigo === "ROJO" || f.codigo === "NEGRO",
      tiempo_espera_minutos: triaje?.espera ?? null,
      motivo_consulta: f.motivo.trim(),
      alergias: f.alergias.trim() || null,
      datos_extra: limpiarExtra(usaDorsal ? { [CAMPO_DORSAL]: f.dorsal } : {}),
      estado_atencion: "en_espera",
      estado_cambio_at: new Date().toISOString(),
      medicamentos_prescritos: [],
      insumos_medico: [],
      requiere_administracion: false,
      administracion_completada: false,
      fecha_atencion: hoyLocal(),
      hora_atencion: horaAhora(),
    };
    setGuardando(true);
    try {
      const res = await sb("atenciones_medicas", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (!res) return;   // sb() ya mostró el error
      const offline = !!res[0]?.__offline;
      toast({
        title: offline ? "Ingreso guardado sin conexión" : "Paciente en espera",
        description: `${datos.paciente_nombre} · ${f.codigo}${offline ? " · se enviará al reconectar" : ""}`,
        variant: offline ? "warning" : "success",
      });
      onGuardado?.(res[0]);
      if (otro) setF({ ...vacio(), evento_id: f.evento_id }); else onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) onCerrar(); }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap size={16} style={{ color: "#f59e0b" }} /> Ingreso rápido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {eventos.length !== 1 && (
            <Field label="Evento" required>
              <select className={selectCls} value={f.evento_id} onChange={e => setF(x => ({ ...x, evento_id: e.target.value }))}>
                <option value="">— Elegir —</option>
                {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre_evento}</option>)}
              </select>
            </Field>
          )}

          <div className={`grid gap-4 ${usaDorsal ? "grid-cols-3" : "grid-cols-1"}`}>
            <div className={usaDorsal ? "col-span-2" : ""}>
              <Field label="Nombre" required={!usaDorsal}>
                <Input autoFocus value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="Nombre del paciente" />
              </Field>
            </div>
            {usaDorsal && (
              <Field label="Dorsal">
                <Input inputMode="numeric" value={f.dorsal} onChange={e => setF(x => ({ ...x, dorsal: e.target.value }))} placeholder="Nº" />
              </Field>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {TRIAJE_OPCIONES.map(t => (
                <button key={t.codigo} type="button" aria-label={`Triaje ${t.codigo}`}
                  className="rounded-lg py-4 text-xs font-bold border transition-all"
                  style={{
                    border: f.codigo === t.codigo ? `2px solid ${t.color}` : `1px solid ${C.border}`,
                    background: f.codigo === t.codigo ? `${t.color}30` : "transparent",
                    color: f.codigo === t.codigo ? t.color : C.textMuted,
                  }}
                  onClick={() => setF(x => ({ ...x, codigo: t.codigo }))}>
                  <div style={{ fontSize: 20 }}>{t.emoji}</div>{t.codigo}
                </button>
              ))}
            </div>
            {f.codigo && <p className="text-xs" style={{ color: TRIAJE_OPCIONES.find(t => t.codigo === f.codigo)?.color }}>{TRIAJE_OPCIONES.find(t => t.codigo === f.codigo)?.desc}</p>}
          </div>

          <Field label="Motivo" required>
            <MotivosRapidos value={f.motivo} onChange={v => setF(x => ({ ...x, motivo: v }))} industria={industria} />
            <Input className="mt-2" value={f.motivo} onChange={e => setF(x => ({ ...x, motivo: e.target.value }))} placeholder="Toca un motivo o escríbelo" />
          </Field>

          <CampoAlergias value={f.alergias} onChange={v => setF(x => ({ ...x, alergias: v }))} />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button variant="outline" disabled={guardando} onClick={() => guardar(true)}>Guardar e ingresar otro</Button>
            <Button variant="teal" disabled={guardando} onClick={() => guardar(false)}>{guardando ? "Guardando..." : "Dejar en espera"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
