import { useState } from "react";
import { C, S, Icon } from "../../config/theme";
import { estadoVenc, estadoStock, CAJONES_META } from "../../config/constants";
import { TablaInsumos } from "../common/TablaInsumos";
import { ModalInsumo } from "../common/ModalInsumo";

export function VistaCarros({ carros, setCarros, permisos, esAdmin }) {
  const [carroSel, setCarroSel] = useState(carros[0]?.id);
  const [cajonAbierto, setCajonAbierto] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const carro = carros.find(c => c.id === carroSel);
  const alertasCarro = (c) => c.insumos.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
  const insumosCajon = (cajonId) => carro ? carro.insumos.filter(i => i.cajon === cajonId) : [];
  const alertasCajon = (cajonId) => insumosCajon(cajonId).filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const toggleCajon = (cajonId) => setCajonAbierto(prev => prev === cajonId ? null : cajonId);

  const abrirNuevo = (cajonId) => {
    setForm({ nombre: "", cajon: cajonId, stock: "", minimo: "", unidad: "unid.", vencimiento: "" });
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
            <div key={c.id} onClick={() => { setCarroSel(c.id); setCajonAbierto(null); }} style={{ cursor: "pointer", background: activo ? C.surface : "transparent", border: `1px solid ${activo ? c.color + "50" : C.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 7, borderLeft: `3px solid ${c.color}`, transition: "all 0.12s" }}>
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
            {/* Header carro */}
            <div style={{ ...S.card, borderLeft: `3px solid ${carro.color}`, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: carro.color }}>{carro.nombre}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                    Evento: <span style={{ color: carro.evento_asignado === "Sin asignar" ? C.textFaint : C.text, fontWeight: 600 }}>{carro.evento_asignado}</span>
                    <span style={{ color: C.textFaint, marginLeft: 12 }}>· {carro.insumos.length} insumos totales</span>
                  </div>
                </div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => editarEvento(carro.id)}>✏️ Editar evento</button>
              </div>
            </div>

            {/* Tarjetas cajones */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
              {CAJONES_META.map(cj => {
                const items = insumosCajon(cj.id);
                const alertas = alertasCajon(cj.id);
                const abierto = cajonAbierto === cj.id;
                return (
                  <div key={cj.id} onClick={() => toggleCajon(cj.id)} style={{ cursor: "pointer", background: abierto ? cj.color + "15" : C.surface, border: `2px solid ${abierto ? cj.color : C.border}`, borderRadius: 12, padding: "16px 12px", textAlign: "center", transition: "all 0.15s", position: "relative" }}>
                    {alertas > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{alertas}</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cj.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: abierto ? cj.color : C.text, textTransform: "uppercase", letterSpacing: 0.5 }}>{cj.id}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, lineHeight: 1.3 }}>{cj.nombre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cj.color, marginTop: 8 }}>{items.length} insumos</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: alertas > 0 ? C.red : C.green }}>
                      {alertas > 0 ? `⚠️ ${alertas} alertas` : "✅ OK"}
                    </div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>{abierto ? "▲ Cerrar" : "▼ Ver insumos"}</div>
                  </div>
                );
              })}
            </div>

            {/* Detalle cajón expandido */}
            {cajonAbierto && (
              <div style={{ ...S.card, borderTop: `3px solid ${CAJONES_META.find(c => c.id === cajonAbierto)?.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: CAJONES_META.find(c => c.id === cajonAbierto)?.color }}>{cajonAbierto}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.nombre} · {insumosCajon(cajonAbierto).length} insumos</div>
                    </div>
                  </div>
                  {permisos?.modificarStock && <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={() => abrirNuevo(cajonAbierto)}>+ Agregar insumo</button>}
                </div>
                <TablaInsumos items={insumosCajon(cajonAbierto)} onEdit={abrirEditar} onDelete={eliminar} />
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <ModalInsumo
          form={form} setForm={setForm} onSave={guardar} onClose={() => setModal(null)}
          titulo={modal === "nuevo" ? `Nuevo insumo — ${carro?.nombre} · ${cajonAbierto}` : "Editar insumo"}
          cajones={CAJONES_META.map(c => c.id)}
        />
      )}
    </div>
  );
}
