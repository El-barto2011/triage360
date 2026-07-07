import { useState } from 'react'
import { C, S } from '../../config/theme'
import { sb } from '../../config/supabase'
import { toast } from '../ui/use-toast'
import { normIdent, esPasaporte } from '../../config/pacientes'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

/* ── Helpers de presentación ──────────────────────────────── */
const TIPO_COLORES = { 'Médica': C.red, 'Kinesiología': C.green, 'Masoterapia': C.purple }
const TIPOS        = ['Todos', 'Médica', 'Kinesiología', 'Masoterapia']

function formatFecha(ts) {
  const d = new Date(ts)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MedList({ meds, label, color }) {
  if (!Array.isArray(meds) || meds.length === 0) return null
  return (
    <div style={{ fontSize: 12 }}>
      <span style={{ color: C.textMuted, fontWeight: 700 }}>{label}: </span>
      {meds.map((m, i) => (
        <span key={i}>
          <strong style={{ color }}>{m.nombre || m.medicamento || '?'}</strong>
          {m.dosis  ? ` ${m.dosis}`  : ''}
          {m.via    ? ` · ${m.via}`  : ''}
          {m.cantidad > 1 ? ` × ${m.cantidad}` : ''}
          {i < meds.length - 1 ? ', ' : ''}
        </span>
      ))}
    </div>
  )
}

function Vitales({ a }) {
  const items = [
    a.presion_sistolica   && `PA: ${a.presion_sistolica}/${a.presion_diastolica ?? '?'} mmHg`,
    a.frecuencia_cardiaca && `FC: ${a.frecuencia_cardiaca} lpm`,
    a.temperatura         && `T°: ${a.temperatura}°C`,
    a.saturacion_oxigeno  && `SpO₂: ${a.saturacion_oxigeno}%`,
    a.frecuencia_respiratoria && `FR: ${a.frecuencia_respiratoria} rpm`,
  ].filter(Boolean)
  if (items.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, padding: '6px 10px', background: C.surface2, borderRadius: 6 }}>
      {items.map(item => {
        const [lbl, val] = item.split(': ')
        return (
          <span key={item} style={{ fontSize: 12 }}>
            <span style={{ color: C.textMuted }}>{lbl}: </span>
            <strong style={{ color: C.text }}>{val}</strong>
          </span>
        )
      })}
    </div>
  )
}

/* ── Fecha corta para ejes ─────────────────────────────────── */
const fechaCorta = (ts) => {
  const d = new Date(ts)
  return isNaN(d) ? '—' : d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
}

/* ══════════════════════════════════════════════════════════
   Tendencias por paciente: evolución de dolor (masoterapia) y
   de signos vitales (médicas) a través de los eventos.
   ══════════════════════════════════════════════════════════ */
function Tendencias({ historial }) {
  // Dolor: fichas de masoterapia con dolor inicial/posterior, orden cronológico
  const dolorData = historial
    .filter(a => a.tipo === 'Masoterapia' && (a.dolor_inicial != null || a.dolor_posterior != null))
    .slice().reverse()
    .map(a => ({
      fecha: fechaCorta(a.created_at),
      'Dolor inicial':   a.dolor_inicial ?? null,
      'Dolor posterior': a.dolor_posterior ?? null,
    }))

  // Signos vitales: atenciones médicas con al menos un vital
  const vitalesData = historial
    .filter(a => a.tipo === 'Médica' && (a.presion_sistolica || a.frecuencia_cardiaca || a.saturacion_oxigeno))
    .slice().reverse()
    .map(a => ({
      fecha: fechaCorta(a.created_at),
      'PA sist.': a.presion_sistolica || null,
      'PA diast.': a.presion_diastolica || null,
      'FC': a.frecuencia_cardiaca || null,
      'SpO₂': a.saturacion_oxigeno || null,
    }))

  const hayDolor   = dolorData.length >= 2
  const hayVitales = vitalesData.length >= 2
  if (!hayDolor && !hayVitales) return null

  const ejeChart = { fontSize: 11, fill: C.textMuted }

  return (
    <div style={{ ...S.card, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Tendencias</div>
      <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>
        Evolución a través de los eventos registrados
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: hayDolor && hayVitales ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: 20 }}>

        {hayDolor && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
              Dolor en masoterapia (escala 0–10)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dolorData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="fecha" tick={ejeChart} />
                <YAxis domain={[0, 10]} tick={ejeChart} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Dolor inicial"   stroke={C.red}   strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="Dolor posterior" stroke={C.green} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hayVitales && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
              Signos vitales
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitalesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="fecha" tick={ejeChart} />
                <YAxis tick={ejeChart} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="PA sist."  stroke={C.red}    strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="PA diast." stroke={C.orange} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="FC"        stroke={C.accent} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="SpO₂"      stroke={C.blue}   strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export function HistorialPaciente({ usuario }) {
  const [query,        setQuery]        = useState('')
  const [historial,    setHistorial]    = useState([])
  const [cargando,     setCargando]     = useState(false)
  const [buscado,      setBuscado]      = useState(false)
  const [pacienteInfo, setPacienteInfo] = useState(null)
  const [filtroTipo,   setFiltroTipo]   = useState('Todos')
  const [adminMeds,    setAdminMeds]    = useState({})
  const [pacienteDB,   setPacienteDB]   = useState(null)   // ficha en tabla pacientes
  const [editFicha,    setEditFicha]    = useState(false)
  const [fichaForm,    setFichaForm]    = useState({ alergias: '', antecedentes: '' })
  const [guardando,    setGuardando]    = useState(false)

  const guardarFicha = async () => {
    if (!pacienteDB) return
    setGuardando(true)
    const res = await sb(`pacientes?id=eq.${pacienteDB.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ alergias: fichaForm.alergias || null, antecedentes: fichaForm.antecedentes || null }),
    }, usuario?.token)
    setGuardando(false)
    if (res) {
      setPacienteDB({ ...pacienteDB, alergias: fichaForm.alergias, antecedentes: fichaForm.antecedentes })
      setEditFicha(false)
      toast({ title: 'Ficha actualizada', description: 'Alergias y antecedentes guardados' })
    }
  }

  const buscar = async () => {
    const rut = query.trim()
    if (!rut) return
    setCargando(true)
    setBuscado(false)
    setHistorial([])
    setPacienteInfo(null)
    setAdminMeds({})
    setFiltroTipo('Todos')
    setPacienteDB(null)
    setEditFicha(false)

    const campo = esPasaporte(rut) ? 'paciente_pasaporte' : 'paciente_rut'

    try {
      // Ficha unificada del paciente (alergias/antecedentes)
      const pacientes = await sb(`pacientes?identificacion=eq.${normIdent(rut)}&select=id,nombre,edad,tipo_identificacion,identificacion,alergias,antecedentes`, {}, usuario?.token)
      const pdb = pacientes?.[0] || null
      if (pdb) {
        setPacienteDB(pdb)
        setFichaForm({ alergias: pdb.alergias || '', antecedentes: pdb.antecedentes || '' })
      }

      // Historial COMPLETO cross-event vía RPC SECURITY DEFINER.
      // Salta el RLS event-scoped para dar continuidad clínica (alergias, tratamientos previos)
      // sin exponer las listas de atenciones de otros eventos.
      const res = await sb('rpc/fn_historial_paciente', {
        method: 'POST',
        body: JSON.stringify({ p_ident: rut }),
      }, usuario?.token)

      const medicasArr = res?.medicas || []
      const kines      = res?.kine    || []
      const maso       = res?.maso    || []

      // Mapa de medicamentos administrados por atención
      const admins = res?.administracion || []
      if (admins.length) {
        const map = {}
        admins.forEach(a => {
          if (!map[a.atencion_id]) map[a.atencion_id] = []
          map[a.atencion_id].push(a)
        })
        setAdminMeds(map)
      }

      const todo = [
        ...medicasArr.map(a => ({ ...a, tipo: 'Médica'       })),
        ...kines.map(a      => ({ ...a, tipo: 'Kinesiología'  })),
        ...maso.map(a       => ({ ...a, tipo: 'Masoterapia'   })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      if (todo.length > 0) {
        const p = todo[0]
        setPacienteInfo({ nombre: p.paciente_nombre, edad: p.paciente_edad, id: pdb?.identificacion || p[campo] })
      }
      setHistorial(todo)
    } catch (err) {
      console.error('Error buscando historial:', err)
    } finally {
      setCargando(false)
      setBuscado(true)
    }
  }

  const filas      = filtroTipo === 'Todos' ? historial : historial.filter(a => a.tipo === filtroTipo)
  const contadores = historial.reduce((acc, a) => { acc[a.tipo] = (acc[a.tipo] || 0) + 1; return acc }, {})

  return (
    <div>

      {/* ── Buscador ──────────────────────────────────────────── */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Buscar por RUT o Pasaporte
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            type="text"
            placeholder="12.345.678-9  ó  12345678-9  ó  A12345678..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
          />
          <button style={{ ...S.btn('primary'), minWidth: 100 }} onClick={buscar} disabled={cargando}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8 }}>
          RUT con o sin puntos dan el mismo resultado · Pasaporte: inicia con letra
        </div>
      </div>

      {/* ── Info del paciente ─────────────────────────────────── */}
      {pacienteInfo && (
        <div style={{ ...S.card, marginBottom: 20, borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{pacienteInfo.nombre || '—'}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                {pacienteInfo.id}{pacienteInfo.edad ? ` · ${pacienteInfo.edad} años` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(contadores).map(([tipo, count]) => (
                <div key={tipo} style={{
                  background: C.surface2, border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${TIPO_COLORES[tipo] || C.accent}`,
                  borderRadius: 8, padding: '8px 14px', minWidth: 88,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TIPO_COLORES[tipo] || C.accent, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{tipo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Ficha clínica persistente: alergias y antecedentes ── */}
      {pacienteDB && (
        <div style={{
          ...S.card, marginBottom: 20,
          borderLeft: `3px solid ${pacienteDB.alergias ? C.red : C.border}`,
          background: pacienteDB.alergias ? C.redDim : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editFicha ? 12 : 0, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>
                {pacienteDB.alergias ? '⚠️ ALERGIAS: ' : 'Sin alergias registradas'}
                {pacienteDB.alergias && <span style={{ color: C.red }}>{pacienteDB.alergias}</span>}
              </span>
              {!editFicha && pacienteDB.antecedentes && (
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Antecedentes: <span style={{ color: C.text }}>{pacienteDB.antecedentes}</span>
                </span>
              )}
            </div>
            {!editFicha && (
              <button style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 12px' }} onClick={() => setEditFicha(true)}>
                Editar ficha
              </button>
            )}
          </div>
          {editFicha && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Alergias</label>
                <input style={{ ...S.input, width: '100%', marginTop: 4 }} value={fichaForm.alergias}
                  placeholder="Ej: Penicilina, AINEs, látex..."
                  onChange={e => setFichaForm(f => ({ ...f, alergias: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Antecedentes</label>
                <textarea style={{ ...S.input, width: '100%', marginTop: 4, minHeight: 60, resize: 'vertical' }} value={fichaForm.antecedentes}
                  placeholder="Ej: Asma, diabetes tipo 1, cirugías previas..."
                  onChange={e => setFichaForm(f => ({ ...f, antecedentes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...S.btn('primary'), fontSize: 12 }} onClick={guardarFicha} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar ficha'}
                </button>
                <button style={{ ...S.btn('ghost'), fontSize: 12 }} onClick={() => setEditFicha(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tendencias (dolor + signos vitales) ───────────────── */}
      {historial.length > 0 && <Tendencias historial={historial} />}

      {/* ── Filtros por tipo ──────────────────────────────────── */}
      {historial.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {TIPOS.filter(t => t === 'Todos' || contadores[t]).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              style={{
                ...S.btn(filtroTipo === t ? 'primary' : 'ghost'),
                fontSize: 12, padding: '5px 14px',
                background:  filtroTipo === t ? (TIPO_COLORES[t] || C.accent) : C.surface2,
                color:       filtroTipo === t ? '#fff' : C.textMuted,
                borderColor: filtroTipo === t ? 'transparent' : C.border,
              }}
            >
              {t}{t !== 'Todos' && contadores[t] ? ` (${contadores[t]})` : ''}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textFaint }}>
            {filas.length} atención{filas.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────── */}
      {filas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filas.map((a, idx) => {
            const color     = TIPO_COLORES[a.tipo] || C.accent
            const admins    = adminMeds[a.id] || []
            const profesional =
              a.medico_nombre || a.enfermero_nombre || a.paramedico_nombre ||
              a.kinesiologo_nombre || a.masoterapeuta_nombre

            return (
              <div key={idx} style={{ ...S.card, borderLeft: `4px solid ${color}`, padding: '14px 18px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                      {a.tipo}
                    </span>
                    {a.es_emergencia && (
                      <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        🚨 EMERGENCIA
                      </span>
                    )}
                    {a.codigo_triaje && (
                      <span style={S.badge(color, color + '25')}>{a.codigo_triaje}</span>
                    )}
                    <span style={{ fontSize: 12, color: C.textMuted }}>{formatFecha(a.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {profesional && (
                      <span style={{ fontSize: 11, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', color: C.textMuted }}>
                        {profesional}
                      </span>
                    )}
                    {a.evento && (
                      <span style={{ fontSize: 11, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', color: C.textMuted }}>
                        {a.evento}
                      </span>
                    )}
                  </div>
                </div>

                {/* Campos clínicos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 5, fontSize: 13 }}>
                  {a.motivo_consulta        && <div><span style={{ color: C.textMuted }}>Motivo: </span>{a.motivo_consulta}</div>}
                  {a.diagnostico            && <div><span style={{ color: C.textMuted }}>Diagnóstico: </span>{a.diagnostico}</div>}
                  {a.tratamiento            && <div><span style={{ color: C.textMuted }}>Tratamiento: </span>{a.tratamiento}</div>}
                  {a.evaluacion_inicial     && <div><span style={{ color: C.textMuted }}>Evaluación: </span>{a.evaluacion_inicial}</div>}
                  {a.tratamiento_realizado  && <div><span style={{ color: C.textMuted }}>Tratamiento: </span>{a.tratamiento_realizado}</div>}
                  {a.recomendaciones        && <div><span style={{ color: C.textMuted }}>Recomendaciones: </span>{a.recomendaciones}</div>}
                  {a.zona_afectada          && <div><span style={{ color: C.textMuted }}>Zona: </span>{a.zona_afectada}</div>}
                  {a.duracion_minutos       && <div><span style={{ color: C.textMuted }}>Duración: </span>{a.duracion_minutos} min</div>}
                  {(a.dolor_inicial != null || a.dolor_posterior != null) && (
                    <div>
                      <span style={{ color: C.textMuted }}>Dolor: </span>
                      {a.dolor_inicial ?? '?'} → {a.dolor_posterior ?? '?'} / 10
                    </div>
                  )}
                  {a.respuesta_tratamiento  && <div><span style={{ color: C.textMuted }}>Respuesta: </span>{a.respuesta_tratamiento}</div>}
                  {a.observaciones          && <div><span style={{ color: C.textMuted }}>Observaciones: </span>{a.observaciones}</div>}
                  {Array.isArray(a.motivo_atencion) && a.motivo_atencion.length > 0 && (
                    <div><span style={{ color: C.textMuted }}>Motivo: </span>{a.motivo_atencion.join(', ')}</div>
                  )}
                  {Array.isArray(a.tipo_masaje) && a.tipo_masaje.length > 0 && (
                    <div><span style={{ color: C.textMuted }}>Tipo masaje: </span>{a.tipo_masaje.join(', ')}</div>
                  )}
                  {Array.isArray(a.zonas_trabajadas) && a.zonas_trabajadas.length > 0 && (
                    <div><span style={{ color: C.textMuted }}>Zonas: </span>{a.zonas_trabajadas.join(', ')}</div>
                  )}
                </div>

                {/* Signos vitales */}
                <Vitales a={a} />

                {/* Medicamentos prescritos */}
                {Array.isArray(a.medicamentos_prescritos) && a.medicamentos_prescritos.length > 0 && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: C.redDim, borderRadius: 6, borderLeft: `3px solid ${C.red}` }}>
                    <MedList meds={a.medicamentos_prescritos} label="Prescritos" color={C.red} />
                  </div>
                )}

                {/* Medicamentos administrados */}
                {admins.length > 0 && (
                  <div style={{ marginTop: 6, padding: '8px 10px', background: C.accentDim, borderRadius: 6, borderLeft: `3px solid ${C.accent}` }}>
                    {admins.map((adm, i) => (
                      <div key={i} style={{ marginBottom: i < admins.length - 1 ? 6 : 0 }}>
                        <MedList meds={adm.medicamentos_administrados} label="Administrados" color={C.accent} />
                        {adm.administrador_nombre && (
                          <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>por {adm.administrador_nombre}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

      {/* ── Sin resultados ────────────────────────────────────── */}
      {buscado && historial.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 48, color: C.textMuted }}>
          No se encontraron atenciones para <strong>{query}</strong>
        </div>
      )}

    </div>
  )
}
