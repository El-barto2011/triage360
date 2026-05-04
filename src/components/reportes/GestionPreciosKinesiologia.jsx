import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { calcularPorcentajeValorizado } from "../../config/constants";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

function Toast({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: C.green, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px #0006" }}>
      ✓ {msg}
    </div>
  );
}

export function GestionPreciosKinesiologia({ usuario }) {
  const [insumos, setInsumos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [precioEdit, setPrecioEdit] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { cargar(); }, [usuario]);

  const cargar = async () => {
    setLoading(true);
    const data = await sb("insumos_kinesiologia?order=nombre", {}, usuario?.token);
    if (data) setInsumos(data);
    setLoading(false);
  };

  const iniciarEdicion = (ins) => {
    setEditando(ins.id);
    setPrecioEdit(ins.precio_unitario != null ? String(ins.precio_unitario) : "");
  };

  const cancelarEdicion = () => { setEditando(null); setPrecioEdit(""); };

  const guardarPrecio = async (ins) => {
    if (precioEdit === "") return;
    const precio = Math.max(0, parseFloat(parseFloat(precioEdit).toFixed(2)));
    setGuardando(true);
    const res = await sb(`insumos_kinesiologia?id=eq.${ins.id}`, {
      method: "PATCH",
      body: JSON.stringify({ precio_unitario: precio }),
    }, usuario?.token);
    if (res) {
      setInsumos(prev => prev.map(i => i.id === ins.id ? { ...i, precio_unitario: precio } : i));
      setToast(`Precio actualizado: ${ins.nombre}`);
    }
    setEditando(null);
    setPrecioEdit("");
    setGuardando(false);
  };

  const limpiarFiltros = () => setBusqueda("");

  const insumosFiltrados = insumos.filter(i =>
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const conPrecio  = insumos.filter(i => i.precio_unitario != null).length;
  const sinPrecio  = insumos.length - conPrecio;
  const totalValor = insumos.reduce((s, i) => s + (i.precio_unitario ?? 0) * (i.stock ?? 0), 0);
  const pct        = calcularPorcentajeValorizado(conPrecio, insumos.length);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando insumos de kinesiología...</div>;

  return (
    <div>
      {toast && <Toast msg={toast} onHide={() => setToast(null)} />}

      {/* Cards resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Insumos Kines", val: insumos.length,            color: C.blue },
          { label: "Con precio",          val: conPrecio,                  color: C.green },
          { label: "Sin precio",          val: sinPrecio,                  color: sinPrecio > 0 ? C.yellow : C.green },
          { label: "Valor inventario",    val: fmt(totalValor),            color: C.accent, small: true },
        ].map(({ label, val, color, small }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: small ? 20 : 28, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra de progreso valorización */}
      <div style={{ ...S.card, padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: C.textMuted }}>Insumos valorizados</span>
          <span style={{ fontWeight: 700, color: pct === 100 ? C.green : pct > 50 ? C.yellow : C.red }}>{pct}%</span>
        </div>
        <div style={{ background: C.surface2, borderRadius: 4, height: 8 }}>
          <div style={{ background: pct === 100 ? C.green : pct > 50 ? C.yellow : C.accent, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>{conPrecio} de {insumos.length} insumos con precio asignado</div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...S.input, maxWidth: 300 }}
          placeholder="Buscar insumo de kinesiología..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
        <span style={{ fontSize: 12, color: C.textMuted, marginLeft: "auto" }}>
          {insumosFiltrados.length} de {insumos.length} insumos
        </span>
      </div>

      {/* Tabla editable */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 60 }}>ID</th>
              <th style={S.th}>Nombre</th>
              <th style={S.th}>Unidad</th>
              <th style={S.th}>Stock Actual</th>
              <th style={S.th}>Mínimo</th>
              <th style={S.th}>Precio Unitario</th>
              <th style={{ ...S.th, width: 80 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin resultados</td></tr>
            ) : insumosFiltrados.map(ins => {
              const editandoEste = editando === ins.id;
              const valorStock = ins.precio_unitario != null ? ins.precio_unitario * (ins.stock ?? 0) : null;
              return (
                <tr key={ins.id} style={{ background: editandoEste ? C.accentDim : "transparent" }}>
                  <td style={{ ...S.td, color: C.textFaint, fontSize: 12 }}>{ins.id}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{ins.nombre}</div>
                    {valorStock != null && (
                      <div style={{ fontSize: 11, color: C.textFaint }}>Stock: {fmt(valorStock)}</div>
                    )}
                  </td>
                  <td style={{ ...S.td, color: C.textMuted }}>{ins.unidad ?? "—"}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{ins.stock ?? "—"}</td>
                  <td style={{ ...S.td, color: C.textMuted }}>{ins.minimo ?? "—"}</td>
                  <td style={S.td}>
                    {editandoEste ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        step="1"
                        style={{ ...S.input, width: 130, padding: "6px 10px" }}
                        value={precioEdit}
                        onChange={e => setPrecioEdit(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") guardarPrecio(ins); if (e.key === "Escape") cancelarEdicion(); }}
                        placeholder="0"
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: ins.precio_unitario != null ? C.accent : C.textFaint }}>
                        {ins.precio_unitario != null ? fmt(ins.precio_unitario) : "Sin precio"}
                      </span>
                    )}
                  </td>
                  <td style={S.td}>
                    {editandoEste ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={{ ...S.btn("primary"), padding: "5px 12px", fontSize: 12, opacity: guardando ? 0.6 : 1 }}
                          onClick={() => guardarPrecio(ins)}
                          disabled={guardando}
                        >
                          Guardar
                        </button>
                        <button style={{ ...S.btn("ghost"), padding: "5px 10px" }} onClick={cancelarEdicion}>
                          <Icon name="close" size={13} color={C.textMuted} />
                        </button>
                      </div>
                    ) : (
                      <button style={{ ...S.btn("ghost"), padding: "5px 10px" }} onClick={() => iniciarEdicion(ins)}>
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
        Clic en ✏️ para editar · Enter para guardar · Escape para cancelar
      </div>
    </div>
  );
}
