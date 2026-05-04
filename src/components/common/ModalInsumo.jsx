import { C, S, Icon } from "../../config/theme";

export function ModalInsumo({ form, setForm, onSave, onClose, titulo, showDosis = false, cajones = [] }) {
  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{titulo}</div>
          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><Icon name="close" size={20} color={C.textMuted} /></button>
        </div>
        <div style={S.formRow}>
          <label style={S.formLabel}>Nombre</label>
          <input style={S.input} value={form.nombre || ""} onChange={e => F("nombre", e.target.value)} />
        </div>
        {showDosis && (
          <div style={S.formRow}>
            <label style={S.formLabel}>Dosis / Presentación</label>
            <input style={S.input} value={form.dosis || ""} onChange={e => F("dosis", e.target.value)} placeholder="Ej: 500mg, Puff" />
          </div>
        )}
        {cajones.length > 0 && (
          <div style={S.formRow}>
            <label style={S.formLabel}>Cajón</label>
            <select style={{ ...S.select, width: "100%" }} value={form.cajon || ""} onChange={e => F("cajon", e.target.value)}>
              {cajones.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div style={S.grid2}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Stock actual</label>
            <input style={S.input} type="number" value={form.stock || ""} onChange={e => F("stock", e.target.value)} />
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Stock mínimo</label>
            <input style={S.input} type="number" value={form.minimo || ""} onChange={e => F("minimo", e.target.value)} />
          </div>
        </div>
        <div style={S.grid2}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Unidad</label>
            <select style={{ ...S.select, width: "100%" }} value={form.unidad || "unid."} onChange={e => F("unidad", e.target.value)}>
              {["unid.", "amp.", "comp.", "frascos", "pares", "vial", "inhalador", "cajas"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Vencimiento</label>
            <input style={S.input} type="date" value={form.vencimiento || ""} onChange={e => F("vencimiento", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btn("ghost")} onClick={onClose}>Cancelar</button>
          <button style={S.btn("primary")} onClick={onSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
