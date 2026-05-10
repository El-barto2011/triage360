import { useState } from 'react'
import { C, S } from '../../config/theme'
import { sb } from '../../config/supabase'

const TIPO_COLORES = {
  'Médica':      C.red    || '#ef4444',
  'Kinesiología': C.green  || '#10b981',
  'Masoterapia': C.purple || '#8b5cf6',
}

export function HistorialPaciente({ usuario }) {
  const [rutBuscar,  setRutBuscar]  = useState('')
  const [historial,  setHistorial]  = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [buscado,    setBuscado]    = useState(false)
  const [pacienteInfo, setPacienteInfo] = useState(null)

  const buscarHistorial = async () => {
    const rut = rutBuscar.trim()
    if (!rut) return

    setCargando(true)
    setBuscado(false)
    setHistorial([])
    setPacienteInfo(null)

    try {
      const campo = rut.length > 0 && /^[a-zA-Z]/.test(rut)
        ? 'paciente_pasaporte'
        : 'paciente_rut'

      const [medicas, kines, maso] = await Promise.all([
        sb(`atenciones_medicas?${campo}=eq.${rut}&order=created_at.desc`, {}, usuario?.token),
        sb(`atenciones_kinesiologia?${campo}=eq.${rut}&order=created_at.desc`, {}, usuario?.token),
        sb(`fichas_masoterapia?${campo}=eq.${rut}&order=created_at.desc`, {}, usuario?.token),
      ])

      const todo = [
        ...(medicas  || []).map(a => ({ ...a, tipo: 'Médica' })),
        ...(kines    || []).map(a => ({ ...a, tipo: 'Kinesiología' })),
        ...(maso     || []).map(a => ({ ...a, tipo: 'Masoterapia' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      if (todo.length > 0) {
        const p = todo[0]
        setPacienteInfo({
          nombre: p.paciente_nombre,
          edad:   p.paciente_edad,
          rut:    p[campo],
        })
      }

      setHistorial(todo)
    } catch (error) {
      console.error('Error buscando historial:', error)
    } finally {
      setCargando(false)
      setBuscado(true)
    }
  }

  const contadores = historial.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Buscador */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>
          Buscar por RUT o Pasaporte
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            type="text"
            placeholder="12.345.678-9 o A12345678..."
            value={rutBuscar}
            onChange={e => setRutBuscar(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarHistorial()}
          />
          <button
            style={{ ...S.btn('primary'), minWidth: 100 }}
            onClick={buscarHistorial}
            disabled={cargando}
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Info paciente */}
      {pacienteInfo && (
        <div style={{ ...S.card, marginBottom: 20, borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{pacienteInfo.nombre}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                {pacienteInfo.rut} · {pacienteInfo.edad} años
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(contadores).map(([tipo, count]) => (
                <div key={tipo} style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${TIPO_COLORES[tipo] || C.accent}`,
                  borderRadius: 8,
                  padding: '8px 14px',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TIPO_COLORES[tipo] || C.accent, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{tipo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {historial.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {historial.map((atencion, idx) => {
            const color = TIPO_COLORES[atencion.tipo] || C.accent
            return (
              <div key={idx} style={{
                ...S.card,
                borderLeft: `4px solid ${color}`,
                padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: color,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {atencion.tipo}
                    </span>
                    <span style={{ fontSize: 12, color: C.textMuted }}>
                      {new Date(atencion.created_at).toLocaleString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {atencion.evento && (
                    <span style={{
                      fontSize: 11,
                      background: C.surface2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      color: C.textMuted,
                    }}>
                      {atencion.evento}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6, fontSize: 13 }}>
                  {atencion.motivo_consulta && (
                    <div><span style={{ color: C.textMuted }}>Motivo: </span>{atencion.motivo_consulta}</div>
                  )}
                  {atencion.diagnostico && (
                    <div><span style={{ color: C.textMuted }}>Diagnóstico: </span>{atencion.diagnostico}</div>
                  )}
                  {atencion.tratamiento && (
                    <div><span style={{ color: C.textMuted }}>Tratamiento: </span>{atencion.tratamiento}</div>
                  )}
                  {atencion.tratamiento_realizado && (
                    <div><span style={{ color: C.textMuted }}>Tratamiento: </span>{atencion.tratamiento_realizado}</div>
                  )}
                  {atencion.evaluacion_inicial && (
                    <div><span style={{ color: C.textMuted }}>Evaluación: </span>{atencion.evaluacion_inicial}</div>
                  )}
                  {(atencion.medico_nombre || atencion.kinesiologo_nombre || atencion.masoterapeuta_nombre) && (
                    <div>
                      <span style={{ color: C.textMuted }}>Profesional: </span>
                      {atencion.medico_nombre || atencion.kinesiologo_nombre || atencion.masoterapeuta_nombre}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {buscado && historial.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 48, color: C.textMuted }}>
          No se encontraron atenciones para <strong>{rutBuscar}</strong>
        </div>
      )}
    </div>
  )
}
