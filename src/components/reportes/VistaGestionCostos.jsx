import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

const RANK_COLORS = ["#d29922", "#8b949e", "#f0883e"]; // oro, plata, bronce

export function VistaGestionCostos({ usuario, onNavigate }) {
  const [tab, setTab] = useState("resumen");
  const [resumen, setResumen] = useState([]);
  const [porEvento, setPorEvento] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [costos, setCostos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [carrosValor, setCarrosValor] = useState([]);
  const [bolsoKines, setBolsoKines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { cargarDatos(); }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const [res, por, top, gest, inv, carr, bolso] = await Promise.all([
      sb("vista_resumen_costos_medicamentos", {}, usuario?.token),
      sb("vista_costos_medicamentos_por_evento?order=fecha_evento.desc&limit=30", {}, usuario?.token),
      sb("vista_top_medicamentos_costosos?limit=20", {}, usuario?.token),
      sb("costos_insumos?order=nombre_insumo", {}, usuario?.token),
      sb("vista_valor_inventario_completo_v3", {}, usuario?.token),
      sb("vista_valor_completo_por_contenedor?order=valor_total.desc", {}, usuario?.token),
      sb("vista_bolso_kines_maestro?order=nombre.asc", {}, usuario?.token),
    ]);
    if (res) setResumen(Array.isArray(res) ? res : [res]);
    if (por) setPorEvento(por);
    if (top) setTopMeds(top);
    if (gest) setCostos(gest);
    if (inv) setInventario(Array.isArray(inv) ? inv : [inv]);
    if (carr) setCarrosValor(carr);
    if (bolso) setBolsoKines(bolso);
    setLoading(false);
  };

  // CRUD costos_insumos
  const abrirNuevo = () => {
    setForm({ nombre_insumo: "", costo_unitario: "", categoria: "General", unidad: "unid.", proveedor: "" });
    setModal("nuevo");
  };
  const abrirEditar = (c) => { setForm(c); setModal("editar"); };

  const guardar = async () => {
    if (!form.nombre_insumo || !form.costo_unitario) return;
    const datos = { nombre_insumo: form.nombre_insumo, costo_unitario: parseFloat(form.costo_unitario), categoria: form.categoria || "General", unidad: form.unidad || "unid.", proveedor: form.proveedor || null };
    if (modal === "nuevo") {
      const res = await sb("costos_insumos", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setCostos(prev => [...prev, res[0]].sort((a, b) => a.nombre_insumo.localeCompare(b.nombre_insumo)));
    } else {
      const res = await sb(`costos_insumos?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setCostos(prev => prev.map(c => c.id === form.id ? res[0] : c));
    }
    setModal(null);
  };

  const eliminar = async (costo) => {
    if (!window.confirm(`¿Eliminar el costo de "${costo.nombre_insumo}"?`)) return;
    await sb(`costos_insumos?id=eq.${costo.id}`, { method: "DELETE" }, usuario?.token);
    setCostos(prev => prev.filter(c => c.id !== costo.id));
  };

  const tabs = [
    { id: "resumen",     label: "Resumen Global",      color: C.accent },
    { id: "eventos",     label: "Por Evento",           color: C.blue },
    { id: "top",         label: "Top Medicamentos",     color: C.orange },
    { id: "inventario",  label: "Inventario Completo",  color: C.green },
    { id: "carros",      label: "Valor de Carros",      color: C.purple },
    { id: "bolso-kines", label: "🎒 Bolso Kines",       color: C.accent },
    { id: "gestion",     label: "Gestión de Costos",    color: C.textMuted },
  ];

  const r = resumen[0] || {};

  return (
    <div>
      {/* Tabs */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={S.tab(tab === t.id, t.color)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando datos...</div>
      ) : (
        <>
          {/* ── TAB RESUMEN ── */}
          {tab === "resumen" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Total Administraciones", val: r.total_administraciones ?? "—", color: C.blue, prefix: "" },
                  { label: "Costo Total",             val: r.costo_total != null ? fmt(r.costo_total) : "—", color: C.accent, raw: true },
                  { label: "Costo Promedio / Atención", val: r.costo_promedio != null ? fmt(r.costo_promedio) : "—", color: C.orange, raw: true },
                  { label: "Medicamentos Distintos",  val: r.medicamentos_distintos ?? r.total_medicamentos ?? "—", color: C.purple, prefix: "" },
                ].map(({ label, val, color, raw }) => (
                  <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
                    <div style={{ fontSize: raw ? 22 : 30, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Desglose por mes si la vista lo incluye */}
              {resumen.length > 1 ? (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Evolución mensual</div>
                  <table style={S.table}>
                    <thead>
                      <tr>{Object.keys(resumen[0]).map(k => <th key={k} style={S.th}>{k.replace(/_/g, " ")}</th>)}</tr>
                    </thead>
                    <tbody>
                      {resumen.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} style={S.td}>{typeof v === "number" && String(v).length > 3 ? fmt(v) : String(v ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                resumen.length === 1 && (
                  <div style={S.card}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: C.textMuted }}>Detalle del resumen</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {Object.entries(r).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.surface2, borderRadius: 8, fontSize: 13 }}>
                          <span style={{ color: C.textMuted, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                          <span style={{ fontWeight: 700 }}>{typeof v === "number" ? fmt(v) : String(v ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ── TAB POR EVENTO ── */}
          {tab === "eventos" && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Costos por Evento</div>
              {porEvento.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 32 }}>Sin datos. Asegúrate de que haya administraciones con precios registrados.</div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Evento</th>
                      <th style={S.th}>Fecha</th>
                      <th style={S.th}>Administraciones</th>
                      <th style={S.th}>Costo Total</th>
                      <th style={S.th}>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porEvento.map((row, i) => {
                      const nombre = row.nombre_evento ?? row.evento ?? row.evento_nombre ?? "—";
                      const fecha  = row.fecha_evento  ?? row.fecha       ?? null;
                      const admins = row.total_administraciones ?? row.administraciones ?? row.cantidad ?? "—";
                      const total  = row.costo_total   ?? row.total       ?? null;
                      const avg    = row.costo_promedio ?? row.promedio   ?? null;
                      return (
                        <tr key={i}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{nombre}</td>
                          <td style={S.td}>{fecha ? new Date(fecha).toLocaleDateString("es-CL") : "—"}</td>
                          <td style={S.td}>{admins}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: C.accent }}>{total != null ? fmt(total) : "—"}</td>
                          <td style={{ ...S.td, color: C.textMuted }}>{avg != null ? fmt(avg) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB TOP MEDICAMENTOS ── */}
          {tab === "top" && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Medicamentos por Costo</div>
              {topMeds.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 32 }}>Sin datos. Registra precios en "Gestión de Costos".</div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>Medicamento</th>
                      <th style={S.th}>Tipo</th>
                      <th style={S.th}>Precio Unit.</th>
                      <th style={S.th}>Cant. Admin.</th>
                      <th style={S.th}>Costo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMeds.map((row, i) => {
                      const nombre  = row.nombre_medicamento ?? row.nombre_insumo ?? row.medicamento ?? row.nombre ?? "—";
                      const dosis   = row.dosis   ?? "";
                      const tipo    = row.tipo     ?? row.categoria ?? "—";
                      const precio  = row.precio_unitario ?? row.costo_unitario ?? null;
                      const cant    = row.cantidad_administrada ?? row.total_administrado ?? row.cantidad ?? "—";
                      const total   = row.costo_total ?? row.total ?? null;
                      return (
                        <tr key={i}>
                          <td style={{ ...S.td, color: C.textFaint, fontWeight: 700 }}>{i + 1}</td>
                          <td style={S.td}>
                            <div style={{ fontWeight: 600 }}>{nombre}</div>
                            {dosis && <div style={{ fontSize: 11, color: C.textMuted }}>{dosis}</div>}
                          </td>
                          <td style={S.td}>
                            <span style={{ ...S.badge(C.blue, C.blueDim), fontSize: 10 }}>{tipo}</span>
                          </td>
                          <td style={{ ...S.td, color: C.orange, fontWeight: 700 }}>{precio != null ? fmt(precio) : "—"}</td>
                          <td style={S.td}>{cant}</td>
                          <td style={{ ...S.td, fontWeight: 800, color: C.accent }}>{total != null ? fmt(total) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB INVENTARIO COMPLETO ── */}
          {tab === "inventario" && (
            <div>
              {/* Cards KPI */}
              {(() => {
                const total = inventario.find(r => (r.categoria ?? "").toUpperCase() === "TOTAL") || {};
                const totalItems  = total.total_items      ?? total.total     ?? inventario.reduce((s, r) => s + (r.total_items ?? 0), 0);
                const totalUnids  = total.unidades_totales ?? total.unidades  ?? inventario.reduce((s, r) => s + (r.unidades_totales ?? 0), 0);
                const valorTotal  = total.valor_total      ?? total.valor     ?? inventario.reduce((s, r) => s + (r.valor_total ?? 0), 0);
                const conPrecio   = total.items_con_precio ?? inventario.reduce((s, r) => s + (r.items_con_precio ?? 0), 0);
                const pct         = totalItems > 0 ? Math.round((conPrecio / totalItems) * 100) : 0;
                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                      {[
                        { label: "Total Items",          val: totalItems,      color: C.blue },
                        { label: "Total Unidades",       val: totalUnids,      color: C.purple },
                        { label: "Valor Total",          val: fmt(valorTotal), color: C.accent, small: true },
                        { label: "% Valorizado",         val: `${pct}%`,       color: pct === 100 ? C.green : pct > 50 ? C.yellow : C.red, small: true },
                      ].map(({ label, val, color, small }) => (
                        <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
                          <div style={{ fontSize: small ? 24 : 32, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ ...S.card, padding: "14px 20px", marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: C.textMuted }}>Completitud de precios — {conPrecio} de {totalItems} items valorizados</span>
                        <span style={{ fontWeight: 700, color: pct === 100 ? C.green : pct > 50 ? C.yellow : C.red }}>{pct}%</span>
                      </div>
                      <div style={{ background: C.surface2, borderRadius: 4, height: 10 }}>
                        <div style={{ background: pct === 100 ? C.green : pct > 50 ? C.yellow : C.accent, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Tabla por categoría */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Desglose por Categoría</div>
                {inventario.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.textMuted, padding: 32 }}>Sin datos en vista_valor_inventario_completo_v3</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Categoría</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Total Items</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Unidades</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Valor Total</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Con Precio</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Sin Precio</th>
                        <th style={{ ...S.th, textAlign: "right" }}>% Completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.map((row, i) => {
                        const esTotal    = (row.categoria ?? "").toUpperCase() === "TOTAL";
                        const items      = row.total_items      ?? row.total    ?? "—";
                        const unidades   = row.unidades_totales ?? row.unidades ?? "—";
                        const valor      = row.valor_total      ?? row.valor    ?? null;
                        const conP       = row.items_con_precio ?? null;
                        const sinP       = row.items_sin_precio ?? (typeof items === "number" && conP != null ? items - conP : null);
                        const pctRow     = typeof items === "number" && conP != null ? Math.round((conP / items) * 100) : null;
                        return (
                          <tr key={i} style={{ background: esTotal ? C.accentDim : "transparent", fontWeight: esTotal ? 800 : 400 }}>
                            <td style={{ ...S.td, fontWeight: esTotal ? 800 : 600, color: esTotal ? C.accent : C.text }}>
                              {esTotal ? "📊 TOTAL" : row.categoria ?? `Categoría ${i + 1}`}
                            </td>
                            <td style={{ ...S.td, textAlign: "right" }}>{items}</td>
                            <td style={{ ...S.td, textAlign: "right" }}>{unidades}</td>
                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: C.accent }}>{valor != null ? fmt(valor) : "—"}</td>
                            <td style={{ ...S.td, textAlign: "right", color: C.green }}>{conP ?? "—"}</td>
                            <td style={{ ...S.td, textAlign: "right", color: sinP > 0 ? C.yellow : C.textMuted }}>{sinP ?? "—"}</td>
                            <td style={{ ...S.td, textAlign: "right" }}>
                              {pctRow != null && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                                  <div style={{ background: C.surface2, borderRadius: 3, height: 6, width: 60 }}>
                                    <div style={{ background: pctRow === 100 ? C.green : pctRow > 50 ? C.yellow : C.accent, width: `${pctRow}%`, height: "100%", borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: pctRow === 100 ? C.green : C.textMuted }}>{pctRow}%</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TAB VALOR DE CARROS ── */}
          {tab === "carros" && (
            <div>
              {carrosValor.length === 0 ? (
                <div style={{ ...S.card, padding: 40, textAlign: "center", color: C.textMuted }}>
                  Sin datos en vista_valor_completo_por_contenedor
                </div>
              ) : (
                <>
                  {/* Top 3 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                    {carrosValor.slice(0, 3).map((row, i) => {
                      const nombre = row.nombre ?? row.nombre_carro ?? row.contenedor ?? `Carro ${i + 1}`;
                      const valor  = row.valor_total ?? row.total ?? null;
                      const color  = RANK_COLORS[i] ?? C.textMuted;
                      const medal  = ["🥇", "🥈", "🥉"][i];
                      return (
                        <div key={i} style={{ background: C.surface, border: `2px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: 12, padding: "18px 20px" }}>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{medal}</div>
                          <div style={{ fontWeight: 800, fontSize: 15, color, marginBottom: 4 }}>{nombre}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color }}>{valor != null ? fmt(valor) : "—"}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                            {row.total_items ?? row.items ?? "—"} items · {row.total_unidades ?? row.unidades ?? "—"} unidades
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabla completa */}
                  <div style={S.card}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={{ ...S.th, width: 36 }}>#</th>
                          <th style={S.th}>Carro / Bolso</th>
                          <th style={S.th}>Cajón</th>
                          <th style={{ ...S.th, textAlign: "right" }}>Medicamentos</th>
                          <th style={{ ...S.th, textAlign: "right" }}>Insumos Grales</th>
                          <th style={{ ...S.th, textAlign: "right" }}>Total Items</th>
                          <th style={{ ...S.th, textAlign: "right" }}>Total Unidades</th>
                          <th style={{ ...S.th, textAlign: "right" }}>Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrosValor.map((row, i) => {
                          const nombre    = row.nombre ?? row.nombre_carro ?? row.contenedor ?? `—`;
                          const cajon     = row.cajon  ?? row.cajon_nombre ?? "—";
                          const medsCant  = row.medicamentos_cantidad ?? row.cant_meds ?? "—";
                          const medsVal   = row.medicamentos_valor    ?? row.valor_meds ?? null;
                          const insCant   = row.insumos_cantidad      ?? row.cant_ins   ?? "—";
                          const insVal    = row.insumos_valor         ?? row.valor_ins  ?? null;
                          const totItems  = row.total_items           ?? row.items      ?? "—";
                          const totUnids  = row.total_unidades        ?? row.unidades   ?? "—";
                          const totVal    = row.valor_total           ?? row.total      ?? null;
                          const rankColor = RANK_COLORS[i] ?? null;
                          return (
                            <tr key={i} style={{ background: i < 3 ? (rankColor + "10") : "transparent" }}>
                              <td style={{ ...S.td, fontWeight: 800, color: rankColor ?? C.textFaint, fontSize: 13 }}>
                                {["🥇", "🥈", "🥉"][i] ?? i + 1}
                              </td>
                              <td style={{ ...S.td, fontWeight: 600 }}>{nombre}</td>
                              <td style={{ ...S.td, color: C.textMuted, fontSize: 13 }}>{cajon}</td>
                              <td style={{ ...S.td, textAlign: "right", fontSize: 13 }}>
                                <div>{medsCant}</div>
                                {medsVal != null && <div style={{ color: C.textFaint, fontSize: 11 }}>{fmt(medsVal)}</div>}
                              </td>
                              <td style={{ ...S.td, textAlign: "right", fontSize: 13 }}>
                                <div>{insCant}</div>
                                {insVal != null && <div style={{ color: C.textFaint, fontSize: 11 }}>{fmt(insVal)}</div>}
                              </td>
                              <td style={{ ...S.td, textAlign: "right" }}>{totItems}</td>
                              <td style={{ ...S.td, textAlign: "right" }}>{totUnids}</td>
                              <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: C.accent, fontSize: 15 }}>
                                {totVal != null ? fmt(totVal) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB BOLSO KINES ── */}
          {tab === "bolso-kines" && (
            <div>
              {/* Header con botón editar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>🎒 Bolso Kines Maestro — Detalle Completo</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{bolsoKines.length} insumos · contenido del bolso standard de kinesiología</div>
                </div>
                {onNavigate && (
                  <button style={{ ...S.btn("primary"), fontSize: 13 }} onClick={() => onNavigate("preciosKine")}>
                    ✏️ Editar Bolso
                  </button>
                )}
              </div>

              {bolsoKines.length === 0 ? (
                <div style={{ ...S.card, padding: 40, textAlign: "center", color: C.textMuted }}>
                  Sin datos en vista_bolso_kines_maestro
                </div>
              ) : (
                <div style={S.card}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Nombre Insumo</th>
                        <th style={S.th}>Unidad</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Cant. por Bolso</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Precio Unitario</th>
                        <th style={{ ...S.th, textAlign: "right" }}>Valor Línea</th>
                        <th style={S.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bolsoKines.map((row, i) => {
                        const nombre    = row.nombre ?? "—";
                        const unidad    = row.unidad ?? "—";
                        const cantidad  = row.cantidad_por_bolso ?? row.cantidad ?? 0;
                        const precio    = row.precio_unitario ?? null;
                        const valorLinea = precio != null ? precio * cantidad : null;
                        const tienePrecio = precio != null && precio > 0;
                        return (
                          <tr key={i}>
                            <td style={{ ...S.td, fontWeight: 600 }}>{nombre}</td>
                            <td style={{ ...S.td, color: C.textMuted }}>{unidad}</td>
                            <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{cantidad}</td>
                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: tienePrecio ? C.accent : C.textFaint }}>
                              {tienePrecio ? fmt(precio) : "Sin precio"}
                            </td>
                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: C.green }}>
                              {valorLinea != null ? fmt(valorLinea) : "—"}
                            </td>
                            <td style={S.td}>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                                color: tienePrecio ? C.green : C.textMuted,
                                background: tienePrecio ? "#3fb95018" : C.surface2,
                              }}>
                                {tienePrecio ? "✓ Valorizado" : "Sin precio"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: C.accentDim, fontWeight: 800 }}>
                        <td colSpan={2} style={{ ...S.td, fontWeight: 800, color: C.textMuted }}>VALOR TOTAL DEL BOLSO</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 800 }}>
                          {bolsoKines.reduce((s, r) => s + (r.cantidad_por_bolso ?? r.cantidad ?? 0), 0)} unid.
                        </td>
                        <td style={S.td}></td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 900, color: C.accent, fontSize: 16 }}>
                          {fmt(bolsoKines.reduce((s, r) => {
                            const p = r.precio_unitario ?? 0;
                            const c = r.cantidad_por_bolso ?? r.cantidad ?? 0;
                            return s + p * c;
                          }, 0))}
                        </td>
                        <td style={S.td}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB GESTIÓN ── */}
          {tab === "gestion" && (
            <div>
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Costos de Insumos Registrados</div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{costos.length} insumos con precio</div>
                  </div>
                  <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Nuevo</button>
                </div>
              </div>

              {costos.length === 0 ? (
                <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>No hay costos registrados</div>
                  <button style={S.btn("primary")} onClick={abrirNuevo}>+ Agregar primer costo</button>
                </div>
              ) : (
                <div style={S.card}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Insumo</th>
                        <th style={S.th}>Costo Unitario</th>
                        <th style={S.th}>Categoría</th>
                        <th style={S.th}>Proveedor</th>
                        <th style={S.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {costos.map(c => (
                        <tr key={c.id}>
                          <td style={S.td}>
                            <div style={{ fontWeight: 600 }}>{c.nombre_insumo}</div>
                            <div style={{ fontSize: 11, color: C.textFaint }}>{c.unidad}</div>
                          </td>
                          <td style={{ ...S.td, fontWeight: 700, color: C.blue }}>{fmt(c.costo_unitario)}</td>
                          <td style={S.td}>{c.categoria}</td>
                          <td style={{ ...S.td, color: C.textMuted }}>{c.proveedor || "—"}</td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => abrirEditar(c)}>
                                <Icon name="edit" size={13} color={C.textMuted} />
                              </button>
                              <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => eliminar(c)}>
                                <Icon name="trash" size={13} color={C.red} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal CRUD */}
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nuevo" ? "Nuevo Costo" : "Editar Costo"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}>
                <Icon name="close" size={20} color={C.textMuted} />
              </button>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre del Insumo *</label>
              <input style={S.input} value={form.nombre_insumo || ""} onChange={e => setForm(f => ({ ...f, nombre_insumo: e.target.value }))} placeholder="Ej: Suero fisiológico 500ml" />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Costo Unitario (CLP) *</label>
                <input style={S.input} type="number" value={form.costo_unitario || ""} onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))} placeholder="1500" />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Unidad</label>
                <select style={{ ...S.select, width: "100%" }} value={form.unidad || "unid."} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
                  {["unid.", "amp.", "comp.", "ml", "mg", "litros", "kg"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Categoría</label>
                <select style={{ ...S.select, width: "100%" }} value={form.categoria || "General"} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {["General", "Medicamentos", "Insumos Médicos", "Kinesiología", "Masoterapia"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Proveedor</label>
                <input style={S.input} value={form.proveedor || ""} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} placeholder="Nombre del proveedor" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
