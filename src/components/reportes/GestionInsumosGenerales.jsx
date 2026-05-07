import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { CATEGORIAS_INSUMOS, calcularPorcentajeValorizado } from "../../config/constants";
import { ModalAgregarInsumo } from "../common/ModalAgregarInsumo";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

const CATS_EDICION = CATEGORIAS_INSUMOS.filter(c => c !== "Todos");

function Toast({ msg, color, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: color || C.green, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px #0006" }}>
      {msg}
    </div>
  );
}

export function GestionInsumosGenerales({ usuario }) {
  const [insumos, setInsumos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);

  useEffect(() => { cargar(); }, [usuario]);

  const cargar = async () => {
    setLoading(true);
    const data = await sb("catalogo_insumos?order=nombre", {}, usuario?.token);
    if (data) setInsumos(data);
    setLoading(false);
  };

  const iniciarEdicion = (ins) => {
    setEditando(ins.id);
    setFormEdit({
      precio_unitario: ins.precio_unitario != null ? String(ins.precio_unitario) : "",
      categoria:       ins.categoria  ?? "Otros",
      proveedor:       ins.proveedor  ?? "",
    });
  };

  const cancelarEdicion = () => { setEditando(null); setFormEdit({}); };

  const guardar = async (ins) => {
    if (formEdit.precio_unitario !== "" && isNaN(parseFloat(formEdit.precio_unitario))) return;
    setGuardando(true);
    const patch = {
      categoria: formEdit.categoria || "Otros",
      proveedor: formEdit.proveedor || null,
      ...(formEdit.precio_unitario !== ""
        ? { precio_unitario: Math.max(0, parseFloat(parseFloat(formEdit.precio_unitario).toFixed(2))) }
        : {}),
    };
    const res = await sb(`catalogo_insumos?id=eq.${ins.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }, usuario?.token);
    if (res) {
      setInsumos(prev => prev.map(i => i.id === ins.id ? { ...i, ...patch } : i));
      setToast({ msg: `✅ Guardado: ${ins.nombre}`, color: C.green });
    }
    setEditando(null);
    setFormEdit({});
    setGuardando(false);
  };

  const agregarInsumo = async (form) => {
    const res = await sb("catalogo_insumos", {
      method: "POST",
      body: JSON.stringify({
        nombre:          form.nombre.trim(),
        categoria:       form.categoria       || "Otros",
        unidad:          form.unidad          || null,
        precio_unitario: form.precio_unitario || null,
        proveedor:       form.proveedor       || null,
        observaciones:   form.observaciones   || null,
      }),
    }, usuario?.token);
    if (res) {
      setToast({ msg: "✅ Insumo agregado al catálogo", color: C.green });
      setModalAgregar(false);
      cargar();
    } else {
      setToast({ msg: "❌ Error: Este insumo ya existe o hubo un problema", color: C.red });
    }
  };

  const limpiarFiltros = () => { setBusqueda(""); setFiltroCategoria("Todos"); };

  const insumosFiltrados = insumos.filter(i => {
    const okCat = filtroCategoria === "Todos" || i.categoria === filtroCategoria;
    const okNom = i.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return okCat && okNom;
  });

  const conPrecio  = insumos.filter(i => i.precio_unitario != null).length;
  const sinPrecio  = insumos.length - conPrecio;
  const totalValor = insumos.reduce((s, i) => s + (i.precio_unitario ?? 0) * (i.stock ?? 0), 0);
  const pct        = calcularPorcentajeValorizado(conPrecio, insumos.length);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando catálogo de insumos...</div>;

  return (
    <div>
      {toast && <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(null)} />}
      {modalAgregar && (
        <ModalAgregarInsumo tipo="general" onClose={() => setModalAgregar(false)} onSave={agregarInsumo} />
      )}

      {/* Cards resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Insumos Generales", val: insumos.length,   color: C.blue },
          { label: "Con precio",              val: conPrecio,         color: C.green },
          { label: "Sin precio",              val: sinPrecio,         color: sinPrecio > 0 ? C.yellow : C.green },
          { label: "Valor en inventario",     val: fmt(totalValor),   color: C.accent, small: true },
        ].map(({ label, val, color, small }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: small ? 20 : 28, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra progreso */}
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

      {/* Filtros y botón agregar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...S.input, maxWidth: 280 }}
          placeholder="Buscar insumo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select
          style={S.select}
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
        >
          {CATEGORIAS_INSUMOS.map(c => <option key={c}>{c}</option>)}
        </select>
        {(busqueda || filtroCategoria !== "Todos") && (
          <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {insumosFiltrados.length} de {insumos.length} insumos
        </span>
        <button style={{ ...S.btn("primary"), marginLeft: "auto", fontSize: 13 }} onClick={() => setModalAgregar(true)}>
          ➕ Agregar Insumo General
        </button>
      </div>

      {/* Tabla */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 60 }}>ID</th>
              <th style={S.th}>Nombre</th>
              <th style={S.th}>Categoría</th>
              <th style={S.th}>Unidad</th>
              <th style={S.th}>Precio Unitario</th>
              <th style={S.th}>Proveedor</th>
              <th style={{ ...S.th, width: 110 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin resultados</td></tr>
            ) : insumosFiltrados.map(ins => {
              const editandoEste = editando === ins.id;
              return (
                <tr key={ins.id} style={{ background: editandoEste ? C.accentDim : "transparent" }}>
                  <td style={{ ...S.td, color: C.textFaint, fontSize: 12 }}>{ins.id}</td>

                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{ins.nombre}</div>
                    {ins.precio_unitario != null && ins.stock != null && (
                      <div style={{ fontSize: 11, color: C.textFaint }}>{fmt(ins.precio_unitario * ins.stock)}</div>
                    )}
                  </td>

                  <td style={S.td}>
                    {editandoEste ? (
                      <select
                        style={{ ...S.select, fontSize: 12, padding: "4px 8px" }}
                        value={formEdit.categoria}
                        onChange={e => setFormEdit(f => ({ ...f, categoria: e.target.value }))}
                      >
                        {CATS_EDICION.map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span style={{ ...S.badge(C.blue, C.blueDim), fontSize: 10 }}>
                        {ins.categoria ?? "—"}
                      </span>
                    )}
                  </td>

                  <td style={{ ...S.td, color: C.textMuted }}>{ins.unidad ?? "—"}</td>

                  <td style={S.td}>
                    {editandoEste ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        step="1"
                        style={{ ...S.input, width: 120, padding: "6px 10px" }}
                        value={formEdit.precio_unitario}
                        onChange={e => setFormEdit(f => ({ ...f, precio_unitario: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") guardar(ins); if (e.key === "Escape") cancelarEdicion(); }}
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
                      <input
                        style={{ ...S.input, fontSize: 12, padding: "6px 10px" }}
                        value={formEdit.proveedor}
                        onChange={e => setFormEdit(f => ({ ...f, proveedor: e.target.value }))}
                        placeholder="Proveedor..."
                      />
                    ) : (
                      <span style={{ color: C.textMuted, fontSize: 13 }}>{ins.proveedor ?? "—"}</span>
                    )}
                  </td>

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
                        <button style={{ ...S.btn("ghost"), padding: "5px 8px" }} onClick={cancelarEdicion}>
                          ✗
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
        Clic en ✏️ para editar precio, categoría y proveedor · Enter para guardar · Escape para cancelar
      </div>
    </div>
  );
}
