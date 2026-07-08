import { useState, useEffect } from "react";
import { toast } from "../ui/use-toast";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaMasoterapiaMasiva({ usuario }) {
  const [registroHoy, setRegistroHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const esAdmin = usuario?.rol === "admin";

    const [evs, hist] = await Promise.all([
      sb("equipos_evento?estado=eq.activo&tipo_masoterapia=eq.Masivo&order=created_at.desc", {}, usuario?.token),
      // Admin ve todos los registros, masoterapeutas solo los suyos
      sb(
        esAdmin
          ? `atenciones_masoterapia_masiva?order=created_at.desc&limit=100`
          : `atenciones_masoterapia_masiva?masoterapeuta_id=eq.${usuario.id}&order=created_at.desc&limit=30`,
        {},
        usuario?.token
      )
    ]);

    if (evs) {
      setEventos(evs);
      if (evs.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(evs[0].id);
      }
    }

    if (hist) {
      setHistorial(hist);
      const hoy = new Date().toISOString().split('T')[0];
      const idActivo = eventoSeleccionado ?? evs?.[0]?.id;
      const regHoy = hist.find(h => {
        const fechaReg = new Date(h.created_at).toISOString().split('T')[0];
        return fechaReg === hoy && h.evento_id === idActivo;
      });
      setRegistroHoy(regHoy || null);
    }

    setLoading(false);
  };

  const iniciarContador = async () => {
    if (!eventoSeleccionado) {
      toast({ title: "Selecciona un evento primero", variant: "destructive" });
      return;
    }

    const datos = {
      masoterapeuta_id: usuario.id,
      masoterapeuta_nombre: usuario.nombre || usuario.email,
      evento_id: eventoSeleccionado,
      masajes_realizados: 0,
      fecha: new Date().toISOString().split('T')[0]
    };

    const res = await sb("atenciones_masoterapia_masiva", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setRegistroHoy(res[0]);
      setHistorial(prev => [res[0], ...prev]);
    }
  };

  // Ajuste atómico vía RPC (evita perder cuentas con dos dispositivos simultáneos y nunca baja de 0)
  const ajustarMasajes = async (delta) => {
    if (!registroHoy) return;
    const res = await sb("rpc/fn_ajustar_masajes", {
      method: "POST",
      body: JSON.stringify({ p_id: registroHoy.id, p_delta: delta })
    }, usuario?.token);
    // La RPC devuelve la fila actualizada (objeto) o un array según PostgREST
    const fila = Array.isArray(res) ? res[0] : res;
    if (fila && typeof fila === "object") {
      setRegistroHoy(fila);
      setHistorial(prev => prev.map(h => h.id === registroHoy.id ? fila : h));
    }
  };

  const sumarMasaje = async () => {
    if (!registroHoy) {
      await iniciarContador();
      return;
    }
    await ajustarMasajes(1);
  };

  const restarMasaje = async () => {
    if (!registroHoy || registroHoy.masajes_realizados === 0) return;
    await ajustarMasajes(-1);
  };

  const cambiarEvento = (nuevoEventoId) => {
    setEventoSeleccionado(nuevoEventoId);
    const hoy = new Date().toISOString().split('T')[0];
    const regHoy = historial.find(h => {
      const fechaReg = new Date(h.created_at).toISOString().split('T')[0];
      return fechaReg === hoy && h.evento_id === nuevoEventoId;
    });
    setRegistroHoy(regHoy || null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando...</div>;

  if (eventos.length === 0) {
    return (
      <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No hay eventos masivos activos</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Los eventos deben estar configurados con tipo de masoterapia "Masivo"
        </div>
      </div>
    );
  }

  const conteo = registroHoy?.masajes_realizados || 0;
  const horaInicio = registroHoy ? new Date(registroHoy.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const horasTranscurridas = registroHoy ? (Date.now() - new Date(registroHoy.created_at).getTime()) / (1000 * 60 * 60) : 0;
  const promedioPorHora = horasTranscurridas > 0 ? (conteo / horasTranscurridas).toFixed(1) : 0;

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.blue, marginBottom: 12 }}>
          Masoterapia Masiva - Contador
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Evento: {eventos.find(e => e.id === eventoSeleccionado)?.nombre_evento || ""}
        </div>
        {eventos.length > 1 && (
          <select
            style={{ ...S.select, width: "100%", marginTop: 12 }}
            value={eventoSeleccionado ?? ""}
            onChange={e => cambiarEvento(Number(e.target.value))}
          >
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre_evento}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ ...S.card, marginBottom: 20, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 20 }}>
          MASAJES REALIZADOS HOY
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: C.blue, marginBottom: 30 }}>
          {conteo}
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
          <button
            style={{
              ...S.btn("ghost"),
              width: 80,
              height: 80,
              fontSize: 40,
              opacity: conteo === 0 ? 0.3 : 1
            }}
            onClick={restarMasaje}
            disabled={conteo === 0}
          >
            −
          </button>
          <button
            style={{
              ...S.btn("primary"),
              width: 120,
              height: 120,
              fontSize: 60
            }}
            onClick={sumarMasaje}
          >
            +
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Presiona + para sumar un masaje
        </div>
      </div>

      {registroHoy && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Estadísticas del Día</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Inicio</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{horaInicio}</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tiempo</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{horasTranscurridas.toFixed(1)}h</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Promedio/hora</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{promedioPorHora}</div>
            </div>
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Historial Reciente</div>
          {historial.slice(0, 10).map(reg => {
            const esHoy = new Date(reg.created_at).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            return (
              <div key={reg.id} style={{
                padding: 12,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                marginBottom: 8,
                opacity: esHoy ? 1 : 0.6
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {eventos.find(e => e.id === reg.evento_id)?.nombre_evento || reg.evento}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {new Date(reg.created_at).toLocaleDateString('es-CL')}
                      {esHoy && <span style={{ marginLeft: 8, color: C.green }}>• Hoy</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>
                    {reg.masajes_realizados}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
