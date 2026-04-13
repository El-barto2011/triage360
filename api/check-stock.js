// api/check-stock.js - Sistema de alertas de stock bajo y vencimientos
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('Iniciando verificacion de stock y vencimientos...');

    const hoy = new Date();
    const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    const hoyStr = hoy.toISOString().split('T')[0];
    const en30diasStr = en30dias.toISOString().split('T')[0];

    // PARTE 1: STOCK BAJO
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
      throw new Error(`Error al obtener inventario: ${response.status} - ${errorText}`);
    }

    const inventario = await response.json();
    const itemsBajos = inventario.filter(item => {
      const stock = parseInt(item.stock) || 0;
      const minimo = parseInt(item.minimo) || 0;
      return stock <= minimo;
    });

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

    // PARTE 2: VENCIMIENTOS PROXIMOS (30 dias)
    const headers = { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` };

    const [resContProx, resInsProx, resMedProx, resContVenc, resInsVenc, resMedVenc] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/contenedores_medicamentos?select=nombre_insumo,fecha_vencimiento,nombre,tipo&fecha_vencimiento=lte.${en30diasStr}&fecha_vencimiento=gte.${hoyStr}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/insumos_carro?select=nombre_insumo,fecha_vencimiento,cajon&fecha_vencimiento=lte.${en30diasStr}&fecha_vencimiento=gte.${hoyStr}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/medicamentos?select=nombre,vencimiento,caja&vencimiento=lte.${en30diasStr}&vencimiento=gte.${hoyStr}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/contenedores_medicamentos?select=nombre_insumo,fecha_vencimiento,nombre,tipo&fecha_vencimiento=lt.${hoyStr}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/insumos_carro?select=nombre_insumo,fecha_vencimiento,cajon&fecha_vencimiento=lt.${hoyStr}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/medicamentos?select=nombre,vencimiento,caja&vencimiento=lt.${hoyStr}`, { headers })
    ]);

    const contProx = resContProx.ok ? await resContProx.json() : [];
    const insProx = resInsProx.ok ? await resInsProx.json() : [];
    const medProx = resMedProx.ok ? await resMedProx.json() : [];
    const contVenc = resContVenc.ok ? await resContVenc.json() : [];
    const insVenc = resInsVenc.ok ? await resInsVenc.json() : [];
    const medVenc = resMedVenc.ok ? await resMedVenc.json() : [];

    const proximosVencer = [
      ...contProx.map(i => ({ nombre: i.nombre_insumo || i.nombre, vencimiento: i.fecha_vencimiento, ubicacion: i.nombre || '-', tipo: 'Contenedor' })),
      ...insProx.map(i => ({ nombre: i.nombre_insumo, vencimiento: i.fecha_vencimiento, ubicacion: i.cajon || '-', tipo: 'Carro' })),
      ...medProx.map(i => ({ nombre: i.nombre, vencimiento: i.vencimiento, ubicacion: i.caja || '-', tipo: 'Medicamento' }))
    ].sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

    const yaVencidos = [
      ...contVenc.map(i => ({ nombre: i.nombre_insumo || i.nombre, vencimiento: i.fecha_vencimiento, ubicacion: i.nombre || '-', tipo: 'Contenedor' })),
      ...insVenc.map(i => ({ nombre: i.nombre_insumo, vencimiento: i.fecha_vencimiento, ubicacion: i.cajon || '-', tipo: 'Carro' })),
      ...medVenc.map(i => ({ nombre: i.nombre, vencimiento: i.vencimiento, ubicacion: i.caja || '-', tipo: 'Medicamento' }))
    ];

    console.log(`Stock bajo: ${itemsBajos.length}, Proximos a vencer: ${proximosVencer.length}, Ya vencidos: ${yaVencidos.length}`);

    if (itemsBajos.length === 0 && proximosVencer.length === 0 && yaVencidos.length === 0) {
      return res.status(200).json({ success: true, message: 'Todo en orden', items: 0 });
    }

    const htmlContent = generarEmailHTML(carros, bolsos, itemsBajos.length, proximosVencer, yaVencidos);

    const asunto = yaVencidos.length > 0
      ? `URGENTE: ${yaVencidos.length} productos vencidos + ${itemsBajos.length} stock bajo - TRIAGE360`
      : `Alerta TRIAGE360: ${proximosVencer.length} vencimientos proximos, ${itemsBajos.length} stock bajo`;

    const { data, error } = await resend.emails.send({
      from: 'TRIAGE360 Alertas <alfredo.jara@sgtrumao.cl>',
      to: ['alfredo.jara@sgtrumao.cl', 'francia.munoz@sgtrumao.cl'],
      subject: asunto,
      html: htmlContent
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      itemsBajos: itemsBajos.length,
      proximosVencer: proximosVencer.length,
      yaVencidos: yaVencidos.length,
      emailEnviado: true,
      emailId: data?.id || null
    });

  } catch (error) {
    console.error('Error en check-stock:', error);
    return res.status(500).json({ error: error.message });
  }
}

function generarEmailHTML(carros, bolsos, totalStock, proximosVencer, yaVencidos) {
  const carrosHTML = Object.keys(carros).length > 0 ? `
    <div class="section">
      <h2 style="color:#dc2626;font-size:16px;">🚑 Stock Bajo — Carros Clinicos</h2>
      ${Object.entries(carros).map(([nombre, items]) => `
        <div class="card">
          <strong>${nombre}</strong>
          <table class="tbl">
            <thead><tr><th>Item</th><th>Ubicacion</th><th>Stock</th><th>Minimo</th><th>Estado</th></tr></thead>
            <tbody>
              ${items.map(item => {
                const stock = parseInt(item.stock) || 0;
                const minimo = parseInt(item.minimo) || 0;
                const estado = stock === 0 ? 'AGOTADO' : 'BAJO';
                const color = stock === 0 ? '#dc2626' : '#f59e0b';
                return `<tr><td>${item.nombre_insumo || 'Sin nombre'}</td><td>${item.cajon || '-'}</td><td style="text-align:center;font-weight:700">${stock} ${item.unidad || ''}</td><td style="text-align:center">${minimo}</td><td style="text-align:center"><span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px">${estado}</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>` : '';

  const bolsosHTML = Object.keys(bolsos).length > 0 ? `
    <div class="section">
      <h2 style="color:#dc2626;font-size:16px;">💊 Stock Bajo — Bolsos</h2>
      ${Object.entries(bolsos).map(([nombre, items]) => `
        <div class="card">
          <strong>${nombre}</strong>
          <table class="tbl">
            <thead><tr><th>Item</th><th>Stock</th><th>Minimo</th></tr></thead>
            <tbody>
              ${items.map(item => {
                const stock = parseInt(item.stock) || 0;
                const minimo = parseInt(item.minimo) || 0;
                const color = stock === 0 ? '#dc2626' : '#f59e0b';
                return `<tr><td>${item.nombre_insumo || 'Sin nombre'}</td><td style="text-align:center;font-weight:700;color:${color}">${stock} ${item.unidad || ''}</td><td style="text-align:center">${minimo}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>` : '';

  const vencidosHTML = yaVencidos.length > 0 ? `
    <div class="section">
      <h2 style="color:#dc2626;font-size:16px;">🚨 PRODUCTOS VENCIDOS — Retirar Inmediatamente</h2>
      <table class="tbl">
        <thead><tr><th>Producto</th><th>Tipo</th><th>Ubicacion</th><th>Vencio</th></tr></thead>
        <tbody>
          ${yaVencidos.map(i => `<tr style="background:#fef2f2"><td><strong>${i.nombre}</strong></td><td>${i.tipo}</td><td>${i.ubicacion}</td><td style="color:#dc2626;font-weight:700">${new Date(i.vencimiento).toLocaleDateString('es-CL')}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  const proximosHTML = proximosVencer.length > 0 ? `
    <div class="section">
      <h2 style="color:#f59e0b;font-size:16px;">⏰ Proximos a Vencer (30 dias)</h2>
      <table class="tbl">
        <thead><tr><th>Producto</th><th>Tipo</th><th>Ubicacion</th><th>Vence</th><th>Dias</th></tr></thead>
        <tbody>
          ${proximosVencer.map(i => {
            const dias = Math.ceil((new Date(i.vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
            const color = dias <= 7 ? '#dc2626' : dias <= 15 ? '#f59e0b' : '#64748b';
            return `<tr><td>${i.nombre}</td><td>${i.tipo}</td><td>${i.ubicacion}</td><td>${new Date(i.vencimiento).toLocaleDateString('es-CL')}</td><td style="text-align:center;color:${color};font-weight:700">${dias} dias</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#1e293b;margin:0;padding:0;background:#f8fafc}
  .container{max-width:700px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#002850,#dc2626);color:white;padding:28px 32px;border-radius:10px 10px 0 0;text-align:center}
  .content{background:white;padding:28px 32px;border:1px solid #e2e8f0;border-radius:0 0 10px 10px}
  .section{margin-bottom:28px}
  .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px}
  .tbl{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
  .tbl th{background:#0ea5e9;color:white;padding:8px 10px;text-align:left;font-size:12px}
  .tbl td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
  .footer{text-align:center;padding:16px;color:#64748b;font-size:12px}
  .btn{display:inline-block;background:#148C8C;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0}
  .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
  .sum-card{text-align:center;padding:16px;border-radius:8px;border:1px solid #e2e8f0}
</style>
</head>
<body><div class="container">
  <div class="header">
    <h1 style="margin:0;font-size:20px">⚕️ TRIAGE360 — Reporte de Alertas</h1>
    <p style="margin:6px 0 0;opacity:0.85;font-size:13px">${new Date().toLocaleDateString('es-CL', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
  </div>
  <div class="content">
    <div class="summary">
      <div class="sum-card" style="border-color:${yaVencidos.length > 0 ? '#dc2626' : '#e2e8f0'}">
        <div style="font-size:28px;font-weight:800;color:${yaVencidos.length > 0 ? '#dc2626' : '#22c55e'}">${yaVencidos.length}</div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Ya Vencidos</div>
      </div>
      <div class="sum-card" style="border-color:${proximosVencer.length > 0 ? '#f59e0b' : '#e2e8f0'}">
        <div style="font-size:28px;font-weight:800;color:${proximosVencer.length > 0 ? '#f59e0b' : '#22c55e'}">${proximosVencer.length}</div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Proximos a Vencer</div>
      </div>
      <div class="sum-card" style="border-color:${totalStock > 0 ? '#f59e0b' : '#e2e8f0'}">
        <div style="font-size:28px;font-weight:800;color:${totalStock > 0 ? '#f59e0b' : '#22c55e'}">${totalStock}</div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Stock Bajo</div>
      </div>
    </div>
    ${vencidosHTML}
    ${proximosHTML}
    ${carrosHTML}
    ${bolsosHTML}
    <div style="text-align:center"><a href="https://triage360.vercel.app" class="btn">Ver en TRIAGE360</a></div>
  </div>
  <div class="footer"><p><strong>TRIAGE360</strong> - Gestion Clinica Inteligente · Powered by SGTRUMAO SPA</p></div>
</div></body></html>`;
}
