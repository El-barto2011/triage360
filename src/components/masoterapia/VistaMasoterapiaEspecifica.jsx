import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaMasoterapiaEspecifica({ usuario }) {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [eventos, setEventos] = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);

  const zonasDisponibles = [
    "Cuello", "Hombros", "Espalda alta", "Espalda baja", "Brazos",
    "Antebrazos", "Manos", "Glúteos", "Isquiotibiales", "Gemelos",
    "Cuádriceps", "Aductores", "Pies", "Zona lumbar"
  ];

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const esAdmin = usuario?.rol === "admin";

    const [fs, evs] = await Promise.all([
      // Admin ve todas las fichas, masoterapeutas solo las suyas
      sb(
        esAdmin
          ? `fichas_masoterapia?order=created_at.desc&limit=100`
          : `fichas_masoterapia?masoterapeuta_id=eq.${usuario.id}&order=created_at.desc&limit=50`,
        {},
        usuario?.token
      ),
      sb("equipos_evento?estado=eq.activo&tipo_masoterapia=eq.Específico&order=created_at.desc", {}, usuario?.token)
    ]);
    if (fs) setFichas(fs);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const abrirNuevaFicha = () => {
    const ahora = new Date();
    setForm({
      fecha_atencion: ahora.toISOString().split('T')[0],
      hora_atencion: ahora.toTimeString().slice(0,5),
      paciente_nombre: "",
      paciente_rut: "",
      paciente_pasaporte: "",
      tipo_identificacion: "rut",
      paciente_edad: "",
      categoria_paciente: "Jugador",
      evento: eventos.length > 0 ? eventos[0].nombre_evento : "",
      evento_id: eventos.length > 0 ? eventos[0].id : null,
      zonas_trabajadas: [],
      dolor_inicial: 5,
      dolor_posterior: 5,
      duracion_minutos: 30,
      observaciones: ""
    });
    setHistorialPaciente([]);
    setModal("nueva");
  };

  const buscarPacientePorRut = async (rut) => {
    if (!rut || rut.length < 8) {
      setHistorialPaciente([]);
      return;
    }

    const campo = form.tipo_identificacion === "pasaporte" ? "paciente_pasaporte" : "paciente_rut";

    const fichasPaciente = await sb(
      `fichas_masoterapia?${campo}=eq.${rut}&order=created_at.desc&limit=10`,
      {},
      usuario?.token
    );

    if (fichasPaciente && fichasPaciente.length > 0) {
      const ultima = fichasPaciente[0];
      setForm(f => ({
        ...f,
        paciente_nombre: ultima.paciente_nombre,
        paciente_edad: ultima.paciente_edad
      }));
      setHistorialPaciente(fichasPaciente);
    } else {
      setHistorialPaciente([]);
    }
  };

  const toggleZona = (zona) => {
    const zonas = form.zonas_trabajadas || [];
    if (zonas.includes(zona)) {
      setForm(f => ({ ...f, zonas_trabajadas: zonas.filter(z => z !== zona) }));
    } else {
      setForm(f => ({ ...f, zonas_trabajadas: [...zonas, zona] }));
    }
  };

  const guardarFicha = async () => {
    if (!form.paciente_nombre || !form.evento) {
      alert("Por favor completa al menos el nombre del paciente y el evento");
      return;
    }

    if (!form.zonas_trabajadas || form.zonas_trabajadas.length === 0) {
      alert("Selecciona al menos una zona trabajada");
      return;
    }

    // Crear timestamp personalizado
    const fechaHora = `${form.fecha_atencion}T${form.hora_atencion || '00:00'}:00`;
    const timestampPersonalizado = new Date(fechaHora).toISOString();

    const datos = {
      evento: form.evento,
      evento_id: form.evento_id || null,
      masoterapeuta_id: usuario.id,
      masoterapeuta_nombre: usuario.email,
      paciente_nombre: form.paciente_nombre,
      paciente_rut: form.tipo_identificacion === "rut" ? (form.paciente_rut || null) : null,
      paciente_pasaporte: form.tipo_identificacion === "pasaporte" ? (form.paciente_pasaporte || null) : null,
      tipo_identificacion: form.tipo_identificacion || "rut",
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente || "Jugador",
      fecha_atencion: form.fecha_atencion,
      duracion_minutos: parseInt(form.duracion_minutos) || 30,
      zonas_trabajadas: form.zonas_trabajadas,
      dolor_inicial: parseInt(form.dolor_inicial) || 5,
      dolor_posterior: parseInt(form.dolor_posterior) || 5,
      observaciones: form.observaciones || null,
      created_at: timestampPersonalizado
    };

    const res = await sb("fichas_masoterapia", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setFichas(prev => [res[0], ...prev]);
      setModal(null);
      alert("Ficha registrada exitosamente");
    }
  };

  const verDetalleFicha = (ficha) => {
    setForm(ficha);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando fichas...</div>;

  if (eventos.length === 0) {
    return (
      <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No hay eventos específicos activos</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Los eventos deben estar configurados con tipo de masoterapia "Específico"
        </div>
      </div>
    );
  }

  const hoy = new Date().toISOString().split('T')[0];
  const fichasHoy = fichas.filter(f => {
    const fecha = new Date(f.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Masoterapia Específica</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {fichasHoy.length} fichas hoy · {fichas.length} fichas totales
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaFicha}>
            + Nueva Ficha
          </button>
        </div>
      </div>

      {fichasHoy.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Fichas de Hoy</div>
          {fichasHoy.map(ficha => (
            <div key={ficha.id} style={{
              padding: 16,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => verDetalleFicha(ficha)}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {ficha.paciente_nombre}
                {ficha.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({ficha.paciente_edad} años)</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                {new Date(ficha.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ·
                {ficha.evento} · {ficha.duracion_minutos} min
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Zonas:</strong> {ficha.zonas_trabajadas?.join(", ") || "N/A"}
              </div>
              <div style={{ fontSize: 13 }}>
                <strong>Dolor:</strong> {ficha.dolor_inicial}/10 → {ficha.dolor_posterior}/10
                {ficha.dolor_posterior < ficha.dolor_inicial && (
                  <span style={{ marginLeft: 8, color: C.green }}>✓ Mejoró</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {fichas.filter(f => {
        const fecha = new Date(f.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Fichas Anteriores por Evento</div>
          {(() => {
            // Agrupar fichas por evento
            const fichasAnteriores = fichas.filter(f => {
              const fecha = new Date(f.created_at).toISOString().split('T')[0];
              return fecha !== hoy;
            });

            const porEvento = fichasAnteriores.reduce((acc, ficha) => {
              const evento = ficha.evento || "Sin evento";
              if (!acc[evento]) {
                acc[evento] = [];
              }
              acc[evento].push(ficha);
              return acc;
            }, {});

            return Object.entries(porEvento).map(([evento, fichasEvento]) => (
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
                      {fichasEvento.length} ficha{fichasEvento.length !== 1 ? 's' : ''} realizadas
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
                    {fichasEvento.length}
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gap: 8,
                  maxHeight: 200,
                  overflowY: "auto"
                }}>
                  {fichasEvento.slice(0, 5).map(ficha => (
                    <div key={ficha.id} style={{
                      padding: 10,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12
                    }} onClick={() => verDetalleFicha(ficha)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{ficha.paciente_nombre}</div>
                          <div style={{ color: C.textMuted, fontSize: 11 }}>
                            {new Date(ficha.created_at).toLocaleDateString('es-CL')} ·
                            {ficha.duracion_minutos} min ·
                            Dolor: {ficha.dolor_inicial}→{ficha.dolor_posterior}
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
                          {ficha.masoterapeuta_nombre?.split('@')[0] || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {fichasEvento.length > 5 && (
                    <div style={{
                      fontSize: 11,
                      color: C.textMuted,
                      textAlign: "center",
                      padding: 8
                    }}>
                      +{fichasEvento.length - 5} fichas más
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
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Nueva Ficha de Masoterapia</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            {/* Toggle RUT/Pasaporte */}
            <div style={S.formRow}>
              <label style={S.formLabel}>Tipo de Identificación</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["rut", "pasaporte"].map(tipo => (
                  <button
                    key={tipo}
                    style={{
                      ...S.btn(form.tipo_identificacion === tipo ? "primary" : "ghost"),
                      flex: 1
                    }}
                    onClick={() => setForm(f => ({ ...f, tipo_identificacion: tipo, paciente_rut: "", paciente_pasaporte: "" }))}
                  >
                    {tipo === "rut" ? "RUT" : "Pasaporte"}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo RUT o Pasaporte */}
            <div style={S.formRow}>
              <label style={S.formLabel}>{form.tipo_identificacion === "rut" ? "RUT" : "Pasaporte"}</label>
              {form.tipo_identificacion === "rut" ? (
                <input
                  style={S.input}
                  value={form.paciente_rut || ""}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({ ...f, paciente_rut: v }));
                    if (v.length >= 8) buscarPacientePorRut(v);
                  }}
                  placeholder="12345678-9"
                />
              ) : (
                <input
                  style={S.input}
                  value={form.paciente_pasaporte || ""}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({ ...f, paciente_pasaporte: v }));
                    if (v.length >= 8) buscarPacientePorRut(v);
                  }}
                  placeholder="AB123456"
                />
              )}
            </div>

            {/* Historial de paciente */}
            {historialPaciente.length > 0 && (
              <div style={{
                background: C.surface2,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                border: `1px solid ${C.border}`
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: C.blue }}>
                  ✓ {historialPaciente.length} atención{historialPaciente.length !== 1 ? 'es' : ''} previa{historialPaciente.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, maxHeight: 150, overflowY: "auto" }}>
                  {historialPaciente.slice(0, 5).map((h, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ fontWeight: 600 }}>{new Date(h.created_at).toLocaleDateString('es-CL')} - {h.evento}</div>
                      <div>Zonas: {h.zonas_trabajadas?.join(", ") || "N/A"} · Dolor: {h.dolor_inicial}→{h.dolor_posterior}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>Por: {h.masoterapeuta_nombre?.split('@')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del Paciente *</label>
                <input
                  style={S.input}
                  value={form.paciente_nombre || ""}
                  onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))}
                  placeholder="Nombre del deportista"
                />
              </div>
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
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
              <div style={S.formRow}>
                <label style={S.formLabel}>Duración (min)</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.duracion_minutos || 30}
                  onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ ...S.formLabel, marginBottom: 12, display: "block" }}>Zonas Trabajadas *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {zonasDisponibles.map(zona => (
                  <label key={zona} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    background: (form.zonas_trabajadas || []).includes(zona) ? C.blueDim : "transparent",
                    fontSize: 13
                  }}>
                    <input
                      type="checkbox"
                      checked={(form.zonas_trabajadas || []).includes(zona)}
                      onChange={() => toggleZona(zona)}
                    />
                    <span>{zona}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Dolor Inicial (1-10)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    type="range"
                    min="1"
                    max="10"
                    value={form.dolor_inicial || 5}
                    onChange={e => setForm(f => ({ ...f, dolor_inicial: e.target.value }))}
                  />
                  <span style={{ fontSize: 20, fontWeight: 700, width: 40, textAlign: "center" }}>
                    {form.dolor_inicial || 5}
                  </span>
                </div>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Dolor Final (1-10)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    type="range"
                    min="1"
                    max="10"
                    value={form.dolor_posterior || 5}
                    onChange={e => setForm(f => ({ ...f, dolor_posterior: e.target.value }))}
                  />
                  <span style={{ fontSize: 20, fontWeight: 700, width: 40, textAlign: "center" }}>
                    {form.dolor_posterior || 5}
                  </span>
                </div>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea
                style={{ ...S.input, minHeight: 80 }}
                value={form.observaciones || ""}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Observaciones sobre la sesión, reacciones del paciente, etc."
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardarFicha}>Guardar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Detalle de Ficha</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
              {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Duración: {form.duracion_minutos} minutos
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Zonas Trabajadas:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(form.zonas_trabajadas || []).map(zona => (
                  <span key={zona} style={{
                    ...S.badge(C.blue, C.blueDim),
                    fontSize: 12
                  }}>
                    {zona}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Dolor:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor Inicial</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{form.dolor_inicial}/10</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor Final</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{form.dolor_posterior}/10</div>
                </div>
              </div>
              {form.dolor_posterior < form.dolor_inicial && (
                <div style={{ marginTop: 12, padding: 12, background: C.greenDim, borderRadius: 6, textAlign: "center" }}>
                  <span style={{ color: C.green, fontWeight: 600 }}>
                    ✓ Mejoría de {form.dolor_inicial - form.dolor_posterior} puntos
                  </span>
                </div>
              )}
            </div>

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
