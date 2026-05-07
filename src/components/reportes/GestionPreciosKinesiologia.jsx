import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { ModalAgregarInsumo } from "../common/ModalAgregarInsumo";

const fmt    = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";
const fmtNum = (n) => n != null ? Number(n).toLocaleString("es-CL") : "—";

function Toast({ msg, color, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: color || C.green, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px #0006" }}>
      {msg}
    </div>
  );
}

export function GestionPreciosKinesiologia({ usuario }) {
  const [insumos, setInsumos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ precio: "", cantidad: "" });
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);

  useEffect(() => { cargar(); }, [usuario]);

  const cargar = async () => {
    setLoading(true);
    const [data, res] = await Promise.all([
      sb("catalogo_insumos_kines?order=nombre.asc", {}, usuario?.token),
      sb("vista_resumen_bolso_kines", {}, usuario?.token),
    ]);
    if (data) setInsumos(data);
    if (res) setResumen(Array.isArray(res) ? res[0] : res);
    setLoading(false);
  };

  const cargarResumen = async () => {
    const res = await sb("vista_resumen_bolso_kines", {}, usuario?.token);
    if (res) setResumen(Array.isArray(res) ? res[0] : res);
  };

  const iniciarEdicion = (ins) => {
    setEditando(ins.id);
    setEditForm({
      precio:    ins.precio_unitario   != null ? String(ins.precio_unitario)   : "0",
      cantidad:  ins.cantidad_por_bolso != null ? String(ins.cantidad_por_bolso) : "1",
    });
  };

  const cancelarEdicion = () => { setEditando(null); setEditForm({ precio: "", cantidad: "" }); };

  const guardar = async (ins) => {
    const precio   = Math.max(0, parseFloat(editForm.precio)   || 0);
    const cantidad = Math.max(0, parseInt(editForm.cantidad)   || 0);
    setGuardando(true);
    const res = await sb(`catalogo_insumos_kines?id=eq.${ins.id}`, {
      method: "PATCH",
      body: JSON.stringify({ precio_unitario: precio, cantidad_por_bolso: cantidad }),
    }, usuario?.token);
    if (res !== null) {
      setInsumos(prev => prev.map(i => i.id === ins.id ? { ...i, precio_unitario: precio, cantidad_por_bolso: cantidad } : i));
      setToast({ msg: `✅ Actualizado: ${ins.nombre}`, color: C.green });
      cargarResumen();
    }
    cancelarEdicion();
    setGuardando(false);
  };

  const agregarInsumo = async (form) => {
    const res = await sb("catalogo_insumos_kines", {
      method: "POST",
      body: JSON.stringify({
        nombre:            form.nombre.trim(),
        unidad:            form.unidad            || null,
        cantidad_por_bolso: form.cantidad_por_bolso ?? 1,
        precio_unitario:   form.precio_unitario   ?? 0,
        observaciones:     form.observaciones     || null,
      }),
    }, usuario?.token);
    if (res) {
      setToast({ msg: "✅ Insumo agregado al bolso", color: C.green });
      setModalAgregar(false);
      cargar();
    } else {
      setToast({ msg: "❌ Error al agregar insumo", color: C.red });
    }
  };

  const insumosFiltrados = insumos.filter(i =>
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalItems     = resumen?.total_items      ?? insumos.length;
  const totalUnidades  = resumen?.total_unidades   ?? insumos.reduce((s, i) => s + (i.cantidad_por_bolso ?? 0), 0);
  const valorBolso     = resumen?.valor_bolso      ?? insumos.reduce((s, i) => s + (i.precio_unitario ?? 0) * (i.cantidad_por_bolso ?? 0), 0);
  const sinPrecio      = resumen?.items_sin_precio ?? insumos.filter(i => !i.precio_unitario).length;
  const pct            = resumen?.pct_valorizado   ?? (totalItems > 0 ? Math.round(((totalItems - sinPrecio) / totalItems) * 100) : 0);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando bolso kines maestro...</div>;

  return (
    <div>
      {toast && <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(null)} />}
      {modalAgregar && (
        <ModalAgregarInsumo tipo="kines" onClose={() => setModalAgregar(false)} onSave={agregarInsumo} />
      )}

      {/* Cards resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Items",     val: totalItems,             color: C.blue },
          { label: "Total Unidades",  val: fmtNum(totalUnidades),  color: C.purple },
          { label: "Valor del Bolso", val: fmt(valorBolso),        color: C.accent, small: true },
          { label: "Sin Precio",      val: sinPrecio,              color: sinPrecio > 0 ? C.yellow : C.green },
          { label: "% Valorizado",    val: `${pct}%`,              color: pct === 100 ? C.green : pct > 50 ? C.yellow : C.red, small: true },
        ].map(({ label, val, color, small }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: small ? 20 : 28, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div style={{ ...S.card, padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: C.textMuted }}>Insumos valorizados</span>
          <span style={{ fontWeight: 700, color: pct === 100 ? C.green : pct > 50 ? C.yellow : C.red }}>{pct}%</span>
        </div>
        <div style={{ background: C.surface2, borderRadius: 4, height: 8 }}>
          <div style={{ background: pct === 100 ? C.green : pct > 50 ? C.yellow : C.accent, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>
          {totalItems - sinPrecio} de {totalItems} insumos con precio asignado
        </div>
      </div>

      {/* Filtros y botón agregar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...S.input, maxWidth: 300 }}
          placeholder="Buscar insumo del bolso..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => setBusqueda("")}>
            Limpiar
          </button>
        )}
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {insumosFiltrados.length} de {insumos.length} insumos
        </span>
        <button style={{ ...S.btn("primary"), marginLeft: "auto", fontSize: 13 }} onClick={() => setModalAgregar(true)}>
          ➕ Agregar Insumo Nuevo
        </button>
      </div>

      {/* Tabla editable */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 60 }}>ID</th>
              <th style={S.th}>Nombre</th>
              <th style={S.th}>Unidad</th>
              <th style={{ ...S.th, textAlign: "right" }}>Cant. por Bolso</th>
              <th style={{ ...S.th, textAlign: "right" }}>Precio Unitario</th>
              <th style={{ ...S.th, textAlign: "right" }}>Valor Línea</th>
              <th style={{ ...S.th, width: 110 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin resultados</td></tr>
            ) : insumosFiltrados.map(ins => {
              const editandoEste = editando === ins.id;
              const valorLinea   = ins.precio_unitario != null && ins.cantidad_por_bolso != null
                ? ins.precio_unitario * ins.cantidad_por_bolso : null;
              return (
                <tr key={ins.id} style={{ background: editandoEste ? C.accentDim : "transparent" }}>
                  <td style={{ ...S.td, color: C.textFaint, fontSize: 12 }}>{ins.id}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{ins.nombre}</div>
                    {ins.observaciones && <div style={{ fontSize: 11, color: C.textFaint }}>{ins.observaciones}</div>}
                  </td>
                  <td style={{ ...S.td, color: C.textMuted }}>{ins.unidad ?? "—"}</td>

                  {/* Cantidad por bolso — editable */}
                  <td style={{ ...S.td, textAlign: "right" }}>
                    {editandoEste ? (
                      <input
                        type="number"
                        min="0"
                        style={{ ...S.input, width: 80, padding: "6px 10px", textAlign: "right" }}
                        value={editForm.cantidad}
                        onChange={e => setEditForm(f => ({ ...f, cantidad: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") guardar(ins); if (e.key === "Escape") cancelarEdicion(); }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{ins.cantidad_por_bolso ?? "—"}</span>
                    )}
                  </td>

                  {/* Precio unitario — editable */}
                  <td style={{ ...S.td, textAlign: "right" }}>
                    {editandoEste ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        step="1"
                        style={{ ...S.input, width: 120, padding: "6px 10px", textAlign: "right" }}
                        value={editForm.precio}
                        onChange={e => setEditForm(f => ({ ...f, precio: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") guardar(ins); if (e.key === "Escape") cancelarEdicion(); }}
                        placeholder="0"
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: ins.precio_unitario ? C.accent : C.textFaint }}>
                        {ins.precio_unitario ? fmt(ins.precio_unitario) : "Sin precio"}
                      </span>
                    )}
                  </td>

                  {/* Valor línea — calculado */}
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: C.green }}>
                    {valorLinea != null ? fmt(valorLinea) : "—"}
                  </td>

                  {/* Acciones */}
                  <td style={S.td}>
                    {editandoEste ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={{ ...S.btn("primary"), padding: "5px 12px", fontSize: 12, opacity: guardando ? 0.6 : 1 }}
                          onClick={() => guardar(ins)}
                          disabled={guardando}
                        >
                          ✓ Guardar
                        </button>
                        <button style={{ ...S.btn("ghost"), padding: "5px 8px" }} onClick={cancelarEdicion}>✗</button>
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
          {insumosFiltrados.length > 0 && (
            <tfoot>
              <tr style={{ background: C.accentDim }}>
                <td colSpan={3} style={{ ...S.td, fontWeight: 800, color: C.textMuted, fontSize: 12 }}>TOTAL DEL BOLSO</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 800 }}>
                  {fmtNum(insumosFiltrados.reduce((s, i) => s + (i.cantidad_por_bolso ?? 0), 0))} unid.
                </td>
                <td style={S.td}></td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: C.accent }}>
                  {fmt(insumosFiltrados.reduce((s, i) => s + (i.precio_unitario ?? 0) * (i.cantidad_por_bolso ?? 0), 0))}
                </td>
                <td style={S.td}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 8 }}>
        Clic en ✏️ para editar precio y cantidad · Enter para guardar · Escape para cancelar
      </div>
    </div>
  );
}
