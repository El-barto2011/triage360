import { useState, useMemo } from "react";

// ─── DATOS REALES DEL BOLSO NARANJA ─────────────────────────────────────────
const MEDICAMENTOS_INYECTABLES = [
  { id: 101, nombre: "Ondansetrón", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2025-11-30" },
  { id: 102, nombre: "Clorfenamina", dosis: "10mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 2, unidad: "amp.", vencimiento: "2026-08-01" },
  { id: 103, nombre: "Viadil", dosis: "5mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 2, unidad: "amp.", vencimiento: "2026-05-15" },
  { id: 104, nombre: "Dexametasona", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 5, minimo: 2, unidad: "amp.", vencimiento: "2026-12-01" },
  { id: 105, nombre: "Metoclopramida", dosis: "10mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 2, unidad: "amp.", vencimiento: "2027-02-01" },
  { id: 106, nombre: "Betametasona", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2025-10-10" },
  { id: 107, nombre: "Esomeprazol", dosis: "40mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 2, unidad: "amp.", vencimiento: "2026-09-01" },
  { id: 108, nombre: "Hidrocortisona", dosis: "100mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 1, unidad: "vial", vencimiento: "2026-07-01" },
  { id: 109, nombre: "Ketorolaco", dosis: "30mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 3, unidad: "amp.", vencimiento: "2026-11-01" },
  { id: 110, nombre: "Ketoprofeno", dosis: "100mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2026-10-01" },
  { id: 111, nombre: "Metamizol", dosis: "1gr", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2026-06-01" },
];

const MEDICAMENTOS_ORALES = [
  { id: 201, nombre: "Ketorolaco S/L", dosis: "30mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2026-10-01" },
  { id: 202, nombre: "Clorfenamina", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 10, minimo: 6, unidad: "comp.", vencimiento: "2027-01-01" },
  { id: 203, nombre: "Ibuprofeno", dosis: "600mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 12, minimo: 8, unidad: "comp.", vencimiento: "2026-12-01" },
  { id: 204, nombre: "Viadil", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2026-08-01" },
  { id: 205, nombre: "Paracetamol", dosis: "500mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 20, minimo: 10, unidad: "comp.", vencimiento: "2027-03-01" },
  { id: 206, nombre: "Loperamida", dosis: "2mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-11-01" },
  { id: 207, nombre: "Celecoxib", dosis: "200mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2026-09-01" },
  { id: 208, nombre: "Prednisona", dosis: "5mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 10, minimo: 6, unidad: "comp.", vencimiento: "2027-02-01" },
  { id: 209, nombre: "Ketoprofeno", dosis: "200mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-10-01" },
  { id: 210, nombre: "Desloratadina", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2027-01-01" },
  { id: 211, nombre: "Ondansetrón", dosis: "4mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-12-01" },
  { id: 212, nombre: "Lágrimas Artificiales", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 2, minimo: 1, unidad: "frasco", vencimiento: "2027-05-01" },
];

const MEDICAMENTOS_AEROSOLES = [
  { id: 301, nombre: "Salbutamol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 2, minimo: 1, unidad: "inhalador", vencimiento: "2026-09-01" },
  { id: 302, nombre: "Femoterol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-07-01" },
  { id: 303, nombre: "Bromuro", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-11-01" },
];

const CARROS_INICIALES = [
  {
    id: 1, nombre: "Carro 1", color: "#00c2a8", evento_asignado: "Torneo Nacional Fútbol Sub-17",
    insumos: [
      { id: 1, nombre: "Gasas estériles 10x10", cajon: "Cajón 1 · Curaciones", stock: 120, minimo: 30, unidad: "unid.", vencimiento: "2025-08-15" },
      { id: 2, nombre: "Vendas elásticas 10cm", cajon: "Cajón 1 · Curaciones", stock: 25, minimo: 10, unidad: "unid.", vencimiento: "2026-12-01" },
      { id: 3, nombre: "Guantes estériles T-M", cajon: "Cajón 1 · Curaciones", stock: 8, minimo: 20, unidad: "pares", vencimiento: "2026-06-30" },
      { id: 4, nombre: "Tegaderm 6x7cm", cajon: "Cajón 1 · Curaciones", stock: 45, minimo: 20, unidad: "unid.", vencimiento: "2027-05-01" },
      { id: 5, nombre: "Cánula EV N°18", cajon: "Cajón 3 · Vías venosas", stock: 15, minimo: 10, unidad: "unid.", vencimiento: "2027-03-15" },
      { id: 6, nombre: "Suero fisiológico 500ml", cajon: "Cajón 3 · Vías venosas", stock: 6, minimo: 8, unidad: "frascos", vencimiento: "2026-01-20" },
      { id: 7, nombre: "Bajada macrogoteo", cajon: "Cajón 3 · Vías venosas", stock: 12, minimo: 8, unidad: "unid.", vencimiento: "2027-06-01" },
    ]
  },
  {
    id: 2, nombre: "Carro 2", color: "#58a6ff", evento_asignado: "Media Maratón de Santiago",
    insumos: [
      { id: 8, nombre: "Mascarilla O2 adulto", cajon: "Cajón 5 · Emergencias", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-01-01" },
      { id: 9, nombre: "AMBU adulto", cajon: "Cajón 5 · Emergencias", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
      { id: 10, nombre: "Electrodos ECG", cajon: "Cajón 5 · Emergencias", stock: 30, minimo: 20, unidad: "unid.", vencimiento: "2026-07-15" },
      { id: 11, nombre: "Bisturí N°10", cajon: "Cajón 4 · Cirugía menor", stock: 8, minimo: 5, unidad: "unid.", vencimiento: "2027-08-01" },
      { id: 12, nombre: "Sutura Nylon 3-0", cajon: "Cajón 4 · Cirugía menor", stock: 12, minimo: 8, unidad: "unid.", vencimiento: "2026-11-01" },
    ]
  },
  {
    id: 3, nombre: "Carro 3", color: "#d29922", evento_asignado: "Sin asignar",
    insumos: [
      { id: 13, nombre: "Gasas estériles 10x10", cajon: "Cajón 1 · Curaciones", stock: 80, minimo: 30, unidad: "unid.", vencimiento: "2026-10-01" },
      { id: 14, nombre: "Vendas elásticas 10cm", cajon: "Cajón 1 · Curaciones", stock: 18, minimo: 10, unidad: "unid.", vencimiento: "2027-01-01" },
      { id: 15, nombre: "Cánula EV N°20", cajon: "Cajón 3 · Vías venosas", stock: 10, minimo: 8, unidad: "unid.", vencimiento: "2027-05-01" },
    ]
  },
  {
    id: 4, nombre: "Carro 4", color: "#f85149", evento_asignado: "Triatlón Región Metropolitana",
    insumos: [
      { id: 16, nombre: "Gasas estériles 10x10", cajon: "Cajón 1 · Curaciones", stock: 100, minimo: 30, unidad: "unid.", vencimiento: "2026-11-01" },
      { id: 17, nombre: "Electrodos ECG", cajon: "Cajón 5 · Emergencias", stock: 20, minimo: 15, unidad: "unid.", vencimiento: "2027-01-01" },
      { id: 18, nombre: "Suero fisiológico 500ml", cajon: "Cajón 3 · Vías venosas", stock: 4, minimo: 6, unidad: "frascos", vencimiento: "2026-04-01" },
    ]
  },
  {
    id: 5, nombre: "Carro 5", color: "#bc8cff", evento_asignado: "Partido Colo-Colo vs U. de Chile",
    insumos: [
      { id: 19, nombre: "Gasas estériles 10x10", cajon: "Cajón 1 · Curaciones", stock: 90, minimo: 30, unidad: "unid.", vencimiento: "2026-09-01" },
      { id: 20, nombre: "AMBU adulto", cajon: "Cajón 5 · Emergencias", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
      { id: 21, nombre: "Bisturí N°10", cajon: "Cajón 4 · Cirugía menor", stock: 5, minimo: 4, unidad: "unid.", vencimiento: "2027-06-01" },
    ]
  },
  { id: 6, nombre: "Carro 6", color: "#3fb950", evento_asignado: "Sin asignar", insumos: [] },
  { id: 7, nombre: "Carro 7", color: "#79c0ff", evento_asignado: "Sin asignar", insumos: [] },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const today = new Date();
const diasHastaVenc = (f) => Math.ceil((new Date(f) - today) / 86400000);
const estadoVenc = (f) => { const d = diasHastaVenc(f); return d < 0 ? "vencido" : d <= 60 ? "proximo" : "ok"; };
const estadoStock = (i) => i.stock === 0 ? "agotado" : i.stock < i.minimo ? "bajo" : "ok";

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117", surface: "#161b22", surface2: "#1c2330", border: "#30363d",
  accent: "#00c2a8", accentDim: "#00c2a820",
  red: "#f85149", redDim: "#f8514918",
  yellow: "#d29922", yellowDim: "#d2992218",
  green: "#3fb950", greenDim: "#3fb95018",
  blue: "#58a6ff", blueDim: "#58a6ff18",
  orange: "#f0883e", orangeDim: "#f0883e18",
  purple: "#bc8cff", purpleDim: "#bc8cff18",
  text: "#e6edf3", textMuted: "#8b949e", textFaint: "#484f58",
};

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex" },
  sidebar: { width: 230, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 },
  logo: { padding: "24px 20px", borderBottom: `1px solid ${C.border}` },
  nav: { padding: "12px", flex: 1 },
  navSection: { fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1.5, padding: "12px 8px 6px" },
  navItem: (a) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: a ? C.accentDim : "transparent", color: a ? C.accent : C.textMuted, fontWeight: a ? 600 : 400, fontSize: 14, border: `1px solid ${a ? C.accent + "30" : "transparent"}`, transition: "all 0.12s" }),
  main: { flex: 1, overflow: "auto", padding: 28 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px", borderBottom: `1px solid ${C.border}` },
  td: { padding: "11px 12px", borderBottom: `1px solid ${C.border}15`, fontSize: 14, verticalAlign: "middle" },
  btn: (v = "primary") => ({ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: v === "ghost" ? `1px solid ${C.border}` : "none", background: v === "primary" ? C.accent : v === "danger" ? C.red : C.surface2, color: v === "ghost" ? C.textMuted : "#fff" }),
  input: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  select: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 14, outline: "none" },
  badge: (c, bg) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: c, background: bg, textTransform: "uppercase", letterSpacing: 0.5 }),
  pill: (c, bg) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: c, background: bg }),
  modal: { position: "fixed", inset: 0, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalBox: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 520, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" },
  formRow: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  tabs: { display: "flex", gap: 4, marginBottom: 24, background: C.surface2, borderRadius: 10, padding: 4 },
  tab: (a, color) => ({ padding: "8px 18px", borderRadius: 7, fontSize: 13, fontWeight: a ? 700 : 500, cursor: "pointer", color: a ? (color || C.text) : C.textMuted, background: a ? C.surface : "transparent", border: "none", transition: "all 0.12s", position: "relative" }),
};

const icons = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  carro: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z",
  bolso: "M20 6h-2.18c.07-.44.18-.88.18-1a3 3 0 0 0-6 0c0 .12.11.56.18 1H10c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
  alert: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  event: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  warn: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};
const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={icons[name] || icons.alert} />
  </svg>
);

// ─── BADGES ──────────────────────────────────────────────────────────────────
const VencBadge = ({ v }) => {
  const s = estadoVenc(v);
  if (s === "vencido") return <span style={S.badge(C.red, C.redDim)}>Vencido</span>;
  if (s === "proximo") return <span style={S.badge(C.yellow, C.yellowDim)}>{diasHastaVenc(v)}d</span>;
  return <span style={S.badge(C.green, C.greenDim)}>OK</span>;
};
const StockBadge = ({ ins }) => {
  const s = estadoStock(ins);
  if (s === "agotado") return <span style={S.pill(C.red, C.redDim)}>Agotado</span>;
  if (s === "bajo") return <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span>;
  return <span style={S.pill(C.green, C.greenDim)}>OK</span>;
};

// ─── TABLA INSUMOS ───────────────────────────────────────────────────────────
function TablaInsumos({ items, onEdit, onDelete }) {
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

// ─── MODAL INSUMO ────────────────────────────────────────────────────────────
function ModalInsumo({ form, setForm, onSave, onClose, titulo, showDosis = false, cajones = [] }) {
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

// ─── VISTA CARROS ────────────────────────────────────────────────────────────
function VistaCarros({ carros, setCarros }) {
  const [carroSel, setCarroSel] = useState(carros[0]?.id);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const carro = carros.find(c => c.id === carroSel);
  const alertasCarro = (c) => c.insumos.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const abrirNuevo = () => {
    setForm({ nombre: "", cajon: "Cajón 1 · Curaciones", stock: "", minimo: "", unidad: "unid.", vencimiento: "" });
    setModal("nuevo");
  };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = () => {
    if (!form.nombre || !form.vencimiento) return;
    setCarros(prev => prev.map(c => {
      if (c.id !== carroSel) return c;
      if (modal === "nuevo") return { ...c, insumos: [...c.insumos, { ...form, id: Date.now(), stock: +form.stock, minimo: +form.minimo }] };
      return { ...c, insumos: c.insumos.map(i => i.id === form.id ? { ...form, stock: +form.stock, minimo: +form.minimo } : i) };
    }));
    setModal(null);
  };

  const eliminar = (insId) => setCarros(prev => prev.map(c => c.id === carroSel ? { ...c, insumos: c.insumos.filter(i => i.id !== insId) } : c));

  const editarEvento = (carroId) => {
    const ev = prompt("Evento asignado:", carros.find(c => c.id === carroId)?.evento_asignado);
    if (ev !== null) setCarros(prev => prev.map(c => c.id === carroId ? { ...c, evento_asignado: ev || "Sin asignar" } : c));
  };

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* Lista carros */}
      <div style={{ width: 185, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Seleccionar carro</div>
        {carros.map(c => {
          const alertas = alertasCarro(c);
          const activo = carroSel === c.id;
          return (
            <div key={c.id} onClick={() => setCarroSel(c.id)} style={{ cursor: "pointer", background: activo ? C.surface : "transparent", border: `1px solid ${activo ? c.color + "50" : C.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 7, borderLeft: `3px solid ${c.color}`, transition: "all 0.12s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: activo ? C.text : C.textMuted }}>{c.nombre}</span>
                {alertas > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{alertas}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{c.insumos.length} insumos</div>
              <div style={{ fontSize: 10, marginTop: 2, color: c.evento_asignado === "Sin asignar" ? C.textFaint : c.color, fontWeight: 500 }}>
                {c.evento_asignado === "Sin asignar" ? "Sin evento" : "📍 " + c.evento_asignado.slice(0, 20) + (c.evento_asignado.length > 20 ? "…" : "")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle carro */}
      <div style={{ flex: 1 }}>
        {carro && (
          <>
            <div style={{ ...S.card, borderLeft: `3px solid ${carro.color}`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: carro.color }}>{carro.nombre}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                    Evento asignado: <span style={{ color: carro.evento_asignado === "Sin asignar" ? C.textFaint : C.text, fontWeight: 600 }}>{carro.evento_asignado}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => editarEvento(carro.id)}>✏️ Evento</button>
                  <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Insumo</button>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <TablaInsumos items={carro.insumos} onEdit={abrirEditar} onDelete={eliminar} />
            </div>
          </>
        )}
      </div>

      {modal && (
        <ModalInsumo
          form={form} setForm={setForm} onSave={guardar} onClose={() => setModal(null)}
          titulo={modal === "nuevo" ? `Nuevo insumo — ${carro?.nombre}` : "Editar insumo"}
          cajones={["Cajón 1 · Curaciones", "Cajón 2 · Inmovilización", "Cajón 3 · Vías venosas", "Cajón 4 · Cirugía menor", "Cajón 5 · Emergencias"]}
        />
      )}
    </div>
  );
}

// ─── VISTA BOLSO NARANJA ─────────────────────────────────────────────────────
function VistaBolsoNaranja() {
  const [tabActiva, setTabActiva] = useState("inyectables");
  const [inyectables, setInyectables] = useState(MEDICAMENTOS_INYECTABLES);
  const [orales, setOrales] = useState(MEDICAMENTOS_ORALES);
  const [aerosoles, setAerosoles] = useState(MEDICAMENTOS_AEROSOLES);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const tabs = [
    { id: "inyectables", emoji: "💉", label: "Inyectables", color: C.blue, data: inyectables, set: setInyectables, caja: "Caja 1 · Inyectables", unidad: "amp." },
    { id: "orales", emoji: "💊", label: "Orales", color: C.green, data: orales, set: setOrales, caja: "Caja 2 · Orales", unidad: "comp." },
    { id: "aerosoles", emoji: "🌬️", label: "Aerosoles", color: C.purple, data: aerosoles, set: setAerosoles, caja: "Caja 3 · Aerosoles", unidad: "inhalador" },
  ];
  const tab = tabs.find(t => t.id === tabActiva);
  const alertas = (data) => data.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const abrirNuevo = () => {
    setForm({ nombre: "", dosis: "", tipo: tabActiva, caja: tab.caja, stock: "", minimo: "", unidad: tab.unidad, vencimiento: "" });
    setModal("nuevo");
  };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = () => {
    if (!form.nombre || !form.vencimiento) return;
    const nuevo = { ...form, id: Date.now(), stock: +form.stock, minimo: +form.minimo };
    tab.set(prev => modal === "nuevo" ? [...prev, nuevo] : prev.map(i => i.id === form.id ? nuevo : i));
    setModal(null);
  };

  const eliminar = (id) => tab.set(prev => prev.filter(i => i.id !== id));

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.orange}12, ${C.surface})`, borderColor: C.orange + "40", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>🟠 Bolso Naranja</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Medicamentos independientes del carro · 3 cajas internas</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {tabs.map(t => (
              <div key={t.id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: alertas(t.data) > 0 ? C.yellow : t.color }}>{t.data.length}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{t.emoji} {t.label}</div>
                {alertas(t.data) > 0 && <div style={{ fontSize: 10, color: C.yellow }}>⚠️ {alertas(t.data)} alertas</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={S.tab(tabActiva === t.id, t.color)} onClick={() => setTabActiva(t.id)}>
            {t.emoji} {t.label}
            {alertas(t.data) > 0 && (
              <span style={{ marginLeft: 6, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "0 4px" }}>
                {alertas(t.data)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <span style={{ fontWeight: 700, color: tab.color }}>{tab.emoji} {tab.label}</span>
            <span style={{ color: C.textMuted, fontSize: 13, marginLeft: 8 }}>— {tab.caja}</span>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Agregar</button>
        </div>
        <TablaInsumos items={tab.data} onEdit={abrirEditar} onDelete={eliminar} />
      </div>

      {modal && (
        <ModalInsumo
          form={form} setForm={setForm} onSave={guardar} onClose={() => setModal(null)}
          titulo={modal === "nuevo" ? `Nuevo — ${tab.emoji} ${tab.label}` : "Editar medicamento"}
          showDosis={true}
        />
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ carros }) {
  const todosInsumos = carros.flatMap(c => c.insumos);
  const todosMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const todo = [...todosInsumos, ...todosMeds];
  const alertasVenc = todo.filter(i => estadoVenc(i.vencimiento) !== "ok");
  const stockBajo = todo.filter(i => estadoStock(i) !== "ok");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={S.title}>Dashboard Operacional</div>
        <div style={S.subtitle}>SGTRUMAO · {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Carros activos", val: carros.length, color: C.accent },
          { label: "Insumos en carros", val: todosInsumos.length, color: C.blue },
          { label: "Medicamentos bolso", val: todosMeds.length, color: C.orange },
          { label: "Alertas vencimiento", val: alertasVenc.length, color: alertasVenc.length > 0 ? C.red : C.green },
          { label: "Stock bajo mínimo", val: stockBajo.length, color: stockBajo.length > 0 ? C.yellow : C.green },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

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

      {/* Alertas */}
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

// ─── ATENCIONES ──────────────────────────────────────────────────────────────
const PROFESIONES = ["Médico", "Enfermero/a", "Paramédico", "Kinesiólogo/a", "Masoterapeuta"];
const TIPOS_ATENCION = ["Consulta general", "Urgencia", "Traumatología", "Kinesiología", "Masoterapia", "Evaluación", "Derivación"];

const ATENCIONES_INICIALES = [
  {
    id: 1, evento: "Media Maratón de Santiago", fecha: "2026-02-20",
    paciente: "Juan Pérez", rut: "12.345.678-9", edad: 34,
    profesion: "Médico", profesional: "Dr. Rodrigo Soto",
    tipo: "Urgencia", hora_ingreso: "10:30", hora_egreso: "11:15",
    diagnostico: "Contusión rodilla derecha post caída",
    tratamiento: "Inmovilización, frío local, reposo",
    insumos_usados: "Venda elástica x1, gasas x4, hielo",
    derivacion: "No", observaciones: ""
  },
  {
    id: 2, evento: "Media Maratón de Santiago", fecha: "2026-02-20",
    paciente: "María González", rut: "15.678.901-2", edad: 28,
    profesion: "Paramédico", profesional: "Carlos Muñoz",
    tipo: "Consulta general", hora_ingreso: "11:00", hora_egreso: "11:20",
    diagnostico: "Deshidratación leve",
    tratamiento: "Hidratación oral, reposo",
    insumos_usados: "Suero oral x1",
    derivacion: "No", observaciones: "Paciente evolucionó bien"
  },
];

function VistaAtenciones({ atenciones, setAtenciones, carros }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filtroEvento, setFiltroEvento] = useState("Todos");
  const [filtroProfesion, setFiltroProfesion] = useState("Todas");
  const [fichaVer, setFichaVer] = useState(null);

  const eventos = ["Todos", ...new Set(carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => c.evento_asignado))];

  const filtradas = atenciones.filter(a => {
    const matchEv = filtroEvento === "Todos" || a.evento === filtroEvento;
    const matchProf = filtroProfesion === "Todas" || a.profesion === filtroProfesion;
    return matchEv && matchProf;
  });

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const abrirNueva = () => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    setForm({
      evento: carros.find(c => c.evento_asignado !== "Sin asignar")?.evento_asignado || "",
      fecha: ahora.toISOString().slice(0, 10),
      paciente: "", rut: "", edad: "",
      profesion: "Médico", profesional: "",
      tipo: "Consulta general",
      hora_ingreso: `${hh}:${mm}`, hora_egreso: "",
      diagnostico: "", tratamiento: "",
      insumos_usados: "", derivacion: "No", observaciones: ""
    });
    setModal("nueva");
  };

  const guardar = () => {
    if (!form.paciente || !form.profesional) return;
    if (modal === "nueva") {
      setAtenciones(prev => [...prev, { ...form, id: Date.now(), edad: +form.edad }]);
    } else {
      setAtenciones(prev => prev.map(a => a.id === form.id ? { ...form, edad: +form.edad } : a));
    }
    setModal(null);
  };

  const eliminar = (id) => setAtenciones(prev => prev.filter(a => a.id !== id));

  const coloresProfesion = {
    "Médico": C.red, "Enfermero/a": C.blue, "Paramédico": C.orange,
    "Kinesiólogo/a": C.green, "Masoterapeuta": C.purple
  };

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {PROFESIONES.map(p => {
          const count = atenciones.filter(a => a.profesion === p).length;
          const color = coloresProfesion[p];
          return (
            <div key={p} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{p}</div>
            </div>
          );
        })}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{atenciones.length}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>Total atenciones</div>
        </div>
      </div>

      {/* Filtros y botón */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select style={S.select} value={filtroEvento} onChange={e => setFiltroEvento(e.target.value)}>
          {eventos.map(e => <option key={e}>{e}</option>)}
        </select>
        <select style={S.select} value={filtroProfesion} onChange={e => setFiltroProfesion(e.target.value)}>
          {["Todas", ...PROFESIONES].map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button style={S.btn("primary")} onClick={abrirNueva}>+ Nueva atención</button>
      </div>

      {/* Tabla */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Paciente", "Evento", "Profesional", "Tipo", "Horario", "Diagnóstico", "Derivación", ""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 36 }}>Sin atenciones registradas</td></tr>
            ) : filtradas.map(a => (
              <tr key={a.id}>
                <td style={S.td}>
                  <div style={{ fontWeight: 600 }}>{a.paciente}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{a.rut} · {a.edad} años</div>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{a.evento}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{new Date(a.fecha).toLocaleDateString("es-CL")}</div>
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge(coloresProfesion[a.profesion], coloresProfesion[a.profesion] + "20"), marginBottom: 4, display: "inline-flex" }}>{a.profesion}</span>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{a.profesional}</div>
                </td>
                <td style={S.td}><span style={S.pill(C.blue, C.blueDim)}>{a.tipo}</span></td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{a.hora_ingreso} → {a.hora_egreso || "—"}</div>
                </td>
                <td style={S.td}><span style={{ fontSize: 13, color: C.textMuted }}>{a.diagnostico.slice(0, 35)}{a.diagnostico.length > 35 ? "…" : ""}</span></td>
                <td style={S.td}>
                  {a.derivacion === "No"
                    ? <span style={S.pill(C.green, C.greenDim)}>No</span>
                    : <span style={S.pill(C.red, C.redDim)}>{a.derivacion}</span>}
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: 11 }} onClick={() => setFichaVer(a)}>Ver</button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => { setForm({ ...a }); setModal("editar"); }}><Icon name="edit" size={12} color={C.textMuted} /></button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => eliminar(a.id)}><Icon name="trash" size={12} color={C.red} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva/editar atención */}
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nueva" ? "Nueva Atención" : "Editar Atención"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>

            {/* Evento */}
            <div style={{ background: C.surface2, borderRadius: 8, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: C.textMuted }}>
              <div style={S.formLabel}>Evento</div>
              <select style={{ ...S.select, width: "100%" }} value={form.evento || ""} onChange={e => F("evento", e.target.value)}>
                {carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => (
                  <option key={c.id}>{c.evento_asignado}</option>
                ))}
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Paciente */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos del Paciente</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre completo</label>
                <input style={S.input} value={form.paciente || ""} onChange={e => F("paciente", e.target.value)} placeholder="Nombre del paciente" />
              </div>
              <div style={S.grid2}>
                <div style={S.formRow}>
                  <label style={S.formLabel}>RUT</label>
                  <input style={S.input} value={form.rut || ""} onChange={e => F("rut", e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div style={S.formRow}>
                  <label style={S.formLabel}>Edad</label>
                  <input style={S.input} type="number" value={form.edad || ""} onChange={e => F("edad", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Profesional */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional que Atiende</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Profesión</label>
                <select style={{ ...S.select, width: "100%" }} value={form.profesion || "Médico"} onChange={e => F("profesion", e.target.value)}>
                  {PROFESIONES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del profesional</label>
                <input style={S.input} value={form.profesional || ""} onChange={e => F("profesional", e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>

            {/* Atención */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos de la Atención</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo</label>
                <select style={{ ...S.select, width: "100%" }} value={form.tipo || ""} onChange={e => F("tipo", e.target.value)}>
                  {TIPOS_ATENCION.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora ingreso</label>
                <input style={S.input} type="time" value={form.hora_ingreso || ""} onChange={e => F("hora_ingreso", e.target.value)} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora egreso</label>
                <input style={S.input} type="time" value={form.hora_egreso || ""} onChange={e => F("hora_egreso", e.target.value)} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Diagnóstico / Motivo de consulta</label>
              <input style={S.input} value={form.diagnostico || ""} onChange={e => F("diagnostico", e.target.value)} placeholder="Ej: Contusión rodilla derecha" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Tratamiento / Procedimiento realizado</label>
              <input style={S.input} value={form.tratamiento || ""} onChange={e => F("tratamiento", e.target.value)} placeholder="Ej: Inmovilización, frío local" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Insumos utilizados</label>
              <input style={S.input} value={form.insumos_usados || ""} onChange={e => F("insumos_usados", e.target.value)} placeholder="Ej: Venda x1, gasas x4" />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Derivación</label>
                <select style={{ ...S.select, width: "100%" }} value={form.derivacion || "No"} onChange={e => F("derivacion", e.target.value)}>
                  {["No", "Hospital", "Clínica", "SAPU", "Ambulancia", "Otro"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Observaciones</label>
                <input style={S.input} value={form.observaciones || ""} onChange={e => F("observaciones", e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar atención</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ficha completa */}
      {fichaVer && (
        <div style={S.modal} onClick={() => setFichaVer(null)}>
          <div style={{ ...S.modalBox, width: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Ficha de Atención</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFichaVer(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>{fichaVer.evento} · {new Date(fichaVer.fecha).toLocaleDateString("es-CL")}</div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Paciente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Nombre", fichaVer.paciente], ["RUT", fichaVer.rut], ["Edad", fichaVer.edad + " años"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Profesión", fichaVer.profesion], ["Nombre", fichaVer.profesional], ["Tipo atención", fichaVer.tipo]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Atención</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["Hora ingreso", fichaVer.hora_ingreso], ["Hora egreso", fichaVer.hora_egreso || "—"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
              {[["Diagnóstico", fichaVer.diagnostico], ["Tratamiento", fichaVer.tratamiento], ["Insumos usados", fichaVer.insumos_usados]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{l}</div>
                  <div style={{ marginTop: 2, fontSize: 14 }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Derivación:</span>
              {fichaVer.derivacion === "No"
                ? <span style={S.badge(C.green, C.greenDim)}>Sin derivación</span>
                : <span style={S.badge(C.red, C.redDim)}>Derivado → {fichaVer.derivacion}</span>}
              {fichaVer.observaciones && <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>· {fichaVer.observaciones}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [carros, setCarros] = useState(CARROS_INICIALES);
  const [atenciones, setAtenciones] = useState(ATENCIONES_INICIALES);

  const allMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const alertCarros = carros.flatMap(c => c.insumos).filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
  const alertBolso = allMeds.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const nav = [
    { section: "General" },
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { section: "Inventario" },
    { id: "carros", label: "Carros Clínicos", icon: "carro", badge: alertCarros },
    { id: "bolso", label: "Bolso Naranja 🟠", icon: "bolso", badge: alertBolso },
    { section: "Operación" },
    { id: "atenciones", label: "Atenciones 🏥", icon: "event" },
    { id: "eventos", label: "Eventos", icon: "event" },
    { id: "reportes", label: "Reportes", icon: "report" },
  ];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: 1, lineHeight: 1 }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Sistema Clínico Integral</div>
        </div>
        <nav style={S.nav}>
          {nav.map((item, i) =>
            item.section ? (
              <div key={i} style={S.navSection}>{item.section}</div>
            ) : (
              <div key={item.id} style={S.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
                <Icon name={item.icon} size={15} color={tab === item.id ? C.accent : C.textMuted} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{item.badge}</span>}
              </div>
            )
          )}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Powered by</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>SGTRUMAO</div>
          
          <div style={{ fontSize: 10, color: C.textFaint, marginTop: 4 }}>v2.0 · 2026</div>
        </div>
      </div>

      <main style={S.main}>
        {tab === "dashboard" && <Dashboard carros={carros} />}
        {tab === "carros" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Carros Clínicos</div>
              <div style={S.subtitle}>7 carros · cada uno asignado a su evento</div>
            </div>
            <VistaCarros carros={carros} setCarros={setCarros} />
          </div>
        )}
        {tab === "bolso" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso Naranja 🟠</div>
              <div style={S.subtitle}>Medicamentos separados del carro · 3 cajas internas</div>
            </div>
            <VistaBolsoNaranja />
          </div>
        )}
        {tab === "atenciones" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Atenciones en Carpa Médica 🏥</div>
              <div style={S.subtitle}>Registro por evento · Médico, Enfermero/a, Paramédico, Kinesiólogo/a, Masoterapeuta</div>
            </div>
            <VistaAtenciones atenciones={atenciones} setAtenciones={setAtenciones} carros={carros} />
          </div>
        )}
        {tab === "eventos" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Eventos</div>
              <div style={S.subtitle}>Carros asignados por evento</div>
            </div>
            <div style={S.card}>
              <table style={S.table}>
                <thead>
                  <tr>{["Evento", "Carro asignado", "Insumos", "Estado"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => (
                    <tr key={c.id}>
                      <td style={S.td}><strong>{c.evento_asignado}</strong></td>
                      <td style={S.td}><span style={{ color: c.color, fontWeight: 700 }}>{c.nombre}</span></td>
                      <td style={S.td}>{c.insumos.length} insumos</td>
                      <td style={S.td}><span style={S.badge(C.blue, C.blueDim)}>Programado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "reportes" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Reportes</div>
              <div style={S.subtitle}>Resumen del inventario completo</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🚑 Insumos por Carro</div>
                {carros.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                    <span style={{ color: c.color, fontWeight: 600 }}>{c.nombre}</span>
                    <span style={{ color: C.textMuted }}>{c.insumos.length} insumos · {c.evento_asignado === "Sin asignar" ? "Sin evento" : c.evento_asignado.slice(0, 25)}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🟠 Bolso Naranja</div>
                {[
                  { label: "💉 Inyectables", count: MEDICAMENTOS_INYECTABLES.length, color: C.blue },
                  { label: "💊 Orales", count: MEDICAMENTOS_ORALES.length, color: C.green },
                  { label: "🌬️ Aerosoles", count: MEDICAMENTOS_AEROSOLES.length, color: C.purple },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: C.textMuted }}>{count} medicamentos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
