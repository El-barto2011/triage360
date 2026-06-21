import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";

const SB_URL = "https://dnlvzwrujosuckdzmffx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg0MzAsImV4cCI6MjA5MDIzNDQzMH0.Bhw_ws8XNzWxJXBn1TzLjNppBD9CRWDTuEb_t92G9ZE";

async function sbGet(path, token) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function sbPost(path, body, token) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

function formVacio() {
  return {
    paciente_nombre: "", tipo_identificacion: "RUT", paciente_rut: "", paciente_pasaporte: "",
    paciente_edad: "", categoria_paciente: "Adulto", evento_id: "",
    motivo_consulta: "", diagnostico: "", tratamiento: "", observaciones: "",
    presion_sistolica: "", presion_diastolica: "", frecuencia_cardiaca: "",
    temperatura: "", saturacion_oxigeno: "", frecuencia_respiratoria: "",
  };
}

export function VistaAtencionesEnfermeria({ usuario }) {
  const [atenciones, setAtenciones] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(formVacio());

  const esEnfermero = usuario?.profesion === "Enfermero/a";

  async function cargar() {
    setLoading(true);
    const campo = esEnfermero
      ? `enfermero_id=eq.${usuario.id}`
      : `paramedico_id=eq.${usuario.id}`;
    const [ats, evs] = await Promise.all([
      sbGet(`atenciones_medicas?${campo}&deleted_at=is.null&order=created_at.desc&select=id,paciente_nombre,diagnostico,motivo_consulta,created_at,evento`, usuario.token),
      sbGet(`equipos_evento?estado=eq.activo&select=id,nombre_evento&order=fecha_evento.desc`, usuario.token),
    ]);
    setAtenciones(ats || []);
    setEventos(evs || []);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  function setF(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function guardar() {
    if (!form.paciente_nombre.trim() || !form.motivo_consulta.trim()) {
      alert("Nombre del paciente y motivo de consulta son obligatorios");
      return;
    }
    setGuardando(true);
    const eventoSel = eventos.find(e => String(e.id) === String(form.evento_id));
    const payload = {
      paciente_nombre: form.paciente_nombre.trim(),
      tipo_identificacion: form.tipo_identificacion,
      paciente_rut: form.tipo_identificacion === "RUT" ? form.paciente_rut.trim() : null,
      paciente_pasaporte: form.tipo_identificacion === "Pasaporte" ? form.paciente_pasaporte.trim() : null,
      paciente_edad: form.paciente_edad ? Number(form.paciente_edad) : null,
      categoria_paciente: form.categoria_paciente,
      motivo_consulta: form.motivo_consulta.trim(),
      diagnostico: form.diagnostico.trim(),
      tratamiento: form.tratamiento.trim(),
      observaciones: form.observaciones.trim(),
      presion_sistolica: form.presion_sistolica ? Number(form.presion_sistolica) : null,
      presion_diastolica: form.presion_diastolica ? Number(form.presion_diastolica) : null,
      frecuencia_cardiaca: form.frecuencia_cardiaca ? Number(form.frecuencia_cardiaca) : null,
      temperatura: form.temperatura ? Number(form.temperatura) : null,
      saturacion_oxigeno: form.saturacion_oxigeno ? Number(form.saturacion_oxigeno) : null,
      frecuencia_respiratoria: form.frecuencia_respiratoria ? Number(form.frecuencia_respiratoria) : null,
      evento: eventoSel?.nombre_evento || "",
      evento_id: eventoSel?.id || null,
      fecha_atencion: new Date().toISOString().split("T")[0],
      requiere_administracion: false,
      administracion_completada: false,
      medicamentos_prescritos: [],
      medico_id: null,
      medico_nombre: null,
    };
    if (esEnfermero) {
      payload.enfermero_id = usuario.id;
      payload.enfermero_nombre = usuario.nombre || usuario.email;
    } else {
      payload.paramedico_id = usuario.id;
      payload.paramedico_nombre = usuario.nombre || usuario.email;
    }
    const ok = await sbPost("atenciones_medicas", payload, usuario.token);
    setGuardando(false);
    if (ok) { setMostrarForm(false); setForm(formVacio()); cargar(); }
    else alert("Error al guardar la atención");
  }

  function inp(key, placeholder, type = "text") {
    return (
      <input
        type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setF(key, e.target.value)}
        style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
      />
    );
  }

  if (loading) return <div style={{ color: C.textMuted, padding: 32, textAlign: "center" }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button style={S.btn("primary")} onClick={() => { setForm(formVacio()); setMostrarForm(true); }}>
          + Nueva Atención
        </button>
      </div>

      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ ...S.title, marginBottom: 4 }}>Nueva Atención</div>
            <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 20 }}>{usuario?.profesion}</div>

            <label style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>Evento</label>
            <select value={form.evento_id} onChange={e => setF("evento_id", e.target.value)}
              style={{ ...S.input, width: "100%", marginTop: 4, marginBottom: 14, boxSizing: "border-box" }}>
              <option value="">Sin evento</option>
              {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre_evento}</option>)}
            </select>

            <label style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>Paciente</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4, marginBottom: 14 }}>
              {inp("paciente_nombre", "Nombre completo *")}
              <select value={form.tipo_identificacion} onChange={e => setF("tipo_identificacion", e.target.value)} style={{ ...S.input }}>
                <option>RUT</option>
                <option>Pasaporte</option>
              </select>
              {form.tipo_identificacion === "RUT" ? inp("paciente_rut", "RUT") : inp("paciente_pasaporte", "Pasaporte")}
              {inp("paciente_edad", "Edad", "number")}
              <select value={form.categoria_paciente} onChange={e => setF("categoria_paciente", e.target.value)} style={{ ...S.input }}>
                <option>Adulto</option>
                <option>Pediátrico</option>
                <option>Adulto Mayor</option>
              </select>
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>Signos Vitales</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4, marginBottom: 14 }}>
              {inp("presion_sistolica", "PAS (mmHg)", "number")}
              {inp("presion_diastolica", "PAD (mmHg)", "number")}
              {inp("frecuencia_cardiaca", "FC (lpm)", "number")}
              {inp("temperatura", "Temp. (°C)", "number")}
              {inp("saturacion_oxigeno", "SpO₂ (%)", "number")}
              {inp("frecuencia_respiratoria", "FR (rpm)", "number")}
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>Evaluación Clínica</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, marginBottom: 20 }}>
              <textarea placeholder="Motivo de consulta *" value={form.motivo_consulta} onChange={e => setF("motivo_consulta", e.target.value)} style={{ ...S.input, height: 72, resize: "vertical" }} />
              <textarea placeholder="Diagnóstico / Evaluación" value={form.diagnostico} onChange={e => setF("diagnostico", e.target.value)} style={{ ...S.input, height: 72, resize: "vertical" }} />
              <textarea placeholder="Tratamiento realizado" value={form.tratamiento} onChange={e => setF("tratamiento", e.target.value)} style={{ ...S.input, height: 72, resize: "vertical" }} />
              <textarea placeholder="Observaciones" value={form.observaciones} onChange={e => setF("observaciones", e.target.value)} style={{ ...S.input, height: 60, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.btn("ghost")} onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Atención"}
              </button>
            </div>
          </div>
        </div>
      )}

      {atenciones.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textMuted, padding: 48, fontSize: 14, borderRadius: 12, border: `1px dashed ${C.border}` }}>
          No hay atenciones registradas aún
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {atenciones.map(a => (
            <div key={a.id} style={{ background: C.surface2, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{a.paciente_nombre}</div>
                  <div style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}>{a.motivo_consulta}</div>
                  {a.diagnostico && <div style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}>Dx: {a.diagnostico}</div>}
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: C.textFaint, whiteSpace: "nowrap" }}>
                  <div>{a.evento}</div>
                  <div>{new Date(a.created_at).toLocaleDateString("es-CL")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
