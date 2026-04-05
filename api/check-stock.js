// api/check-stock.js - Sistema de alertas de stock bajo
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Verificar que sea una petición autorizada (cron de Vercel)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('Iniciando verificación de stock...');
    
    // 1. Obtener todos los items de inventario
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/contenedores_medicamentos?select=*`,
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
      console.error('Error de Supabase:', errorText);
      throw new Error(`Error al obtener inventario: ${response.status} - ${errorText}`);
    }

    const inventario = await response.json();
    console.log(`Total items en inventario: ${inventario.length}`);

    // 2. Filtrar items con stock bajo o igual al mínimo
    const itemsBajos = inventario.filter(item => {
      const stock = parseInt(item.stock) || 0;
      const minimo = parseInt(item.minimo) || 0;
      return stock <= minimo;
    });

    console.log(`Items con stock bajo: ${itemsBajos.length}`);

    // Si no hay items con stock bajo, no enviar email
    if (itemsBajos.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No hay items con stock bajo',
        items: 0
      });
    }

    // 3. Agrupar por tipo (carros, bolsos medicamentos, bolsos kine)
    const carros = {};
    const bolsos = {};

    itemsBajos.forEach(item => {
      if (item.tipo === 'carro') {
        if (!carros[item.nombre]) carros[item.nombre] = [];
        carros[item.nombre].push(item);
      } else if (item.tipo === 'bolso') {
        if (!bolsos[item.nombre]) bolsos[item.nombre] = [];
        bolsos[item.nombre].push(item);
      }
    });

    console.log(`Carros afectados: ${Object.keys(carros).length}`);
    console.log(`Bolsos afectados: ${Object.keys(bolsos).length}`);

    // 4. Generar HTML del email
    const htmlContent = generarEmailHTML(carros, bolsos, itemsBajos.length);

    // 5. Enviar email a administradores
    const destinatarios = [
      'alfredo.jara@sgtrumao.cl',
      'francia.munoz@sgtrumao.cl'
    ];

    const { data, error } = await resend.emails.send({
      from: 'TRIAGE360 Alertas <alfredo.jara@sgtrumao.cl>',
      to: destinatarios,
      subject: `⚠️ Alerta de Stock Bajo - ${itemsBajos.length} items requieren atención`,
      html: htmlContent
    });

    if (error) {
      console.error('Error al enviar email:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Email enviado exitosamente');

    return res.status(200).json({ 
      success: true, 
      itemsBajos: itemsBajos.length,
      carrosAfectados: Object.keys(carros).length,
      bolsosAfectados: Object.keys(bolsos).length,
      emailEnviado: true,
      emailId: data?.id || null
    });

  } catch (error) {
    console.error('Error en check-stock:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}

function generarEmailHTML(carros, bolsos, totalItems) {
  const carrosHTML = Object.keys(carros).length > 0 ? `
    <div class="section">
      <h2 style="color: #0ea5e9; margin-top: 0; font-size: 18px;">🚑 Carros Clínicos</h2>
      ${Object.entries(carros).map(([nombreCarro, items]) => `
        <div class="carro-card">
          <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">${nombreCarro}</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const stock = parseInt(item.stock) || 0;
                const minimo = parseInt(item.minimo) || 0;
                const estado = stock === 0 ? 'AGOTADO' : stock < minimo ? 'CRÍTICO' : 'BAJO';
                const colorEstado = stock === 0 ? '#dc2626' : stock < minimo ? '#f59e0b' : '#eab308';
                
                return `
                  <tr>
                    <td><strong>${item.nombre_insumo || 'Sin nombre'}</strong></td>
                    <td>${item.cajon || '-'}</td>
                    <td style="text-align: center; font-weight: 600;">${stock} ${item.unidad || ''}</td>
                    <td style="text-align: center;">${minimo} ${item.unidad || ''}</td>
                    <td style="text-align: center;">
                      <span class="badge" style="background: ${colorEstado};">${estado}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  ` : '';

  const bolsosHTML = Object.keys(bolsos).length > 0 ? `
    <div class="section">
      <h2 style="color: #0ea5e9; margin-top: 0; font-size: 18px;">💊 Bolsos de Medicamentos y Kinesiología</h2>
      ${Object.entries(bolsos).map(([nombreBolso, items]) => `
        <div class="carro-card">
          <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">${nombreBolso}</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const stock = parseInt(item.stock) || 0;
                const minimo = parseInt(item.minimo) || 0;
                const estado = stock === 0 ? 'AGOTADO' : stock < minimo ? 'CRÍTICO' : 'BAJO';
                const colorEstado = stock === 0 ? '#dc2626' : stock < minimo ? '#f59e0b' : '#eab308';
                
                return `
                  <tr>
                    <td><strong>${item.nombre_insumo || 'Sin nombre'}</strong></td>
                    <td>${item.cajon || '-'}</td>
                    <td style="text-align: center; font-weight: 600;">${stock} ${item.unidad || ''}</td>
                    <td style="text-align: center;">${minimo} ${item.unidad || ''}</td>
                    <td style="text-align: center;">
                      <span class="badge" style="background: ${colorEstado};">${estado}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #1e293b; 
      margin: 0;
      padding: 0;
      background: #f8fafc;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); 
      color: white; 
      padding: 30px; 
      border-radius: 10px 10px 0 0; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
    }
    .alert-badge {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 10px;
      font-size: 14px;
      font-weight: 600;
    }
    .content { 
      background: white; 
      padding: 30px; 
      border: 1px solid #e2e8f0; 
      border-top: none; 
    }
    .section {
      margin-bottom: 30px;
    }
    .carro-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .items-table th {
      background: #0ea5e9;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .items-table tr:hover {
      background: #f1f5f9;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      color: white;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      color: #64748b; 
      font-size: 12px; 
    }
    .button { 
      display: inline-block; 
      background: #0ea5e9; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600; 
      margin: 20px 0; 
    }
    .summary-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Alerta de Stock Bajo - TRIAGE360</h1>
      <div class="alert-badge">${totalItems} items requieren reposición</div>
    </div>
    
    <div class="content">
      <div class="summary-box">
        <strong style="color: #92400e;">Atención Administradores:</strong><br>
        Se han detectado <strong>${totalItems} items</strong> con stock bajo o agotado en el inventario.
        Es necesario realizar reposición lo antes posible para garantizar la operación continua.
      </div>

      ${carrosHTML}
      ${bolsosHTML}

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://triage360.vercel.app" class="button">Acceder al Sistema</a>
      </div>

      <p style="margin-top: 30px; color: #64748b; font-size: 13px; text-align: center;">
        Esta es una alerta automática generada a las 22:00 hrs.<br>
        Revisa el sistema para actualizar el inventario.
      </p>
    </div>

    <div class="footer">
      <p><strong>TRIAGE360</strong> - Sistema de Gestión Clínica</p>
      <p>Powered by SGTRUMAO</p>
    </div>
  </div>
</body>
</html>
  `;
}
