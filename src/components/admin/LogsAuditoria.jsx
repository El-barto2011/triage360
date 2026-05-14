import { useState, useEffect, useCallback } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";

/* ── Metadatos por tabla ──────────────────────────────────── */
const TABLA_META = {
  equipos_evento:             { label: "Eventos",            color: C.blue   },
  atenciones_medicas:         { label: "Atenciones Médicas", color: C.red    },
  contenedores_medicamentos:  { label: "Stock Carros",       color: C.orange },
  medicamentos:               { label: "Medicamentos",       color: C.purple },
  perfiles:                   { label: "Usuarios",           color: C.green  },
};

const ACCION_COLOR = { INSERT: C.green, UPDATE: C.accent, DELETE: C.red };
const ACCION_BG    = { INSERT: C.greenDim, UPDATE: C.accentDim, DELETE: C.redDim };
const ACCION_LABEL = { INSERT: "Creación", UPDATE: "Modificación", DELETE: "Eliminación" };

const TABLAS_TODAS = Object.keys(TABLA_META);

/* ── Descripción legible de cada log ─────────────────────── */
function describir(log) {
  const n = log.datos_nuevos;
  const o = log.datos_anteriores;
  switch (log.tabla) {
    case "equipos_evento": {
      const nombre = n?.nombre_evento || o?.nombre_evento || "?";
      if (log.accion === "INSERT") return `Evento creado: "${nombre}"`;
      if (log.accion === "DELETE") return `Evento eliminado: "${nombre}"`;
      if (n?.deleted_at && !o?.deleted_at) return `Evento anulado (soft-delete): "${nombre}"`;
      if (n?.estado !== o?.estado) return `Estado de "${nombre}": ${o?.estado} → ${n?.estado}`;
      const cambiosEquipo = [
        ["Médicos",       o?.medicos,       n?.medicos],
        ["Enfermeros",    o?.enfermeros,    n?.enfermeros],
        ["Paramédicos",   o?.paramedicos,   n?.paramedicos],
        ["Kinesiólogos",  o?.kinesiologos,  n?.kinesiologos],
        ["Masoterapeutas",o?.masoterapeutas,n?.masoterapeutas],
        ["Carros",        o?.carros_asignados, n?.carros_asignados],
      ].filter(([, a, b]) => JSON.stringify(a) !== JSON.stringify(b))
       .map(([k]) => k);
      return `Equipo de "${nombre}" modificado${cambiosEquipo.length ? ` (${cambiosEquipo.join(", ")})` : ""}`;
    }
    case "atenciones_medicas": {
      const paciente = n?.paciente_nombre || o?.paciente_nombre || "?";
      if (log.accion === "DELETE") return `Atención eliminada — ${paciente}`;
      if (n?.deleted_at && !o?.deleted_at) return `Atención anulada (soft-delete) — ${paciente}`;
      return `Atención modificada — ${paciente}`;
    }
    case "contenedores_medicamentos": {
      const insumo = n?.nombre_insumo || o?.nombre_insumo || "?";
      const carro  = n?.nombre        || o?.nombre        || "?";
      if (log.accion === "DELETE") return `Insumo eliminado: "${insumo}" de ${carro}`;
      return `Stock "${insumo}" (${carro}): ${o?.stock ?? "?"} → ${n?.stock ?? "?"}`;
    }
    case "medicamentos": {
      const med = n?.nombre || o?.nombre || "?";
      if (log.accion === "DELETE") return `Medicamento eliminado: "${med}"`;
      return `Stock "${med}": ${o?.stock ?? "?"} → ${n?.stock ?? "?"}`;
    }
    case "perfiles": {
      const nombre = n?.nombre || o?.nombre || "?";
      if (log.accion === "INSERT") return `Usuario creado: ${nombre} (${n?.profesion || "?"})`;
      if (log.accion === "DELETE") return `Usuario eliminado: ${nombre}`;
      const cambios = [];
      if (o?.rol !== n?.rol)         cambios.push(`rol: ${o?.rol} → ${n?.rol}`);
      if (o?.activo !== n?.activo)   cambios.push(`activo: ${o?.activo} → ${n?.activo}`);
      if (!o?.deleted_at && n?.deleted_at) cambios.push("desactivado");
      return `Usuario modificado: ${nombre}${cambios.length ? ` (${cambios.join(", ")})` : ""}`;
    }
    default:
      return `${log.tabla} — ${log.accion}`;
  }
}

function formatFecha(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ════════════════════════════════════════════════════════════ */
export function LogsAuditoria({ usuario }) {
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [detalle,      setDetalle]      = useState(null);

  // Filtros
  const [filtroTabla,  setFiltroTabla]  = useState("todas");
  const [filtroAccion, setFiltroAccion] = useState("todas");
  const [fechaDesde,   setFechaDesde]   = useState("");
  const [fechaHasta,   setFechaHasta]   = useState("");

  const cargar = useCallback(() => {
    setLoading(true);
    const partes = ["select=*", "order=created_at.desc", "limit=500"];
    if (filtroTabla  !== "todas") partes.push(`tabla=eq.${filtroTabla}`);
    if (filtroAccion !== "todas") partes.push(`accion=eq.${filtroAccion}`);
    if (fechaDesde)  partes.push(`created_at=gte.${fechaDesde}T00:00:00`);
    if (fechaHasta)  partes.push(`created_at=lte.${fechaHasta}T23:59:59`);
    sb(`logs_auditoria?${partes.join("&")}`, {}, usuario.token)
      .then(data => { setLogs(data || []); setLoading(false); });
  }, [filtroTabla, filtroAccion, fechaDesde, fechaHasta, usuario.token]);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Contadores por tabla ─────────────────────────────── */
  const totalesPorTabla = logs.reduce((acc, l) => {
    acc[l.tabla] = (acc[l.tabla] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>

      {/* ── Resumen por tabla ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {TABLAS_TODAS.map(t => {
          const meta = TABLA_META[t];
          return (
            <div
              key={t}
              onClick={() => setFiltroTabla(filtroTabla === t ? "todas" : t)}
              style={{
                ...S.card,
                padding: "14px 16px",
                borderLeft: `4px solid ${meta.color}`,
                cursor: "pointer",
                opacity: filtroTabla !== "todas" && filtroTabla !== t ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                {totalesPorTabla[t] ?? 0}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Filtros ───────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        {/* Acción */}
        {["todas", "INSERT", "UPDATE", "DELETE"].map(a => (
          <button
            key={a}
            onClick={() => setFiltroAccion(a)}
            style={{
              ...S.btn(filtroAccion === a ? "primary" : "ghost"),
              fontSize: 12, padding: "5px 13px",
              background:  filtroAccion === a ? (ACCION_COLOR[a] || C.accent) : C.surface2,
              color:       filtroAccion === a ? "#fff" : C.textMuted,
              borderColor: filtroAccion === a ? "transparent" : C.border,
            }}
          >
            {a === "todas" ? "Todas" : ACCION_LABEL[a]}
          </button>
        ))}

        {/* Fecha desde/hasta */}
        <input
          type="date" value={fechaDesde}
          onChange={e => setFechaDesde(e.target.value)}
          style={{ ...S.input, width: 140, padding: "6px 10px", fontSize: 13 }}
          title="Desde"
        />
        <input
          type="date" value={fechaHasta}
          onChange={e => setFechaHasta(e.target.value)}
          style={{ ...S.input, width: 140, padding: "6px 10px", fontSize: 13 }}
          title="Hasta"
        />

        <button
          onClick={() => { setFechaDesde(""); setFechaHasta(""); setFiltroTabla("todas"); setFiltroAccion("todas"); }}
          style={{ ...S.btn("ghost"), fontSize: 12, padding: "5px 13px" }}
        >
          Limpiar
        </button>

        <span style={{ marginLeft: "auto", fontSize: 12, color: C.textFaint }}>
          {logs.length} registro{logs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla de logs ─────────────────────────────────── */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>
            Cargando logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>
            Sin registros para los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Fecha", "Tabla", "Acción", "Usuario", "Descripción", "IP"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const meta = TABLA_META[log.tabla] || { label: log.tabla, color: C.textMuted };
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setDetalle(detalle?.id === log.id ? null : log)}
                      style={{ cursor: "pointer", background: detalle?.id === log.id ? C.surface2 : "transparent" }}
                    >
                      <td style={{ ...S.td, fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
                        {formatFecha(log.created_at)}
                      </td>
                      <td style={S.td}>
                        <span style={S.pill(meta.color, meta.color + "20")}>{meta.label}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(ACCION_COLOR[log.accion], ACCION_BG[log.accion])}>
                          {ACCION_LABEL[log.accion] || log.accion}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 13 }}>
                        {log.usuario_nombre || <span style={{ color: C.textFaint }}>sistema</span>}
                      </td>
                      <td style={{ ...S.td, fontSize: 13, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {describir(log)}
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: C.textFaint }}>
                        {log.ip || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Panel de detalle ──────────────────────────────── */}
      {detalle && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{describir(detalle)}</span>
              <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 12 }}>
                {formatFecha(detalle.created_at)}
                {detalle.usuario_nombre ? ` · ${detalle.usuario_nombre}` : ""}
                {detalle.ip ? ` · ${detalle.ip}` : ""}
              </span>
            </div>
            <button
              style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 10px" }}
              onClick={() => setDetalle(null)}
            >
              Cerrar
            </button>
          </div>

          <div style={S.grid2}>
            {detalle.datos_anteriores && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Estado anterior
                </div>
                <pre style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 11, color: C.text, overflow: "auto", margin: 0, maxHeight: 320 }}>
                  {JSON.stringify(detalle.datos_anteriores, null, 2)}
                </pre>
              </div>
            )}
            {detalle.datos_nuevos && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Estado nuevo
                </div>
                <pre style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 11, color: C.text, overflow: "auto", margin: 0, maxHeight: 320 }}>
                  {JSON.stringify(detalle.datos_nuevos, null, 2)}
                </pre>
              </div>
            )}
            {!detalle.datos_anteriores && !detalle.datos_nuevos && (
              <div style={{ color: C.textFaint, fontSize: 13 }}>Sin datos de estado disponibles.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
