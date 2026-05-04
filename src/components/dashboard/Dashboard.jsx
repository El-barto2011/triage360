import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";
import { diasHastaVenc, estadoVenc, estadoStock, MEDICAMENTOS_INYECTABLES, MEDICAMENTOS_ORALES, MEDICAMENTOS_AEROSOLES } from "../../config/constants";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

export function Dashboard({ carros, usuario, esAdmin, permisos, onNavigate }) {
  const todosInsumos = carros.flatMap(c => c.insumos);
  const todosMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const todo = [...todosInsumos, ...todosMeds];
  const alertasVenc = todo.filter(i => estadoVenc(i.vencimiento) !== "ok");
  const stockBajo = todo.filter(i => estadoStock(i) !== "ok");

  const [costoMes, setCostoMes] = useState(null);
  const [costoMesAnt, setCostoMesAnt] = useState(null);
  const [invData, setInvData] = useState(null);

  useEffect(() => {
    if (!esAdmin || !usuario?.token) return;
    const cargar = async () => {
      const [costos, inv] = await Promise.all([
        sb("vista_costos_medicamentos_por_evento", {}, usuario.token),
        sb("vista_valor_inventario_completo_v2", {}, usuario.token),
      ]);

      if (costos) {
        const hoy = new Date();
        const mesActual  = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        const mesAnt     = mesActual === 0 ? 11 : mesActual - 1;
        const anioAnt    = mesActual === 0 ? anioActual - 1 : anioActual;
        const sumar = (mes, anio) =>
          costos
            .filter(r => { const f = new Date(r.fecha_evento ?? r.fecha ?? 0); return f.getMonth() === mes && f.getFullYear() === anio; })
            .reduce((s, r) => s + (r.costo_total ?? 0), 0);
        setCostoMes(sumar(mesActual, anioActual));
        setCostoMesAnt(sumar(mesAnt, anioAnt));
      }

      if (inv) {
        const rows  = Array.isArray(inv) ? inv : [inv];
        const total = rows.find(r => (r.categoria ?? "").toUpperCase() === "TOTAL") || rows[rows.length - 1] || {};
        const cats  = rows.filter(r => (r.categoria ?? "").toUpperCase() !== "TOTAL");
        setInvData({
          valorTotal:  total.valor_total ?? total.valor ?? rows.reduce((s, r) => s + (r.valor_total ?? 0), 0),
          totalItems:  total.total_items ?? total.total ?? rows.reduce((s, r) => s + (r.total_items ?? 0), 0),
          conPrecio:   total.items_con_precio ?? rows.reduce((s, r) => s + (r.items_con_precio ?? 0), 0),
          categorias:  cats.map(r => ({
            nombre: r.categoria ?? "—",
            valor:  r.valor_total ?? r.valor ?? null,
          })),
        });
      }
    };
    cargar();
  }, [esAdmin, usuario?.token]);

  const diffPct = costoMes != null && costoMesAnt != null && costoMesAnt > 0
    ? Math.round(((costoMes - costoMesAnt) / costoMesAnt) * 100)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={S.title}>
          {esAdmin ? "Dashboard Operacional" : `Bienvenido/a, ${usuario?.nombre?.split(" ")[0]}`}
        </div>
        <div style={S.subtitle}>
          {esAdmin
            ? `TRIAGE360 · ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
            : usuario?.evento_asignado
              ? `📍 Evento asignado: ${usuario.evento_asignado}`
              : "Sin evento asignado hoy"}
        </div>
      </div>

      {!esAdmin && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            👤 {usuario?.profesion} — Permisos activos
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Registrar atenciones", ok: true },
              { label: "Recetar medicamentos", ok: permisos?.recetarMedicamentos },
              { label: "Ver inventario carro",  ok: permisos?.verInventario },
              { label: "Modificar stock",       ok: permisos?.modificarStock },
              { label: "Ver bolso medicamentos",ok: permisos?.verBolso },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ color: ok ? C.green : C.red, fontSize: 16 }}>{ok ? "✅" : "❌"}</span>
                <span style={{ color: ok ? C.text : C.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Carros activos",       val: carros.length,          color: C.accent },
          { label: "Insumos en carros",    val: todosInsumos.length,    color: C.blue },
          { label: "Medicamentos bolso",   val: todosMeds.length,       color: C.orange },
          { label: "Alertas vencimiento",  val: alertasVenc.length,     color: alertasVenc.length > 0 ? C.red : C.green },
          { label: "Stock bajo mínimo",    val: stockBajo.length,       color: stockBajo.length > 0 ? C.yellow : C.green },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tarjeta valor del inventario — solo admin */}
      {esAdmin && (
        <div
          onClick={() => onNavigate?.("costos")}
          style={{ ...S.card, marginBottom: 20, borderLeft: `3px solid ${C.accent}`, cursor: onNavigate ? "pointer" : "default", transition: "box-shadow 0.15s" }}
          onMouseEnter={e => { if (onNavigate) e.currentTarget.style.boxShadow = `0 0 0 2px ${C.accent}40`; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            {/* Lado izquierdo: valor total + barra */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                💰 Valor del Inventario
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.accent, lineHeight: 1, marginBottom: 10 }}>
                {invData ? fmt(invData.valorTotal) : <span style={{ color: C.textFaint, fontSize: 16 }}>Cargando...</span>}
              </div>
              {invData && (
                <>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                    Items valorizados: <strong style={{ color: C.text }}>{invData.conPrecio}</strong> / {invData.totalItems}
                  </div>
                  <div style={{ background: C.surface2, borderRadius: 4, height: 6 }}>
                    <div style={{
                      background: invData.totalItems > 0 && Math.round((invData.conPrecio / invData.totalItems) * 100) === 100 ? C.green : C.accent,
                      width: `${invData.totalItems > 0 ? Math.round((invData.conPrecio / invData.totalItems) * 100) : 0}%`,
                      height: "100%", borderRadius: 4, transition: "width 0.5s"
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
                    {invData.totalItems > 0 ? Math.round((invData.conPrecio / invData.totalItems) * 100) : 0}% completado
                    {onNavigate && <span style={{ color: C.accent, marginLeft: 8 }}>→ Ver detalle</span>}
                  </div>
                </>
              )}
            </div>

            {/* Lado derecho: desglose por categoría + costo del mes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
              {invData?.categorias?.map(cat => (
                <div key={cat.nombre} style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: 13 }}>
                  <span style={{ color: C.textMuted }}>{cat.nombre}</span>
                  <span style={{ fontWeight: 700 }}>{cat.valor != null ? fmt(cat.valor) : "—"}</span>
                </div>
              ))}
              {costoMes != null && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Gasto este mes</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.orange }}>{fmt(costoMes)}</div>
                  {diffPct != null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: diffPct > 0 ? C.red : diffPct < 0 ? C.green : C.textMuted, marginTop: 2 }}>
                      {diffPct > 0 ? `▲ +${diffPct}% vs mes ant.` : diffPct < 0 ? `▼ ${diffPct}% vs mes ant.` : "= Sin variación"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado carros */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🚑 Estado de Carros</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {carros.map(c => {
            const alertas = c.insumos.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
            return (
              <div key={c.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${c.color}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: c.color }}>{c.nombre}</span>
                  {alertas > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 6px" }}>{alertas} ⚠️</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{c.insumos.length} insumos</div>
                <div style={{ fontSize: 11, marginTop: 3, color: c.evento_asignado === "Sin asignar" ? C.textFaint : C.text }}>
                  {c.evento_asignado === "Sin asignar" ? "Sin evento asignado" : "📍 " + c.evento_asignado}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas críticas */}
      {(alertasVenc.length > 0 || stockBajo.length > 0) && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>⚠️ Alertas Críticas</div>
          {todo.filter(i => estadoVenc(i.vencimiento) === "vencido").map(i => (
            <div key={i.id} style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.red }}>VENCIDO:</strong> {i.nombre} {i.dosis || ""} — venció {new Date(i.vencimiento).toLocaleDateString("es-CL")}
            </div>
          ))}
          {todo.filter(i => estadoVenc(i.vencimiento) === "proximo").map(i => (
            <div key={i.id} style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.yellow }}>Próximo a vencer:</strong> {i.nombre} {i.dosis || ""} — {diasHastaVenc(i.vencimiento)} días
            </div>
          ))}
          {todo.filter(i => estadoStock(i) !== "ok").map(i => (
            <div key={i.id} style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.yellow }}>Stock bajo:</strong> {i.nombre} {i.dosis || ""} — {i.stock}/{i.minimo} {i.unidad}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
