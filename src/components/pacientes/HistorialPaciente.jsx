import { useState } from 'react'
import { C, S } from '../../config/theme'
import { sb } from '../../config/supabase'
import { toast } from '../ui/use-toast'

/* ── Normaliza RUT/pasaporte igual que fn_norm_ident en la BD ── */
const normIdent = (v) => (v || '').toUpperCase().replace(/[^0-9A-Z]/g, '')

/* ── RUT: genera variantes con y sin puntos ───────────────── */
function rutVariants(raw) {
  const sinPuntos = raw.replace(/\./g, '')
  if (sinPuntos === raw) {
    // entrada sin puntos → intentar agregar formato con puntos
    const m = sinPuntos.match(/^(\d+)(-[\dkK])?$/)
    if (m) {
      const num = m[1], dv = m[2] ? '-' + m[2].slice(1) : ''
      let conPuntos = ''
      if      (num.length === 8) conPuntos = `${num.slice(0,2)}.${num.slice(2,5)}.${num.slice(5)}${dv}`
      else if (num.length === 7) conPuntos = `${num.slice(0,1)}.${num.slice(1,4)}.${num.slice(4)}${dv}`
      return [...new Set([raw, conPuntos].filter(Boolean))]
    }
    return [raw]
  }
  return [...new Set([raw, sinPuntos])]
}

/* ── Select explícito por tabla (sin columnas innecesarias) ── */
const SEL_MEDICA = [
  'id,created_at,evento,paciente_nombre,paciente_edad,paciente_rut,paciente_pasaporte,tipo_identificacion',
  'medico_nombre,enfermero_nombre,paramedico_nombre',
  'motivo_consulta,diagnostico,tratamiento,observaciones,medicamentos_prescritos',
  'codigo_triaje,es_emergencia',
  'presion_sistolica,presion_diastolica,frecuencia_cardiaca,temperatura,saturacion_oxigeno,frecuencia_respiratoria',
].join(',')

const SEL_KINE = [
  'id,created_at,evento,paciente_nombre,paciente_edad,paciente_rut,paciente_pasaporte,tipo_identificacion',
  'kinesiologo_nombre,motivo_consulta,evaluacion_inicial,tratamiento_realizado,recomendaciones,observaciones',
].join(',')

const SEL_MASO = [
  'id,created_at,fecha_atencion,evento,paciente_nombre,paciente_edad,paciente_rut,paciente_pasaporte,tipo_identificacion',
  'masoterapeuta_nombre,motivo_atencion,zona_afectada,tipo_masaje,zonas_trabajadas',
  'dolor_inicial,dolor_posterior,duracion_minutos,respuesta_tratamiento,observaciones',
].join(',')

/* ── Construye endpoint PostgREST con OR de variantes de RUT ─ */
function endpoint(tabla, campo, valor, select) {
  const esPassaporte = /^[a-zA-Z]/.test(valor)
  const variants     = esPassaporte ? [valor] : rutVariants(valor)
  const filtro       = variants.length > 1
    ? `or=(${variants.map(v => `${campo}.eq.${v}`).join(',')})`
    : `${campo}=eq.${variants[0]}`
  return `${tabla}?${filtro}&deleted_at=is.null&order=created_at.desc&select=${select}&limit=100`
}

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

    const campo = /^[a-zA-Z]/.test(rut) ? 'paciente_pasaporte' : 'paciente_rut'

    try {
      // 1° intento: entidad paciente unificada (vínculo por paciente_id)
      const pacientes = await sb(`pacientes?identificacion=eq.${normIdent(rut)}&select=id,nombre,edad,tipo_identificacion,identificacion,alergias,antecedentes`, {}, usuario?.token)
      const pdb = pacientes?.[0] || null
      if (pdb) {
        setPacienteDB(pdb)
        setFichaForm({ alergias: pdb.alergias || '', antecedentes: pdb.antecedentes || '' })
      }

      const porPid = (tabla, select) =>
        `${tabla}?paciente_id=eq.${pdb?.id}&deleted_at=is.null&order=created_at.desc&select=${select}&limit=100`

      const [medicas, kines, maso] = await Promise.all([
        sb(pdb ? porPid('atenciones_medicas', SEL_MEDICA)   : endpoint('atenciones_medicas',     campo, rut, SEL_MEDICA), {}, usuario?.token),
        sb(pdb ? porPid('atenciones_kinesiologia', SEL_KINE): endpoint('atenciones_kinesiologia', campo, rut, SEL_KINE),  {}, usuario?.token),
        sb(pdb ? porPid('fichas_masoterapia', SEL_MASO)     : endpoint('fichas_masoterapia',      campo, rut, SEL_MASO),  {}, usuario?.token),
      ])

      // Medicamentos administrados: segundo fetch por IDs de atenciones médicas
      const medicasArr = medicas || []
      if (medicasArr.length > 0) {
        const ids    = medicasArr.map(a => a.id).join(',')
        const admins = await sb(
          `administracion_medicamentos?atencion_id=in.(${ids})` +
          `&select=atencion_id,medicamentos_administrados,administrador_nombre,created_at`,
          {},
          usuario?.token
        )
        if (admins?.length) {
          const map = {}
          admins.forEach(a => {
            if (!map[a.atencion_id]) map[a.atencion_id] = []
            map[a.atencion_id].push(a)
          })
          setAdminMeds(map)
        }
      }

      const todo = [
        ...medicasArr.map(a          => ({ ...a, tipo: 'Médica'       })),
        ...(kines || []).map(a       => ({ ...a, tipo: 'Kinesiología'  })),
        ...(maso  || []).map(a       => ({ ...a, tipo: 'Masoterapia'   })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      if (todo.length > 0) {
        const p = todo[0]
        setPacienteInfo({ nombre: p.paciente_nombre, edad: p.paciente_edad, id: p[campo] })
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
