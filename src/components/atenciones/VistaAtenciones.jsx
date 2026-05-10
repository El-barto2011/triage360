import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { TIPOS_ATENCION } from "../../config/constants";
import { PROFESIONES } from "../../config/permisos";
import { useEvento } from "../common/SelectorEvento";
import { toast } from "../ui/use-toast";

export function VistaAtenciones({ carros, usuario, permisos, industria }) {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filtroEvento, setFiltroEvento] = useState("Todos");
  const [filtroProfesion, setFiltroProfesion] = useState("Todas");
  const [fichaVer, setFichaVer] = useState(null);
  const { eventoActual, eventos: eventosGlobal } = useEvento();

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

  // Sincronizar filtro con evento global
  useEffect(() => {
    if (eventoActual) {
      const ev = eventosGlobal.find(e => e.id === eventoActual);
      if (ev) setFiltroEvento(ev.nombre_evento);
    } else {
      setFiltroEvento("Todos");
    }
  }, [eventoActual, eventosGlobal]);

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
    if (!form.paciente) {
      toast({ title: "Error de validación", description: "Falta el nombre del paciente", variant: "destructive" });
      return;
    }
    if (!form.profesional) {
      toast({ title: "Error de validación", description: "Falta el nombre del profesional", variant: "destructive" });
      return;
    }
    const datos = { ...form, edad: +form.edad, usuario_email: usuario?.email };
    delete datos.id;
    try {
      if (modal === "nueva") {
        const res = await sb("atenciones", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
        if (res) {
          setAtenciones(prev => [res[0], ...prev]);
          toast({ title: "Atención registrada", description: `Paciente: ${form.paciente}` });
        } else {
          throw new Error("Sin respuesta");
        }
      } else {
        const res = await sb(`atenciones?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
        if (res) {
          setAtenciones(prev => prev.map(a => a.id === form.id ? res[0] : a));
          toast({ title: "Atención actualizada" });
        } else {
          throw new Error("Sin respuesta");
        }
      }
      setModal(null);
    } catch {
      toast({ title: "Error al guardar", description: "No se pudo registrar la atención", variant: "destructive" });
    }
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
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ ...S.table, minWidth: 640 }}>
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
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button
                      style={{ ...S.btn("ghost"), padding: "10px 14px", fontSize: 12, minHeight: 44 }}
                      onClick={() => setFichaVer(a)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva/editar atención */}
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nueva" ? "Nueva Atención" : "Editar Atención"}</div>
              <button aria-label="Cerrar modal" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
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
      {fichaVer && (() => {
        const f = fichaVer;
        const esMedica  = f.tipo_atencion === 'Médica';
        const esKine    = f.tipo_atencion === 'Kinesiología';
        const esMaso    = f.tipo_atencion === 'Masoterapia';
        const fechaStr  = new Date(f.created_at).toLocaleDateString("es-CL");
        const horaStr   = new Date(f.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

        /* ── nombre profesional correcto según tipo ─── */
        const profNombre = esMedica
          ? (f.medico_nombre || f.enfermero_nombre || f.paramedico_nombre || "—").split("@")[0]
          : esKine
            ? (f.kinesiologo_nombre || "—").split("@")[0]
            : (f.masoterapeuta_nombre || "—").split("@")[0];

        /* ── campos clínicos según tipo ─────────────── */
        const diag      = esMedica ? (f.diagnostico || "—")
                        : esKine   ? (f.evaluacion_inicial || "—")
                        : (f.zonas_trabajadas?.join(", ") || "—");
        const trat      = esMedica ? (f.tratamiento || "—")
                        : esKine   ? (f.tratamiento_realizado || "—")
                        : `Masoterapia ${f.duracion_minutos ? f.duracion_minutos + " min" : ""}`;
        // médica usa insumos_medico; kine/maso usan insumos_usados
        const insumosRaw = f.insumos_medico || f.insumos_usados;
        const insumos   = Array.isArray(insumosRaw)
          ? insumosRaw.map(i => typeof i === "object" ? `${i.nombre} (${i.cantidad})` : i).join(", ") || "—"
          : (typeof insumosRaw === "string" ? insumosRaw : "—");

        /* ── badge triaje ────────────────────────────── */
        const triajeColor = { ROJO: "#ef4444", AMARILLO: "#f59e0b", NEGRO: "#374151", VERDE: "#10b981" };
        const triajeEmoji = { ROJO: "🔴", AMARILLO: "🟡", NEGRO: "⚫", VERDE: "🟢" };

        /* ── Row helper ──────────────────────────────── */
        const Row = ({ label, value }) => (
          <div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
            <div style={{ fontWeight: 600, marginTop: 2, fontSize: 13 }}>{value || "—"}</div>
          </div>
        );
        const Block = ({ title, children }) => (
          <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{title}</div>
            {children}
          </div>
        );

        return (
          <div style={S.modal} onClick={() => setFichaVer(null)}>
            <div style={{ ...S.modalBox, width: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Ficha de Atención</div>
                <button aria-label="Cerrar ficha" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFichaVer(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span>{f.evento || "Sin evento"}</span>
                <span>·</span>
                <span>{fechaStr} {horaStr}</span>
                <span>·</span>
                <span style={{ color: coloresProfesion[f.profesion_real] || C.accent, fontWeight: 600 }}>{f.tipo_atencion}</span>
                {f.codigo_triaje && (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: triajeColor[f.codigo_triaje] || "#10b981", color: "#fff" }}>
                    {triajeEmoji[f.codigo_triaje]} {f.codigo_triaje}
                  </span>
                )}
              </div>

              {/* Paciente */}
              <Block title="Paciente">
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                  <Row label="Nombre" value={f.paciente_nombre || f.paciente} />
                  <Row label="RUT / Pasaporte" value={f.paciente_rut || f.rut || f.paciente_pasaporte} />
                  <Row label="Edad" value={f.paciente_edad ? `${f.paciente_edad} años` : null} />
                </div>
                {f.categoria_paciente && (
                  <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted }}>
                    Categoría: <strong style={{ color: C.text }}>{f.categoria_paciente}</strong>
                  </div>
                )}
              </Block>

              {/* Profesional */}
              <Block title="Profesional">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Row label="Nombre" value={profNombre} />
                  <Row label="Profesión" value={f.profesion_real} />
                  <Row label="Tipo de atención" value={f.tipo_atencion} />
                </div>
              </Block>

              {/* Signos vitales — solo atenciones médicas */}
              {esMedica && (f.presion_sistolica || f.frecuencia_cardiaca || f.temperatura || f.saturacion_oxigeno) && (
                <Block title="Signos Vitales">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {f.presion_sistolica && <Row label="Presión arterial" value={`${f.presion_sistolica}/${f.presion_diastolica} mmHg`} />}
                    {f.frecuencia_cardiaca && <Row label="Frec. cardíaca" value={`${f.frecuencia_cardiaca} lpm`} />}
                    {f.temperatura && <Row label="Temperatura" value={`${f.temperatura} °C`} />}
                    {f.saturacion_oxigeno && <Row label="SpO₂" value={`${f.saturacion_oxigeno}%`} />}
                    {f.frecuencia_respiratoria && <Row label="Frec. respiratoria" value={`${f.frecuencia_respiratoria} rpm`} />}
                  </div>
                </Block>
              )}

              {/* Datos clínicos */}
              <Block title="Datos de la Atención">
                {/* 1. Motivo de consulta */}
                {(esMedica || esKine) && (
                  <div style={{ marginBottom: 10 }}>
                    <Row label="Motivo de consulta" value={f.motivo_consulta} />
                  </div>
                )}
                {/* Campos específicos de masoterapia */}
                {esMaso && (
                  <>
                    {f.motivo_atencion && <div style={{ marginBottom: 10 }}><Row label="Motivo de atención" value={f.motivo_atencion} /></div>}
                    {f.tipo_molestia && <div style={{ marginBottom: 10 }}><Row label="Tipo de molestia" value={f.tipo_molestia} /></div>}
                    {f.zona_afectada && <div style={{ marginBottom: 10 }}><Row label="Zona afectada" value={f.zona_afectada} /></div>}
                    {f.tipo_masaje && <div style={{ marginBottom: 10 }}><Row label="Tipo de masaje" value={f.tipo_masaje} /></div>}
                  </>
                )}
                {/* 2. Diagnóstico / Evaluación / Zonas */}
                <div style={{ marginBottom: 10 }}>
                  <Row label={esMedica ? "Diagnóstico" : esKine ? "Evaluación inicial" : "Zonas trabajadas"} value={diag} />
                </div>
                {/* 3. Tratamiento */}
                <div style={{ marginBottom: 10 }}>
                  <Row label={esMedica ? "Tratamiento" : esKine ? "Tratamiento realizado" : "Tipo de atención"} value={trat} />
                </div>
                {/* 4. Medicamentos prescritos — solo médica */}
                {esMedica && (() => {
                  const meds = f.medicamentos_prescritos;
                  const medsTexto = f.medicamentos_recetados;
                  if (Array.isArray(meds) && meds.length > 0) {
                    return (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Medicamentos prescritos</div>
                        {meds.map((m, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: C.surface, borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                            <span style={{ fontWeight: 600 }}>{m.nombre}{m.dosis ? ` — ${m.dosis}` : ""}</span>
                            <span style={{ color: C.textMuted }}>{m.via ? `${m.via} ·` : ""} cant. {m.cantidad}{m.urgente ? <span style={{ color: C.red, marginLeft: 6 }}>🚨</span> : null}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <Row label="Medicamentos prescritos" value={typeof medsTexto === "string" && medsTexto ? medsTexto : null} />
                    </div>
                  );
                })()}
                {/* 5. Insumos utilizados */}
                <div style={{ marginBottom: 10 }}>
                  <Row label="Insumos utilizados" value={insumosRaw && insumos !== "—" ? insumos : null} />
                </div>
                {/* 6. Observaciones */}
                <div style={{ marginBottom: 10 }}>
                  <Row label="Observaciones" value={f.observaciones} />
                </div>
                {f.recomendaciones && (
                  <Row label="Recomendaciones" value={f.recomendaciones} />
                )}
              </Block>

              {/* Masoterapia: dolor */}
              {esMaso && (f.dolor_inicial != null || f.dolor_posterior != null) && (
                <Block title="Escala de Dolor">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, textAlign: "center" }}>
                    <div style={{ padding: 14, background: C.surface, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor inicial</div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{f.dolor_inicial ?? "—"}<span style={{ fontSize: 14 }}>/10</span></div>
                    </div>
                    <div style={{ padding: 14, background: C.surface, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor final</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: f.dolor_posterior < f.dolor_inicial ? C.green : C.text }}>{f.dolor_posterior ?? "—"}<span style={{ fontSize: 14 }}>/10</span></div>
                    </div>
                  </div>
                </Block>
              )}

              {/* Estado administración — solo médica */}
              {esMedica && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>Administración:</span>
                  {f.requiere_administracion
                    ? f.administracion_completada
                      ? <span style={S.badge(C.green, C.greenDim)}>✅ Administrado</span>
                      : <span style={S.badge(C.orange, C.orangeDim)}>⏳ Pendiente</span>
                    : <span style={{ fontSize: 12, color: C.textMuted }}>No requiere</span>
                  }
                </div>
              )}

            </div>
          </div>
        );
      })()}
    </div>
  );
}
