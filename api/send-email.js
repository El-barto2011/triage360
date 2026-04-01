// API endpoint para enviar emails con Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  try {
    let emailHtml = '';
    let subject = '';

    if (type === 'stock_bajo') {
      // Email de alerta de stock bajo
      subject = '⚠️ Alerta: Insumos con stock bajo';
      emailHtml = generarEmailStockBajo(data);
    } else if (type === 'reporte_evento') {
      // Email de reporte al cerrar evento
      subject = `📊 Reporte: ${data.evento}`;
      emailHtml = generarEmailReporteEvento(data);
    } else {
      return res.status(400).json({ error: 'Tipo de email no válido' });
    }

    // Enviar email con Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'TRIAGE360 <alfredo.jara@sgtrumao.cl>',
        to: ADMIN_EMAIL.split(","),
        subject: subject,
        html: emailHtml
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error Resend:', result);
      return res.status(500).json({ error: 'Error al enviar email', details: result });
    }

    return res.status(200).json({ success: true, emailId: result.id });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

function generarEmailStockBajo(data) {
  const { insumos } = data;
  
  let insumosHtml = insumos.map(ins => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${ins.nombre}</strong><br>
        <span style="color: #6b7280; font-size: 13px;">${ins.categoria || 'General'}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="color: ${ins.stock === 0 ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
          ${ins.stock} ${ins.unidad}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${ins.minimo} ${ins.unidad}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="background: ${ins.stock === 0 ? '#fee2e2' : '#fef3c7'}; color: ${ins.stock === 0 ? '#dc2626' : '#f59e0b'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${ins.stock === 0 ? 'AGOTADO' : 'BAJO'}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px;">⚠️ Alerta de Stock Bajo</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">TRIAGE360 - Sistema de Gestión Médica</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 24px 0; color: #374151; font-size: 15px;">
            Se han detectado <strong>${insumos.length} insumo(s)</strong> con stock por debajo del mínimo requerido.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Insumo</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Stock Actual</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Mínimo</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${insumosHtml}
            </tbody>
          </table>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Acción requerida:</strong> Por favor, revisa el inventario y realiza el pedido de reposición necesario.
            </p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 13px;">
            TRIAGE360 · Gestión clínica inteligente<br>
            <a href="https://triage360.vercel.app" style="color: #3b82f6; text-decoration: none;">triage360.vercel.app</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generarEmailReporteEvento(data) {
  const { evento, fecha_cierre, stats } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px;">📊 Reporte de Evento</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600;">${evento}</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 24px 0; color: #374151; font-size: 15px;">
            Evento cerrado el <strong>${new Date(fecha_cierre).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
          </p>
          
          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">📈 Resumen de Atenciones</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe;">
              <div style="color: #1e40af; font-size: 32px; font-weight: bold; margin-bottom: 4px;">${stats.total_atenciones || 0}</div>
              <div style="color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Total Atenciones</div>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <div style="color: #15803d; font-size: 32px; font-weight: bold; margin-bottom: 4px;">${stats.total_profesionales || 0}</div>
              <div style="color: #16a34a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Profesionales</div>
            </div>
          </div>

          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">👥 Atenciones por Profesional</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">Profesional</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">Rol</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">Atenciones</th>
              </tr>
            </thead>
            <tbody>
              ${(stats.por_profesional || []).map(p => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.nombre}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px;">${p.rol}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600;">${p.atenciones}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Reporte generado automáticamente</strong><br>
              Para más detalles, ingresa al sistema TRIAGE360.
            </p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 13px;">
            TRIAGE360 · Gestión clínica inteligente<br>
            <a href="https://triage360.vercel.app" style="color: #3b82f6; text-decoration: none;">triage360.vercel.app</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
