import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaAtencionesKinesiologia({ usuario }) {
  const [atenciones, setAtenciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
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
    const esAdmin = usuario?.rol === "admin";

    const [ats, ins, evs] = await Promise.all([
      // Admin ve todas las atenciones, kinesiologos solo las suyas
      sb(
        esAdmin
          ? `atenciones_kinesiologia?order=created_at.desc&limit=100`
          : `atenciones_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=created_at.desc&limit=50`,
        {},
        usuario?.token
      ),
      sb(`insumos_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=nombre`, {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token)
    ]);
    if (ats) setAtenciones(ats);
    if (ins) setInsumos(ins);
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

    const atencionesPaciente = await sb(
      `atenciones_kinesiologia?${campo}=eq.${rut}&order=created_at.desc&limit=10`,
      {},
      usuario?.token
    );

    if (atencionesPaciente && atencionesPaciente.length > 0) {
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
      evaluacion_inicial: "",
      tratamiento_realizado: "",
      observaciones: "",
      recomendaciones: "",
      insumos_usados: []
    });
    setHistorialPaciente([]);
    setModal("nueva");
  };

  const agregarInsumo = () => {
    const ins = form.insumos_usados || [];
    setForm(f => ({
      ...f,
      insumos_usados: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...(form.insumos_usados || [])];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...(form.insumos_usados || [])];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      alert("Por favor completa al menos: nombre del paciente, evento y motivo de consulta");
      return;
    }

    // Crear timestamp personalizado
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || '00:00'}:00`;
    const timestampPersonalizado = new Date(fechaHora).toISOString();

    const datos = {
      kinesiologo_id: usuario.id,
      kinesiologo_nombre: usuario.email,
      paciente_nombre: form.paciente_nombre,
      paciente_rut: form.paciente_rut || null,
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente || "Jugador",
      evento: form.evento,
      evento_id: form.evento_id || null,
      motivo_consulta: form.motivo_consulta,
      evaluacion_inicial: form.evaluacion_inicial || null,
      tratamiento_realizado: form.tratamiento_realizado || null,
      observaciones: form.observaciones || null,
      recomendaciones: form.recomendaciones || null,
      insumos_usados: form.insumos_usados || [],
      created_at: timestampPersonalizado
    };

    const res = await sb("atenciones_kinesiologia", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      // Descontar insumos del bolso
      for (const insumo of form.insumos_usados || []) {
        const insumoEnBolso = insumos.find(i => i.nombre === insumo.nombre);
        if (insumoEnBolso) {
          const nuevoStock = insumoEnBolso.stock - insumo.cantidad;
          await sb(`insumos_kinesiologia?id=eq.${insumoEnBolso.id}`, {
            method: "PATCH",
            body: JSON.stringify({ stock: nuevoStock })
          }, usuario?.token);
        }
      }

      setAtenciones(prev => [res[0], ...prev]);
      setModal(null);
      alert("Atención registrada exitosamente");
      cargarDatos(); // Recargar para actualizar stock
    }
  };

  const verDetalleAtencion = (atencion) => {
    setForm(atencion);
    setModal("detalle");
  };

  const abrirGestionBolso = () => {
    setModal("bolso");
  };

  const agregarInsumoAlBolso = async () => {
    const nombre = prompt("Nombre del insumo:");
    if (!nombre) return;

    const stock = prompt("Stock inicial:");
    if (!stock) return;

    const minimo = prompt("Stock mínimo:");
    if (!minimo) return;

    const datos = {
      kinesiologo_id: usuario.id,
      nombre: nombre,
      stock: parseFloat(stock),
      minimo: parseFloat(minimo),
      unidad: "unid.",
      categoria: "General"
    };

    const res = await sb("insumos_kinesiologia", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setInsumos(prev => [...prev, res[0]]);
      alert("Insumo agregado al bolso");
    }
  };

  const ajustarStockInsumo = async (insumo) => {
    const nuevoStock = prompt(`Stock actual: ${insumo.stock} ${insumo.unidad}\nNuevo stock:`, insumo.stock);
    if (nuevoStock === null) return;

    const res = await sb(`insumos_kinesiologia?id=eq.${insumo.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: parseFloat(nuevoStock) })
    }, usuario?.token);

    if (res) {
      setInsumos(prev => prev.map(i => i.id === insumo.id ? { ...i, stock: parseFloat(nuevoStock) } : i));
      alert("Stock actualizado");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  const hoy = new Date().toISOString().split('T')[0];
  const atencionesHoy = atenciones.filter(a => {
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  const insumosAlerta = insumos.filter(i => i.stock <= i.minimo);

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Atenciones de Kinesiología</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {atencionesHoy.length} atenciones hoy · {insumos.length} insumos en mi bolso
              {insumosAlerta.length > 0 && <span style={{ color: C.red, marginLeft: 8 }}>⚠️ {insumosAlerta.length} con stock bajo</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={abrirGestionBolso}>
              🎒 Mi Bolso
            </button>
            <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaAtencion}>
              + Nueva Atención
            </button>
          </div>
        </div>
      </div>

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
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {atencion.paciente_nombre}
                {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · {atencion.evento}
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Motivo:</strong> {atencion.motivo_consulta}
              </div>
              {atencion.insumos_usados?.length > 0 && (
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                  🎒 {atencion.insumos_usados.length} insumo(s) utilizados
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {atenciones.filter(a => {
        const fecha = new Date(a.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Atenciones Anteriores por Evento</div>
          {(() => {
            // Agrupar atenciones por evento
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
                      {atencionesEvento.length} atención{atencionesEvento.length !== 1 ? 'es' : ''} realizadas
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
                            {atencion.motivo_consulta?.substring(0, 30)}{atencion.motivo_consulta?.length > 30 ? '...' : ''}
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
                          {atencion.kinesiologo_nombre?.split('@')[0] || 'N/A'}
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

      {modal === "nueva" && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Nueva Atención Kinesiológica</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 16 }}>
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
                  onChange={e => setForm(f => ({ ...f, evento: e.target.value }))}
                >
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Motivo de Consulta *</label>
              <textarea
                style={{ ...S.input, minHeight: 60 }}
                value={form.motivo_consulta || ""}
                onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))}
                placeholder="Descripción del motivo..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Evaluación Inicial</label>
              <textarea
                style={{ ...S.input, minHeight: 60 }}
                value={form.evaluacion_inicial || ""}
                onChange={e => setForm(f => ({ ...f, evaluacion_inicial: e.target.value }))}
                placeholder="Hallazgos de la evaluación..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Tratamiento Realizado</label>
              <textarea
                style={{ ...S.input, minHeight: 60 }}
                value={form.tratamiento_realizado || ""}
                onChange={e => setForm(f => ({ ...f, tratamiento_realizado: e.target.value }))}
                placeholder="Descripción del tratamiento..."
              />
            </div>

            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Insumos Utilizados (de mi bolso)</div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                  + Agregar Insumo
                </button>
              </div>
              {(form.insumos_usados || []).map((ins, index) => (
                <div key={index} style={{
                  padding: 12,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  marginBottom: 8,
                  display: "flex",
                  gap: 12,
                  alignItems: "center"
                }}>
                  <select
                    style={{ ...S.select, flex: 2 }}
                    value={ins.nombre}
                    onChange={e => actualizarInsumo(index, "nombre", e.target.value)}
                  >
                    <option value="">Selecciona insumo...</option>
                    {insumos.map(i => (
                      <option key={i.id} value={i.nombre}>
                        {i.nombre} (Stock: {i.stock} {i.unidad})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    style={{ ...S.input, width: 80 }}
                    placeholder="Cant."
                    value={ins.cantidad}
                    onChange={e => actualizarInsumo(index, "cantidad", parseFloat(e.target.value) || 1)}
                  />
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
                placeholder="Observaciones..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Recomendaciones</label>
              <textarea
                style={{ ...S.input, minHeight: 60 }}
                value={form.recomendaciones || ""}
                onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))}
                placeholder="Recomendaciones para el paciente..."
              />
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
                        Kinesiólogo/a: {at.kinesiologo_nombre?.split('@')[0]}
                      </div>
                      {at.motivo_consulta && (
                        <div style={{ fontSize: 11 }}>
                          <strong>Motivo:</strong> {at.motivo_consulta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardarAtencion}>Guardar Atención</button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Detalle de Atención</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
              {form.paciente_rut && <div style={{ fontSize: 13, color: C.textMuted }}>RUT: {form.paciente_rut}</div>}
              {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Motivo de Consulta:</div>
              <div style={{ fontSize: 14 }}>{form.motivo_consulta}</div>
            </div>

            {form.evaluacion_inicial && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Evaluación Inicial:</div>
                <div style={{ fontSize: 14 }}>{form.evaluacion_inicial}</div>
              </div>
            )}

            {form.tratamiento_realizado && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Tratamiento Realizado:</div>
                <div style={{ fontSize: 14 }}>{form.tratamiento_realizado}</div>
              </div>
            )}

            {form.insumos_usados && form.insumos_usados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                {form.insumos_usados.map((ins, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                    • {ins.nombre} - {ins.cantidad} {ins.unidad || "unid."}
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

            {form.recomendaciones && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Recomendaciones:</div>
                <div style={{ fontSize: 14 }}>{form.recomendaciones}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {modal === "bolso" && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>🎒 Mi Bolso de Insumos</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <button style={{ ...S.btn("primary"), marginBottom: 16, width: "100%" }} onClick={agregarInsumoAlBolso}>
              + Agregar Insumo al Bolso
            </button>

            {insumos.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
                No tienes insumos en tu bolso. Agrega algunos para comenzar.
              </div>
            ) : (
              insumos.map(insumo => (
                <div key={insumo.id} style={{
                  padding: 14,
                  border: `1px solid ${insumo.stock <= insumo.minimo ? C.red : C.border}`,
                  borderRadius: 8,
                  marginBottom: 12,
                  background: insumo.stock <= insumo.minimo ? C.redDim : C.surface
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{insumo.nombre}</div>
                      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                        Stock: {insumo.stock} {insumo.unidad} · Mínimo: {insumo.minimo} {insumo.unidad}
                      </div>
                      {insumo.stock <= insumo.minimo && (
                        <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>
                          ⚠️ Stock bajo
                        </div>
                      )}
                    </div>
                    <button
                      style={{ ...S.btn("ghost"), fontSize: 12 }}
                      onClick={() => ajustarStockInsumo(insumo)}
                    >
                      Ajustar Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
