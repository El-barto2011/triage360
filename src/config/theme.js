export const C = {
  bg: "#0d1117", surface: "#161b22", surface2: "#1c2330", border: "#30363d",
  accent: "#00c2a8", accentDim: "#00c2a820",
  red: "#f85149", redDim: "#f8514918",
  yellow: "#d29922", yellowDim: "#d2992218",
  green: "#3fb950", greenDim: "#3fb95018",
  blue: "#58a6ff", blueDim: "#58a6ff18",
  orange: "#f0883e", orangeDim: "#f0883e18",
  purple: "#bc8cff", purpleDim: "#bc8cff18",
  text: "#e6edf3", textMuted: "#8b949e", textFaint: "#6e7681",
};

export const S = {
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

export const icons = {
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
  med: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z",
  arrowRight: "M8 5v14l11-7z",
  arrowLeft: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
};

export const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={icons[name] || icons.alert} />
  </svg>
);

export const VencBadge = ({ v }) => {
  const today = new Date();
  const diasHastaVenc = (f) => Math.ceil((new Date(f) - today) / 86400000);
  const estadoVenc = (f) => { const d = diasHastaVenc(f); return d < 0 ? "vencido" : d <= 60 ? "proximo" : "ok"; };
  const s = estadoVenc(v);
  if (s === "vencido") return <span style={S.badge(C.red, C.redDim)}>Vencido</span>;
  if (s === "proximo") return <span style={S.badge(C.yellow, C.yellowDim)}>{diasHastaVenc(v)}d</span>;
  return <span style={S.badge(C.green, C.greenDim)}>OK</span>;
};

export const StockBadge = ({ ins }) => {
  const estadoStock = (i) => i.stock === 0 ? "agotado" : i.stock < i.minimo ? "bajo" : "ok";
  const s = estadoStock(ins);
  if (s === "agotado") return <span style={S.pill(C.red, C.redDim)}>Agotado</span>;
  if (s === "bajo") return <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span>;
  return <span style={S.pill(C.green, C.greenDim)}>OK</span>;
};
