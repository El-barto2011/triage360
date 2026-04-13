// api/check-events.js - Cierre automático de eventos por fecha_fin
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Verificar autorización (cron de Vercel)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('Iniciando verificación de cierre de eventos...');

    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Obtener eventos activos cuya fecha_fin ya pasó
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/equipos_evento?estado=eq.activo&fecha_fin=lte.${hoy}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener eventos: ${response.status} - ${errorText}`);
    }

    const eventosVencidos = await response.json();
    console.log(`Eventos activos con fecha_fin vencida: ${eventosVencidos.length}`);

    if (eventosVencidos.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay eventos que cerrar',
        eventosCerrados: 0
      });
    }

    const eventosCerrados = [];
    const errores = [];

    // 2. Cerrar cada evento vencido
    for (const evento of eventosVencidos) {
      try {
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/equipos_evento?id=eq.${evento.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              estado: 'cerrado',
              cerrado_automaticamente: true,
              fecha_cierre: new Date().toISOString()
            })
          }
        );

        if (patchRes.ok) {
          eventosCerrados.push(evento);
          console.log(`Evento cerrado: ${evento.nombre_evento}`);
        } else {
          const err = await patchRes.text();
          errores.push({ evento: evento.nombre_evento, error: err });
        }
      } catch (e) {
        errores.push({ evento: evento.nombre_evento, error: e.message });
      }
    }

    // 3. Enviar email si hay eventos cerrados
    if (eventosCerrados.length > 0) {
      const htmlContent = generarEmailHTML(eventosCerrados);

      const { data, error } = await resend.emails.send({
        from: 'TRIAGE360 <alfredo.jara@sgtrumao.cl>',
        to: ['alfredo.jara@sgtrumao.cl', 'francia.munoz@sgtrumao.cl'],
        subject: `🔒 ${eventosCerrados.length} evento${eventosCerrados.length > 1 ? 's' : ''} cerrado${eventosCerrados.length > 1 ? 's' : ''} automáticamente`,
        html: htmlContent
      });

      if (error) {
        console.error('Error al enviar email:', error);
      } else {
        console.log('Email de cierre enviado:', data?.id);
      }
    }

    return res.status(200).json({
      success: true,
      eventosCerrados: eventosCerrados.length,
      errores: errores.length,
      detalle: eventosCerrados.map(e => e.nombre_evento)
    });

  } catch (error) {
    console.error('Error en check-events:', error);
    return res.status(500).json({ error: error.message });
  }
}

function generarEmailHTML(eventos) {
  const filasEventos = eventos.map(e => {
    const fechaInicio = new Date(e.fecha_evento).toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const fechaFin = e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'No definida';

    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #148C8C; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <div style="font-size: 16px; font-weight: 700; color: #002850; margin-bottom: 8px;">
          🔒 ${e.nombre_evento}
        </div>
        <div style="font-size: 13px; color: #64748b; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>Inicio:</strong> ${fechaInicio}</div>
          <div><strong>Fin:</strong> ${fechaFin}</div>
          ${e.ubicacion ? `<div><strong>Ubicación:</strong> ${e.ubicacion}</div>` : ''}
          ${e.tipo_evento ? `<div><strong>Tipo:</strong> ${e.tipo_evento}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #002850, #148C8C); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .button { display: inline-block; background: #148C8C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px; border-radius: 4px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚕️ TRIAGE360 — Cierre Automático de Eventos</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <strong style="color: #15803d;">✅ ${eventos.length} evento${eventos.length > 1 ? 's' : ''} cerrado${eventos.length > 1 ? 's' : ''} automáticamente</strong><br>
        <span style="font-size: 13px; color: #64748b;">
          El sistema detectó que los siguientes eventos superaron su fecha de término y los cerró automáticamente.
        </span>
      </div>

      ${filasEventos}

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        Los reportes de estos eventos siguen disponibles en el sistema. Si necesitas reabrir algún evento, puedes hacerlo manualmente desde la sección de Eventos.
      </p>

      <div style="text-align: center;">
        <a href="https://triage360.vercel.app" class="button">Ver en TRIAGE360</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>TRIAGE360</strong> - Gestión Clínica Inteligente · Powered by SGTRUMAO SPA</p>
      <p>Cierre automático ejecutado el ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${new Date().toLocaleTimeString('es-CL')}</p>
    </div>
  </div>
</body>
</html>`;
}
