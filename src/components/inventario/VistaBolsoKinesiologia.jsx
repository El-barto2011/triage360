import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaBolsoKinesiologia({ usuario }) {
  const [kines, setKines] = useState([]);
  const [kineSeleccionado, setKineSeleccionado] = useState(null);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const esAdmin = usuario?.rol === 'admin';
  const esKine = usuario?.profesion === 'Kinesiólogo/a';

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      if (esAdmin) {
        const data = await sb("perfiles?profesion=eq.Kinesiólogo/a&order=nombre", {}, usuario?.token);
        if (data) setKines(data);
      } else if (esKine) {
        const data = await sb(`insumos_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=nombre`, {}, usuario?.token);
        if (data) setInsumos(data);
      }
      setLoading(false);
    };
    cargar();
  }, [usuario, esAdmin, esKine]);

  const cargarBolsoKine = async (kineId) => {
    setLoading(true);
    const data = await sb(`insumos_kinesiologia?kinesiologo_id=eq.${kineId}&order=nombre`, {}, usuario?.token);
    if (data) setInsumos(data);
    setKineSeleccionado(kineId);
    setLoading(false);
  };

  const volverALista = () => { setKineSeleccionado(null); setInsumos([]); };
  const alertas = insumos.filter(i => i.stock < i.minimo).length;
  const abrirNuevo = () => { setForm({ nombre: "", stock: "", minimo: "", unidad: "unid.", kinesiologo_id: esKine ? usuario.id : kineSeleccionado }); setModal("nuevo"); };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = async () => {
    if (!form.nombre) return;
    const kineId = esKine ? usuario.id : kineSeleccionado;
    const datos = { nombre: form.nombre, stock: +form.stock, minimo: +form.minimo, unidad: form.unidad, kinesiologo_id: kineId };
    if (modal === "nuevo") {
      const res = await sb("insumos_kinesiologia", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setInsumos(prev => [...prev, res[0]]);
    } else {
      const res = await sb(`insumos_kinesiologia?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setInsumos(prev => prev.map(i => i.id === form.id ? res[0] : i));
    }
    setModal(null);
  };

  const eliminar = async (id) => {
    await sb(`insumos_kinesiologia?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
    setInsumos(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando...</div>;

  if (esAdmin && !kineSeleccionado) {
    return (
      <div>
        <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.blue}12, ${C.surface})`, borderColor: C.blue + "40", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>🏥 Bolsos de Kinesiólogos</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Selecciona un kinesiólogo para ver su inventario</div>
        </div>
        <div style={S.card}>
          <div style={{ display: "grid", gap: 12 }}>
            {kines.map(kine => (
              <button key={kine.id} onClick={() => cargarBolsoKine(kine.id)} style={{ ...S.btn("ghost"), padding: 16, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{kine.nombre}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Kinesiólogo/a</div>
                </div>
                <Icon name="arrowRight" size={18} color={C.textMuted} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kineActual = esKine ? usuario.nombre : kines.find(k => k.id === kineSeleccionado)?.nombre;
  return (
    <div>
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.blue}12, ${C.surface})`, borderColor: C.blue + "40", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {esAdmin && <button onClick={volverALista} style={{ ...S.btn("ghost"), padding: "4px 8px" }}><Icon name="arrowLeft" size={16} color={C.blue} /></button>}
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>🏥 Bolso de {kineActual}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Insumos de kinesiología</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: alertas > 0 ? C.yellow : C.blue }}>{insumos.length}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Insumos</div>
            {alertas > 0 && <div style={{ fontSize: 10, color: C.yellow }}>⚠️ {alertas} alertas</div>}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, color: C.blue }}>📦 Inventario</span>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Agregar</button>
        </div>
        <table style={S.table}>
          <thead><tr>{["Insumo", "Stock", "Estado", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos</td></tr>
            ) : insumos.map(ins => (
              <tr key={ins.id}>
                <td style={S.td}><div style={{ fontWeight: 600 }}>{ins.nombre}</div></td>
                <td style={S.td}>
                  <span style={{ fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}> / {ins.minimo} {ins.unidad}</span>
                </td>
                <td style={S.td}>
                  {ins.stock === 0 ? <span style={S.pill(C.red, C.redDim)}>Agotado</span> : ins.stock < ins.minimo ? <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span> : <span style={S.pill(C.green, C.greenDim)}>OK</span>}
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => abrirEditar(ins)}><Icon name="edit" size={13} color={C.textMuted} /></button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => eliminar(ins.id)}><Icon name="trash" size={13} color={C.red} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nuevo" ? "Nuevo Insumo" : "Editar Insumo"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre</label>
              <input style={S.input} value={form.nombre || ""} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Stock actual</label>
                <input style={S.input} type="number" value={form.stock || ""} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Mínimo</label>
                <input style={S.input} type="number" value={form.minimo || ""} onChange={e => setForm(p => ({ ...p, minimo: e.target.value }))} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Unidad</label>
              <input style={S.input} value={form.unidad || ""} onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={S.btn("primary")} onClick={guardar}>Guardar</button>
              <button style={S.btn("secondary")} onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
