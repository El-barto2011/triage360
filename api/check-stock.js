// Cron job diario para revisar stock bajo y enviar alerta
const SUPABASE_URL = 'https://dnlvzwrujosuckdzmffx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuibHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MjI0MTksImV4cCI6MjAzMTM5ODQxOX0.c-KQJjSl1mP0kVWGjrIJBBgJsQgSDxzkxz4VqhztYGk';

export default async function handler(req, res) {
  try {
    const insumosRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_insumos_stock_bajo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const insumos = await insumosRes.json();

    if (!insumos || insumos.length === 0) {
      return res.status(200).json({ message: 'No hay insumos con stock bajo' });
    }

    const emailRes = await fetch(`${req.headers.origin || 'https://triage360.vercel.app'}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'stock_bajo',
        data: { insumos }
      })
    });

    const emailResult = await emailRes.json();

    return res.status(200).json({ 
      success: true, 
      insumos_alertados: insumos.length,
      email: emailResult 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
const SUPABASE_URL = 'https://dnlvzwrujosuckdzmffx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuibHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MjI0MTksImV4cCI6MjAzMTM5ODQxOX0.c-KQJjSl1mP0kVWGjrIJBBgJsQgSDxzkxz4VqhztYGk';

export default async function handler(req, res) {
  try {
    const insumosRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_insumos_stock_bajo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    const insumos = await insumosRes.json();
    if (!insumos || insumos.length === 0) {
      return res.status(200).json({ message: 'No hay insumos con stock bajo' });
    }
    const emailRes = await fetch('https://triage360.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'stock_bajo', data: { insumos: insumos } })
    });
    const emailResult = await emailRes.json();
    return res.status(200).json({ success: true, insumos_alertados: insumos.length, email: emailResult });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

