import { useState, useEffect, useCallback } from 'react'
import { C, S } from '../../config/theme'
import { sb } from '../../config/supabase'
import { toast } from '../ui/use-toast'

/* ── Helpers ──────────────────────────────────────────────── */
const clp = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString('es-CL')
const fmtFecha = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const CATEGORIAS_GASTO = ['traslado', 'alojamiento', 'alimentación', 'insumos', 'arriendo equipo', 'otro']

/* Definido FUERA del componente: si vive adentro, cada render lo recrea
   y React desmonta/remonta los inputs (pierden el foco al tipear). */
const Seccion = ({ titulo, children }) => (
  <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{titulo}</div>
    {children}
  </div>
)

/* ══════════════════════════════════════════════════════════ */
export function VistaRentabilidad({ usuario }) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(null)        // evento_id expandido
  const [detalle, setDetalle] = useState(null)        // { ingresos, gastos, asignaciones, consumos }
  const [cargandoDet, setCargandoDet] = useState(false)

  // Formularios
  const [fIngreso, setFIngreso] = useState({ concepto: '', neto: '', conIva: true })
  const [fGasto, setFGasto] = useState({ categoria: 'traslado', concepto: '', monto: '' })
  const [honorarios, setHonorarios] = useState({})    // asignacion_id -> monto en edición

  const cargar = useCallback(async () => {
    setCargando(true)
    const data = await sb('v_rentabilidad_evento?order=fecha_evento.desc', {}, usuario?.token)
    setFilas(data || [])
    setCargando(false)
  }, [usuario?.token])

  useEffect(() => { cargar() }, [cargar])

  const cargarDetalle = useCallback(async (eventoId) => {
    setCargandoDet(true)
    const [ingresos, gastos, asignaciones, consumos] = await Promise.all([
      sb(`ingresos_evento?evento_id=eq.${eventoId}&order=created_at.desc`, {}, usuario?.token),
      sb(`gastos_evento?evento_id=eq.${eventoId}&order=created_at.desc`, {}, usuario?.token),
      sb(`asignaciones_evento?evento_id=eq.${eventoId}&select=id,rol,horas,honorario_bruto,retencion_pct,honorario_liquido,pagado,perfiles(nombre)&order=rol`, {}, usuario?.token),
      sb(`consumos_evento?evento_id=eq.${eventoId}&origen=neq.prescripcion&select=item_nombre,item_tipo,cantidad,precio_unitario&order=created_at.desc&limit=200`, {}, usuario?.token),
    ])
    // Agrupar consumos por item
    const map = {}
    ;(consumos || []).forEach(c => {
      const k = c.item_nombre
      if (!map[k]) map[k] = { nombre: k, tipo: c.item_tipo, cantidad: 0, total: 0, sinPrecio: false }
      map[k].cantidad += Number(c.cantidad || 0)
      if (c.precio_unitario == null) map[k].sinPrecio = true
      else map[k].total += Number(c.cantidad || 0) * Number(c.precio_unitario)
    })
    const consumosAgrupados = Object.values(map).sort((a, b) => b.total - a.total)
    setDetalle({ ingresos: ingresos || [], gastos: gastos || [], asignaciones: asignaciones || [], consumos: consumosAgrupados })
    const h = {}
    ;(asignaciones || []).forEach(a => { h[a.id] = a.honorario_bruto ?? '' })
    setHonorarios(h)
    setCargandoDet(false)
  }, [usuario?.token])

  const toggle = (eventoId) => {
    if (abierto === eventoId) { setAbierto(null); setDetalle(null); return }
    setAbierto(eventoId)
    setDetalle(null)
    setFIngreso({ concepto: '', neto: '', conIva: true })
    setFGasto({ categoria: 'traslado', concepto: '', monto: '' })
    cargarDetalle(eventoId)
  }

  const refrescar = async () => { await Promise.all([cargar(), abierto ? cargarDetalle(abierto) : null]) }

  /* ── Acciones ───────────────────────────────────────────── */
  const agregarIngreso = async () => {
    const neto = Number(fIngreso.neto)
    if (!fIngreso.concepto.trim() || !neto) { toast({ title: 'Completa concepto y monto', variant: 'destructive' }); return }
    const res = await sb('ingresos_evento', {
      method: 'POST',
      body: JSON.stringify({ evento_id: abierto, concepto: fIngreso.concepto.trim(), monto_neto: neto, iva: fIngreso.conIva ? Math.round(neto * 0.19) : 0 }),
    }, usuario?.token)
    if (res) { setFIngreso({ concepto: '', neto: '', conIva: true }); toast({ title: 'Ingreso registrado' }); refrescar() }
  }

  const agregarGasto = async () => {
    const monto = Number(fGasto.monto)
    if (!fGasto.concepto.trim() || !monto) { toast({ title: 'Completa concepto y monto', variant: 'destructive' }); return }
    const res = await sb('gastos_evento', {
      method: 'POST',
      body: JSON.stringify({ evento_id: abierto, categoria: fGasto.categoria, concepto: fGasto.concepto.trim(), monto }),
    }, usuario?.token)
    if (res) { setFGasto({ categoria: 'traslado', concepto: '', monto: '' }); toast({ title: 'Gasto registrado' }); refrescar() }
  }

  const eliminar = async (tabla, id) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    await sb(`${tabla}?id=eq.${id}`, { method: 'DELETE' }, usuario?.token)
    refrescar()
  }

  const guardarHonorario = async (asigId) => {
    const bruto = honorarios[asigId] === '' ? null : Number(honorarios[asigId])
    const res = await sb(`asignaciones_evento?id=eq.${asigId}`, {
      method: 'PATCH',
      body: JSON.stringify({ honorario_bruto: bruto }),
    }, usuario?.token)
    if (res) { toast({ title: 'Honorario guardado' }); refrescar() }
  }

  /* ── Totales globales ───────────────────────────────────── */
  const tot = filas.reduce((a, f) => ({
    ingresos: a.ingresos + Number(f.ingresos || 0),
    costos: a.costos + Number(f.costo_insumos || 0) + Number(f.honorarios || 0) + Number(f.gastos || 0),
    margen: a.margen + Number(f.margen || 0),
  }), { ingresos: 0, costos: 0, margen: 0 })

  return (
    <div>
      {/* KPIs globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { lbl: 'Ingresos totales', val: tot.ingresos, color: C.green },
          { lbl: 'Costos totales (insumos + honorarios + gastos)', val: tot.costos, color: C.red },
          { lbl: 'Margen total', val: tot.margen, color: tot.margen >= 0 ? C.accent : C.red },
        ].map(k => (
          <div key={k.lbl} style={{ ...S.card, borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{clp(k.val)}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {cargando && <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>Cargando...</div>}

      {/* Tabla por evento */}
      {!cargando && filas.map(f => {
        const margenColor = Number(f.margen) > 0 ? C.green : Number(f.margen) < 0 ? C.red : C.textMuted
        const esAbierto = abierto === f.evento_id
        return (
          <div key={f.evento_id} style={{ ...S.card, marginBottom: 10, padding: 0, overflow: 'hidden' }}>
            <div onClick={() => toggle(f.evento_id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{f.nombre_evento}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{fmtFecha(f.fecha_evento)} · {f.estado || '—'}</div>
              </div>
              {[
                { lbl: 'Ingresos', val: f.ingresos, color: C.green },
                { lbl: 'Insumos', val: f.costo_insumos, color: C.text },
                { lbl: 'Honorarios', val: f.honorarios, color: C.text },
                { lbl: 'Gastos', val: f.gastos, color: C.text },
              ].map(c => (
                <div key={c.lbl} style={{ minWidth: 86, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{clp(c.val)}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>{c.lbl}</div>
                </div>
              ))}
              <div style={{ minWidth: 100, textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: margenColor }}>{clp(f.margen)}</div>
                <div style={{ fontSize: 10, color: C.textFaint }}>Margen</div>
              </div>
              <span style={{ color: C.textMuted, transform: esAbierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
            </div>

            {esAbierto && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: 18 }}>
                {cargandoDet && <div style={{ color: C.textMuted, fontSize: 13 }}>Cargando detalle...</div>}
                {!cargandoDet && detalle && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

                    {/* INGRESOS */}
                    <Seccion titulo={`Ingresos · ${clp(f.ingresos)}`}>
                      {detalle.ingresos.map(i => (
                        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span>{i.concepto}{i.iva > 0 ? ' (+IVA)' : ''}</span>
                          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong style={{ color: C.green }}>{clp(i.monto_total)}</strong>
                            <span onClick={() => eliminar('ingresos_evento', i.id)} style={{ cursor: 'pointer', color: C.textFaint }}>✕</span>
                          </span>
                        </div>
                      ))}
                      {detalle.ingresos.length === 0 && <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 6 }}>Sin ingresos registrados</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        <input style={{ ...S.input, flex: '2 1 110px', fontSize: 12 }} placeholder="Concepto (ej: Cobertura evento)"
                          value={fIngreso.concepto} onChange={e => setFIngreso(v => ({ ...v, concepto: e.target.value }))} />
                        <input style={{ ...S.input, flex: '1 1 80px', fontSize: 12 }} placeholder="Neto $" type="number"
                          value={fIngreso.neto} onChange={e => setFIngreso(v => ({ ...v, neto: e.target.value }))} />
                        <label style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="checkbox" checked={fIngreso.conIva} onChange={e => setFIngreso(v => ({ ...v, conIva: e.target.checked }))} />
                          +IVA
                        </label>
                        <button style={{ ...S.btn('primary'), fontSize: 12, padding: '6px 14px' }} onClick={agregarIngreso}>Agregar</button>
                      </div>
                    </Seccion>

                    {/* GASTOS */}
                    <Seccion titulo={`Gastos · ${clp(f.gastos)}`}>
                      {detalle.gastos.map(g => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span><span style={{ color: C.textFaint }}>[{g.categoria}]</span> {g.concepto}</span>
                          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong>{clp(g.monto)}</strong>
                            <span onClick={() => eliminar('gastos_evento', g.id)} style={{ cursor: 'pointer', color: C.textFaint }}>✕</span>
                          </span>
                        </div>
                      ))}
                      {detalle.gastos.length === 0 && <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 6 }}>Sin gastos registrados</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        <select style={{ ...S.input, flex: '1 1 90px', fontSize: 12 }} value={fGasto.categoria}
                          onChange={e => setFGasto(v => ({ ...v, categoria: e.target.value }))}>
                          {CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input style={{ ...S.input, flex: '2 1 100px', fontSize: 12 }} placeholder="Concepto"
                          value={fGasto.concepto} onChange={e => setFGasto(v => ({ ...v, concepto: e.target.value }))} />
                        <input style={{ ...S.input, flex: '1 1 70px', fontSize: 12 }} placeholder="$" type="number"
                          value={fGasto.monto} onChange={e => setFGasto(v => ({ ...v, monto: e.target.value }))} />
                        <button style={{ ...S.btn('primary'), fontSize: 12, padding: '6px 14px' }} onClick={agregarGasto}>Agregar</button>
                      </div>
                    </Seccion>

                    {/* HONORARIOS */}
                    <Seccion titulo={`Honorarios · ${clp(f.honorarios)} bruto`}>
                      {detalle.asignaciones.map(a => (
                        <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 130px' }}>
                            <div style={{ fontWeight: 600 }}>{a.perfiles?.nombre || '—'}</div>
                            <div style={{ fontSize: 10, color: C.textFaint }}>{a.rol}</div>
                          </div>
                          <input style={{ ...S.input, width: 95, fontSize: 12, padding: '5px 8px' }} type="number" placeholder="Bruto $"
                            value={honorarios[a.id] ?? ''}
                            onChange={e => setHonorarios(h => ({ ...h, [a.id]: e.target.value }))} />
                          <div style={{ fontSize: 10, color: C.textMuted, minWidth: 90 }}>
                            Líquido: <strong style={{ color: C.text }}>{honorarios[a.id] ? clp(Number(honorarios[a.id]) * (1 - (a.retencion_pct ?? 15.25) / 100)) : '—'}</strong>
                            <div style={{ color: C.textFaint }}>ret. {a.retencion_pct ?? 15.25}%</div>
                          </div>
                          <button style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }} onClick={() => guardarHonorario(a.id)}>Guardar</button>
                        </div>
                      ))}
                      {detalle.asignaciones.length === 0 && <div style={{ fontSize: 12, color: C.textFaint }}>Sin profesionales asignados</div>}
                    </Seccion>

                    {/* CONSUMOS */}
                    <Seccion titulo={`Insumos consumidos · ${clp(f.costo_insumos)}`}>
                      {detalle.consumos.map(c => (
                        <div key={c.nombre} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span>{c.nombre} <span style={{ color: C.textFaint }}>× {c.cantidad}</span></span>
                          <strong style={{ color: c.sinPrecio ? C.textFaint : C.text }}>{c.sinPrecio ? 'sin precio' : clp(c.total)}</strong>
                        </div>
                      ))}
                      {detalle.consumos.length === 0 && <div style={{ fontSize: 12, color: C.textFaint }}>Sin consumos registrados</div>}
                      {Number(f.costo_prescrito) > 0 && (
                        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8 }}>
                          Prescrito (referencia, no sumado): {clp(f.costo_prescrito)}
                        </div>
                      )}
                    </Seccion>

                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!cargando && filas.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>No hay eventos registrados</div>
      )}
    </div>
  )
}
