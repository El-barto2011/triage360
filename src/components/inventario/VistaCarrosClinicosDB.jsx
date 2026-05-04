import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";
import { CAJONES_META, estadoVenc, estadoStock } from "../../config/constants";

export function VistaCarrosClinicosDB({ usuario }) {
console.log("VistaCarrosClinicosDB renderizado, usuario:", usuario);
  const [carros, setCarros] = useState([]);
  const [carroSel, setCarroSel] = useState(null);
  const [cajonAbierto, setCajonAbierto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [carrosPermitidos, setCarrosPermitidos] = useState([]);

  const esAdmin = usuario?.rol === 'admin';

  const cargarCarros = async () => {
    console.log("cargarCarros ejecutándose...");

    // Si es admin, cargar todos los carros
    if (esAdmin) {
      const data = await sb('contenedores_medicamentos?tipo=eq.carro&select=*', {}, usuario?.token);
      console.log("DEBUG Carros (Admin):", data);
      if (data) {
        setCarros(data);
        setCarrosPermitidos(['Carro 1', 'Carro 2', 'Carro 3', 'Carro 4', 'Carro 5', 'Carro 6', 'Carro 7']);
        if (data.length > 0 && !carroSel) setCarroSel(data[0].nombre);
      }
    } else {
      // Si es profesional, obtener eventos donde está asignado
      const eventos = await sb('equipos_evento?estado=eq.activo', {}, usuario?.token);
      console.log("DEBUG Eventos activos:", eventos);

      let carrosAsignados = [];
      if (eventos) {
        eventos.forEach(evento => {
          // Verificar si el usuario está en alguna lista de profesionales
          const estaAsignado =
            (evento.medicos || []).includes(usuario.id) ||
            (evento.enfermeros || []).includes(usuario.id) ||
            (evento.paramedicos || []).includes(usuario.id);

          if (estaAsignado && evento.carros_asignados) {
            carrosAsignados = [...carrosAsignados, ...evento.carros_asignados];
          }
        });
      }

      // Eliminar duplicados
      carrosAsignados = [...new Set(carrosAsignados)];
      console.log("DEBUG Carros asignados al usuario:", carrosAsignados);
      setCarrosPermitidos(carrosAsignados);

      // Cargar solo los carros asignados
      if (carrosAsignados.length > 0) {
        const data = await sb('contenedores_medicamentos?tipo=eq.carro&select=*', {}, usuario?.token);
        if (data) {
          const carrosFiltrados = data.filter(c => carrosAsignados.includes(c.nombre));
          setCarros(carrosFiltrados);
          if (carrosFiltrados.length > 0 && !carroSel) setCarroSel(carrosFiltrados[0].nombre);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("useEffect ejecutándose...");
    cargarCarros();
  }, []);

  const carroActual = carros.filter(c => c.nombre === carroSel);
  const insumosCarroActual = carroActual;

  const insumosCajon = (cajonId) => insumosCarroActual.filter(i => i.cajon === cajonId);
  const alertasCajon = (cajonId) => insumosCajon(cajonId).filter(i => i.stock <= i.minimo).length;
  const alertasCarro = (nombreCarro) => carros.filter(c => c.nombre === nombreCarro && c.stock <= c.minimo).length;

  const toggleCajon = (cajonId) => setCajonAbierto(prev => prev === cajonId ? null : cajonId);

  const abrirEditar = (insumo) => {
    setEditando(insumo.id);
    setFormEdit({ stock: insumo.stock, minimo: insumo.minimo });
  };

  const guardarEdicion = async (id) => {
    const { error } = await sb(`contenedores_medicamentos?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: +formEdit.stock, minimo: +formEdit.minimo })
    }, usuario?.token);

    if (!error) {
      setEditando(null);
      cargarCarros();
    }
  };

  const carrosUnicos = [...new Set(carros.map(c => c.nombre))];
  const colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Cargando carros...</div>;

  if (!esAdmin && carrosPermitidos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚑</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          No tienes carros asignados
        </div>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          Solicita al administrador que te asigne a un evento con un carro clínico.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Lista de carros */}
      <div style={{ width: 185, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Seleccionar carro</div>
        {carrosUnicos.map((nombreCarro, idx) => {
          const alertas = alertasCarro(nombreCarro);
          const activo = carroSel === nombreCarro;
          const color = colores[idx % colores.length];
          const totalInsumos = carros.filter(c => c.nombre === nombreCarro).length;

          return (
            <div key={nombreCarro} onClick={() => { setCarroSel(nombreCarro); setCajonAbierto(null); }}
                 style={{ cursor: 'pointer', background: activo ? C.surface : 'transparent', border: `1px solid ${activo ? color + '50' : C.border}`, borderRadius: 10, padding: '11px 13px', marginBottom: 7, borderLeft: `3px solid ${color}`, transition: 'all 0.12s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: activo ? C.text : C.textMuted }}>{nombreCarro}</span>
                {alertas > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{alertas}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{totalInsumos} medicamentos</div>
            </div>
          );
        })}
      </div>

      {/* Detalle del carro */}
      <div style={{ flex: 1 }}>
        {carroSel && (
          <>
            {/* Header */}
            <div style={{ ...S.card, borderLeft: `3px solid ${colores[carrosUnicos.indexOf(carroSel) % colores.length]}`, marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: colores[carrosUnicos.indexOf(carroSel) % colores.length] }}>{carroSel}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                {insumosCarroActual.length} medicamentos totales · 5 cajones
              </div>
            </div>

            {/* Tarjetas de cajones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
              {CAJONES_META.map(cj => {
                const items = insumosCajon(cj.id);
                const alertas = alertasCajon(cj.id);
                const abierto = cajonAbierto === cj.id;

                return (
                  <div key={cj.id} onClick={() => toggleCajon(cj.id)}
                       style={{ cursor: 'pointer', background: abierto ? cj.color + '15' : C.surface, border: `2px solid ${abierto ? cj.color : C.border}`, borderRadius: 12, padding: '16px 12px', textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}>
                    {alertas > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: C.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{alertas}</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cj.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: abierto ? cj.color : C.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cj.id}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, lineHeight: 1.3 }}>{cj.nombre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cj.color, marginTop: 8 }}>{items.length} items</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: alertas > 0 ? C.red : C.green }}>
                      {alertas > 0 ? `⚠️ ${alertas} alertas` : '✅ OK'}
                    </div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>{abierto ? '▲ Cerrar' : '▼ Ver medicamentos'}</div>
                  </div>
                );
              })}
            </div>

            {/* Contenido del cajón abierto */}
            {cajonAbierto && (
              <div style={{ ...S.card, borderTop: `3px solid ${CAJONES_META.find(c => c.id === cajonAbierto)?.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: CAJONES_META.find(c => c.id === cajonAbierto)?.color }}>{cajonAbierto}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.nombre}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>MEDICAMENTO</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>STOCK</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>MÍNIMO</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>UNIDAD</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosCajon(cajonAbierto).map(insumo => {
                      const enEdicion = editando === insumo.id;
                      const bajStock = insumo.stock <= insumo.minimo;

                      return (
                        <tr key={insumo.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '10px', fontSize: 13, fontWeight: 600 }}>{insumo.nombre_insumo || "Sin nombre"}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {enEdicion ? (
                              <input type="number" value={formEdit.stock} onChange={e => setFormEdit({...formEdit, stock: e.target.value})}
                                     style={{ width: 60, padding: 4, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }} />
                            ) : (
                              <span style={{ color: bajStock ? C.red : C.text, fontWeight: bajStock ? 700 : 400 }}>{insumo.stock}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {enEdicion ? (
                              <input type="number" value={formEdit.minimo} onChange={e => setFormEdit({...formEdit, minimo: e.target.value})}
                                     style={{ width: 60, padding: 4, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }} />
                            ) : (
                              <span style={{ fontSize: 12, color: C.textMuted }}>{insumo.minimo}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: C.textMuted }}>{insumo.unidad}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {enEdicion ? (
                              <>
                                <button onClick={() => guardarEdicion(insumo.id)} style={{ ...S.btn('primary'), fontSize: 11, padding: '4px 10px', marginRight: 5 }}>💾 Guardar</button>
                                <button onClick={() => setEditando(null)} style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }}>✖️</button>
                              </>
                            ) : (
                              <button onClick={() => abrirEditar(insumo)} style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }}>✏️ Editar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
