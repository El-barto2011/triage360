import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaAtencionesMedicas({ usuario, carros }) {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [eventos, setEventos] = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const [ats, evs] = await Promise.all([
      sb("atenciones_medicas?order=created_at.desc&limit=50", {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token)
    ]);
    if (ats) setAtenciones(ats);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const buscarPacientePorRut = async (rut) => {
    if (!rut || rut.length < 8) {
      setHistorialPaciente([]);
      return;
    }

    // Determinar el campo a buscar según tipo_identificacion
    const campo = form.tipo_identificacion === "pasaporte" ? "paciente_pasaporte" : "paciente_rut";

    // Buscar en todas las atenciones médicas
    const atencionesPaciente = await sb(
      `atenciones_medicas?${campo}=eq.${rut}&order=created_at.desc&limit=10`,
      {},
      usuario?.token
    );

    if (atencionesPaciente && atencionesPaciente.length > 0) {
      // Autocompletar con los datos del paciente
      const ultima = atencionesPaciente[0];
      setForm(f => ({
        ...f,
        paciente_nombre: ultima.paciente_nombre,
        paciente_edad: ultima.paciente_edad
      }));
      setHistorialPaciente(atencionesPaciente);
    } else {
      setHistorialPaciente([]);
    }
  };

  const abrirNuevaAtencion = () => {
    const ahora = new Date();
    setForm({
      fecha_atencion: ahora.toISOString().split('T')[0],
      hora_atencion: ahora.toTimeString().slice(0,5),
      paciente_nombre: "",
      paciente_rut: "",
      paciente_edad: "",
      categoria_paciente: "Jugador",
      evento: eventos.length > 0 ? eventos[0].nombre_evento : "",
      evento_id: eventos.length > 0 ? eventos[0].id : null,
      motivo_consulta: "",
      diagnostico: "",
      tratamiento: "",
      observaciones: "",
      medicamentos_prescritos: [],
      insumos_medico: [],
      requiere_administracion: false
    });
    setHistorialPaciente([]);
    setModal("nueva");
  };

  const agregarMedicamento = () => {
    const meds = form.medicamentos_prescritos || [];
    setForm(f => ({
      ...f,
      medicamentos_prescritos: [...meds, {
        nombre: "",
        dosis: "",
        via: "Oral",
        cantidad: 1,
        urgente: false
      }]
    }));
  };

  const actualizarMedicamento = (index, campo, valor) => {
    const meds = [...(form.medicamentos_prescritos || [])];
    meds[index][campo] = valor;
    setForm(f => ({ ...f, medicamentos_prescritos: meds }));
  };

  const eliminarMedicamento = (index) => {
    const meds = [...(form.medicamentos_prescritos || [])];
    meds.splice(index, 1);
    setForm(f => ({ ...f, medicamentos_prescritos: meds }));
  };

  const agregarInsumo = () => {
    const ins = form.insumos_medico || [];
    setForm(f => ({
      ...f,
      insumos_medico: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...(form.insumos_medico || [])];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...(form.insumos_medico || [])];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      alert("Por favor completa al menos: nombre del paciente, evento y motivo de consulta");
      return;
    }

    // Crear timestamp personalizado con fecha y hora seleccionadas
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || '00:00'}:00`;
    const timestampPersonalizado = new Date(fechaHora).toISOString();

    // Detectar si es médico o enfermero/paramédico
    const esMedico = usuario.profesion === "Médico";
    const esEnfermero = usuario.profesion === "Enfermero/a" || usuario.profesion === "Paramédico";

    const datos = {
      ...(esMedico ? { medico_id: usuario.id, medico_nombre: usuario.email } : {}),
      ...(esEnfermero ? { enfermero_id: usuario.id, enfermero_nombre: usuario.email } : {}),
      codigo_triaje: form.codigo_triaje || "VERDE",
      es_emergencia: form.codigo_triaje === "ROJO" || form.codigo_triaje === "NEGRO",
      tiempo_espera_minutos: form.tiempo_espera_minutos !== undefined ? form.tiempo_espera_minutos : 60,
      presion_sistolica: form.presion_sistolica ? parseInt(form.presion_sistolica) : null,
      presion_diastolica: form.presion_diastolica ? parseInt(form.presion_diastolica) : null,
      frecuencia_cardiaca: form.frecuencia_cardiaca ? parseInt(form.frecuencia_cardiaca) : null,
      temperatura: form.temperatura ? parseFloat(form.temperatura) : null,
      saturacion_oxigeno: form.saturacion_oxigeno ? parseInt(form.saturacion_oxigeno) : null,
      frecuencia_respiratoria: form.frecuencia_respiratoria ? parseInt(form.frecuencia_respiratoria) : null,
      paciente_nombre: form.paciente_nombre,
      paciente_rut: form.paciente_rut || null,
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente || "Jugador",
      evento: form.evento,
      evento_id: form.evento_id || null,
      motivo_consulta: form.motivo_consulta,
      diagnostico: form.diagnostico || null,
      tratamiento: form.tratamiento || null,
      observaciones: form.observaciones || null,
      medicamentos_prescritos: form.medicamentos_prescritos || [],
      insumos_medico: form.insumos_medico || [],
      requiere_administracion: form.requiere_administracion || false,
      administracion_completada: false,
      created_at: timestampPersonalizado
    };

    const res = await sb("atenciones_medicas", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setAtenciones(prev => [res[0], ...prev]);
      setModal(null);
      alert("Atención registrada exitosamente");
    }
  };

  const verDetalleAtencion = (atencion) => {
    setForm(atencion);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  const atencionesHoy = atenciones.filter(a => {
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  const pendientesAdmin = atenciones.filter(a =>
    a.requiere_administracion && !a.administracion_completada
  );

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Atenciones Médicas</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {atencionesHoy.length} atenciones hoy · {pendientesAdmin.length} pendientes de administración
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaAtencion}>
            + Nueva Atención
          </button>
        </div>
      </div>

      {pendientesAdmin.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20, border: `2px solid ${C.orange}` }}>
          <div style={{ fontWeight: 700, color: C.orange, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span>
            <span>Pendientes de Administración ({pendientesAdmin.length})</span>
          </div>
          {pendientesAdmin.slice(0, 3).map(a => (
            <div key={a.id} style={{
              padding: 12,
              background: C.orangeDim,
              borderRadius: 6,
              marginBottom: 8,
              fontSize: 13
            }}>
              <div style={{ fontWeight: 600 }}>{a.paciente_nombre}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>
                Evento: {a.evento} · Médico: {a.medico_nombre}
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                Medicamentos: {a.medicamentos_prescritos?.length || 0} prescritos
                {a.medicamentos_prescritos?.some(m => m.urgente) && (
                  <span style={{ marginLeft: 8, color: C.red, fontWeight: 700 }}>🚨 URGENTE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {atencionesHoy.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Atenciones de Hoy</div>
          {atencionesHoy.map(atencion => (
            <div key={atencion.id} style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => verDetalleAtencion(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ·
                    {atencion.evento}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Motivo:</strong> {atencion.motivo_consulta}
                  </div>
                  {atencion.diagnostico && (
                    <div style={{ fontSize: 13, color: C.blue }}>
                      <strong>Dx:</strong> {atencion.diagnostico}
                    </div>
                  )}
                  {atencion.medicamentos_prescritos?.length > 0 && (
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                      💊 {atencion.medicamentos_prescritos.length} medicamento(s) prescrito(s)
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* Badge de código de triaje */}
                  {atencion.codigo_triaje && (
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background:
                        atencion.codigo_triaje === "ROJO" ? "#ef4444" :
                        atencion.codigo_triaje === "AMARILLO" ? "#f59e0b" :
                        atencion.codigo_triaje === "NEGRO" ? "#1f2937" :
                        "#10b981",
                      color: "#fff"
                    }}>
                      {atencion.codigo_triaje === "VERDE" && "🟢"}
                      {atencion.codigo_triaje === "AMARILLO" && "🟡"}
                      {atencion.codigo_triaje === "ROJO" && "🔴"}
                      {atencion.codigo_triaje === "NEGRO" && "⚫"}
                      {" " + atencion.codigo_triaje}
                    </span>
                  )}
                  {atencion.requiere_administracion && !atencion.administracion_completada && (
                    <span style={{ ...S.badge(C.orange, C.orangeDim), fontSize: 10 }}>Pendiente admin.</span>
                  )}
                  {atencion.administracion_completada && (
                    <span style={{ ...S.badge(C.green, C.greenDim), fontSize: 10 }}>Administrado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {atenciones.filter(a => {
        const hoy = new Date().toISOString().split('T')[0];
        const fecha = new Date(a.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Atenciones Anteriores por Evento</div>
          {(() => {
            // Agrupar atenciones por evento
            const hoy = new Date().toISOString().split('T')[0];
            const atencionesAnteriores = atenciones.filter(a => {
              const fecha = new Date(a.created_at).toISOString().split('T')[0];
              return fecha !== hoy;
            });

            const porEvento = atencionesAnteriores.reduce((acc, atencion) => {
              const evento = atencion.evento || "Sin evento";
              if (!acc[evento]) {
                acc[evento] = [];
              }
              acc[evento].push(atencion);
              return acc;
            }, {});

            return Object.entries(porEvento).map(([evento, atencionesEvento]) => (
              <div key={evento} style={{
                marginBottom: 16,
                padding: 16,
                background: C.surface2,
                borderRadius: 8,
                border: `1px solid ${C.border}`
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.blue }}>
                      {evento}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {atencionesEvento.length} atención{atencionesEvento.length !== 1 ? 'es' : ''} médica{atencionesEvento.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: C.blue,
                    background: C.surface,
                    padding: "8px 16px",
                    borderRadius: 6
                  }}>
                    {atencionesEvento.length}
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gap: 8,
                  maxHeight: 200,
                  overflowY: "auto"
                }}>
                  {atencionesEvento.slice(0, 5).map(atencion => (
                    <div key={atencion.id} style={{
                      padding: 10,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12
                    }} onClick={() => verDetalleAtencion(atencion)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{atencion.paciente_nombre}</div>
                          <div style={{ color: C.textMuted, fontSize: 11 }}>
                            {new Date(atencion.created_at).toLocaleDateString('es-CL')} ·
                            {atencion.diagnostico?.substring(0, 30)}{atencion.diagnostico?.length > 30 ? '...' : ''}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: C.textMuted,
                          background: C.surface2,
                          padding: "4px 8px",
                          borderRadius: 4,
                          marginLeft: 8
                        }}>
                          {(atencion.medico_nombre || atencion.enfermero_nombre || 'N/A').split('@')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                  {atencionesEvento.length > 5 && (
                    <div style={{
                      fontSize: 11,
                      color: C.textMuted,
                      textAlign: "center",
                      padding: 8
                    }}>
                      +{atencionesEvento.length - 5} atenciones más
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {modal === "nueva" ? "Nueva Atención Médica" : "Detalle de Atención"}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            {modal === "nueva" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Fecha de Atención *</label>
                    <input
                      style={S.input}
                      type="date"
                      value={form.fecha_atencion || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, fecha_atencion: e.target.value }))}
                    />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Hora de Atención</label>
                    <input
                      style={S.input}
                      type="time"
                      value={form.hora_atencion || new Date().toTimeString().slice(0,5)}
                      onChange={e => setForm(f => ({ ...f, hora_atencion: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Selector de Código de Triaje */}
                <div style={S.formRow}>
                  <label style={S.formLabel}>Código de Triaje *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[
                      { codigo: "VERDE", color: "#10b981", label: "🟢 VERDE - Leve" },
                      { codigo: "AMARILLO", color: "#f59e0b", label: "🟡 AMARILLO - Moderado" },
                      { codigo: "ROJO", color: "#ef4444", label: "🔴 ROJO - Urgente" },
                      { codigo: "NEGRO", color: "#1f2937", label: "⚫ NEGRO - Fallecido" }
                    ].map(t => (
                      <button
                        key={t.codigo}
                        type="button"
                        style={{
                          padding: "12px 8px",
                          border: form.codigo_triaje === t.codigo ? `3px solid ${t.color}` : `1px solid ${C.border}`,
                          borderRadius: 8,
                          background: form.codigo_triaje === t.codigo ? t.color + "20" : C.surface,
                          color: form.codigo_triaje === t.codigo ? t.color : C.text,
                          fontWeight: form.codigo_triaje === t.codigo ? 700 : 400,
                          fontSize: 11,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onClick={() => {
                          const tiempos = {
                            'VERDE': 60,
                            'AMARILLO': 30,
                            'ROJO': 0,
                            'NEGRO': null
                          };
                          setForm(f => ({
                            ...f,
                            codigo_triaje: t.codigo,
                            es_emergencia: t.codigo === "ROJO" || t.codigo === "NEGRO",
                            tiempo_espera_minutos: tiempos[t.codigo]
                          }));
                        }}
                      >
                        {t.label.split(" - ")[0]}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                    {form.codigo_triaje === "VERDE" && "Leve - Puede esperar"}
                    {form.codigo_triaje === "AMARILLO" && "Moderado - Atención pronto"}
                    {form.codigo_triaje === "ROJO" && "⚠️ URGENTE - Atención inmediata"}
                    {form.codigo_triaje === "NEGRO" && "Sin signos vitales"}
                  </div>
                  {form.tiempo_espera_minutos !== undefined && form.tiempo_espera_minutos !== null && (
                    <div style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background:
                        form.codigo_triaje === "ROJO" ? "#fef2f2" :
                        form.codigo_triaje === "AMARILLO" ? "#fffbeb" :
                        "#f0fdf4",
                      border: `1px solid ${
                        form.codigo_triaje === "ROJO" ? "#ef4444" :
                        form.codigo_triaje === "AMARILLO" ? "#f59e0b" :
                        "#10b981"
                      }`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        form.codigo_triaje === "ROJO" ? "#991b1b" :
                        form.codigo_triaje === "AMARILLO" ? "#92400e" :
                        "#166534"
                    }}>
                      ⏱️ Tiempo de espera esperado: {form.tiempo_espera_minutos === 0 ? "INMEDIATO" : `${form.tiempo_espera_minutos} minutos`}
                    </div>
                  )}
                </div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Nombre del Paciente *</label>
                    <input
                      style={S.input}
                      value={form.paciente_nombre || ""}
                      onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>RUT</label>
                    <input
                      style={S.input}
                      value={form.paciente_rut || ""}
                      onChange={e => {
                        const rut = e.target.value;
                        setForm(f => ({ ...f, paciente_rut: rut }));
                        buscarPacientePorRut(rut);
                      }}
                      placeholder="12.345.678-9"
                    />
                    {historialPaciente.length > 0 && (
                      <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
                        ✓ {historialPaciente.length} atención{historialPaciente.length > 1 ? 'es' : ''} previa{historialPaciente.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Edad</label>
                    <input
                      style={S.input}
                      type="number"
                      value={form.paciente_edad || ""}
                      onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))}
                      placeholder="35"
                    />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Categoría</label>
                    <select
                      style={{ ...S.select, width: "100%" }}
                      value={form.categoria_paciente || "Jugador"}
                      onChange={e => setForm(f => ({ ...f, categoria_paciente: e.target.value }))}
                    >
                      <option>Jugador</option>
                      <option>Staff</option>
                      <option>Voluntario</option>
                    </select>
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Evento *</label>
                    <select
                      style={{ ...S.select, width: "100%" }}
                      value={form.evento || ""}
                      onChange={e => {
                        const eventoSeleccionado = eventos.find(ev => ev.nombre_evento === e.target.value);
                        setForm(f => ({
                          ...f,
                          evento: e.target.value,
                          evento_id: eventoSeleccionado?.id || null
                        }));
                      }}
                    >
                      {eventos.map(ev => (
                        <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={S.formRow}>
                {/* Signos Vitales */}
                <div style={{ ...S.card, padding: 16, marginBottom: 16, background: C.surface }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, color: C.blue }}>💓 Signos Vitales</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div style={S.formRow}>
                      <label style={S.formLabel}>Presión Arterial (mmHg)</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          style={{ ...S.input, width: "70px" }}
                          type="number"
                          placeholder="120"
                          value={form.presion_sistolica || ""}
                          onChange={e => setForm(f => ({ ...f, presion_sistolica: e.target.value }))}
                        />
                        <span style={{ color: C.textMuted }}>/</span>
                        <input
                          style={{ ...S.input, width: "70px" }}
                          type="number"
                          placeholder="80"
                          value={form.presion_diastolica || ""}
                          onChange={e => setForm(f => ({ ...f, presion_diastolica: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div style={S.formRow}>
                      <label style={S.formLabel}>Frec. Cardíaca (lpm)</label>
                      <input
                        style={S.input}
                        type="number"
                        placeholder="72"
                        value={form.frecuencia_cardiaca || ""}
                        onChange={e => setForm(f => ({ ...f, frecuencia_cardiaca: e.target.value }))}
                      />
                    </div>

                    <div style={S.formRow}>
                      <label style={S.formLabel}>Temperatura (°C)</label>
                      <input
                        style={S.input}
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={form.temperatura || ""}
                        onChange={e => setForm(f => ({ ...f, temperatura: e.target.value }))}
                      />
                    </div>

                    <div style={S.formRow}>
                      <label style={S.formLabel}>Sat. Oxígeno (%)</label>
                      <input
                        style={S.input}
                        type="number"
                        placeholder="98"
                        value={form.saturacion_oxigeno || ""}
                        onChange={e => setForm(f => ({ ...f, saturacion_oxigeno: e.target.value }))}
                      />
                    </div>

                    <div style={S.formRow}>
                      <label style={S.formLabel}>Frec. Respiratoria (rpm)</label>
                      <input
                        style={S.input}
                        type="number"
                        placeholder="16"
                        value={form.frecuencia_respiratoria || ""}
                        onChange={e => setForm(f => ({ ...f, frecuencia_respiratoria: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                  <label style={S.formLabel}>Motivo de Consulta *</label>
                  <textarea
                    style={{ ...S.input, minHeight: 60 }}
                    value={form.motivo_consulta || ""}
                    onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))}
                    placeholder="Descripción del motivo de consulta..."
                  />
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Diagnóstico</label>
                  <textarea
                    style={{ ...S.input, minHeight: 60 }}
                    value={form.diagnostico || ""}
                    onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                    placeholder="Diagnóstico médico..."
                  />
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Tratamiento</label>
                  <textarea
                    style={{ ...S.input, minHeight: 60 }}
                    value={form.tratamiento || ""}
                    onChange={e => setForm(f => ({ ...f, tratamiento: e.target.value }))}
                    placeholder="Tratamiento indicado..."
                  />
                </div>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>Medicamentos Prescritos</div>
                    <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarMedicamento}>
                      + Agregar Medicamento
                    </button>
                  </div>
                  {(form.medicamentos_prescritos || []).map((med, index) => (
                    <div key={index} style={{
                      padding: 12,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      marginBottom: 12,
                      background: med.urgente ? C.redDim : C.surface
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input
                          style={S.input}
                          placeholder="Nombre del medicamento"
                          value={med.nombre}
                          onChange={e => actualizarMedicamento(index, "nombre", e.target.value)}
                        />
                        <input
                          style={S.input}
                          placeholder="Dosis"
                          value={med.dosis}
                          onChange={e => actualizarMedicamento(index, "dosis", e.target.value)}
                        />
                        <select
                          style={S.select}
                          value={med.via}
                          onChange={e => actualizarMedicamento(index, "via", e.target.value)}
                        >
                          <option>Oral</option>
                          <option>Intravenosa</option>
                          <option>Intramuscular</option>
                          <option>Subcutánea</option>
                          <option>Tópica</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input
                          type="number"
                          style={{ ...S.input, width: 80 }}
                          placeholder="Cant."
                          value={med.cantidad}
                          onChange={e => actualizarMedicamento(index, "cantidad", parseInt(e.target.value) || 1)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={med.urgente}
                            onChange={e => actualizarMedicamento(index, "urgente", e.target.checked)}
                          />
                          <span style={{ color: med.urgente ? C.red : C.text }}>Urgente 🚨</span>
                        </label>
                        <button
                          style={{ ...S.btn("ghost"), fontSize: 12, marginLeft: "auto" }}
                          onClick={() => eliminarMedicamento(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>Insumos Utilizados (del Carro)</div>
                    <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                      + Agregar Insumo
                    </button>
                  </div>
                  {(form.insumos_medico || []).map((ins, index) => (
                    <div key={index} style={{
                      padding: 12,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      marginBottom: 8,
                      display: "flex",
                      gap: 12,
                      alignItems: "center"
                    }}>
                      <input
                        style={{ ...S.input, flex: 2 }}
                        placeholder="Nombre del insumo"
                        value={ins.nombre}
                        onChange={e => actualizarInsumo(index, "nombre", e.target.value)}
                      />
                      <input
                        type="number"
                        style={{ ...S.input, width: 80 }}
                        placeholder="Cant."
                        value={ins.cantidad}
                        onChange={e => actualizarInsumo(index, "cantidad", parseInt(e.target.value) || 1)}
                      />
                      <select
                        style={{ ...S.select, width: 100 }}
                        value={ins.unidad}
                        onChange={e => actualizarInsumo(index, "unidad", e.target.value)}
                      >
                        <option>unid.</option>
                        <option>ml</option>
                        <option>mg</option>
                        <option>amp.</option>
                      </select>
                      <button
                        style={{ ...S.btn("ghost"), fontSize: 12 }}
                        onClick={() => eliminarInsumo(index)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Observaciones</label>
                  <textarea
                    style={{ ...S.input, minHeight: 60 }}
                    value={form.observaciones || ""}
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={form.requiere_administracion}
                      onChange={e => setForm(f => ({ ...f, requiere_administracion: e.target.checked }))}
                    />
                    <span>Requiere administración por Enfermero/Paramédico</span>
                  </label>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, marginLeft: 24 }}>
                    Si marcas esta opción, la atención aparecerá en la lista de pendientes para enfermeros/paramédicos
                  </div>
                </div>

                {historialPaciente.length > 0 && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    background: C.surface2,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: C.blue }}>
                      📋 Historial del Paciente ({historialPaciente.length} atenciones previas)
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      {historialPaciente.map((at, idx) => (
                        <div key={idx} style={{
                          padding: 10,
                          marginBottom: 8,
                          background: C.surface,
                          borderRadius: 6,
                          fontSize: 12
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>
                            {new Date(at.created_at).toLocaleDateString('es-CL')} · {at.evento}
                          </div>
                          <div style={{ color: C.textMuted, marginBottom: 4 }}>
                            Dr/a: {at.medico_nombre?.split('@')[0]}
                          </div>
                          {at.diagnostico && (
                            <div style={{ fontSize: 11 }}>
                              <strong>Dx:</strong> {at.diagnostico}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                  <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
                  <button style={S.btn("primary")} onClick={guardarAtencion}>
                    Guardar Atención
                  </button>
                </div>
              </>
            )}

            {modal === "detalle" && form && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
                  {form.paciente_rut && <div style={{ fontSize: 13, color: C.textMuted }}>RUT: {form.paciente_rut}</div>}
                  {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                    Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted }}>
                    Médico: {form.medico_nombre}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Motivo de Consulta:</div>
                  <div style={{ fontSize: 14 }}>{form.motivo_consulta}</div>
                </div>

                {form.diagnostico && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Diagnóstico:</div>
                    <div style={{ fontSize: 14 }}>{form.diagnostico}</div>
                  </div>
                )}

                {form.tratamiento && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Tratamiento:</div>
                    <div style={{ fontSize: 14 }}>{form.tratamiento}</div>
                  </div>
                )}

                {form.medicamentos_prescritos && form.medicamentos_prescritos.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Medicamentos Prescritos:</div>
                    {form.medicamentos_prescritos.map((med, i) => (
                      <div key={i} style={{
                        padding: 10,
                        background: med.urgente ? C.redDim : C.surface2,
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: 13
                      }}>
                        <div style={{ fontWeight: 600 }}>
                          {med.nombre} - {med.dosis}
                          {med.urgente && <span style={{ marginLeft: 8, color: C.red }}>🚨 URGENTE</span>}
                        </div>
                        <div style={{ color: C.textMuted, fontSize: 12 }}>
                          Vía: {med.via} · Cantidad: {med.cantidad}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {form.insumos_medico && form.insumos_medico.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                    {form.insumos_medico.map((ins, i) => (
                      <div key={i} style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                        • {ins.nombre} - {ins.cantidad} {ins.unidad}
                      </div>
                    ))}
                  </div>
                )}

                {form.observaciones && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Observaciones:</div>
                    <div style={{ fontSize: 14 }}>{form.observaciones}</div>
                  </div>
                )}

                <div style={{ marginTop: 20, padding: 12, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Estado de Administración:</div>
                  {form.requiere_administracion ? (
                    form.administracion_completada ? (
                      <span style={{ ...S.badge(C.green, C.greenDim) }}>✅ Administrado</span>
                    ) : (
                      <span style={{ ...S.badge(C.orange, C.orangeDim) }}>⏳ Pendiente de administración</span>
                    )
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: 13 }}>No requiere administración</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
