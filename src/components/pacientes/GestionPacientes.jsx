import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";
import { toast } from "../ui/use-toast";
import { confirmDialog } from "../ui/confirm";

/* Normaliza nombre para detectar duplicados (sin acentos, minúsculas, espacios colapsados) */
const normNombre = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

export function GestionPacientes({ usuario }) {
  const [pacientes, setPacientes] = useState([]);
  const [conteos, setConteos]     = useState({}); // paciente_id -> total atenciones
  const [loading, setLoading]     = useState(true);
  const [fusionando, setFusionando] = useState(false);
  const [principalSel, setPrincipalSel] = useState({}); // grupoKey -> paciente_id principal

  const cargar = async () => {
    setLoading(true);
    const [pac, med, kine, maso] = await Promise.all([
      sb("pacientes?select=id,identificacion,tipo_identificacion,nombre,edad,alergias,antecedentes&order=nombre", {}, usuario?.token),
      sb("atenciones_medicas?deleted_at=is.null&select=paciente_id", {}, usuario?.token),
      sb("atenciones_kinesiologia?deleted_at=is.null&select=paciente_id", {}, usuario?.token),
      sb("fichas_masoterapia?deleted_at=is.null&select=paciente_id", {}, usuario?.token),
    ]);
    const c = {};
    [...(med || []), ...(kine || []), ...(maso || [])].forEach(r => {
      if (r.paciente_id != null) c[r.paciente_id] = (c[r.paciente_id] || 0) + 1;
    });
    setConteos(c);
    setPacientes(pac || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [usuario]);

  /* Agrupar posibles duplicados por nombre normalizado (grupos de 2+) */
  const grupos = (() => {
    const map = {};
    pacientes.forEach(p => {
      const k = normNombre(p.nombre);
      if (!k) return;
      (map[k] = map[k] || []).push(p);
    });
    return Object.entries(map).filter(([, arr]) => arr.length >= 2);
  })();

  const fusionar = async (principal, duplicado) => {
    const res = await sb("rpc/fn_fusionar_pacientes", {
      method: "POST",
      body: JSON.stringify({ p_principal: principal.id, p_duplicado: duplicado.id }),
    }, usuario?.token);
    if (res) {
      const r = res.reasignadas || {};
      toast({ title: "Pacientes fusionados", description: `${duplicado.nombre} → ${principal.nombre}. Reasignadas: ${(r.medicas || 0) + (r.kine || 0) + (r.maso || 0)} atenciones.` });
      return true;
    }
    toast({ title: "Error al fusionar", description: "No se pudo completar la fusión.", variant: "destructive" });
    return false;
  };

  const fusionarGrupo = async (grupoKey, arr) => {
    const principalId = principalSel[grupoKey] ?? arr.reduce((best, p) => (conteos[p.id] || 0) > (conteos[best.id] || 0) ? p : best, arr[0]).id;
    const principal = arr.find(p => p.id === principalId);
    const duplicados = arr.filter(p => p.id !== principalId);
    const ok = await confirmDialog({
      title: "Confirmar fusión",
      description: `Se fusionarán ${duplicados.length} registro(s) en:\n\n${principal.nombre} (${principal.identificacion})\n\nTodas las atenciones de los duplicados pasarán al principal y los duplicados se eliminarán. Esta acción no se puede deshacer.`,
      confirmText: "Fusionar",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;
    setFusionando(true);
    try {
      for (const dup of duplicados) {
        const done = await fusionar(principal, dup);
        if (!done) break;
      }
      await cargar();
    } finally {
      setFusionando(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando pacientes...</div>;

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Gestión de pacientes</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
          {pacientes.length} pacientes registrados · {grupos.length} posible(s) duplicado(s) por nombre
        </div>
      </div>

      {/* ── Posibles duplicados ─────────────────────────────── */}
      {grupos.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40, color: C.textMuted }}>
          No se detectaron pacientes duplicados por nombre. ✓
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grupos.map(([grupoKey, arr]) => {
            const principalId = principalSel[grupoKey] ?? arr.reduce((best, p) => (conteos[p.id] || 0) > (conteos[best.id] || 0) ? p : best, arr[0]).id;
            return (
              <div key={grupoKey} style={{ ...S.card, borderLeft: `3px solid ${C.orange}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  Posible duplicado: <span style={{ color: C.orange }}>{arr[0].nombre}</span> ({arr.length} registros)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {arr.map(p => (
                    <label key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: p.id === principalId ? C.accentDim : C.surface2,
                      border: `1px solid ${p.id === principalId ? C.accent : C.border}`, borderRadius: 8, cursor: "pointer",
                    }}>
                      <input type="radio" name={`princ-${grupoKey}`} checked={p.id === principalId}
                        onChange={() => setPrincipalSel(s => ({ ...s, [grupoKey]: p.id }))} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {p.nombre} {p.id === principalId && <span style={{ color: C.accent, fontSize: 11 }}>· PRINCIPAL</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          {p.identificacion} · {p.edad ? `${p.edad} años · ` : ""}{conteos[p.id] || 0} atención(es)
                          {p.alergias ? ` · ⚠️ ${p.alergias}` : ""}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <button style={{ ...S.btn("primary"), fontSize: 12 }} disabled={fusionando}
                  onClick={() => fusionarGrupo(grupoKey, arr)}>
                  {fusionando ? "Fusionando..." : "Fusionar en el principal"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
