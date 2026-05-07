export const formatearNumero = (numero) => {
  if (numero == null || numero === 0) return "0";
  return new Intl.NumberFormat("es-CL").format(numero);
};

export const formatearPrecio = (precio) => {
  if (precio == null || precio === 0) return "$0";
  return "$" + formatearNumero(precio);
};

export const CATEGORIAS_INSUMOS = [
  "Todos",
  "Instrumental",
  "Vía Aérea",
  "Circulatorio",
  "Inmovilización",
  "Curaciones",
  "Material Descartable",
  "Otros",
];

export const calcularPorcentajeValorizado = (conPrecio, total) => {
  if (!total || total === 0) return 0;
  return Math.round((conPrecio / total) * 100);
};

export const today = new Date();
export const diasHastaVenc = (f) => Math.ceil((new Date(f) - today) / 86400000);
export const estadoVenc = (f) => { const d = diasHastaVenc(f); return d < 0 ? "vencido" : d <= 60 ? "proximo" : "ok"; };
export const estadoStock = (i) => i.stock === 0 ? "agotado" : i.stock < i.minimo ? "bajo" : "ok";

export const MEDICAMENTOS_INYECTABLES = [
  { id: 101, nombre: "Ondansetrón", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2025-11-30" },
  { id: 102, nombre: "Clorfenamina", dosis: "10mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 2, unidad: "amp.", vencimiento: "2026-08-01" },
  { id: 103, nombre: "Viadil", dosis: "5mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 2, unidad: "amp.", vencimiento: "2026-05-15" },
  { id: 104, nombre: "Dexametasona", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 5, minimo: 2, unidad: "amp.", vencimiento: "2026-12-01" },
  { id: 105, nombre: "Metoclopramida", dosis: "10mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 2, unidad: "amp.", vencimiento: "2027-02-01" },
  { id: 106, nombre: "Betametasona", dosis: "4mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2025-10-10" },
  { id: 107, nombre: "Esomeprazol", dosis: "40mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 2, unidad: "amp.", vencimiento: "2026-09-01" },
  { id: 108, nombre: "Hidrocortisona", dosis: "100mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 2, minimo: 1, unidad: "vial", vencimiento: "2026-07-01" },
  { id: 109, nombre: "Ketorolaco", dosis: "30mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 4, minimo: 3, unidad: "amp.", vencimiento: "2026-11-01" },
  { id: 110, nombre: "Ketoprofeno", dosis: "100mg", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2026-10-01" },
  { id: 111, nombre: "Metamizol", dosis: "1gr", tipo: "inyectable", caja: "Caja 1 · Inyectables", stock: 3, minimo: 2, unidad: "amp.", vencimiento: "2026-06-01" },
];

export const MEDICAMENTOS_ORALES = [
  { id: 201, nombre: "Ketorolaco S/L", dosis: "30mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2026-10-01" },
  { id: 202, nombre: "Clorfenamina", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 10, minimo: 6, unidad: "comp.", vencimiento: "2027-01-01" },
  { id: 203, nombre: "Ibuprofeno", dosis: "600mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 12, minimo: 8, unidad: "comp.", vencimiento: "2026-12-01" },
  { id: 204, nombre: "Viadil", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2026-08-01" },
  { id: 205, nombre: "Paracetamol", dosis: "500mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 20, minimo: 10, unidad: "comp.", vencimiento: "2027-03-01" },
  { id: 206, nombre: "Loperamida", dosis: "2mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-11-01" },
  { id: 207, nombre: "Celecoxib", dosis: "200mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2026-09-01" },
  { id: 208, nombre: "Prednisona", dosis: "5mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 10, minimo: 6, unidad: "comp.", vencimiento: "2027-02-01" },
  { id: 209, nombre: "Ketoprofeno", dosis: "200mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-10-01" },
  { id: 210, nombre: "Desloratadina", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 6, minimo: 4, unidad: "comp.", vencimiento: "2027-01-01" },
  { id: 211, nombre: "Ondansetrón", dosis: "4mg", tipo: "oral", caja: "Caja 2 · Orales", stock: 8, minimo: 4, unidad: "comp.", vencimiento: "2026-12-01" },
  { id: 212, nombre: "Lágrimas Artificiales", dosis: "", tipo: "oral", caja: "Caja 2 · Orales", stock: 2, minimo: 1, unidad: "frasco", vencimiento: "2027-05-01" },
];

export const MEDICAMENTOS_AEROSOLES = [
  { id: 301, nombre: "Salbutamol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 2, minimo: 1, unidad: "inhalador", vencimiento: "2026-09-01" },
  { id: 302, nombre: "Femoterol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-07-01" },
  { id: 303, nombre: "Bromuro", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-11-01" },
];

export const INSUMOS_BASE = [
  // CAJÓN 1
  { nombre: "Mariposas N°21", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Mariposas N°23", cajon: "Cajón 1", stock: 2, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Termómetro", cajon: "Cajón 1", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Tapones nasales", cajon: "Cajón 1", stock: 2, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Pack alcohol", cajon: "Cajón 1", stock: 1, minimo: 1, unidad: "pack", vencimiento: "2027-01-01" },
  { nombre: "Parche curita", cajon: "Cajón 1", stock: 1, minimo: 1, unidad: "caja", vencimiento: "2027-01-01" },
  { nombre: "Llaves 3 pasos con alargador", cajon: "Cajón 1", stock: 3, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Llaves 3 pasos", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tapón antireflujo", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tapas rojas", cajon: "Cajón 1", stock: 10, minimo: 5, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Agujas N°18", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Jeringas 1ml", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Jeringas 3ml", cajon: "Cajón 1", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Jeringas 5ml", cajon: "Cajón 1", stock: 14, minimo: 5, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Jeringas 10ml", cajon: "Cajón 1", stock: 10, minimo: 5, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Jeringas 20ml", cajon: "Cajón 1", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cinta micropore 1 y 2 pulgada", cajon: "Cajón 1", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  // CAJÓN 2
  { nombre: "Jeringa N°50", cajon: "Cajón 2", stock: 5, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tega Derm", cajon: "Cajón 2", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 14", cajon: "Cajón 2", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 16", cajon: "Cajón 2", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 18", cajon: "Cajón 2", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 20", cajon: "Cajón 2", stock: 2, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 22", cajon: "Cajón 2", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula 24", cajon: "Cajón 2", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula de gas", cajon: "Cajón 2", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Ligadura", cajon: "Cajón 2", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Apósitos", cajon: "Cajón 2", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Parches 6x7", cajon: "Cajón 2", stock: 5, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Gasas", cajon: "Cajón 2", stock: 10, minimo: 5, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sueros fisiológicos 20ml", cajon: "Cajón 2", stock: 15, minimo: 5, unidad: "unid.", vencimiento: "2027-06-01" },
  // CAJÓN 3
  { nombre: "Tijera", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Tubo aspiración 1.8mt", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cánula Yancahuer", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 6", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 6.5", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 7", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 7.5", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 8", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Tubo endotraquial 8.5", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sonda aspiración 12", cajon: "Cajón 3", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sonda aspiración 14", cajon: "Cajón 3", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sonda aspiración 16", cajon: "Cajón 3", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Bajada macro goteo", cajon: "Cajón 3", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Ventury adulto", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Máscara nebulización adulto", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Naricera adulto", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Mascarilla alta concentración adulto", cajon: "Cajón 3", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  // CAJÓN 4
  { nombre: "Guantes estériles N°6", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles N°6.5", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles N°7", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles N°7.5", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles N°8", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles sin látex N°6", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles sin látex N°6.5", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles sin látex N°7", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles sin látex N°7.5", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Guantes estériles sin látex N°8", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "pares", vencimiento: "2027-06-01" },
  { nombre: "Cinta afrontamiento 6x75mm", cajon: "Cajón 4", stock: 3, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cinta afrontamiento 6x38mm", cajon: "Cajón 4", stock: 3, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Cinta afrontamiento 12x10mm", cajon: "Cajón 4", stock: 3, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Nylon N°3", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Nylon N°4", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Nylon N°5", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Nylon N°6", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Vicryl N°3", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Vicryl N°4", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Sutura Vicryl N°5", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Elastomul", cajon: "Cajón 4", stock: 8, minimo: 3, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Corchetera", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Kit curación", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Visturi", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Saca corchete", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Kit sutura N°3", cajon: "Cajón 4", stock: 2, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Campo estéril", cajon: "Cajón 4", stock: 4, minimo: 2, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Bicarbonato de sodio", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Clorhexidina gluconato 2% solución tópica", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Clorhexidina gluconato 2% jabón líquido", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Povidona yodada 10%", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Alcohol al 70%", cajon: "Cajón 4", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  // CAJÓN 5
  { nombre: "AMBU", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Pqte electrodos 50 unid.", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "pqte", vencimiento: "2027-06-01" },
  { nombre: "Máscara I-GEL 2.5", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Máscara I-GEL 3", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Máscara I-GEL 4", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Máscara I-GEL 5", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Ringer lactato 500ml", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Glucosa al 30% 500ml", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Suero 100ml", cajon: "Cajón 5", stock: 2, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Suero 200ml", cajon: "Cajón 5", stock: 2, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Suero 500ml", cajon: "Cajón 5", stock: 2, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Suero 1lt", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "frasco", vencimiento: "2027-06-01" },
  { nombre: "Laringoscopio 4 hojas curvas", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Hoja recta N°2", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Tubo 5.5cms", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2027-06-01" },
  { nombre: "Oftalmoscopio/Otoscopio", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
  { nombre: "Glucómetro", cajon: "Cajón 5", stock: 1, minimo: 1, unidad: "unid.", vencimiento: "2028-01-01" },
];

export const crearInsumosCarro = (carroId) =>
  INSUMOS_BASE.map((ins, idx) => ({ ...ins, id: carroId * 1000 + idx }));

export const CARROS_INICIALES = [
  { id: 1, nombre: "Carro 1", color: "#00c2a8", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(1) },
  { id: 2, nombre: "Carro 2", color: "#58a6ff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(2) },
  { id: 3, nombre: "Carro 3", color: "#d29922", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(3) },
  { id: 4, nombre: "Carro 4", color: "#f85149", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(4) },
  { id: 5, nombre: "Carro 5", color: "#bc8cff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(5) },
  { id: 6, nombre: "Carro 6", color: "#3fb950", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(6) },
  { id: 7, nombre: "Carro 7", color: "#79c0ff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(7) },
];

export const CAJONES_META = [
  { id: "Cajón 1", emoji: "🩺", nombre: "Vías y accesos", color: "#58a6ff" },
  { id: "Cajón 2", emoji: "💉", nombre: "Cánulas y sueros", color: "#00c2a8" },
  { id: "Cajón 3", emoji: "🫁", nombre: "Vía aérea", color: "#bc8cff" },
  { id: "Cajón 4", emoji: "🔪", nombre: "Cirugía y antisépticos", color: "#f0883e" },
  { id: "Cajón 5", emoji: "🚨", nombre: "Equipamiento especializado", color: "#f85149" },
];

export const TIPOS_ATENCION = ["Consulta general", "Urgencia", "Traumatología", "Kinesiología", "Masoterapia", "Evaluación", "Derivación"];

export const ATENCIONES_INICIALES = [
  {
    id: 1, evento: "Media Maratón de Santiago", fecha: "2026-02-20",
    paciente: "Juan Pérez", rut: "12.345.678-9", edad: 34,
    profesion: "Médico", profesional: "Dr. Rodrigo Soto",
    tipo: "Urgencia", hora_ingreso: "10:30", hora_egreso: "11:15",
    diagnostico: "Contusión rodilla derecha post caída",
    tratamiento: "Inmovilización, frío local, reposo",
    insumos_usados: "Venda elástica x1, gasas x4, hielo",
    derivacion: "No", observaciones: ""
  },
  {
    id: 2, evento: "Media Maratón de Santiago", fecha: "2026-02-20",
    paciente: "María González", rut: "15.678.901-2", edad: 28,
    profesion: "Paramédico", profesional: "Carlos Muñoz",
    tipo: "Consulta general", hora_ingreso: "11:00", hora_egreso: "11:20",
    diagnostico: "Deshidratación leve",
    tratamiento: "Hidratación oral, reposo",
    insumos_usados: "Suero oral x1",
    derivacion: "No", observaciones: "Paciente evolucionó bien"
  },
];
