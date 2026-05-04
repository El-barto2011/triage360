import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { estadoVenc, estadoStock } from "../../config/constants";
import { TablaInsumos } from "../common/TablaInsumos";
import { ModalInsumo } from "../common/ModalInsumo";

export function VistaBolsoNaranja({ usuario }) {
  const [tabActiva, setTabActiva] = useState("inyectables");
const [inyectables, setInyectables] = useState([]);
const [orales, setOrales] = useState([]);
const [aerosoles, setAerosoles] = useState([]);

// Cargar medicamentos desde Supabase
useEffect(() => {
async function cargarMedicamentos() {
const data = await sb("medicamentos?order=id", {}, usuario?.token);
if (data) {
setInyectables(data.filter(m => m.tipo === "inyectable"));
setOrales(data.filter(m => m.tipo === "oral"));
setAerosoles(data.filter(m => m.tipo === "aerosol"));
}
}
if (usuario?.token) cargarMedicamentos();
}, [usuario?.token]);
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

const guardar = async () => {
if (!form.nombre || !form.vencimiento) return;
const datos = { nombre: form.nombre, dosis: form.dosis, tipo: form.tipo, stock: +form.stock, minimo: +form.minimo, unidad: form.unidad, vencimiento: form.vencimiento };
if (modal === "nuevo") {
const res = await sb("medicamentos", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
if (res) tab.set(prev => [...prev, res[0]]);
} else {
const res = await sb(`medicamentos?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
if (res) tab.set(prev => prev.map(i => i.id === form.id ? res[0] : i));
}
setModal(null);
};

const eliminar = async (id) => {
await sb(`medicamentos?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
tab.set(prev => prev.filter(i => i.id !== id));
};

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
