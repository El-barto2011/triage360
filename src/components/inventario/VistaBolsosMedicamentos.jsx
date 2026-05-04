import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaBolsosMedicamentos({ usuario }) {
  const [bolsos, setBolsos] = useState([]);
  const [bolsoSel, setBolsoSel] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [bolsosPermitidos, setBolsosPermitidos] = useState([]);

  const esAdmin = usuario?.rol === 'admin';

  const cargarBolsos = async () => {
    // Si es admin, cargar todos los bolsos
    if (esAdmin) {
      const data = await sb('contenedores_medicamentos?tipo=eq.bolso&select=*', {}, usuario?.token);
      console.log("DEBUG Bolsos (Admin):", data);
      if (data) {
        setBolsos(data);
        setBolsosPermitidos(['Bolso 1', 'Bolso 2', 'Bolso 3']);
        if (data.length > 0 && !bolsoSel) setBolsoSel(data[0].nombre);
      }
    } else {
      // Si es profesional, obtener eventos donde está asignado
      const eventos = await sb('equipos_evento?estado=eq.activo', {}, usuario?.token);
      console.log("DEBUG Eventos activos:", eventos);

      let bolsosAsignados = [];
      if (eventos) {
        eventos.forEach(evento => {
          // Verificar si el usuario está en alguna lista de profesionales
          const estaAsignado =
            (evento.medicos || []).includes(usuario.id) ||
            (evento.enfermeros || []).includes(usuario.id) ||
            (evento.paramedicos || []).includes(usuario.id);

          if (estaAsignado && evento.bolsos_asignados) {
            bolsosAsignados = [...bolsosAsignados, ...evento.bolsos_asignados];
          }
        });
      }

      // Eliminar duplicados
      bolsosAsignados = [...new Set(bolsosAsignados)];
      console.log("DEBUG Bolsos asignados al usuario:", bolsosAsignados);
      setBolsosPermitidos(bolsosAsignados);

      // Cargar solo los bolsos asignados
      if (bolsosAsignados.length > 0) {
        const data = await sb('contenedores_medicamentos?tipo=eq.bolso&select=*', {}, usuario?.token);
        if (data) {
          const bolsosFiltrados = data.filter(b => bolsosAsignados.includes(b.nombre));
          setBolsos(bolsosFiltrados);
          if (bolsosFiltrados.length > 0 && !bolsoSel) setBolsoSel(bolsosFiltrados[0].nombre);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarBolsos();
  }, []);

  const bolsoActual = bolsos.filter(b => b.nombre === bolsoSel);
  const medicamentosBolsoActual = bolsoActual;

  const medicamentosCaja = (cajaId) => medicamentosBolsoActual.filter(m => m.cajon === cajaId);
  const alertasCaja = (cajaId) => medicamentosCaja(cajaId).filter(m => m.stock <= m.minimo).length;
  const alertasBolso = (nombreBolso) => bolsos.filter(b => b.nombre === nombreBolso && b.stock <= b.minimo).length;

  const toggleCaja = (cajaId) => setCajaAbierta(prev => prev === cajaId ? null : cajaId);

  const iniciarEdicion = (medicamento) => {
    setEditando(medicamento.id);
    setFormEdit({ stock: medicamento.stock, minimo: medicamento.minimo });
  };

  const guardarEdicion = async (medicamento) => {
    const data = await sb(
      `contenedores_medicamentos?id=eq.${medicamento.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ stock: formEdit.stock, minimo: formEdit.minimo })
      },
      usuario?.token
    );
    if (data) {
      await cargarBolsos();
      setEditando(null);
      setFormEdit({});
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormEdit({});
  };

  const CAJAS_META = [
    { id: "Caja 1 · Inyectables", emoji: "💉", nombre: "Inyectables", color: C.red },
    { id: "Caja 2 · Orales", emoji: "💊", nombre: "Orales", color: C.blue },
    { id: "Caja 3 · Aerosoles", emoji: "🫁", nombre: "Aerosoles", color: C.purple }
  ];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Cargando bolsos...</div>;
  }

  if (!esAdmin && bolsosPermitidos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          No tienes bolsos asignados
        </div>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          Solicita al administrador que te asigne a un evento con un bolso de medicamentos.
        </div>
      </div>
    );
  }

  const bolsosUnicos = [...new Set(bolsos.map(b => b.nombre))];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* SIDEBAR - Lista de bolsos */}
      <div style={{ width: 280, borderRight: `1px solid ${C.border}`, padding: 20, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Bolsos de Medicamentos
        </div>
        {bolsosUnicos.map(nombreBolso => {
          const alertas = alertasBolso(nombreBolso);
          const activo = bolsoSel === nombreBolso;
          return (
            <div
              key={nombreBolso}
              onClick={() => setBolsoSel(nombreBolso)}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 8,
                cursor: 'pointer',
                background: activo ? C.accentDim : C.surface2,
                border: `1px solid ${activo ? C.accent : C.border}`,
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: activo ? C.accent : C.text }}>
                    💊 {nombreBolso}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                    26 medicamentos
                  </div>
                </div>
                {alertas > 0 && (
                  <div style={{
                    background: C.red,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 12
                  }}>
                    {alertas}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN - Cajas del bolso seleccionado */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {bolsoSel ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={S.title}>💊 {bolsoSel}</div>
              <div style={S.subtitle}>26 medicamentos totales · 3 cajas</div>
            </div>

            {/* Grid de cajas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              {CAJAS_META.map(caja => {
                const meds = medicamentosCaja(caja.id);
                const alertas = alertasCaja(caja.id);
                const abierta = cajaAbierta === caja.id;

                return (
                  <div
                    key={caja.id}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${caja.color}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Header de la caja */}
                    <div
                      onClick={() => toggleCaja(caja.id)}
                      style={{
                        padding: '18px 20px',
                        cursor: 'pointer',
                        background: abierta ? C.surface2 : 'transparent',
                        borderBottom: abierta ? `1px solid ${C.border}` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{caja.emoji}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: caja.color }}>
                            {caja.nombre}
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                            {meds.length} items
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {alertas > 0 ? (
                            <div style={{
                              background: C.redDim,
                              color: C.red,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              marginBottom: 8
                            }}>
                              ⚠️ {alertas} alertas
                            </div>
                          ) : (
                            <div style={{
                              background: C.greenDim,
                              color: C.green,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              marginBottom: 8
                            }}>
                              ✓ OK
                            </div>
                          )}
                          <div style={{ fontSize: 20, color: C.textMuted }}>
                            {abierta ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la caja (medicamentos) */}
                    {abierta && (
                      <div style={{ padding: 20 }}>
                        <table style={{ width: '100%', fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th style={{ ...S.th, textAlign: 'left' }}>Medicamento</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Stock</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Mín</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meds.map(med => {
                              const bajo = med.stock <= med.minimo;
                              const editandoEste = editando === med.id;

                              return (
                                <tr key={med.id}>
                                  <td style={{ padding: '10px', fontSize: 13, fontWeight: 600 }}>
                                    {med.nombre_insumo || "Sin nombre"}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <input
                                        type="number"
                                        value={formEdit.stock}
                                        onChange={e => setFormEdit(f => ({ ...f, stock: parseInt(e.target.value) }))}
                                        style={{ ...S.input, width: 60, padding: '4px 8px', textAlign: 'center' }}
                                      />
                                    ) : (
                                      <span style={{ color: bajo ? C.red : C.text, fontWeight: bajo ? 700 : 400 }}>
                                        {med.stock} {med.unidad}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <input
                                        type="number"
                                        value={formEdit.minimo}
                                        onChange={e => setFormEdit(f => ({ ...f, minimo: parseInt(e.target.value) }))}
                                        style={{ ...S.input, width: 60, padding: '4px 8px', textAlign: 'center' }}
                                      />
                                    ) : (
                                      <span style={{ color: C.textMuted }}>{med.minimo}</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                        <button onClick={() => guardarEdicion(med)} style={{ ...S.btn('primary'), padding: '4px 12px', fontSize: 12 }}>
                                          Guardar
                                        </button>
                                        <button onClick={cancelarEdicion} style={{ ...S.btn('ghost'), padding: '4px 12px', fontSize: 12 }}>
                                          Cancelar
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => iniciarEdicion(med)} style={{ ...S.btn('ghost'), padding: '4px 12px', fontSize: 12 }}>
                                        Editar
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
            Selecciona un bolso para ver su contenido
          </div>
        )}
      </div>
    </div>
  );
}
