import { useState } from "react";
import { C, S, Icon } from "../../config/theme";
import { CATEGORIAS_INSUMOS } from "../../config/constants";

const CATS_EDICION = CATEGORIAS_INSUMOS.filter(c => c !== "Todos");

export function ModalAgregarInsumo({ tipo, onClose, onSave }) {
  const initForm = () => {
    if (tipo === "medicamento") return { nombre: "", dosis: "", tipo: "inyectable", unidad: "amp.", stock: 0, minimo: 1, precio_unitario: 0 };
    if (tipo === "kines")       return { nombre: "", unidad: "", cantidad_por_bolso: 1, precio_unitario: 0, observaciones: "" };
    return { nombre: "", categoria: "Instrumental", unidad: "", precio_unitario: 0, proveedor: "", observaciones: "" };
  };

  const [form, setForm] = useState(initForm);
  const [guardando, setGuardando] = useState(false);

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await onSave(form);
    setGuardando(false);
  };

  const titulo =
    tipo === "medicamento" ? "➕ Agregar Medicamento" :
    tipo === "kines"       ? "➕ Agregar Insumo al Bolso Kines" :
                             "➕ Agregar Insumo General";

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalBox, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{titulo}</div>
          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}>
            <Icon name="close" size={20} color={C.textMuted} />
          </button>
        </div>

        <div style={S.formRow}>
          <label style={S.formLabel}>Nombre *</label>
          <input
            style={S.input}
            value={form.nombre}
            onChange={e => f("nombre", e.target.value)}
            placeholder="Nombre del insumo"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          />
        </div>

        {tipo === "medicamento" && (
          <>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Dosis</label>
                <input style={S.input} value={form.dosis} onChange={e => f("dosis", e.target.value)} placeholder="Ej: 500mg" />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo</label>
                <select style={{ ...S.select, width: "100%" }} value={form.tipo} onChange={e => f("tipo", e.target.value)}>
                  {["inyectable", "oral", "aerosol"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Unidad</label>
                <input style={S.input} value={form.unidad} onChange={e => f("unidad", e.target.value)} placeholder="amp., comp., inhalador..." />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Precio Unitario (CLP)</label>
                <input style={S.input} type="number" min="0" value={form.precio_unitario} onChange={e => f("precio_unitario", Number(e.target.value))} />
              </div>
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Stock Inicial</label>
                <input style={S.input} type="number" min="0" value={form.stock} onChange={e => f("stock", Number(e.target.value))} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Stock Mínimo</label>
                <input style={S.input} type="number" min="0" value={form.minimo} onChange={e => f("minimo", Number(e.target.value))} />
              </div>
            </div>
          </>
        )}

        {tipo === "kines" && (
          <>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Unidad</label>
                <input style={S.input} value={form.unidad} onChange={e => f("unidad", e.target.value)} placeholder="unid., ml, cm..." />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Cantidad por Bolso</label>
                <input style={S.input} type="number" min="0" value={form.cantidad_por_bolso} onChange={e => f("cantidad_por_bolso", Number(e.target.value))} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Precio Unitario (CLP)</label>
              <input style={S.input} type="number" min="0" value={form.precio_unitario} onChange={e => f("precio_unitario", Number(e.target.value))} />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea style={{ ...S.input, minHeight: 64, resize: "vertical" }} value={form.observaciones} onChange={e => f("observaciones", e.target.value)} placeholder="Opcional..." />
            </div>
          </>
        )}

        {tipo === "general" && (
          <>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Categoría</label>
                <select style={{ ...S.select, width: "100%" }} value={form.categoria} onChange={e => f("categoria", e.target.value)}>
                  {CATS_EDICION.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Unidad</label>
                <input style={S.input} value={form.unidad} onChange={e => f("unidad", e.target.value)} placeholder="unid., ml, caja..." />
              </div>
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Precio Unitario (CLP)</label>
                <input style={S.input} type="number" min="0" value={form.precio_unitario} onChange={e => f("precio_unitario", Number(e.target.value))} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Proveedor</label>
                <input style={S.input} value={form.proveedor} onChange={e => f("proveedor", e.target.value)} placeholder="Nombre del proveedor" />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea style={{ ...S.input, minHeight: 64, resize: "vertical" }} value={form.observaciones} onChange={e => f("observaciones", e.target.value)} placeholder="Opcional..." />
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={S.btn("ghost")} onClick={onClose}>Cancelar</button>
          <button
            style={{ ...S.btn("primary"), opacity: guardando || !form.nombre.trim() ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={guardando || !form.nombre.trim()}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
