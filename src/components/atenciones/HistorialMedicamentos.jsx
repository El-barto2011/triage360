import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";

const ACCION_LABEL = { INSERT: "Nuevo", UPDATE: "Modificado", DELETE: "Eliminado" };
const ACCION_COLOR = { INSERT: C.green, UPDATE: C.accent, DELETE: C.red };
const ACCION_BG    = { INSERT: C.greenDim, UPDATE: C.accentDim, DELETE: C.redDim };

function formatFecha(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${d.toLocaleDateString("es-CL")} ${d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
}

function getMeds(datos) {
  const arr = datos?.medicamentos_administrados;
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  return arr.map(m => {
    const nombre = m.nombre || m.medicamento || "?";
    const extras = [m.dosis && `${m.dosis}`, m.via && m.via, m.cantidad > 1 && `x${m.cantidad}`]
      .filter(Boolean).join(" · ");
    return extras ? `${nombre} (${extras})` : nombre;
  }).join(", ");
}

function getCambios(row) {
  if (row.accion !== "UPDATE" || !row.datos_anteriores || !row.datos_nuevos) return null;
  const old = row.datos_anteriores;
  const nw  = row.datos_nuevos;
  const cambios = [];
  if (JSON.stringify(old.medicamentos_administrados) !== JSON.stringify(nw.medicamentos_administrados))
    cambios.push("medicamentos");
  if (JSON.stringify(old.insumos_administracion) !== JSON.stringify(nw.insumos_administracion))
    cambios.push("insumos");
  if (old.observaciones !== nw.observaciones)
    cambios.push("observaciones");
  if (old.administrador_nombre !== nw.administrador_nombre)
    cambios.push("administrador");
  return cambios.length ? cambios.join(", ") : "sin diferencias detectadas";
}

export function HistorialMedicamentos({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState("todos");
  const [detalle, setDetalle]     = useState(null);

  useEffect(() => {
    setLoading(true);
    sb(
      "historial_administracion_medicamentos?select=*&order=created_at.desc&limit=300",
      {},
      usuario.token
    ).then(data => {
      setHistorial(data || []);
      setLoading(false);
    });
  }, [usuario]);

  const filas = filtro === "todos"
    ? historial
    : historial.filter(r => r.accion === filtro);

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {["todos", "INSERT", "UPDATE", "DELETE"].map(f => (
          <button
            key={f}
            style={{
              ...S.btn(filtro === f ? "primary" : "ghost"),
              fontSize: 12,
              padding: "6px 14px",
              background: filtro === f
                ? (f === "todos" ? C.accent : ACCION_COLOR[f] || C.accent)
                : C.surface2,
              color: filtro === f ? "#fff" : C.textMuted,
              borderColor: filtro === f ? "transparent" : C.border,
            }}
            onClick={() => setFiltro(f)}
          >
            {f === "todos" ? "Todos" : ACCION_LABEL[f]}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.textFaint }}>
          {filas.length} registro{filas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>
            Cargando historial...
          </div>
        ) : filas.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>
            No hay registros de historial aún.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Fecha", "Acción", "Medicamentos", "Administrador", "Cambios"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map(row => {
                  const datos = row.accion === "DELETE" ? row.datos_anteriores : row.datos_nuevos;
                  const cambios = getCambios(row);
                  return (
                    <tr
                      key={row.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetalle(detalle?.id === row.id ? null : row)}
                    >
                      <td style={{ ...S.td, fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
                        {formatFecha(row.created_at)}
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(ACCION_COLOR[row.accion], ACCION_BG[row.accion])}>
                          {ACCION_LABEL[row.accion] || row.accion}
                        </span>
                      </td>
                      <td style={{ ...S.td, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getMeds(datos)}
                      </td>
                      <td style={{ ...S.td, fontSize: 13 }}>
                        {row.usuario_nombre || "—"}
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: cambios ? C.yellow : C.textFaint }}>
                        {row.accion === "UPDATE" ? (cambios || "—") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel de detalle */}
      {detalle && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Detalle — registro #{detalle.administracion_id} · {formatFecha(detalle.created_at)}
            </span>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Estado anterior
                </div>
                <pre style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 11, color: C.text, overflow: "auto", margin: 0 }}>
                  {JSON.stringify(detalle.datos_anteriores, null, 2)}
                </pre>
              </div>
            )}
            {detalle.datos_nuevos && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Estado nuevo
                </div>
                <pre style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 11, color: C.text, overflow: "auto", margin: 0 }}>
                  {JSON.stringify(detalle.datos_nuevos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
