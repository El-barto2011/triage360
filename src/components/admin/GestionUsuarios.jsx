import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { PROFESIONES } from "../../config/permisos";

export function GestionUsuarios({ usuario, carros }) {
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const cargar = async () => {
      const [users, evs] = await Promise.all([
        sb("perfiles?order=nombre", {}, usuario?.token),
        sb("equipos_evento?estado=eq.activo", {}, usuario?.token)
      ]);
      if (users) setUsuarios(users);
      if (evs) setEventos(evs);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  // Calcular eventos asignados por profesional
  const getEventosAsignados = (userId) => {
    const eventosUsuario = eventos.filter(ev =>
      ev.medicos?.includes(userId) ||
      ev.enfermeros?.includes(userId) ||
      ev.paramedicos?.includes(userId) ||
      ev.kinesiologos?.includes(userId) ||
      ev.masoterapeutas?.includes(userId)
    );
    return eventosUsuario.map(ev => ev.nombre_evento);
  };

  const abrirEditar = (u) => { setForm({ ...u }); setEditando(u.id); };

  const guardar = async () => {
    const res = await sb(`perfiles?user_id=eq.${editando}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre: form.nombre, profesion: form.profesion, rol: form.rol })
    }, usuario?.token);
    if (res !== null) setUsuarios(prev => prev.map(u => u.id === editando ? { ...u, ...form } : u));
    setEditando(null);
  };

  const coloresProfesion = {
    "Médico": C.red, "Enfermero/a": C.blue, "Paramédico": C.orange,
    "Kinesiólogo/a": C.green, "Masoterapeuta": C.purple, "Administrador": C.accent
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando usuarios...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.title}>Gestión de Usuarios 👥</div>
        <div style={S.subtitle}>{usuarios.length} usuarios registrados · Asigna eventos y roles</div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {usuarios.map(u => (
          <div key={u.id} style={{ ...S.card, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: coloresProfesion[u.profesion] + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {u.rol === "admin" ? "👑" : "👤"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{u.nombre}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{u.profesion}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={S.badge(u.rol === "admin" ? C.accent : C.blue, u.rol === "admin" ? C.accentDim : C.blueDim)}>
                    {u.rol === "admin" ? "Admin" : "Profesional"}
                  </span>
                  {(() => {
                    const eventosAsignados = getEventosAsignados(u.id);
                    if (eventosAsignados.length === 0) {
                      return <span style={S.badge(C.textFaint, C.surface2)}>Sin evento</span>;
                    } else if (eventosAsignados.length === 1) {
                      return <span style={S.badge(C.green, C.greenDim)}>📍 {eventosAsignados[0]}</span>;
                    } else {
                      return <span style={S.badge(C.green, C.greenDim)}>📍 {eventosAsignados.length} eventos</span>;
                    }
                  })()}
                </div>
              </div>
            </div>
            <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => abrirEditar(u)}>✏️ Editar</button>
          </div>
        ))}
      </div>

      {editando && (
        <div style={S.modal} onClick={() => setEditando(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Editar Usuario</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setEditando(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre completo</label>
              <input style={S.input} value={form.nombre || ""} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Profesión</label>
                <select style={{ ...S.select, width: "100%" }} value={form.profesion || ""} onChange={e => setForm(p => ({ ...p, profesion: e.target.value }))}>
                  {["Médico", "Enfermero/a", "Paramédico", "Kinesiólogo/a", "Masoterapeuta", "Administrador"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Rol</label>
                <select style={{ ...S.select, width: "100%" }} value={form.rol || "profesional"} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                  <option value="admin">👑 Administrador</option>
                  <option value="profesional">👤 Profesional</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              La asignación a eventos se gestiona desde <strong>Eventos</strong> (equipo del evento), no aquí.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.btn("ghost")} onClick={() => setEditando(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
