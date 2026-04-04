// api/send-email.js - Endpoint para enviar emails
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { tipo, destinatario, nombreProfesional, rol, evento, equipo } = req.body;

  if (tipo === 'asignacion_evento') {
    try {
      // Formatear fecha
      const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Construir lista de equipo
      let listaEquipo = '';
      if (equipo.medicos?.length > 0) listaEquipo += `<li><strong>Médicos:</strong> ${equipo.medicos.join(', ')}</li>`;
      if (equipo.enfermeros?.length > 0) listaEquipo += `<li><strong>Enfermeros:</strong> ${equipo.enfermeros.join(', ')}</li>`;
      if (equipo.paramedicos?.length > 0) listaEquipo += `<li><strong>Paramédicos:</strong> ${equipo.paramedicos.join(', ')}</li>`;
      if (equipo.kinesiologos?.length > 0) listaEquipo += `<li><strong>Kinesiólogos:</strong> ${equipo.kinesiologos.join(', ')}</li>`;
      if (equipo.masoterapeutas?.length > 0) listaEquipo += `<li><strong>Masoterapeutas:</strong> ${equipo.masoterapeutas.join(', ')}</li>`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .info-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    .info-box h3 { margin-top: 0; color: #0ea5e9; font-size: 16px; }
    .info-item { margin: 10px 0; }
    .label { font-weight: 600; color: #64748b; }
    .value { color: #1e293b; }
    .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #0369a1; border-radius: 12px; font-size: 13px; font-weight: 600; margin-right: 6px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    ul { list-style: none; padding: 0; }
    ul li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    ul li:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Asignación de Evento - TRIAGE360</h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${nombreProfesional}</strong>,</p>
      
      <p>Has sido asignado al siguiente evento:</p>
      
      <div class="info-box">
        <h3>📅 Detalles del Evento</h3>
        <div class="info-item">
          <span class="label">Evento:</span> 
          <span class="value"><strong>${evento.nombre}</strong></span>
        </div>
        <div class="info-item">
          <span class="label">📍 Ubicación:</span> 
          <span class="value">${evento.ubicacion}</span>
        </div>
        <div class="info-item">
          <span class="label">🗓️ Fecha:</span> 
          <span class="value">${fechaFormateada}</span>
        </div>
        <div class="info-item">
          <span class="label">👤 Tu rol:</span> 
          <span class="value"><strong>${rol}</strong></span>
        </div>
      </div>

      ${evento.carros?.length > 0 || evento.bolsos?.length > 0 ? `
      <div class="info-box">
        <h3>📦 Inventario Asignado</h3>
        ${evento.carros?.length > 0 ? `
        <div class="info-item">
          <span class="label">🚑 Carros Clínicos:</span><br>
          ${evento.carros.map(c => `<span class="badge">${c}</span>`).join('')}
        </div>
        ` : ''}
        ${evento.bolsos?.length > 0 ? `
        <div class="info-item">
          <span class="label">💊 Bolsos de Medicamentos:</span><br>
          ${evento.bolsos.map(b => `<span class="badge">${b}</span>`).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${listaEquipo ? `
      <div class="info-box">
        <h3>👥 Equipo Completo</h3>
        <ul>
          ${listaEquipo}
        </ul>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://triage360.vercel.app" class="button">Acceder al Sistema</a>
      </div>

      <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
        Podrás ver el inventario completo de tus carros y bolsos asignados una vez que inicies sesión en el sistema.
      </p>
    </div>

    <div class="footer">
      <p><strong>TRIAGE360</strong> - Gestión Clínica Inteligente</p>
      <p>Powered by SGTRUMAO</p>
    </div>
  </div>
</body>
</html>
      `;

      const { data, error } = await resend.emails.send({
        from: 'TRIAGE360 <onboarding@resend.dev>',
        to: [destinatario],
        subject: `Asignación al evento: ${evento.nombre}`,
        html: htmlContent
      });

      if (error) {
        console.error('Error al enviar email:', error);
        return res.status(400).json({ error });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error en el servidor:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Otros tipos de emails existentes...
  return res.status(400).json({ error: 'Tipo de email no soportado' });
}
