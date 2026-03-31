const SUPABASE_URL = 'https://dnlvzwrujosuckdzmffx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuibHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MjI0MTksImV4cCI6MjAzMTM5ODQxOX0.c-KQJjSl1mP0kVWGjrIJBBgJsQgSDxzkxz4VqhztYGk';

export default async function handler(req, res) {
  try {
    // Obtener medicamentos con stock bajo
    const medicamentosRes = await fetch(SUPABASE_URL + '/rest/v1/medicamentos?stock=lte.minimo&select=*', {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    const medicamentos = await medicamentosRes.json();

    // Obtener insumos de kinesiología con stock bajo
    const insumosRes = await fetch(SUPABASE_URL + '/rest/v1/insumos_kinesiologia?stock=lte.minimo&kinesiologo_id=not.is.null&select=*', {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    const insumosKine = await insumosRes.json();

    // Combinar y formatear
    const insumos = [
      ...medicamentos.map(m => ({ ...m, categoria: m.caja || 'Medicamentos' })),
      ...insumosKine.map(i => ({ ...i, categoria: 'Kinesiología' }))
    ];

    if (insumos.length === 0) {
      return res.status(200).json({ message: 'No hay insumos con stock bajo' });
    }

    // Enviar email
    const emailRes = await fetch('https://triage360.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'stock_bajo', data: { insumos: insumos } })
    });
    const emailResult = await emailRes.json();

    return res.status(200).json({ 
      success: true, 
      insumos_alertados: insumos.length,
      email: emailResult 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
