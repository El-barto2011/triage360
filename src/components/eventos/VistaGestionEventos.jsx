import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { toast } from "../ui/use-toast";

export function VistaGestionEventos({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const [evs, profs] = await Promise.all([
        sb("equipos_evento?order=created_at.desc", {}, usuario?.token),
        sb("perfiles?order=nombre", {}, usuario?.token)
      ]);

      if (evs) {
        // Auto-cerrar eventos que ya pasaron su fecha_fin
        const hoy = new Date().toISOString().split('T')[0];
        const eventosActualizados = [];

        for (const ev of evs) {
          if (ev.estado === "activo" && ev.fecha_fin && ev.fecha_fin < hoy) {
            // Cerrar automáticamente
            await sb(`equipos_evento?id=eq.${ev.id}`, {
              method: "PATCH",
              body: JSON.stringify({ estado: "cerrado", fecha_cierre: new Date().toISOString() })
            }, usuario?.token);
            eventosActualizados.push({ ...ev, estado: "cerrado", fecha_cierre: new Date().toISOString() });
          } else {
            eventosActualizados.push(ev);
          }
        }

        setEventos(eventosActualizados);
      }
      if (profs) setProfesionales(profs);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  const abrirNuevoEvento = () => {
    setForm({
      nombre_evento: "",
      fecha_evento: new Date().toISOString().split('T')[0],
      fecha_fin: "",
      hora_inicio: "",
      hora_fin: "",
      ubicacion: "",
      tipo_evento: "Deportivo",
      tipo_masoterapia: "Masivo",
      observaciones: "",
      medicos: [],
      enfermeros: [],
      paramedicos: [],
      kinesiologos: [],
      masoterapeutas: [],
      carros_asignados: [],
      bolsos_asignados: []
    });
    setModal("nuevo");
  };

  const abrirEditarEvento = (evento) => {
    setForm({ ...evento });
    setModal("editar");
  };

  const guardarEvento = async () => {
    if (!form.nombre_evento?.trim()) {
      toast({ title: "Campo requerido", description: "El nombre del evento es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.fecha_evento) {
      toast({ title: "Campo requerido", description: "La fecha de inicio es obligatoria", variant: "destructive" });
      return;
    }
    setGuardando(true);
    try {

    const datos = {
      nombre_evento: form.nombre_evento,
      fecha_evento: form.fecha_evento,
      fecha_fin: form.fecha_fin || null,
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      ubicacion: form.ubicacion || null,
      tipo_evento: form.tipo_evento,
      tipo_masoterapia: form.tipo_masoterapia,
      observaciones: form.observaciones || null,
      medicos: form.medicos || [],
      enfermeros: form.enfermeros || [],
      paramedicos: form.paramedicos || [],
      kinesiologos: form.kinesiologos || [],
      masoterapeutas: form.masoterapeutas || [],
      carros_asignados: form.carros_asignados || [],
      bolsos_asignados: form.bolsos_asignados || [],
      estado: modal === "nuevo" ? "activo" : form.estado
    };

    let eventoGuardado = null;
    let profesionalesANotificar = [];

    if (modal === "nuevo") {
      // CREAR NUEVO EVENTO
      const res = await sb("equipos_evento", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) {
        eventoGuardado = res[0];
        setEventos(prev => [eventoGuardado, ...prev]);

        // Notificar a TODOS los profesionales asignados
        profesionalesANotificar = [
          ...datos.medicos,
          ...datos.enfermeros,
          ...datos.paramedicos,
          ...datos.kinesiologos,
          ...datos.masoterapeutas
        ];
      }
    } else {
      // EDITAR EVENTO EXISTENTE
      const eventoAnterior = eventos.find(e => e.id === form.id);
      const res = await sb(`equipos_evento?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);

      if (res) {
        eventoGuardado = res[0];
        setEventos(prev => prev.map(e => e.id === form.id ? eventoGuardado : e));

        // Detectar NUEVOS profesionales agregados
        const profesionalesAnteriores = [
          ...(eventoAnterior?.medicos || []),
          ...(eventoAnterior?.enfermeros || []),
          ...(eventoAnterior?.paramedicos || []),
          ...(eventoAnterior?.kinesiologos || []),
          ...(eventoAnterior?.masoterapeutas || [])
        ];

        const profesionalesActuales = [
          ...datos.medicos,
          ...datos.enfermeros,
          ...datos.paramedicos,
          ...datos.kinesiologos,
          ...datos.masoterapeutas
        ];

        // Notificar solo a los NUEVOS
        profesionalesANotificar = profesionalesActuales.filter(
          id => !profesionalesAnteriores.includes(id)
        );
      }
    }

    // Enviar emails a los profesionales
    if (eventoGuardado && profesionalesANotificar.length > 0) {
      await enviarEmailsAsignacion(eventoGuardado, profesionalesANotificar);
    }

      toast({
        title: modal === "nuevo" ? "Evento creado" : "Evento actualizado",
        description: form.nombre_evento,
        variant: "default",
      });
      setModal(null);
    } catch (error) {
      console.error("Error guardando evento:", error);
      toast({ title: "Error al guardar", description: "No se pudo guardar el evento. Intenta nuevamente.", variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  const enviarEmailsAsignacion = async (evento, profesionalesIds) => {
    try {
      // Obtener datos completos de los profesionales a notificar
      const profesionalesNotificar = profesionales.filter(p => profesionalesIds.includes(p.id));

      // Obtener datos completos del equipo para mostrar en el email
      const equipoCompleto = {
        medicos: profesionales.filter(p => evento.medicos?.includes(p.id)).map(p => p.nombre),
        enfermeros: profesionales.filter(p => evento.enfermeros?.includes(p.id)).map(p => p.nombre),
        paramedicos: profesionales.filter(p => evento.paramedicos?.includes(p.id)).map(p => p.nombre),
        kinesiologos: profesionales.filter(p => evento.kinesiologos?.includes(p.id)).map(p => p.nombre),
        masoterapeutas: profesionales.filter(p => evento.masoterapeutas?.includes(p.id)).map(p => p.nombre)
      };

      // Enviar email a cada profesional
      for (const prof of profesionalesNotificar) {
        // Determinar el rol del profesional
        let rol = "";
        if (evento.medicos?.includes(prof.id)) rol = "Médico";
        else if (evento.enfermeros?.includes(prof.id)) rol = "Enfermero/a";
        else if (evento.paramedicos?.includes(prof.id)) rol = "Paramédico";
        else if (evento.kinesiologos?.includes(prof.id)) rol = "Kinesiólogo/a";
        else if (evento.masoterapeutas?.includes(prof.id)) rol = "Masoterapeuta";

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "asignacion_evento",
            destinatario: prof.email,
            nombreProfesional: prof.nombre,
            rol: rol,
            evento: {
              nombre: evento.nombre_evento,
              fecha: evento.fecha_evento,
              ubicacion: evento.ubicacion || "Por confirmar",
              carros: evento.carros_asignados || [],
              bolsos: evento.bolsos_asignados || []
            },
            equipo: equipoCompleto
          })
        });
      }

      console.log(`Emails enviados a ${profesionalesNotificar.length} profesionales`);
    } catch (error) {
      console.error("Error al enviar emails:", error);
    }
  };

  const toggleProfesional = (tipo, profesionalId) => {
    const lista = form[tipo] || [];
    const index = lista.indexOf(profesionalId);
    if (index > -1) {
      setForm(p => ({ ...p, [tipo]: lista.filter(id => id !== profesionalId) }));
    } else {
      setForm(p => ({ ...p, [tipo]: [...lista, profesionalId] }));
    }
  };

  const toggleCarro = (carro) => {
    const carros = form.carros_asignados || [];
    const index = carros.indexOf(carro);
    if (index > -1) {
      setForm(p => ({ ...p, carros_asignados: carros.filter(c => c !== carro) }));
    } else {
      setForm(p => ({ ...p, carros_asignados: [...carros, carro] }));
    }
  };

  const toggleBolso = (bolso) => {
    const bolsos = form.bolsos_asignados || [];
    const index = bolsos.indexOf(bolso);
    if (index > -1) {
      setForm(p => ({ ...p, bolsos_asignados: bolsos.filter(b => b !== bolso) }));
    } else {
      setForm(p => ({ ...p, bolsos_asignados: [...bolsos, bolso] }));
    }
  };

  const getProfesionalesNombres = (ids) => {
    if (!ids || ids.length === 0) return "Ninguno";
    return ids.map(id => {
      const prof = profesionales.find(p => p.id === id);
      return prof ? prof.nombre : "?";
    }).join(", ");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando eventos...</div>;

  const eventosActivos = eventos.filter(e => e.estado === "activo");
  const eventosCerrados = eventos.filter(e => e.estado === "cerrado");

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Gestión de Eventos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {eventosActivos.length} eventos activos
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevoEvento}>
            + Nuevo Evento
          </button>
        </div>
      </div>

      {eventosActivos.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Eventos Activos</div>
          {eventosActivos.map(evento => (
            <div key={evento.id} style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 12,
              background: C.surface
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {evento.nombre_evento}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    {new Date(evento.fecha_evento).toLocaleDateString('es-CL')} • {evento.tipo_evento} • Masoterapia: {evento.tipo_masoterapia}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    <div>Médicos: {getProfesionalesNombres(evento.medicos)}</div>
                    <div>Enfermeros: {getProfesionalesNombres(evento.enfermeros)}</div>
                    <div>Paramédicos: {getProfesionalesNombres(evento.paramedicos)}</div>
                    <div>Kinesiólogos: {getProfesionalesNombres(evento.kinesiologos)}</div>
                    <div>Masoterapeutas: {getProfesionalesNombres(evento.masoterapeutas)}</div>
                    {evento.carros_asignados && evento.carros_asignados.length > 0 && (
                      <div>Carros: {evento.carros_asignados.join(", ")}</div>
                    )}
                  </div>
                </div>
                <button
                  style={{ ...S.btn("ghost"), padding: "6px 12px" }}
                  onClick={() => abrirEditarEvento(evento)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {eventosCerrados.length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Eventos Cerrados Recientes</div>
          {eventosCerrados.slice(0, 3).map(evento => (
            <div key={evento.id} style={{
              padding: 12,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 8,
              opacity: 0.6
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{evento.nombre_evento}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {new Date(evento.fecha_evento).toLocaleDateString('es-CL')} •
                Cerrado: {new Date(evento.fecha_cierre).toLocaleDateString('es-CL')}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {modal === "nuevo" ? "Nuevo Evento" : "Editar Evento"}
              </div>
              <button aria-label="Cerrar modal" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre del Evento</label>
              <input
                style={S.input}
                value={form.nombre_evento || ""}
                onChange={e => setForm(p => ({ ...p, nombre_evento: e.target.value }))}
                placeholder="Media Maratón Santiago"
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Ubicación</label>
              <input
                style={S.input}
                value={form.ubicacion || ""}
                onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))}
                placeholder="Parque Bicentenario, Vitacura"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Fecha Inicio</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.fecha_evento || ""}
                  onChange={e => setForm(p => ({ ...p, fecha_evento: e.target.value }))}
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Fecha Fin</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.fecha_fin || ""}
                  onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora Inicio</label>
                <input
                  style={S.input}
                  type="time"
                  value={form.hora_inicio || ""}
                  onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))}
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora Fin</label>
                <input
                  style={S.input}
                  type="time"
                  value={form.hora_fin || ""}
                  onChange={e => setForm(p => ({ ...p, hora_fin: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo de Evento</label>
                <select
                  style={{ ...S.select, width: "100%" }}
                  value={form.tipo_evento || "Deportivo"}
                  onChange={e => setForm(p => ({ ...p, tipo_evento: e.target.value }))}
                >
                  <option>Deportivo</option>
                  <option>Feria Laboral</option>
                  <option>Torneo</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Tipo de Masoterapia</label>
              <select
                style={{ ...S.select, width: "100%" }}
                value={form.tipo_masoterapia || "Masivo"}
                onChange={e => setForm(p => ({ ...p, tipo_masoterapia: e.target.value }))}
              >
                <option>Masivo</option>
                <option>Específico</option>
              </select>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                Masivo = contador simple | Específico = fichas individuales
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea
                style={{ ...S.input, minHeight: 80, resize: "vertical" }}
                value={form.observaciones || ""}
                onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                placeholder="Notas adicionales sobre el evento..."
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Asignar Profesionales:</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Médicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Médico").map(prof => (
                    <label key={prof.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.medicos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.medicos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("medicos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enfermeros</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Enfermero/a").map(prof => (
                    <label key={prof.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.enfermeros || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.enfermeros || []).includes(prof.id)}
                        onChange={() => toggleProfesional("enfermeros", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Paramédicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Paramédico").map(prof => (
                    <label key={prof.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.paramedicos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.paramedicos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("paramedicos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Kinesiólogos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Kinesiólogo/a").map(prof => (
                    <label key={prof.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.kinesiologos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.kinesiologos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("kinesiologos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Masoterapeutas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Masoterapeuta").map(prof => (
                    <label key={prof.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.masoterapeutas || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.masoterapeutas || []).includes(prof.id)}
                        onChange={() => toggleProfesional("masoterapeutas", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Carros Clínicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <label key={num} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.carros_asignados || []).includes(`Carro ${num}`) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.carros_asignados || []).includes(`Carro ${num}`)}
                        onChange={() => toggleCarro(`Carro ${num}`)}
                      />
                      <span style={{ fontSize: 12 }}>Carro {num}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Bolsos de Medicamentos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[1, 2, 3].map(num => (
                    <label key={num} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.bolsos_asignados || []).includes(`Bolso ${num}`) ? C.blueDim : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={(form.bolsos_asignados || []).includes(`Bolso ${num}`)}
                        onChange={() => toggleBolso(`Bolso ${num}`)}
                      />
                      <span style={{ fontSize: 12 }}>💊 Bolso {num}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button
                style={{ ...S.btn("primary"), opacity: guardando ? 0.6 : 1, cursor: guardando ? "not-allowed" : "pointer" }}
                onClick={guardarEvento}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : modal === "nuevo" ? "Crear Evento" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
