import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { TIPOS_ATENCION } from "../../config/constants";
import { PROFESIONES } from "../../config/permisos";

export function VistaAtenciones({ carros, usuario, permisos, industria }) {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filtroEvento, setFiltroEvento] = useState("Todos");
  const [filtroProfesion, setFiltroProfesion] = useState("Todas");
  const [fichaVer, setFichaVer] = useState(null);

  // Cargar TODAS las atenciones (médicas, kines, masoterapia)
  useEffect(() => {
    const cargar = async () => {
      if (!usuario) return;

      try {
        setLoading(true);

        // Traer atenciones médicas
        const medicas = await sb("atenciones_medicas?order=created_at.desc", {}, usuario?.token) || [];

        // Traer atenciones de kinesiología
        const kines = await sb("atenciones_kinesiologia?order=created_at.desc", {}, usuario?.token) || [];

        // Traer fichas de masoterapia
        const maso = await sb("fichas_masoterapia?order=created_at.desc", {}, usuario?.token) || [];

        // Unificar todas en un solo array con el tipo de atención
        const todasMedicas = medicas.map(a => ({ ...a, tipo_atencion: 'Médica', profesion_real: a.medico_nombre ? 'Médico' : a.enfermero_nombre ? 'Enfermero/a' : 'Paramédico' }));
        const todasKines = kines.map(a => ({ ...a, tipo_atencion: 'Kinesiología', profesion_real: 'Kinesiólogo/a' }));
        const todasMaso = maso.map(a => ({ ...a, tipo_atencion: 'Masoterapia', profesion_real: 'Masoterapeuta' }));

        const unificadas = [...todasMedicas, ...todasKines, ...todasMaso].sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );

        setAtenciones(unificadas);
      } catch (error) {
        console.error("Error cargando atenciones:", error);
        setAtenciones([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [usuario]);

  const eventos = ["Todos", ...new Set(atenciones.map(a => a.evento).filter(Boolean))];

  const filtradas = atenciones.filter(a => {
    const matchEv = filtroEvento === "Todos" || a.evento === filtroEvento;
    const matchProf = filtroProfesion === "Todas" || a.profesion_real === filtroProfesion;
    return matchEv && matchProf;
  });

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const abrirNueva = () => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    setForm({
      evento: carros.find(c => c.evento_asignado !== "Sin asignar")?.evento_asignado || "",
      fecha: ahora.toISOString().slice(0, 10),
      paciente: "", rut: "", edad: "",
      profesion: "Médico", profesional: "",
      tipo: "Consulta general",
      hora_ingreso: `${hh}:${mm}`, hora_egreso: "",
      diagnostico: "", tratamiento: "",
      insumos_usados: "", derivacion: "No", observaciones: ""
    });
    setModal("nueva");
  };

  const guardar = async () => {
    if (!form.paciente || !form.profesional) return;
    const datos = { ...form, edad: +form.edad, usuario_email: usuario?.email };
    delete datos.id;
    if (modal === "nueva") {
      const res = await sb("atenciones", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setAtenciones(prev => [res[0], ...prev]);
    } else {
      const res = await sb(`atenciones?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setAtenciones(prev => prev.map(a => a.id === form.id ? res[0] : a));
    }
    setModal(null);
  };

  const eliminar = async (id) => {
    await sb(`atenciones?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
    setAtenciones(prev => prev.filter(a => a.id !== id));
  };

  const coloresProfesion = {
    "Médico": C.red, "Enfermero/a": C.blue, "Paramédico": C.orange,
    "Kinesiólogo/a": C.green, "Masoterapeuta": C.purple
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {PROFESIONES.map(p => {
          const count = atenciones.filter(a => a.profesion_real === p).length;
          const color = coloresProfesion[p];
          return (
            <div key={p} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{p}</div>
            </div>
          );
        })}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{atenciones.length}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>Total atenciones</div>
        </div>
      </div>

      {/* Filtros y botón */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select style={S.select} value={filtroEvento} onChange={e => setFiltroEvento(e.target.value)}>
          {eventos.map(e => <option key={e}>{e}</option>)}
        </select>
        <select style={S.select} value={filtroProfesion} onChange={e => setFiltroProfesion(e.target.value)}>
          {["Todas", ...PROFESIONES].map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ flex: 1 }} />
      </div>

      {/* Tabla */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {[industria?.paciente || "Paciente", "Evento", "Profesional", "Tipo", "Horario", "Diagnóstico", "Derivación", ""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 36 }}>Sin atenciones registradas</td></tr>
            ) : filtradas.map(a => (
              <tr key={a.id}>
                <td style={S.td}>
                  <div style={{ fontWeight: 600 }}>{a.paciente_nombre}</div>
                  {a.paciente_edad && <div style={{ fontSize: 11, color: C.textFaint }}>{a.paciente_edad} años</div>}
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{a.evento}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{new Date(a.created_at).toLocaleDateString("es-CL")}</div>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 12 }}>
                    {a.tipo_atencion === 'Médica'
                      ? (a.medico_nombre || a.enfermero_nombre || a.paramedico_nombre || 'N/A').split('@')[0]
                      : (a.kinesiologo_nombre || a.masoterapeuta_nombre || 'N/A')}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{a.profesion_real}</div>
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {a.codigo_triaje && (
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background:
                          a.codigo_triaje === "ROJO" ? "#ef4444" :
                          a.codigo_triaje === "AMARILLO" ? "#f59e0b" :
                          a.codigo_triaje === "NEGRO" ? "#1f2937" :
                          "#10b981",
                        color: "#fff"
                      }}>
                        {a.codigo_triaje === "VERDE" && "🟢"}
                        {a.codigo_triaje === "AMARILLO" && "🟡"}
                        {a.codigo_triaje === "ROJO" && "🔴"}
                        {a.codigo_triaje === "NEGRO" && "⚫"}
                        {" " + a.codigo_triaje}
                      </span>
                    )}

                  </div>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{new Date(a.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td style={S.td}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>
                    {a.diagnostico ? (a.diagnostico.slice(0, 35) + (a.diagnostico.length > 35 ? "…" : "")) : "---"}
                  </span>
                </td>
                <td style={S.td}>---</td>
                <td style={S.td}>
                  <button style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: 11 }} onClick={() => setFichaVer(a)}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva/editar atención */}
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nueva" ? "Nueva Atención" : "Editar Atención"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>

            {/* Evento */}
            <div style={{ background: C.surface2, borderRadius: 8, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: C.textMuted }}>
              <div style={S.formLabel}>Evento</div>
              <select style={{ ...S.select, width: "100%" }} value={form.evento || ""} onChange={e => F("evento", e.target.value)}>
                {carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => (
                  <option key={c.id}>{c.evento_asignado}</option>
                ))}
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Paciente */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos del Paciente</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre completo</label>
                <input style={S.input} value={form.paciente || ""} onChange={e => F("paciente", e.target.value)} placeholder="Nombre del paciente" />
              </div>
              <div style={S.grid2}>
                <div style={S.formRow}>
                  <label style={S.formLabel}>RUT</label>
                  <input style={S.input} value={form.rut || ""} onChange={e => F("rut", e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div style={S.formRow}>
                  <label style={S.formLabel}>Edad</label>
                  <input style={S.input} type="number" value={form.edad || ""} onChange={e => F("edad", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Profesional */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional que Atiende</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Profesión</label>
                <select style={{ ...S.select, width: "100%" }} value={form.profesion || "Médico"} onChange={e => F("profesion", e.target.value)}>
                  {PROFESIONES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del profesional</label>
                <input style={S.input} value={form.profesional || ""} onChange={e => F("profesional", e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>

            {/* Atención */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos de la Atención</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo</label>
                <select style={{ ...S.select, width: "100%" }} value={form.tipo || ""} onChange={e => F("tipo", e.target.value)}>
                  {(industria?.tipos_atencion || TIPOS_ATENCION).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora ingreso</label>
                <input style={S.input} type="time" value={form.hora_ingreso || ""} onChange={e => F("hora_ingreso", e.target.value)} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora egreso</label>
                <input style={S.input} type="time" value={form.hora_egreso || ""} onChange={e => F("hora_egreso", e.target.value)} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Diagnóstico / Motivo de consulta</label>
              <input style={S.input} value={form.diagnostico || ""} onChange={e => F("diagnostico", e.target.value)} placeholder="Ej: Contusión rodilla derecha" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Tratamiento / Procedimiento realizado</label>
              <input style={S.input} value={form.tratamiento || ""} onChange={e => F("tratamiento", e.target.value)} placeholder="Ej: Inmovilización, frío local" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Insumos utilizados</label>
              <input style={S.input} value={form.insumos_usados || ""} onChange={e => F("insumos_usados", e.target.value)} placeholder="Ej: Venda x1, gasas x4" />
            </div>
            {permisos?.recetarMedicamentos ? (
              <div style={S.formRow}>
                <label style={S.formLabel}>💊 Medicamentos recetados</label>
                <input style={S.input} value={form.medicamentos_recetados || ""} onChange={e => F("medicamentos_recetados", e.target.value)} placeholder="Ej: Ibuprofeno 600mg, Paracetamol 500mg" />
              </div>
            ) : (
              <div style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.yellow, marginBottom: 16 }}>
                ⚠️ Solo el médico puede recetar medicamentos
              </div>
            )}
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Derivación</label>
                <select style={{ ...S.select, width: "100%" }} value={form.derivacion || "No"} onChange={e => F("derivacion", e.target.value)}>
                  {["No", "Hospital", "Clínica", "SAPU", "Ambulancia", "Otro"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Observaciones</label>
                <input style={S.input} value={form.observaciones || ""} onChange={e => F("observaciones", e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar atención</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ficha completa */}
      {fichaVer && (
        <div style={S.modal} onClick={() => setFichaVer(null)}>
          <div style={{ ...S.modalBox, width: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Ficha de Atención</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFichaVer(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>{fichaVer.evento} · {new Date(fichaVer.fecha).toLocaleDateString("es-CL")}</div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Paciente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Nombre", fichaVer.paciente], ["RUT", fichaVer.rut], ["Edad", fichaVer.paciente_edad ? fichaVer.paciente_edad + " años" : "---"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  ["Profesión", fichaVer.profesion_real || "---"],
                  ["Nombre", fichaVer.tipo_atencion === 'Médica'
                    ? (fichaVer.medico_nombre || fichaVer.enfermero_nombre || fichaVer.paramedico_nombre || "---").split('@')[0]
                    : (fichaVer.kinesiologo_nombre || fichaVer.masoterapeuta_nombre || "---")],
                  ["Tipo atención", fichaVer.tipo_atencion || "---"]
                ].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v || "---"}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Atención</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["Hora ingreso", fichaVer.hora_ingreso], ["Hora egreso", fichaVer.hora_egreso || "—"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
              {[
                ["Diagnóstico", fichaVer.diagnostico],
                ["Tratamiento", Array.isArray(fichaVer.tratamiento_realizado) ? fichaVer.tratamiento_realizado.join(', ') : (fichaVer.tratamiento || fichaVer.tratamiento_realizado || "—")],
                ["Insumos usados", Array.isArray(fichaVer.insumos_usados) ? fichaVer.insumos_usados.map(i => typeof i === 'object' ? `${i.nombre} (${i.cantidad})` : i).join(', ') : (fichaVer.insumos_usados || "—")]
              ].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{l}</div>
                  <div style={{ marginTop: 2, fontSize: 14 }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Derivación:</span>
              {fichaVer.derivacion === "No"
                ? <span style={S.badge(C.green, C.greenDim)}>Sin derivación</span>
                : <span style={S.badge(C.red, C.redDim)}>Derivado → {fichaVer.derivacion}</span>}
              {fichaVer.observaciones && <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>· {fichaVer.observaciones}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
