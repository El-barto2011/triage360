import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaAdministracionMedicamentos({ usuario }) {
  const [pendientes, setPendientes] = useState([]);
  const [misCasos, setMisCasos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);

    // Cargar atenciones pendientes
    const pend = await sb(
      "atenciones_medicas?requiere_administracion=eq.true&administracion_completada=eq.false&order=created_at.asc",
      {},
      usuario?.token
    );

    // Cargar administraciones completadas
    const hist = await sb(
      "administracion_medicamentos?order=created_at.desc&limit=50",
      {},
      usuario?.token
    );

    if (pend) setPendientes(pend);
    if (hist) {
      // Filtrar mis casos (que yo administré)
      const mios = hist.filter(h => h.administrador_id === usuario.id);
      setMisCasos(mios);
      setHistorial(hist);
    }

    setLoading(false);
  };

  const tomarCaso = (atencion) => {
    setForm({
      atencion_id: atencion.id,
      atencion: atencion,
      medicamentos_administrados: atencion.medicamentos_prescritos?.map(m => ({
        ...m,
        administrado: false,
        hora_admin: "",
        observaciones: ""
      })) || [],
      insumos_administracion: [],
      observaciones_generales: ""
    });
    setModal("administrar");
  };

  const toggleMedicamentoAdministrado = (index) => {
    const meds = [...form.medicamentos_administrados];
    meds[index].administrado = !meds[index].administrado;
    if (meds[index].administrado && !meds[index].hora_admin) {
      meds[index].hora_admin = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }
    setForm(f => ({ ...f, medicamentos_administrados: meds }));
  };

  const actualizarMedicamento = (index, campo, valor) => {
    const meds = [...form.medicamentos_administrados];
    meds[index][campo] = valor;
    setForm(f => ({ ...f, medicamentos_administrados: meds }));
  };

  const agregarInsumo = () => {
    const ins = form.insumos_administracion || [];
    setForm(f => ({
      ...f,
      insumos_administracion: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...form.insumos_administracion];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_administracion: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...form.insumos_administracion];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_administracion: ins }));
  };

  const completarAdministracion = async () => {
    const administrados = form.medicamentos_administrados.filter(m => m.administrado);

    if (administrados.length === 0) {
      alert("Debes marcar al menos un medicamento como administrado");
      return;
    }

    // 1. Registrar la administración
    const datosAdmin = {
      atencion_id: form.atencion_id,
      administrador_id: usuario.id,
      administrador_nombre: usuario.email,
      administrador_tipo: usuario.profesion || "Enfermero/a",
      medicamentos_administrados: form.medicamentos_administrados,
      insumos_administracion: form.insumos_administracion || [],
      observaciones: form.observaciones_generales || null
    };

    const resAdmin = await sb(
      "administracion_medicamentos",
      { method: "POST", body: JSON.stringify(datosAdmin) },
      usuario?.token
    );

    // 2. Marcar la atención como completada
    if (resAdmin) {
      const resAtencion = await sb(
        `atenciones_medicas?id=eq.${form.atencion_id}`,
        { method: "PATCH", body: JSON.stringify({ administracion_completada: true }) },
        usuario?.token
      );

      if (resAtencion) {
        alert("Administración registrada exitosamente");
        setModal(null);
        cargarDatos(); // Recargar datos
      }
    }
  };

  const verDetalleAdministracion = (admin) => {
    setForm(admin);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando pendientes...</div>;

  const urgentes = pendientes.filter(p =>
    p.medicamentos_prescritos?.some(m => m.urgente)
  );

  const hoy = new Date().toISOString().split('T')[0];
  const administracionesHoy = misCasos.filter(a => {
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Administración de Medicamentos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {pendientes.length} casos pendientes · {urgentes.length} urgentes · {administracionesHoy.length} administrados hoy por mí
            </div>
          </div>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20, border: `2px solid ${C.red}` }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🚨</span>
            <span>CASOS URGENTES ({urgentes.length})</span>
          </div>
          {urgentes.map(atencion => (
            <div key={atencion.id} style={{
              padding: 14,
              background: C.redDim,
              borderRadius: 8,
              marginBottom: 12,
              cursor: "pointer"
            }} onClick={() => tomarCaso(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    Prescrito: {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ·
                    Médico: {atencion.medico_nombre}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <strong>Diagnóstico:</strong> {atencion.diagnostico || "No especificado"}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    💊 {atencion.medicamentos_prescritos?.length || 0} medicamento(s)
                    {atencion.medicamentos_prescritos?.filter(m => m.urgente).map(m => (
                      <div key={m.nombre} style={{ fontSize: 12, color: C.red, marginTop: 4 }}>
                        🚨 {m.nombre} - {m.dosis} ({m.via})
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  style={{ ...S.btn("primary"), fontSize: 12, background: C.red }}
                  onClick={(e) => { e.stopPropagation(); tomarCaso(atencion); }}
                >
                  Tomar Caso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendientes.filter(p => !urgentes.includes(p)).length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>
            Pendientes de Administración ({pendientes.filter(p => !urgentes.includes(p)).length})
          </div>
          {pendientes.filter(p => !urgentes.includes(p)).map(atencion => (
            <div key={atencion.id} style={{
              padding: 14,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => tomarCaso(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    Prescrito: {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ·
                    Médico: {atencion.medico_nombre} · Evento: {atencion.evento}
                  </div>
                  {atencion.diagnostico && (
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>Dx:</strong> {atencion.diagnostico}
                    </div>
                  )}
                  <div style={{ fontSize: 13 }}>
                    💊 {atencion.medicamentos_prescritos?.length || 0} medicamento(s) prescritos
                  </div>
                </div>
                <button
                  style={{ ...S.btn("primary"), fontSize: 12 }}
                  onClick={(e) => { e.stopPropagation(); tomarCaso(atencion); }}
                >
                  Tomar Caso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {administracionesHoy.length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.green, marginBottom: 12 }}>
            Mis Administraciones de Hoy ({administracionesHoy.length})
          </div>
          {administracionesHoy.map(admin => (
            <div key={admin.id} style={{
              padding: 12,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              marginBottom: 8,
              background: C.greenDim,
              cursor: "pointer"
            }} onClick={() => verDetalleAdministracion(admin)}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Caso #{admin.atencion_id}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                {new Date(admin.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ·
                {admin.medicamentos_administrados?.filter(m => m.administrado).length || 0} medicamento(s) administrado(s)
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "administrar" && form.atencion && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                Administrar Medicamentos
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: C.surface2, borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                Paciente: {form.atencion.paciente_nombre}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                {form.atencion.paciente_edad && `${form.atencion.paciente_edad} años · `}
                Evento: {form.atencion.evento}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                Médico: {form.atencion.medico_nombre}
              </div>
              {form.atencion.diagnostico && (
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  <strong>Diagnóstico:</strong> {form.atencion.diagnostico}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Medicamentos Prescritos:</div>
              {form.medicamentos_administrados.map((med, index) => (
                <div key={index} style={{
                  padding: 14,
                  border: `2px solid ${med.urgente ? C.red : med.administrado ? C.green : C.border}`,
                  borderRadius: 8,
                  marginBottom: 12,
                  background: med.administrado ? C.greenDim : med.urgente ? C.redDim : C.surface
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "start", marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={med.administrado}
                      onChange={() => toggleMedicamentoAdministrado(index)}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {med.nombre} - {med.dosis}
                        {med.urgente && <span style={{ marginLeft: 8, color: C.red, fontSize: 13 }}>🚨 URGENTE</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>
                        Vía: {med.via} · Cantidad: {med.cantidad}
                      </div>
                    </div>
                  </div>

                  {med.administrado && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4 }}>
                            Hora de administración
                          </label>
                          <input
                            type="time"
                            style={S.input}
                            value={med.hora_admin || ""}
                            onChange={e => actualizarMedicamento(index, "hora_admin", e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4 }}>
                            Observaciones
                          </label>
                          <input
                            style={S.input}
                            placeholder="Reacción del paciente, efectos, etc."
                            value={med.observaciones || ""}
                            onChange={e => actualizarMedicamento(index, "observaciones", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Insumos Utilizados (Jeringas, Agujas, etc.)</div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                  + Agregar Insumo
                </button>
              </div>
              {(form.insumos_administracion || []).map((ins, index) => (
                <div key={index} style={{
                  padding: 10,
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

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Observaciones Generales
              </label>
              <textarea
                style={{ ...S.input, minHeight: 80 }}
                placeholder="Reacciones del paciente, complicaciones, etc."
                value={form.observaciones_generales || ""}
                onChange={e => setForm(f => ({ ...f, observaciones_generales: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button
                style={S.btn("primary")}
                onClick={completarAdministracion}
                disabled={!form.medicamentos_administrados?.some(m => m.administrado)}
              >
                Completar Administración
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                Detalle de Administración
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                Administrado por: {form.administrador_nombre} ({form.administrador_tipo})
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Fecha: {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Medicamentos Administrados:</div>
              {form.medicamentos_administrados?.filter(m => m.administrado).map((med, i) => (
                <div key={i} style={{
                  padding: 12,
                  background: C.greenDim,
                  borderRadius: 6,
                  marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    ✓ {med.nombre} - {med.dosis}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                    Vía: {med.via} · Cantidad: {med.cantidad} · Hora: {med.hora_admin || "No especificada"}
                  </div>
                  {med.observaciones && (
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <strong>Obs:</strong> {med.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {form.insumos_administracion && form.insumos_administracion.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                {form.insumos_administracion.map((ins, i) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
