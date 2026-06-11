// api/send-email.js - Endpoint para enviar emails
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── Autenticación: solo usuarios logueados en TRIAGE360 pueden enviar ──
  const authHeader = req.headers.authorization || '';
  const userToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!userToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${userToken}`,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'No se pudo validar la sesión' });
  }

  const { destinatario, nombreProfesional, rol, evento, equipo } = req.body;
  const tipo = req.body.tipo || req.body.type; // acepta ambas claves

  /* ══════════ REPORTE DE CIERRE DE EVENTO (con CSV adjunto) ══════════ */
  if (tipo === 'reporte_evento') {
    try {
      const { evento_id, evento_nombre, fecha_cierre } = req.body.data || req.body;
      const SB = process.env.SUPABASE_URL;
      const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const hdrs = { apikey: KEY, Authorization: `Bearer ${KEY}` };
      const get = async (q) => {
        const r = await fetch(`${SB}/rest/v1/${q}`, { headers: hdrs });
        return r.ok ? r.json() : [];
      };

      const [medicas, kines, fichas, masivas, consumos] = await Promise.all([
        get(`atenciones_medicas?evento_id=eq.${evento_id}&deleted_at=is.null&select=created_at,paciente_nombre,paciente_rut,paciente_edad,codigo_triaje,motivo_consulta,diagnostico,tratamiento,medico_nombre,es_emergencia&order=created_at`),
        get(`atenciones_kinesiologia?evento_id=eq.${evento_id}&deleted_at=is.null&select=created_at,paciente_nombre,paciente_rut,motivo_consulta,evaluacion_inicial,tratamiento_realizado,kinesiologo_nombre&order=created_at`),
        get(`fichas_masoterapia?evento_id=eq.${evento_id}&deleted_at=is.null&select=created_at,paciente_nombre,zona_afectada,dolor_inicial,dolor_posterior,duracion_minutos,masoterapeuta_nombre&order=created_at`),
        get(`atenciones_masoterapia_masiva?evento_id=eq.${evento_id}&select=fecha,masajes_realizados,masoterapeuta_nombre`),
        get(`consumos_evento?evento_id=eq.${evento_id}&origen=neq.prescripcion&select=item_nombre,cantidad,precio_unitario`),
      ]);

      const masajesTotal = masivas.reduce((a, m) => a + (Number(m.masajes_realizados) || 0), 0);
      const costoInsumos = consumos.reduce((a, c) => a + Number(c.cantidad || 0) * Number(c.precio_unitario || 0), 0);
      const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');
      const fmtF = (d) => d ? new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

      // ── CSV adjunto ──
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      let csv = '﻿REPORTE DE EVENTO;' + esc(evento_nombre) + '\nCerrado;' + esc(fmtF(fecha_cierre)) + '\n\n';
      csv += 'ATENCIONES MEDICAS (' + medicas.length + ')\nFecha;Paciente;RUT;Edad;Triaje;Emergencia;Motivo;Diagnostico;Tratamiento;Profesional\n';
      medicas.forEach(a => { csv += [fmtF(a.created_at), a.paciente_nombre, a.paciente_rut, a.paciente_edad, a.codigo_triaje, a.es_emergencia ? 'SI' : 'NO', a.motivo_consulta, a.diagnostico, a.tratamiento, a.medico_nombre].map(esc).join(';') + '\n'; });
      csv += '\nKINESIOLOGIA (' + kines.length + ')\nFecha;Paciente;RUT;Motivo;Evaluacion;Tratamiento;Profesional\n';
      kines.forEach(a => { csv += [fmtF(a.created_at), a.paciente_nombre, a.paciente_rut, a.motivo_consulta, a.evaluacion_inicial, a.tratamiento_realizado, a.kinesiologo_nombre].map(esc).join(';') + '\n'; });
      csv += '\nMASOTERAPIA FICHAS (' + fichas.length + ')\nFecha;Paciente;Zona;Dolor inicial;Dolor final;Duracion (min);Profesional\n';
      fichas.forEach(a => { csv += [fmtF(a.created_at), a.paciente_nombre, a.zona_afectada, a.dolor_inicial, a.dolor_posterior, a.duracion_minutos, a.masoterapeuta_nombre].map(esc).join(';') + '\n'; });
      csv += '\nMASAJES MASIVOS;' + masajesTotal + '\n';
      csv += '\nINSUMOS CONSUMIDOS (' + consumos.length + ')\nItem;Cantidad;Precio unitario;Total\n';
      consumos.forEach(c => { csv += [c.item_nombre, c.cantidad, c.precio_unitario ?? 'sin precio', c.precio_unitario ? Number(c.cantidad) * Number(c.precio_unitario) : ''].map(esc).join(';') + '\n'; });
      csv += '\nCOSTO TOTAL INSUMOS;' + clp(costoInsumos) + '\n';

      const totalAt = medicas.length + kines.length + fichas.length;
      const htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1b24;color:#e8f0f8;border-radius:12px;overflow:hidden">
          <div style="background:#00c2a8;padding:22px 26px"><h2 style="margin:0;color:#0d1b24">📊 Reporte de cierre — ${evento_nombre}</h2></div>
          <div style="padding:26px">
            <p style="color:#9fb3c8">Evento cerrado el ${fmtF(fecha_cierre)}. Resumen de la operación:</p>
            <table style="width:100%;border-collapse:collapse;margin:14px 0">
              <tr><td style="padding:9px 0;border-bottom:1px solid #1e2d3d">🏥 Atenciones médicas</td><td style="text-align:right;font-weight:700">${medicas.length}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #1e2d3d">🦵 Kinesiología</td><td style="text-align:right;font-weight:700">${kines.length}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #1e2d3d">💆 Fichas masoterapia</td><td style="text-align:right;font-weight:700">${fichas.length}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #1e2d3d">🙌 Masajes masivos</td><td style="text-align:right;font-weight:700">${masajesTotal}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #1e2d3d">📦 Insumos consumidos (costo)</td><td style="text-align:right;font-weight:700">${clp(costoInsumos)}</td></tr>
              <tr><td style="padding:9px 0">Σ Total atenciones individuales</td><td style="text-align:right;font-weight:800;color:#00c2a8;font-size:18px">${totalAt}</td></tr>
            </table>
            <p style="color:#9fb3c8;font-size:13px">El detalle completo va adjunto en CSV (se abre con Excel). Generado automáticamente por TRIAGE360.</p>
          </div>
        </div>`;

      const { data, error } = await resend.emails.send({
        from: 'TRIAGE360 <alfredo.jara@sgtrumao.cl>',
        to: ['alfredo.jara@sgtrumao.cl', 'francia.munoz@sgtrumao.cl'],
        subject: `📊 Reporte de cierre: ${evento_nombre} (${totalAt} atenciones)`,
        html: htmlContent,
        attachments: [{
          filename: `reporte-${String(evento_nombre).replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40)}.csv`,
          content: Buffer.from(csv, 'utf-8').toString('base64'),
        }],
      });
      if (error) { console.error('Error reporte_evento:', error); return res.status(400).json({ error }); }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error en reporte_evento:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (tipo === 'asignacion_evento') {
    try {
      // Formatear fecha inicio
      const fechaInicio = new Date(evento.fecha).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Formatear fecha fin si existe
      let fechaTexto = fechaInicio;
      if (evento.fecha_fin) {
        const fechaFin = new Date(evento.fecha_fin).toLocaleDateString('es-CL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        fechaTexto = `${fechaInicio} al ${fechaFin}`;
      }

      // Formatear horario si existe
      let horarioTexto = '';
      if (evento.hora_inicio || evento.hora_fin) {
        horarioTexto = `<div class="info-item">
          <span class="label">🕐 Horario:</span> 
          <span class="value">${evento.hora_inicio || '--:--'} - ${evento.hora_fin || '--:--'}</span>
        </div>`;
      }

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
    .observaciones { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .observaciones-title { font-weight: 600; color: #92400e; margin-bottom: 8px; }
    .observaciones-text { color: #78350f; font-style: italic; }
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
          <span class="value">${fechaTexto}</span>
        </div>
        ${horarioTexto}
        <div class="info-item">
          <span class="label">👤 Tu rol:</span> 
          <span class="value"><strong>${rol}</strong></span>
        </div>
      </div>

      ${evento.observaciones ? `
      <div class="observaciones">
        <div class="observaciones-title">💬 Observaciones Importantes</div>
        <div class="observaciones-text">${evento.observaciones}</div>
      </div>
      ` : ''}

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
        from: 'TRIAGE360 <alfredo.jara@sgtrumao.cl>',
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

  if (tipo === 'alerta_stock') {
    try {
      const { insumos, profesional, evento } = req.body;

      const filasInsumos = insumos.map(i => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${i.nombre}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: 700;">${i.stockActual} ${i.unidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${i.minimo} ${i.unidad}</td>
        </tr>
      `).join('');

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 13px; color: #64748b; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Alerta de Stock Bajo - TRIAGE360</h1>
    </div>
    <div class="content">
      <p>Se ha detectado <strong>stock bajo el mínimo</strong> luego de una atención registrada:</p>
      <ul style="color: #64748b; font-size: 14px;">
        <li><strong>Profesional:</strong> ${profesional}</li>
        <li><strong>Evento:</strong> ${evento}</li>
        <li><strong>Hora:</strong> ${new Date().toLocaleString('es-CL')}</li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Insumo</th>
            <th style="text-align:center;">Stock Actual</th>
            <th style="text-align:center;">Mínimo</th>
          </tr>
        </thead>
        <tbody>${filasInsumos}</tbody>
      </table>
      <div style="text-align: center;">
        <a href="https://triage360.vercel.app" class="button">Ver en TRIAGE360</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>TRIAGE360</strong> - Gestión Clínica Inteligente | Powered by SGTRUMAO</p>
    </div>
  </div>
</body>
</html>`;

      const { data, error } = await resend.emails.send({
        from: 'TRIAGE360 <alfredo.jara@sgtrumao.cl>',
        to: ['alfredo.jara@sgtrumao.cl', 'francia.munoz@sgtrumao.cl'],
        subject: `🚨 Stock bajo mínimo en evento: ${evento}`,
        html: htmlContent
      });

      if (error) return res.status(400).json({ error });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Otros tipos de emails existentes...
  return res.status(400).json({ error: 'Tipo de email no soportado' });
}
// Force redeploy Fri Apr  3 22:59:00 -03 2026
