import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

const TIPO_COLOR = {
  inyectable: { color: C.blue,   bg: "#58a6ff18" },
  oral:       { color: C.green,  bg: "#3fb95018" },
  aerosol:    { color: C.purple, bg: "#bc8cff18" },
};

export function GestionPreciosMedicamentos({ usuario }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [precioEdit, setPrecioEdit] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, [usuario]);

  const cargar = async () => {
    setLoading(true);
    const data = await sb("medicamentos?order=nombre", {}, usuario?.token);
    if (data) setMedicamentos(data);
    setLoading(false);
  };

  const iniciarEdicion = (med) => {
    setEditando(med.id);
    setPrecioEdit(med.precio_unitario != null ? String(med.precio_unitario) : "");
  };

  const cancelarEdicion = () => { setEditando(null); setPrecioEdit(""); };

  const guardarPrecio = async (med) => {
    if (precioEdit === "") return;
    setGuardando(true);
    const precio = parseFloat(precioEdit);
    const res = await sb(`medicamentos?id=eq.${med.id}`, {
      method: "PATCH",
      body: JSON.stringify({ precio_unitario: precio }),
    }, usuario?.token);
    if (res) {
      setMedicamentos(prev => prev.map(m => m.id === med.id ? { ...m, precio_unitario: precio } : m));
    }
    setEditando(null);
    setPrecioEdit("");
    setGuardando(false);
  };

  const tipos = ["todos", "inyectable", "oral", "aerosol"];

  const medicamentosFiltrados = medicamentos.filter(m => {
    const okTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const okBusq = m.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return okTipo && okBusq;
  });

  const conPrecio    = medicamentos.filter(m => m.precio_unitario != null).length;
  const sinPrecio    = medicamentos.length - conPrecio;
  const totalValor   = medicamentos.reduce((s, m) => s + (m.precio_unitario ?? 0) * (m.stock ?? 0), 0);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando medicamentos...</div>;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total medicamentos", val: medicamentos.length, color: C.blue },
          { label: "Con precio",         val: conPrecio,            color: C.green },
          { label: "Sin precio",         val: sinPrecio,            color: sinPrecio > 0 ? C.yellow : C.green },
          { label: "Valor inventario",   val: fmt(totalValor),      color: C.accent, small: true },
        ].map(({ label, val, color, small }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: small ? 20 : 28, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...S.input, maxWidth: 260 }}
          placeholder="Buscar medicamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div style={S.tabs}>
          {tipos.map(t => (
            <button key={t} style={{ ...S.tab(filtroTipo === t), textTransform: "capitalize" }} onClick={() => setFiltroTipo(t)}>
              {t === "todos" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla editable */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Medicamento</th>
              <th style={S.th}>Tipo</th>
              <th style={S.th}>Stock</th>
              <th style={S.th}>Precio Unitario</th>
              <th style={S.th}>Valor en Stock</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {medicamentosFiltrados.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin resultados</td></tr>
            ) : medicamentosFiltrados.map(med => {
              const tc = TIPO_COLOR[med.tipo] || { color: C.textMuted, bg: C.surface2 };
              const editandoEste = editando === med.id;
              const valorStock = med.precio_unitario != null ? med.precio_unitario * (med.stock ?? 0) : null;
              return (
                <tr key={med.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{med.nombre}</div>
                    {med.dosis && <div style={{ fontSize: 11, color: C.textMuted }}>{med.dosis}</div>}
                  </td>
                  <td style={S.td}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: tc.color, background: tc.bg }}>
                      {med.tipo ?? "—"}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{med.stock ?? "—"} {med.unidad}</td>
                  <td style={S.td}>
                    {editandoEste ? (
                      <input
                        type="number"
                        autoFocus
                        style={{ ...S.input, width: 120, padding: "6px 10px" }}
                        value={precioEdit}
                        onChange={e => setPrecioEdit(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") guardarPrecio(med); if (e.key === "Escape") cancelarEdicion(); }}
                        placeholder="0"
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: med.precio_unitario != null ? C.accent : C.textFaint }}>
                        {med.precio_unitario != null ? fmt(med.precio_unitario) : "Sin precio"}
                      </span>
                    )}
                  </td>
                  <td style={{ ...S.td, color: C.textMuted, fontSize: 13 }}>
                    {valorStock != null ? fmt(valorStock) : "—"}
                  </td>
                  <td style={S.td}>
                    {editandoEste ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={{ ...S.btn("primary"), padding: "5px 12px", fontSize: 12, opacity: guardando ? 0.6 : 1 }}
                          onClick={() => guardarPrecio(med)}
                          disabled={guardando}
                        >
                          Guardar
                        </button>
                        <button style={{ ...S.btn("ghost"), padding: "5px 10px", fontSize: 12 }} onClick={cancelarEdicion}>
                          <Icon name="close" size={13} color={C.textMuted} />
                        </button>
                      </div>
                    ) : (
                      <button style={{ ...S.btn("ghost"), padding: "5px 10px" }} onClick={() => iniciarEdicion(med)}>
                        <Icon name="edit" size={14} color={C.textMuted} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 8 }}>
        Haz clic en ✏️ para editar el precio · Enter para guardar · Escape para cancelar
      </div>
    </div>
  );
}
