import { useState, useEffect, createContext, useContext } from 'react'
import { sb } from '../../config/supabase'
import { C } from '../../config/theme'

export const EventoContext = createContext()

export function EventoProvider({ children, usuario }) {
  const [eventoActual, setEventoActual] = useState(null)
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      const data = await sb(
        'equipos_evento?order=fecha_evento.desc',
        {},
        usuario?.token
      )
      const lista = data || []
      setEventos(lista)

      const savedId = localStorage.getItem('evento_activo_id')
      if (savedId) {
        const id = parseInt(savedId)
        if (lista.find(e => e.id === id)) {
          setEventoActual(id)
          return
        }
      }
      const primerActivo = lista.find(e => e.estado === 'activo')
      if (primerActivo) cambiarEvento(primerActivo.id)
      else if (lista[0]) cambiarEvento(lista[0].id)
    }
    cargar()
  }, [usuario])

  const cambiarEvento = (eventoId) => {
    setEventoActual(eventoId)
    localStorage.setItem('evento_activo_id', String(eventoId))
  }

  const recargarEventos = async () => {
    const data = await sb('equipos_evento?order=fecha_evento.desc', {}, usuario?.token)
    if (data) setEventos(data)
  }

  return (
    <EventoContext.Provider value={{ eventoActual, eventos, cambiarEvento, recargarEventos }}>
      {children}
    </EventoContext.Provider>
  )
}

export function SelectorEvento() {
  const { eventoActual, eventos, cambiarEvento } = useContext(EventoContext)
  const [verCerrados, setVerCerrados] = useState(false)
  const eventoSel = eventos.find(e => e.id === eventoActual)
  const activos  = eventos.filter(e => e.estado === 'activo')
  const cerrados = eventos.filter(e => e.estado !== 'activo')
  // si el evento seleccionado está cerrado, mostrar cerrados para que no "desaparezca"
  const mostrarCerrados = verCerrados || (eventoSel && eventoSel.estado !== 'activo')

  return (
    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.textFaint, textTransform: 'uppercase', letterSpacing: 1 }}>Evento activo</span>
        {cerrados.length > 0 && (
          <span onClick={() => setVerCerrados(v => !v)}
            style={{ fontSize: 10, color: C.textFaint, cursor: 'pointer', textDecoration: 'underline' }}>
            {mostrarCerrados ? 'ocultar cerrados' : `+${cerrados.length} cerrados`}
          </span>
        )}
      </div>
      <select
        value={eventoActual || ''}
        onChange={e => cambiarEvento(parseInt(e.target.value))}
        style={{
          width: '100%', fontSize: 12, padding: '5px 8px',
          border: `1px solid ${C.border}`, borderRadius: 6,
          background: C.surface, color: C.text, cursor: 'pointer'
        }}
      >
        <option value="">— Sin filtro —</option>
        {activos.map(evento => (
          <option key={evento.id} value={evento.id}>🟢 {evento.nombre_evento}</option>
        ))}
        {mostrarCerrados && cerrados.map(evento => (
          <option key={evento.id} value={evento.id}>⚪ {evento.nombre_evento}</option>
        ))}
      </select>
      {eventoSel && (
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
          {new Date(eventoSel.fecha_evento + 'T12:00:00').toLocaleDateString('es-CL')}
          {eventoSel.estado === 'activo' && (
            <span style={{ color: '#10b981', marginLeft: 6, fontWeight: 600 }}>Activo</span>
          )}
        </div>
      )}
    </div>
  )
}

export function useEvento() {
  const context = useContext(EventoContext)
  if (!context) throw new Error('useEvento debe usarse dentro de EventoProvider')
  return context
}
