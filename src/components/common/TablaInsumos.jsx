import { C, S, Icon, VencBadge, StockBadge } from "../../config/theme";
import { useIsMobile } from "../../hooks/useIsMobile";

export function TablaInsumos({ items, onEdit, onDelete }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos registrados</div>
        ) : items.map(ins => (
          <div key={ins.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{ins.nombre} {ins.dosis && <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 13 }}>{ins.dosis}</span>}</div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 2 }}>{ins.cajon}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}/{ins.minimo} {ins.unidad}</span>
                  <VencBadge v={ins.vencimiento} />
                  <StockBadge ins={ins} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                <button style={{ ...S.btn("ghost"), padding: "8px 10px" }} onClick={() => onEdit(ins)}><Icon name="edit" size={15} color={C.textMuted} /></button>
                <button style={{ ...S.btn("ghost"), padding: "8px 10px" }} onClick={() => onDelete(ins.id)}><Icon name="trash" size={15} color={C.red} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table style={S.table}>
      <thead>
        <tr>
          {["Nombre", "Stock", "Vencimiento", "Estado", ""].map(h => (
            <th key={h} style={S.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos registrados</td></tr>
        ) : items.map(ins => (
          <tr key={ins.id}>
            <td style={S.td}>
              <div style={{ fontWeight: 600 }}>
                {ins.nombre} {ins.dosis && <span style={{ color: C.textMuted, fontWeight: 400 }}>{ins.dosis}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint }}>{ins.cajon}</div>
            </td>
            <td style={S.td}>
              <span style={{ fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}</span>
              <span style={{ fontSize: 11, color: C.textFaint }}> / {ins.minimo} {ins.unidad}</span>
            </td>
            <td style={S.td}>{new Date(ins.vencimiento).toLocaleDateString("es-CL")}</td>
            <td style={S.td}><VencBadge v={ins.vencimiento} /> <StockBadge ins={ins} /></td>
            <td style={S.td}>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => onEdit(ins)}><Icon name="edit" size={13} color={C.textMuted} /></button>
                <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => onDelete(ins.id)}><Icon name="trash" size={13} color={C.red} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
