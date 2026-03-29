import { useState, useEffect } from "react";


// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://dnlvzwrujosuckdzmffx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg0MzAsImV4cCI6MjA5MDIzNDQzMH0.Bhw_ws8XNzWxJXBn1TzLjNppBD9CRWDTuEb_t92G9ZE";

// ─── SUPABASE HELPER ─────────────────────────────────────────────────────────
const sb = async (endpoint, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Prefer": "return=representation" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) { const e = await res.text(); console.error("Supabase error:", e); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};


// ─── DATOS REALES DEL BOLSO NARANJA ─────────────────────────────────────────
const MEDICAMENTOS_INYECTABLES = [
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

const MEDICAMENTOS_ORALES = [
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

const MEDICAMENTOS_AEROSOLES = [
  { id: 301, nombre: "Salbutamol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 2, minimo: 1, unidad: "inhalador", vencimiento: "2026-09-01" },
  { id: 302, nombre: "Femoterol", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-07-01" },
  { id: 303, nombre: "Bromuro", dosis: "Puff", tipo: "aerosol", caja: "Caja 3 · Aerosoles", stock: 1, minimo: 1, unidad: "inhalador", vencimiento: "2026-11-01" },
];

// Inventario base igual para todos los carros
const INSUMOS_BASE = [
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

const crearInsumosCarro = (carroId) =>
  INSUMOS_BASE.map((ins, idx) => ({ ...ins, id: carroId * 1000 + idx }));

const CARROS_INICIALES = [
  { id: 1, nombre: "Carro 1", color: "#00c2a8", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(1) },
  { id: 2, nombre: "Carro 2", color: "#58a6ff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(2) },
  { id: 3, nombre: "Carro 3", color: "#d29922", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(3) },
  { id: 4, nombre: "Carro 4", color: "#f85149", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(4) },
  { id: 5, nombre: "Carro 5", color: "#bc8cff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(5) },
  { id: 6, nombre: "Carro 6", color: "#3fb950", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(6) },
  { id: 7, nombre: "Carro 7", color: "#79c0ff", evento_asignado: "Sin asignar", insumos: crearInsumosCarro(7) },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const today = new Date();
const diasHastaVenc = (f) => Math.ceil((new Date(f) - today) / 86400000);
const estadoVenc = (f) => { const d = diasHastaVenc(f); return d < 0 ? "vencido" : d <= 60 ? "proximo" : "ok"; };
const estadoStock = (i) => i.stock === 0 ? "agotado" : i.stock < i.minimo ? "bajo" : "ok";

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117", surface: "#161b22", surface2: "#1c2330", border: "#30363d",
  accent: "#00c2a8", accentDim: "#00c2a820",
  red: "#f85149", redDim: "#f8514918",
  yellow: "#d29922", yellowDim: "#d2992218",
  green: "#3fb950", greenDim: "#3fb95018",
  blue: "#58a6ff", blueDim: "#58a6ff18",
  orange: "#f0883e", orangeDim: "#f0883e18",
  purple: "#bc8cff", purpleDim: "#bc8cff18",
  text: "#e6edf3", textMuted: "#8b949e", textFaint: "#484f58",
};

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex" },
  sidebar: { width: 230, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 },
  logo: { padding: "24px 20px", borderBottom: `1px solid ${C.border}` },
  nav: { padding: "12px", flex: 1 },
  navSection: { fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1.5, padding: "12px 8px 6px" },
  navItem: (a) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: a ? C.accentDim : "transparent", color: a ? C.accent : C.textMuted, fontWeight: a ? 600 : 400, fontSize: 14, border: `1px solid ${a ? C.accent + "30" : "transparent"}`, transition: "all 0.12s" }),
  main: { flex: 1, overflow: "auto", padding: 28 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px", borderBottom: `1px solid ${C.border}` },
  td: { padding: "11px 12px", borderBottom: `1px solid ${C.border}15`, fontSize: 14, verticalAlign: "middle" },
  btn: (v = "primary") => ({ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: v === "ghost" ? `1px solid ${C.border}` : "none", background: v === "primary" ? C.accent : v === "danger" ? C.red : C.surface2, color: v === "ghost" ? C.textMuted : "#fff" }),
  input: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  select: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 14, outline: "none" },
  badge: (c, bg) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: c, background: bg, textTransform: "uppercase", letterSpacing: 0.5 }),
  pill: (c, bg) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: c, background: bg }),
  modal: { position: "fixed", inset: 0, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalBox: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 520, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" },
  formRow: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  tabs: { display: "flex", gap: 4, marginBottom: 24, background: C.surface2, borderRadius: 10, padding: 4 },
  tab: (a, color) => ({ padding: "8px 18px", borderRadius: 7, fontSize: 13, fontWeight: a ? 700 : 500, cursor: "pointer", color: a ? (color || C.text) : C.textMuted, background: a ? C.surface : "transparent", border: "none", transition: "all 0.12s", position: "relative" }),
};

const icons = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  carro: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z",
  bolso: "M20 6h-2.18c.07-.44.18-.88.18-1a3 3 0 0 0-6 0c0 .12.11.56.18 1H10c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
  alert: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  event: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  warn: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};
const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={icons[name] || icons.alert} />
  </svg>
);

// ─── BADGES ──────────────────────────────────────────────────────────────────
const VencBadge = ({ v }) => {
  const s = estadoVenc(v);
  if (s === "vencido") return <span style={S.badge(C.red, C.redDim)}>Vencido</span>;
  if (s === "proximo") return <span style={S.badge(C.yellow, C.yellowDim)}>{diasHastaVenc(v)}d</span>;
  return <span style={S.badge(C.green, C.greenDim)}>OK</span>;
};
const StockBadge = ({ ins }) => {
  const s = estadoStock(ins);
  if (s === "agotado") return <span style={S.pill(C.red, C.redDim)}>Agotado</span>;
  if (s === "bajo") return <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span>;
  return <span style={S.pill(C.green, C.greenDim)}>OK</span>;
};

// ─── TABLA INSUMOS ───────────────────────────────────────────────────────────
function TablaInsumos({ items, onEdit, onDelete }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos registrados</div>
        ) : items.map(ins => (
          <div key={ins.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{ins.nombre} {ins.dosis && <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 13 }}>{ins.dosis}</span>}</div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 2 }}>{ins.cajon}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}/{ins.minimo} {ins.unidad}</span>
                  <VencBadge v={ins.vencimiento} />
                  <StockBadge ins={ins} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                <button style={{ ...S.btn("ghost"), padding: "8px 10px" }} onClick={() => onEdit(ins)}><Icon name="edit" size={15} color={C.textMuted} /></button>
                <button style={{ ...S.btn("ghost"), padding: "8px 10px" }} onClick={() => onDelete(ins.id)}><Icon name="trash" size={15} color={C.red} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table style={S.table}>
      <thead>
        <tr>
          {["Nombre", "Stock", "Vencimiento", "Estado", ""].map(h => (
            <th key={h} style={S.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos registrados</td></tr>
        ) : items.map(ins => (
          <tr key={ins.id}>
            <td style={S.td}>
              <div style={{ fontWeight: 600 }}>
                {ins.nombre} {ins.dosis && <span style={{ color: C.textMuted, fontWeight: 400 }}>{ins.dosis}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint }}>{ins.cajon}</div>
            </td>
            <td style={S.td}>
              <span style={{ fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}</span>
              <span style={{ fontSize: 11, color: C.textFaint }}> / {ins.minimo} {ins.unidad}</span>
            </td>
            <td style={S.td}>{new Date(ins.vencimiento).toLocaleDateString("es-CL")}</td>
            <td style={S.td}><VencBadge v={ins.vencimiento} /> <StockBadge ins={ins} /></td>
            <td style={S.td}>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => onEdit(ins)}><Icon name="edit" size={13} color={C.textMuted} /></button>
                <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => onDelete(ins.id)}><Icon name="trash" size={13} color={C.red} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── MODAL INSUMO ────────────────────────────────────────────────────────────
function ModalInsumo({ form, setForm, onSave, onClose, titulo, showDosis = false, cajones = [] }) {
  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{titulo}</div>
          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><Icon name="close" size={20} color={C.textMuted} /></button>
        </div>
        <div style={S.formRow}>
          <label style={S.formLabel}>Nombre</label>
          <input style={S.input} value={form.nombre || ""} onChange={e => F("nombre", e.target.value)} />
        </div>
        {showDosis && (
          <div style={S.formRow}>
            <label style={S.formLabel}>Dosis / Presentación</label>
            <input style={S.input} value={form.dosis || ""} onChange={e => F("dosis", e.target.value)} placeholder="Ej: 500mg, Puff" />
          </div>
        )}
        {cajones.length > 0 && (
          <div style={S.formRow}>
            <label style={S.formLabel}>Cajón</label>
            <select style={{ ...S.select, width: "100%" }} value={form.cajon || ""} onChange={e => F("cajon", e.target.value)}>
              {cajones.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div style={S.grid2}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Stock actual</label>
            <input style={S.input} type="number" value={form.stock || ""} onChange={e => F("stock", e.target.value)} />
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Stock mínimo</label>
            <input style={S.input} type="number" value={form.minimo || ""} onChange={e => F("minimo", e.target.value)} />
          </div>
        </div>
        <div style={S.grid2}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Unidad</label>
            <select style={{ ...S.select, width: "100%" }} value={form.unidad || "unid."} onChange={e => F("unidad", e.target.value)}>
              {["unid.", "amp.", "comp.", "frascos", "pares", "vial", "inhalador", "cajas"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Vencimiento</label>
            <input style={S.input} type="date" value={form.vencimiento || ""} onChange={e => F("vencimiento", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btn("ghost")} onClick={onClose}>Cancelar</button>
          <button style={S.btn("primary")} onClick={onSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA CARROS ────────────────────────────────────────────────────────────
const CAJONES_META = [
  { id: "Cajón 1", emoji: "🩺", nombre: "Vías y accesos", color: C.blue },
  { id: "Cajón 2", emoji: "💉", nombre: "Cánulas y sueros", color: C.accent },
  { id: "Cajón 3", emoji: "🫁", nombre: "Vía aérea", color: C.purple },
  { id: "Cajón 4", emoji: "🔪", nombre: "Cirugía y antisépticos", color: C.orange },
  { id: "Cajón 5", emoji: "🚨", nombre: "Equipamiento especializado", color: C.red },
];

function VistaCarros({ carros, setCarros, permisos, esAdmin }) {
  const [carroSel, setCarroSel] = useState(carros[0]?.id);
  const [cajonAbierto, setCajonAbierto] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const carro = carros.find(c => c.id === carroSel);
  const alertasCarro = (c) => c.insumos.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
  const insumosCajon = (cajonId) => carro ? carro.insumos.filter(i => i.cajon === cajonId) : [];
  const alertasCajon = (cajonId) => insumosCajon(cajonId).filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const toggleCajon = (cajonId) => setCajonAbierto(prev => prev === cajonId ? null : cajonId);

  const abrirNuevo = (cajonId) => {
    setForm({ nombre: "", cajon: cajonId, stock: "", minimo: "", unidad: "unid.", vencimiento: "" });
    setModal("nuevo");
  };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = () => {
    if (!form.nombre || !form.vencimiento) return;
    setCarros(prev => prev.map(c => {
      if (c.id !== carroSel) return c;
      if (modal === "nuevo") return { ...c, insumos: [...c.insumos, { ...form, id: Date.now(), stock: +form.stock, minimo: +form.minimo }] };
      return { ...c, insumos: c.insumos.map(i => i.id === form.id ? { ...form, stock: +form.stock, minimo: +form.minimo } : i) };
    }));
    setModal(null);
  };

  const eliminar = (insId) => setCarros(prev => prev.map(c => c.id === carroSel ? { ...c, insumos: c.insumos.filter(i => i.id !== insId) } : c));

  const editarEvento = (carroId) => {
    const ev = prompt("Evento asignado:", carros.find(c => c.id === carroId)?.evento_asignado);
    if (ev !== null) setCarros(prev => prev.map(c => c.id === carroId ? { ...c, evento_asignado: ev || "Sin asignar" } : c));
  };

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* Lista carros */}
      <div style={{ width: 185, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Seleccionar carro</div>
        {carros.map(c => {
          const alertas = alertasCarro(c);
          const activo = carroSel === c.id;
          return (
            <div key={c.id} onClick={() => { setCarroSel(c.id); setCajonAbierto(null); }} style={{ cursor: "pointer", background: activo ? C.surface : "transparent", border: `1px solid ${activo ? c.color + "50" : C.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 7, borderLeft: `3px solid ${c.color}`, transition: "all 0.12s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: activo ? C.text : C.textMuted }}>{c.nombre}</span>
                {alertas > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{alertas}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{c.insumos.length} insumos</div>
              <div style={{ fontSize: 10, marginTop: 2, color: c.evento_asignado === "Sin asignar" ? C.textFaint : c.color, fontWeight: 500 }}>
                {c.evento_asignado === "Sin asignar" ? "Sin evento" : "📍 " + c.evento_asignado.slice(0, 20) + (c.evento_asignado.length > 20 ? "…" : "")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle carro */}
      <div style={{ flex: 1 }}>
        {carro && (
          <>
            {/* Header carro */}
            <div style={{ ...S.card, borderLeft: `3px solid ${carro.color}`, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: carro.color }}>{carro.nombre}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                    Evento: <span style={{ color: carro.evento_asignado === "Sin asignar" ? C.textFaint : C.text, fontWeight: 600 }}>{carro.evento_asignado}</span>
                    <span style={{ color: C.textFaint, marginLeft: 12 }}>· {carro.insumos.length} insumos totales</span>
                  </div>
                </div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => editarEvento(carro.id)}>✏️ Editar evento</button>
              </div>
            </div>

            {/* Tarjetas cajones */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
              {CAJONES_META.map(cj => {
                const items = insumosCajon(cj.id);
                const alertas = alertasCajon(cj.id);
                const abierto = cajonAbierto === cj.id;
                return (
                  <div key={cj.id} onClick={() => toggleCajon(cj.id)} style={{ cursor: "pointer", background: abierto ? cj.color + "15" : C.surface, border: `2px solid ${abierto ? cj.color : C.border}`, borderRadius: 12, padding: "16px 12px", textAlign: "center", transition: "all 0.15s", position: "relative" }}>
                    {alertas > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{alertas}</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cj.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: abierto ? cj.color : C.text, textTransform: "uppercase", letterSpacing: 0.5 }}>{cj.id}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, lineHeight: 1.3 }}>{cj.nombre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cj.color, marginTop: 8 }}>{items.length} insumos</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: alertas > 0 ? C.red : C.green }}>
                      {alertas > 0 ? `⚠️ ${alertas} alertas` : "✅ OK"}
                    </div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>{abierto ? "▲ Cerrar" : "▼ Ver insumos"}</div>
                  </div>
                );
              })}
            </div>

            {/* Detalle cajón expandido */}
            {cajonAbierto && (
              <div style={{ ...S.card, borderTop: `3px solid ${CAJONES_META.find(c => c.id === cajonAbierto)?.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: CAJONES_META.find(c => c.id === cajonAbierto)?.color }}>{cajonAbierto}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.nombre} · {insumosCajon(cajonAbierto).length} insumos</div>
                    </div>
                  </div>
                  {permisos?.modificarStock && <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={() => abrirNuevo(cajonAbierto)}>+ Agregar insumo</button>}
                </div>
                <TablaInsumos items={insumosCajon(cajonAbierto)} onEdit={abrirEditar} onDelete={eliminar} />
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <ModalInsumo
          form={form} setForm={setForm} onSave={guardar} onClose={() => setModal(null)}
          titulo={modal === "nuevo" ? `Nuevo insumo — ${carro?.nombre} · ${cajonAbierto}` : "Editar insumo"}
          cajones={CAJONES_META.map(c => c.id)}
        />
      )}
    </div>
  );
}

// ─── VISTA BOLSO MEDICAMENTOS ─────────────────────────────────────────────────────
function VistaBolsoNaranja() {
  const [tabActiva, setTabActiva] = useState("inyectables");
  const [inyectables, setInyectables] = useState(MEDICAMENTOS_INYECTABLES);
  const [orales, setOrales] = useState(MEDICAMENTOS_ORALES);
  const [aerosoles, setAerosoles] = useState(MEDICAMENTOS_AEROSOLES);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const tabs = [
    { id: "inyectables", emoji: "💉", label: "Inyectables", color: C.blue, data: inyectables, set: setInyectables, caja: "Caja 1 · Inyectables", unidad: "amp." },
    { id: "orales", emoji: "💊", label: "Orales", color: C.green, data: orales, set: setOrales, caja: "Caja 2 · Orales", unidad: "comp." },
    { id: "aerosoles", emoji: "🌬️", label: "Aerosoles", color: C.purple, data: aerosoles, set: setAerosoles, caja: "Caja 3 · Aerosoles", unidad: "inhalador" },
  ];
  const tab = tabs.find(t => t.id === tabActiva);
  const alertas = (data) => data.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const abrirNuevo = () => {
    setForm({ nombre: "", dosis: "", tipo: tabActiva, caja: tab.caja, stock: "", minimo: "", unidad: tab.unidad, vencimiento: "" });
    setModal("nuevo");
  };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = () => {
    if (!form.nombre || !form.vencimiento) return;
    const nuevo = { ...form, id: Date.now(), stock: +form.stock, minimo: +form.minimo };
    tab.set(prev => modal === "nuevo" ? [...prev, nuevo] : prev.map(i => i.id === form.id ? nuevo : i));
    setModal(null);
  };

  const eliminar = (id) => tab.set(prev => prev.filter(i => i.id !== id));

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.orange}12, ${C.surface})`, borderColor: C.orange + "40", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>🟠 Bolso Naranja</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Medicamentos independientes del carro · 3 cajas internas</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {tabs.map(t => (
              <div key={t.id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: alertas(t.data) > 0 ? C.yellow : t.color }}>{t.data.length}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{t.emoji} {t.label}</div>
                {alertas(t.data) > 0 && <div style={{ fontSize: 10, color: C.yellow }}>⚠️ {alertas(t.data)} alertas</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={S.tab(tabActiva === t.id, t.color)} onClick={() => setTabActiva(t.id)}>
            {t.emoji} {t.label}
            {alertas(t.data) > 0 && (
              <span style={{ marginLeft: 6, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "0 4px" }}>
                {alertas(t.data)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <span style={{ fontWeight: 700, color: tab.color }}>{tab.emoji} {tab.label}</span>
            <span style={{ color: C.textMuted, fontSize: 13, marginLeft: 8 }}>— {tab.caja}</span>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Agregar</button>
        </div>
        <TablaInsumos items={tab.data} onEdit={abrirEditar} onDelete={eliminar} />
      </div>

      {modal && (
        <ModalInsumo
          form={form} setForm={setForm} onSave={guardar} onClose={() => setModal(null)}
          titulo={modal === "nuevo" ? `Nuevo — ${tab.emoji} ${tab.label}` : "Editar medicamento"}
          showDosis={true}
        />
      )}
    </div>
  );
}
// ─── VISTA BOLSO KINESIOLOGÍA ────────────────────────────────────────────────
function VistaBolsoKinesiologia({ usuario }) {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const data = await sb("insumos_kinesiologia?order=nombre", {}, usuario?.token);
      if (data) setInsumos(data);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  const alertas = insumos.filter(i => i.stock < i.minimo).length;
  const abrirNuevo = () => { setForm({ nombre: "", stock: "", minimo: "", unidad: "unid." }); setModal("nuevo"); };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = async () => {
    if (!form.nombre) return;
    const datos = { nombre: form.nombre, stock: +form.stock, minimo: +form.minimo, unidad: form.unidad };
    if (modal === "nuevo") {
      const res = await sb("insumos_kinesiologia", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setInsumos(prev => [...prev, res[0]]);
    } else {
      const res = await sb(`insumos_kinesiologia?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setInsumos(prev => prev.map(i => i.id === form.id ? res[0] : i));
    }
    setModal(null);
  };

  const eliminar = async (id) => {
    await sb(`insumos_kinesiologia?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
    setInsumos(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando...</div>;

  return (
    <div>
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.blue}12, ${C.surface})`, borderColor: C.blue + "40", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>🏥 Bolso de Kinesiólogo/a</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Insumos de kinesiología</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: alertas > 0 ? C.yellow : C.blue }}>{insumos.length}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Insumos</div>
            {alertas > 0 && <div style={{ fontSize: 10, color: C.yellow }}>⚠️ {alertas} alertas</div>}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, color: C.blue }}>📦 Inventario</span>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevo}>+ Agregar</button>
        </div>

        <table style={S.table}>
          <thead><tr>{["Insumo", "Stock", "Estado", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 32 }}>Sin insumos</td></tr>
            ) : insumos.map(ins => (
              <tr key={ins.id}>
                <td style={S.td}><div style={{ fontWeight: 600 }}>{ins.nombre}</div></td>
                <td style={S.td}>
                  <span style={{ fontWeight: 700, color: ins.stock < ins.minimo ? C.yellow : C.text }}>{ins.stock}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}> / {ins.minimo} {ins.unidad}</span>
                </td>
                <td style={S.td}>
                  {ins.stock === 0 ? <span style={S.pill(C.red, C.redDim)}>Agotado</span> :
                   ins.stock < ins.minimo ? <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span> :
                   <span style={S.pill(C.green, C.greenDim)}>OK</span>}
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => abrirEditar(ins)}><Icon name="edit" size={13} color={C.textMuted} /></button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => eliminar(ins.id)}><Icon name="trash" size={13} color={C.red} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nuevo" ? "Nuevo Insumo" : "Editar Insumo"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre</label>
              <input style={S.input} value={form.nombre || ""} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Stock actual</label>
                <input style={S.input} type="number" value={form.stock || ""} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Stock mínimo</label>
                <input style={S.input} type="number" value={form.minimo || ""} onChange={e => setForm(p => ({ ...p, minimo: e.target.value }))} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Unidad</label>
              <select style={{ ...S.select, width: "100%" }} value={form.unidad || "unid."} onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))}>
                {["unid.", "rollos", "spray", "pote", "frascos"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
// ═══════════════════════════════════════════════════════════════════════════
}
// COMPONENTE: VISTA GESTIÓN DE EVENTOS
// Agregar este código DESPUÉS de VistaBolsoKinesiologia (línea ~742)
// ═══════════════════════════════════════════════════════════════════════════

function VistaGestionEventos({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const [evs, profs] = await Promise.all([
        sb("equipos_evento?order=created_at.desc", {}, usuario?.token),
        sb("perfiles?order=nombre", {}, usuario?.token)
      ]);
      if (evs) setEventos(evs);
      if (profs) setProfesionales(profs);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  const abrirNuevoEvento = () => {
    setForm({
      nombre_evento: "",
      fecha_evento: new Date().toISOString().split('T')[0],
      tipo_evento: "Deportivo",
      tipo_masoterapia: "Masivo",
      medicos: [],
      enfermeros: [],
      paramedicos: [],
      kinesiologos: [],
      masoterapeutas: [],
      carros_asignados: []
    });
    setModal("nuevo");
  };

  const abrirEditarEvento = (evento) => {
    setForm({ ...evento });
    setModal("editar");
  };

  const guardarEvento = async () => {
    if (!form.nombre_evento || !form.fecha_evento) {
      alert("Por favor completa nombre y fecha del evento");
      return;
    }

    const datos = {
      nombre_evento: form.nombre_evento,
      fecha_evento: form.fecha_evento,
      tipo_evento: form.tipo_evento,
      tipo_masoterapia: form.tipo_masoterapia,
      medicos: form.medicos || [],
      enfermeros: form.enfermeros || [],
      paramedicos: form.paramedicos || [],
      kinesiologos: form.kinesiologos || [],
      masoterapeutas: form.masoterapeutas || [],
      carros_asignados: form.carros_asignados || [],
      estado: "activo"
    };

    if (modal === "nuevo") {
      const res = await sb("equipos_evento", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setEventos(prev => [res[0], ...prev]);
    } else {
      const res = await sb(`equipos_evento?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setEventos(prev => prev.map(e => e.id === form.id ? res[0] : e));
    }
    setModal(null);
  };

  const toggleProfesional = (tipo, profesionalId) => {
    const lista = form[tipo] || [];
    const index = lista.indexOf(profesionalId);
    if (index > -1) {
      setForm(p => ({ ...p, [tipo]: lista.filter(id => id !== profesionalId) }));
    } else {
      setForm(p => ({ ...p, [tipo]: [...lista, profesionalId] }));
    }
  };

  const toggleCarro = (carro) => {
    const carros = form.carros_asignados || [];
    const index = carros.indexOf(carro);
    if (index > -1) {
      setForm(p => ({ ...p, carros_asignados: carros.filter(c => c !== carro) }));
    } else {
      setForm(p => ({ ...p, carros_asignados: [...carros, carro] }));
    }
  };

  const getProfesionalesNombres = (ids) => {
    if (!ids || ids.length === 0) return "Ninguno";
    return ids.map(id => {
      const prof = profesionales.find(p => p.id === id);
      return prof ? prof.nombre : "?";
    }).join(", ");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando eventos...</div>;

  const eventosActivos = eventos.filter(e => e.estado === "activo");
  const eventosCerrados = eventos.filter(e => e.estado === "cerrado");

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Gestión de Eventos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {eventosActivos.length} eventos activos
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevoEvento}>
            + Nuevo Evento
          </button>
        </div>
      </div>

      {eventosActivos.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Eventos Activos</div>
          {eventosActivos.map(evento => (
            <div key={evento.id} style={{ 
              padding: 16, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 12,
              background: C.surface 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {evento.nombre_evento}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    {new Date(evento.fecha_evento).toLocaleDateString('es-CL')} • {evento.tipo_evento} • Masoterapia: {evento.tipo_masoterapia}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    <div>Médicos: {getProfesionalesNombres(evento.medicos)}</div>
                    <div>Enfermeros: {getProfesionalesNombres(evento.enfermeros)}</div>
                    <div>Paramédicos: {getProfesionalesNombres(evento.paramedicos)}</div>
                    <div>Kinesiólogos: {getProfesionalesNombres(evento.kinesiologos)}</div>
                    <div>Masoterapeutas: {getProfesionalesNombres(evento.masoterapeutas)}</div>
                    {evento.carros_asignados && evento.carros_asignados.length > 0 && (
                      <div>Carros: {evento.carros_asignados.join(", ")}</div>
                    )}
                  </div>
                </div>
                <button 
                  style={{ ...S.btn("ghost"), padding: "6px 12px" }} 
                  onClick={() => abrirEditarEvento(evento)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {eventosCerrados.length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Eventos Cerrados Recientes</div>
          {eventosCerrados.slice(0, 3).map(evento => (
            <div key={evento.id} style={{ 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 8,
              opacity: 0.6 
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{evento.nombre_evento}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {new Date(evento.fecha_evento).toLocaleDateString('es-CL')} • 
                Cerrado: {new Date(evento.fecha_cierre).toLocaleDateString('es-CL')}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {modal === "nuevo" ? "Nuevo Evento" : "Editar Evento"}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre del Evento</label>
              <input 
                style={S.input} 
                value={form.nombre_evento || ""} 
                onChange={e => setForm(p => ({ ...p, nombre_evento: e.target.value }))} 
                placeholder="Media Maratón Santiago"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Fecha</label>
                <input 
                  style={S.input} 
                  type="date" 
                  value={form.fecha_evento || ""} 
                  onChange={e => setForm(p => ({ ...p, fecha_evento: e.target.value }))} 
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo de Evento</label>
                <select 
                  style={{ ...S.select, width: "100%" }} 
                  value={form.tipo_evento || "Deportivo"} 
                  onChange={e => setForm(p => ({ ...p, tipo_evento: e.target.value }))}
                >
                  <option>Deportivo</option>
                  <option>Feria Laboral</option>
                  <option>Torneo</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Tipo de Masoterapia</label>
              <select 
                style={{ ...S.select, width: "100%" }} 
                value={form.tipo_masoterapia || "Masivo"} 
                onChange={e => setForm(p => ({ ...p, tipo_masoterapia: e.target.value }))}
              >
                <option>Masivo</option>
                <option>Específico</option>
              </select>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                Masivo = contador simple | Específico = fichas individuales
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Asignar Profesionales:</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Médicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Médico").map(prof => (
                    <label key={prof.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.medicos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.medicos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("medicos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enfermeros</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Enfermero/a").map(prof => (
                    <label key={prof.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.enfermeros || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.enfermeros || []).includes(prof.id)}
                        onChange={() => toggleProfesional("enfermeros", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Paramédicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Paramédico").map(prof => (
                    <label key={prof.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.paramedicos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.paramedicos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("paramedicos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Kinesiólogos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Kinesiólogo/a").map(prof => (
                    <label key={prof.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.kinesiologos || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.kinesiologos || []).includes(prof.id)}
                        onChange={() => toggleProfesional("kinesiologos", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Masoterapeutas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profesionales.filter(p => p.profesion === "Masoterapeuta").map(prof => (
                    <label key={prof.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.masoterapeutas || []).includes(prof.id) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.masoterapeutas || []).includes(prof.id)}
                        onChange={() => toggleProfesional("masoterapeutas", prof.id)}
                      />
                      <span style={{ fontSize: 12 }}>{prof.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Carros Clínicos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <label key={num} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.carros_asignados || []).includes(`Carro ${num}`) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.carros_asignados || []).includes(`Carro ${num}`)}
                        onChange={() => toggleCarro(`Carro ${num}`)}
                      />
                      <span style={{ fontSize: 12 }}>Carro {num}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardarEvento}>
                {modal === "nuevo" ? "Crear Evento" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Dashboard({ carros, usuario, esAdmin, permisos }) {
  const todosInsumos = carros.flatMap(c => c.insumos);
  const todosMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const todo = [...todosInsumos, ...todosMeds];
  const alertasVenc = todo.filter(i => estadoVenc(i.vencimiento) !== "ok");
  const stockBajo = todo.filter(i => estadoStock(i) !== "ok");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={S.title}>
          {esAdmin ? "Dashboard Operacional" : `Bienvenido/a, ${usuario?.nombre?.split(" ")[0]}`}
        </div>
        <div style={S.subtitle}>
          {esAdmin
            ? `SGTRUMAO · ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
            : usuario?.evento_asignado
              ? `📍 Evento asignado: ${usuario.evento_asignado}`
              : "Sin evento asignado hoy"}
        </div>
      </div>
      {!esAdmin && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            👤 {usuario?.profesion} — Permisos activos
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Registrar atenciones", ok: true },
              { label: "Recetar medicamentos", ok: permisos?.recetarMedicamentos },
              { label: "Ver inventario carro", ok: permisos?.verInventario },
              { label: "Modificar stock", ok: permisos?.modificarStock },
              { label: "Ver bolso medicamentos", ok: permisos?.verBolso },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ color: ok ? C.green : C.red, fontSize: 16 }}>{ok ? "✅" : "❌"}</span>
                <span style={{ color: ok ? C.text : C.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Carros activos", val: carros.length, color: C.accent },
          { label: "Insumos en carros", val: todosInsumos.length, color: C.blue },
          { label: "Medicamentos bolso", val: todosMeds.length, color: C.orange },
          { label: "Alertas vencimiento", val: alertasVenc.length, color: alertasVenc.length > 0 ? C.red : C.green },
          { label: "Stock bajo mínimo", val: stockBajo.length, color: stockBajo.length > 0 ? C.yellow : C.green },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Estado carros */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🚑 Estado de Carros</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {carros.map(c => {
            const alertas = c.insumos.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
            return (
              <div key={c.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${c.color}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: c.color }}>{c.nombre}</span>
                  {alertas > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 6px" }}>{alertas} ⚠️</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{c.insumos.length} insumos</div>
                <div style={{ fontSize: 11, marginTop: 3, color: c.evento_asignado === "Sin asignar" ? C.textFaint : C.text }}>
                  {c.evento_asignado === "Sin asignar" ? "Sin evento asignado" : "📍 " + c.evento_asignado}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {(alertasVenc.length > 0 || stockBajo.length > 0) && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>⚠️ Alertas Críticas</div>
          {todo.filter(i => estadoVenc(i.vencimiento) === "vencido").map(i => (
            <div key={i.id} style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.red }}>VENCIDO:</strong> {i.nombre} {i.dosis || ""} — venció {new Date(i.vencimiento).toLocaleDateString("es-CL")}
            </div>
          ))}
          {todo.filter(i => estadoVenc(i.vencimiento) === "proximo").map(i => (
            <div key={i.id} style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.yellow }}>Próximo a vencer:</strong> {i.nombre} {i.dosis || ""} — {diasHastaVenc(i.vencimiento)} días
            </div>
          ))}
          {todo.filter(i => estadoStock(i) !== "ok").map(i => (
            <div key={i.id} style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: C.yellow }}>Stock bajo:</strong> {i.nombre} {i.dosis || ""} — {i.stock}/{i.minimo} {i.unidad}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ATENCIONES ──────────────────────────────────────────────────────────────
const PROFESIONES = ["Médico", "Enfermero/a", "Paramédico", "Kinesiólogo/a", "Masoterapeuta"];
// ─── CONFIGURACIÓN POR INDUSTRIA ─────────────────────────────────────────────
const INDUSTRIAS = {
  "eventos": {
    nombre: "Eventos Deportivos y Masivos",
    emoji: "🏟️",
    paciente: "Paciente",
    unidad: "Carpa Médica",
    tipos_atencion: [
      "Trauma deportivo", "Contusión / golpe", "Luxación",
      "Esguince", "Fractura", "Laceración / herida",
      "Deshidratación", "Insolación / golpe de calor",
      "Crisis asmática", "Dolor torácico", "Síncope / desmayo",
      "Convulsión", "Reacción alérgica", "Consulta general",
      "Urgencia vital", "Derivación hospital"
    ],
    campos_extra: ["Disciplina deportiva", "Número de dorsal"],
    color: "#00c2a8",
  },
  "mineria": {
    nombre: "Minería e Industria",
    emoji: "⛏️",
    paciente: "Trabajador",
    unidad: "Unidad Médica",
    tipos_atencion: [
      "Accidente laboral", "Trauma por impacto", "Aplastamiento",
      "Quemadura química", "Quemadura térmica", "Intoxicación",
      "Caída de altura", "Atrapamiento", "Corte / laceración",
      "Inhalación de gases", "Cuerpo extraño", "Dolor lumbar",
      "Crisis hipertensiva", "Deshidratación", "Urgencia vital",
      "Accidente de tránsito en faena"
    ],
    campos_extra: ["RUT trabajador", "Empresa contratista", "Área de faena", "Turno"],
    color: "#d29922",
  },
  "educacion": {
    nombre: "Educación",
    emoji: "🏫",
    paciente: "Alumno",
    unidad: "Enfermería",
    tipos_atencion: [
      "Caída / golpe", "Herida cortante", "Epistaxis / sangrado nasal",
      "Fiebre", "Dolor abdominal", "Cefalea / dolor de cabeza",
      "Crisis alérgica", "Crisis asmática", "Convulsión",
      "Crisis emocional / ansiedad", "Desmayo", "Traumatismo dental",
      "Cuerpo extraño", "Quemadura", "Accidente deportivo",
      "Consulta general"
    ],
    campos_extra: ["Curso", "Apoderado notificado", "Edad"],
    color: "#58a6ff",
  },
  "emergencias": {
    nombre: "Servicios de Emergencia",
    emoji: "🚒",
    paciente: "Víctima",
    unidad: "Puesto de Avanzada",
    tipos_atencion: [
      "Trauma múltiple", "PCR / paro cardiorrespiratorio",
      "Quemadura", "Intoxicación", "Trauma craneal",
      "Herida por arma", "Accidente de tránsito",
      "Rescate en altura", "Ahogamiento", "Hipotermia",
      "Crisis hipertensiva", "ACV / accidente cerebrovascular",
      "Shock anafiláctico", "Urgencia obstétrica", "Urgencia pediátrica"
    ],
    campos_extra: ["Mecanismo de lesión", "Glasgow", "Prioridad triage"],
    color: "#f85149",
  },
  "empresas": {
    nombre: "Empresas y Corporativos",
    emoji: "🏢",
    paciente: "Colaborador",
    unidad: "Sala Médica",
    tipos_atencion: [
      "Accidente laboral", "Enfermedad común", "Cefalea / estrés",
      "Dolor musculoesquelético", "Crisis hipertensiva",
      "Crisis de ansiedad / pánico", "Desmayo", "Herida cortante",
      "Quemadura", "Cuerpo extraño", "Reacción alérgica",
      "Dolor torácico", "Control de presión", "Consulta general",
      "Urgencia vital"
    ],
    campos_extra: ["Área / departamento", "Cargo", "Jefatura notificada"],
    color: "#bc8cff",
  },
};

const getIndustria = (key) => INDUSTRIAS[key] || INDUSTRIAS["eventos"];



// ─── PERMISOS POR PROFESIÓN ───────────────────────────────────────────────────
const PERMISOS = {
  "Médico":          { recetarMedicamentos: true,  verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Enfermero/a":     { recetarMedicamentos: false, verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Paramédico":      { recetarMedicamentos: false, verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Kinesiólogo/a":   { recetarMedicamentos: false, verInventario: false, modificarStock: false, verBolso: false, verBolsoKine: true  },
  "Masoterapeuta":   { recetarMedicamentos: false, verInventario: false, modificarStock: false, verBolso: false, verBolsoKine: false },
  "Administrador":   { recetarMedicamentos: true,  verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: true  },
};
const getPermisos = (usuario) => {  if (usuario?.rol === "admin") return PERMISOS["Administrador"];
  return PERMISOS[usuario?.profesion] || PERMISOS["Kinesiólogo/a"];
};
const TIPOS_ATENCION = ["Consulta general", "Urgencia", "Traumatología", "Kinesiología", "Masoterapia", "Evaluación", "Derivación"];

const ATENCIONES_INICIALES = [
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

function VistaAtenciones({ carros, usuario, permisos, industria }) {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filtroEvento, setFiltroEvento] = useState("Todos");
  const [filtroProfesion, setFiltroProfesion] = useState("Todas");
  const [fichaVer, setFichaVer] = useState(null);

  // Cargar atenciones desde Supabase
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const data = await sb("atenciones?order=created_at.desc", {}, usuario?.token);
      if (data) setAtenciones(data);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  const eventos = ["Todos", ...new Set(carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => c.evento_asignado))];

  const filtradas = atenciones.filter(a => {
    const matchEv = filtroEvento === "Todos" || a.evento === filtroEvento;
    const matchProf = filtroProfesion === "Todas" || a.profesion === filtroProfesion;
    return matchEv && matchProf;
  });

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const abrirNueva = () => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    setForm({
      evento: carros.find(c => c.evento_asignado !== "Sin asignar")?.evento_asignado || "",
      fecha: ahora.toISOString().slice(0, 10),
      paciente: "", rut: "", edad: "",
      profesion: "Médico", profesional: "",
      tipo: "Consulta general",
      hora_ingreso: `${hh}:${mm}`, hora_egreso: "",
      diagnostico: "", tratamiento: "",
      insumos_usados: "", derivacion: "No", observaciones: ""
    });
    setModal("nueva");
  };

  const guardar = async () => {
    if (!form.paciente || !form.profesional) return;
    const datos = { ...form, edad: +form.edad, usuario_email: usuario?.email };
    delete datos.id;
    if (modal === "nueva") {
      const res = await sb("atenciones", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setAtenciones(prev => [res[0], ...prev]);
    } else {
      const res = await sb(`atenciones?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      if (res) setAtenciones(prev => prev.map(a => a.id === form.id ? res[0] : a));
    }
    setModal(null);
  };

  const eliminar = async (id) => {
    await sb(`atenciones?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
    setAtenciones(prev => prev.filter(a => a.id !== id));
  };

  const coloresProfesion = {
    "Médico": C.red, "Enfermero/a": C.blue, "Paramédico": C.orange,
    "Kinesiólogo/a": C.green, "Masoterapeuta": C.purple
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {PROFESIONES.map(p => {
          const count = atenciones.filter(a => a.profesion === p).length;
          const color = coloresProfesion[p];
          return (
            <div key={p} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{p}</div>
            </div>
          );
        })}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{atenciones.length}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>Total atenciones</div>
        </div>
      </div>

      {/* Filtros y botón */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select style={S.select} value={filtroEvento} onChange={e => setFiltroEvento(e.target.value)}>
          {eventos.map(e => <option key={e}>{e}</option>)}
        </select>
        <select style={S.select} value={filtroProfesion} onChange={e => setFiltroProfesion(e.target.value)}>
          {["Todas", ...PROFESIONES].map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button style={S.btn("primary")} onClick={abrirNueva}>+ Nueva atención</button>
      </div>

      {/* Tabla */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {[industria?.paciente || "Paciente", "Evento", "Profesional", "Tipo", "Horario", "Diagnóstico", "Derivación", ""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: C.textMuted, padding: 36 }}>Sin atenciones registradas</td></tr>
            ) : filtradas.map(a => (
              <tr key={a.id}>
                <td style={S.td}>
                  <div style={{ fontWeight: 600 }}>{a.paciente}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{a.rut} · {a.edad} años</div>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{a.evento}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{new Date(a.fecha).toLocaleDateString("es-CL")}</div>
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge(coloresProfesion[a.profesion], coloresProfesion[a.profesion] + "20"), marginBottom: 4, display: "inline-flex" }}>{a.profesion}</span>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{a.profesional}</div>
                </td>
                <td style={S.td}><span style={S.pill(C.blue, C.blueDim)}>{a.tipo}</span></td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>{a.hora_ingreso} → {a.hora_egreso || "—"}</div>
                </td>
                <td style={S.td}><span style={{ fontSize: 13, color: C.textMuted }}>{a.diagnostico.slice(0, 35)}{a.diagnostico.length > 35 ? "…" : ""}</span></td>
                <td style={S.td}>
                  {a.derivacion === "No"
                    ? <span style={S.pill(C.green, C.greenDim)}>No</span>
                    : <span style={S.pill(C.red, C.redDim)}>{a.derivacion}</span>}
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: 11 }} onClick={() => setFichaVer(a)}>Ver</button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => { setForm({ ...a }); setModal("editar"); }}><Icon name="edit" size={12} color={C.textMuted} /></button>
                    <button style={{ ...S.btn("ghost"), padding: "4px 8px" }} onClick={() => eliminar(a.id)}><Icon name="trash" size={12} color={C.red} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva/editar atención */}
      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{modal === "nueva" ? "Nueva Atención" : "Editar Atención"}</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setModal(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>

            {/* Evento */}
            <div style={{ background: C.surface2, borderRadius: 8, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: C.textMuted }}>
              <div style={S.formLabel}>Evento</div>
              <select style={{ ...S.select, width: "100%" }} value={form.evento || ""} onChange={e => F("evento", e.target.value)}>
                {carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => (
                  <option key={c.id}>{c.evento_asignado}</option>
                ))}
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Paciente */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos del Paciente</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre completo</label>
                <input style={S.input} value={form.paciente || ""} onChange={e => F("paciente", e.target.value)} placeholder="Nombre del paciente" />
              </div>
              <div style={S.grid2}>
                <div style={S.formRow}>
                  <label style={S.formLabel}>RUT</label>
                  <input style={S.input} value={form.rut || ""} onChange={e => F("rut", e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div style={S.formRow}>
                  <label style={S.formLabel}>Edad</label>
                  <input style={S.input} type="number" value={form.edad || ""} onChange={e => F("edad", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Profesional */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional que Atiende</div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Profesión</label>
                <select style={{ ...S.select, width: "100%" }} value={form.profesion || "Médico"} onChange={e => F("profesion", e.target.value)}>
                  {PROFESIONES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del profesional</label>
                <input style={S.input} value={form.profesional || ""} onChange={e => F("profesional", e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>

            {/* Atención */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Datos de la Atención</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Tipo</label>
                <select style={{ ...S.select, width: "100%" }} value={form.tipo || ""} onChange={e => F("tipo", e.target.value)}>
                  {(industria?.tipos_atencion || TIPOS_ATENCION).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora ingreso</label>
                <input style={S.input} type="time" value={form.hora_ingreso || ""} onChange={e => F("hora_ingreso", e.target.value)} />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Hora egreso</label>
                <input style={S.input} type="time" value={form.hora_egreso || ""} onChange={e => F("hora_egreso", e.target.value)} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Diagnóstico / Motivo de consulta</label>
              <input style={S.input} value={form.diagnostico || ""} onChange={e => F("diagnostico", e.target.value)} placeholder="Ej: Contusión rodilla derecha" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Tratamiento / Procedimiento realizado</label>
              <input style={S.input} value={form.tratamiento || ""} onChange={e => F("tratamiento", e.target.value)} placeholder="Ej: Inmovilización, frío local" />
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Insumos utilizados</label>
              <input style={S.input} value={form.insumos_usados || ""} onChange={e => F("insumos_usados", e.target.value)} placeholder="Ej: Venda x1, gasas x4" />
            </div>
            {permisos?.recetarMedicamentos ? (
              <div style={S.formRow}>
                <label style={S.formLabel}>💊 Medicamentos recetados</label>
                <input style={S.input} value={form.medicamentos_recetados || ""} onChange={e => F("medicamentos_recetados", e.target.value)} placeholder="Ej: Ibuprofeno 600mg, Paracetamol 500mg" />
              </div>
            ) : (
              <div style={{ background: C.yellowDim, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.yellow, marginBottom: 16 }}>
                ⚠️ Solo el médico puede recetar medicamentos
              </div>
            )}
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Derivación</label>
                <select style={{ ...S.select, width: "100%" }} value={form.derivacion || "No"} onChange={e => F("derivacion", e.target.value)}>
                  {["No", "Hospital", "Clínica", "SAPU", "Ambulancia", "Otro"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Observaciones</label>
                <input style={S.input} value={form.observaciones || ""} onChange={e => F("observaciones", e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar atención</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ficha completa */}
      {fichaVer && (
        <div style={S.modal} onClick={() => setFichaVer(null)}>
          <div style={{ ...S.modalBox, width: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Ficha de Atención</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFichaVer(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>{fichaVer.evento} · {new Date(fichaVer.fecha).toLocaleDateString("es-CL")}</div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Paciente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Nombre", fichaVer.paciente], ["RUT", fichaVer.rut], ["Edad", fichaVer.edad + " años"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profesional</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Profesión", fichaVer.profesion], ["Nombre", fichaVer.profesional], ["Tipo atención", fichaVer.tipo]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Atención</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["Hora ingreso", fichaVer.hora_ingreso], ["Hora egreso", fichaVer.hora_egreso || "—"]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
              {[["Diagnóstico", fichaVer.diagnostico], ["Tratamiento", fichaVer.tratamiento], ["Insumos usados", fichaVer.insumos_usados]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{l}</div>
                  <div style={{ marginTop: 2, fontSize: 14 }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Derivación:</span>
              {fichaVer.derivacion === "No"
                ? <span style={S.badge(C.green, C.greenDim)}>Sin derivación</span>
                : <span style={S.badge(C.red, C.redDim)}>Derivado → {fichaVer.derivacion}</span>}
              {fichaVer.observaciones && <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>· {fichaVer.observaciones}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── GESTIÓN DE USUARIOS ─────────────────────────────────────────────────────
function GestionUsuarios({ usuario, carros }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});

  const eventos = carros.filter(c => c.evento_asignado !== "Sin asignar").map(c => c.evento_asignado);

  useEffect(() => {
    const cargar = async () => {
      const data = await sb("perfiles?order=nombre", {}, usuario?.token);
      if (data) setUsuarios(data);
      setLoading(false);
    };
    cargar();
  }, [usuario]);

  const abrirEditar = (u) => { setForm({ ...u }); setEditando(u.id); };

  const guardar = async () => {
    const res = await sb(`perfiles?id=eq.${editando}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre: form.nombre, profesion: form.profesion, rol: form.rol, evento_asignado: form.evento_asignado || null })
    }, usuario?.token);
    if (res !== null) setUsuarios(prev => prev.map(u => u.id === editando ? { ...u, ...form } : u));
    setEditando(null);
  };

  const coloresProfesion = {
    "Médico": C.red, "Enfermero/a": C.blue, "Paramédico": C.orange,
    "Kinesiólogo/a": C.green, "Masoterapeuta": C.purple, "Administrador": C.accent
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando usuarios...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.title}>Gestión de Usuarios 👥</div>
        <div style={S.subtitle}>{usuarios.length} usuarios registrados · Asigna eventos y roles</div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {usuarios.map(u => (
          <div key={u.id} style={{ ...S.card, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: coloresProfesion[u.profesion] + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {u.rol === "admin" ? "👑" : "👤"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{u.nombre}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{u.profesion}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={S.badge(u.rol === "admin" ? C.accent : C.blue, u.rol === "admin" ? C.accentDim : C.blueDim)}>
                    {u.rol === "admin" ? "Admin" : "Profesional"}
                  </span>
                  {u.evento_asignado
                    ? <span style={S.badge(C.green, C.greenDim)}>📍 {u.evento_asignado}</span>
                    : <span style={S.badge(C.textFaint, C.surface2)}>Sin evento</span>}
                </div>
              </div>
            </div>
            <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => abrirEditar(u)}>✏️ Editar</button>
          </div>
        ))}
      </div>

      {editando && (
        <div style={S.modal} onClick={() => setEditando(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Editar Usuario</div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setEditando(null)}><Icon name="close" size={20} color={C.textMuted} /></button>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre completo</label>
              <input style={S.input} value={form.nombre || ""} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div style={S.grid2}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Profesión</label>
                <select style={{ ...S.select, width: "100%" }} value={form.profesion || ""} onChange={e => setForm(p => ({ ...p, profesion: e.target.value }))}>
                  {["Médico", "Enfermero/a", "Paramédico", "Kinesiólogo/a", "Masoterapeuta", "Administrador"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Rol</label>
                <select style={{ ...S.select, width: "100%" }} value={form.rol || "profesional"} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                  <option value="admin">👑 Administrador</option>
                  <option value="profesional">👤 Profesional</option>
                </select>
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Evento asignado</label>
              <select style={{ ...S.select, width: "100%" }} value={form.evento_asignado || ""} onChange={e => setForm(p => ({ ...p, evento_asignado: e.target.value }))}>
                <option value="">Sin evento asignado</option>
                {eventos.map(ev => <option key={ev}>{ev}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.btn("ghost")} onClick={() => setEditando(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardar}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
function Configuracion({ industriaKey, setIndustriaKey, usuario }) {
  const industria = getIndustria(industriaKey);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.title}>Configuración ⚙️</div>
        <div style={S.subtitle}>Personaliza TRIAGE360 para tu organización</div>
      </div>

      {/* Selección de industria */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🏭 Tipo de Organización</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          Define tu industria para adaptar los tipos de atención, nomenclatura y campos del sistema.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {Object.entries(INDUSTRIAS).map(([key, ind]) => (
            <div
              key={key}
              onClick={() => setIndustriaKey(key)}
              style={{
                cursor: "pointer",
                background: industriaKey === key ? ind.color + "15" : C.surface2,
                border: `2px solid ${industriaKey === key ? ind.color : C.border}`,
                borderRadius: 12, padding: "18px 20px",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{ind.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: industriaKey === key ? ind.color : C.text }}>{ind.nombre}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                {ind.paciente} · {ind.unidad}
              </div>
              {industriaKey === key && (
                <div style={{ marginTop: 8, fontSize: 11, color: ind.color, fontWeight: 700 }}>✓ Seleccionada</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vista previa de la configuración actual */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          {industria.emoji} Configuración activa — {industria.nombre}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Nomenclatura</div>
            {[
              ["Persona atendida", industria.paciente],
              ["Unidad clínica", industria.unidad],
              ["Tipos de atención", `${industria.tipos_atencion.length} tipos`],
              ["Campos adicionales", `${industria.campos_extra.length} campos`],
            ].map(([label, valor]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                <span style={{ color: C.textMuted }}>{label}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{valor}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tipos de Atención</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {industria.tipos_atencion.slice(0, 8).map(t => (
                <span key={t} style={{ background: industria.color + "15", color: industria.color, border: `1px solid ${industria.color}30`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  {t}
                </span>
              ))}
              {industria.tipos_atencion.length > 8 && (
                <span style={{ color: C.textMuted, fontSize: 11, padding: "3px 6px" }}>
                  +{industria.tipos_atencion.length - 8} más
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info cuenta */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>👤 Información de Cuenta</div>
        {[
          ["Email", usuario?.email],
          ["Nombre", usuario?.nombre],
          ["Rol", usuario?.rol === "admin" ? "👑 Administrador" : "👤 Profesional"],
          ["Profesión", usuario?.profesion],
        ].map(([label, valor]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
            <span style={{ color: C.textMuted }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{valor || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Ingresa tu email y contraseña"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
      const token = data.access_token;
      const userId = data.user?.id;
      // Obtener perfil con rol
      const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${userId}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
      });
      const perfiles = await perfilRes.json();
      const perfil = perfiles?.[0] || {};
      onLogin({
        token,
        email: data.user?.email,
        nombre: perfil.nombre || data.user?.email,
        rol: perfil.rol || 'profesional',
        evento_asignado: perfil.evento_asignado || null,
        profesion: perfil.profesion || '',
      });
    } catch (e) { setError("Error de conexión"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: 420, padding: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <svg viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, margin: "0 auto 8px", display: "block" }}>
            <defs>
              <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5c8"/>
                <stop offset="100%" stopColor="#00a896"/>
              </linearGradient>
              <filter id="gl">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="bgG" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00c2a8" stopOpacity="0.12"/>
                <stop offset="100%" stopColor="#00c2a8" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="url(#bgG)"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="#1e2d3d" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="url(#lg1)" strokeWidth="2.8"
              strokeDasharray="170 56" strokeDashoffset="-28" strokeLinecap="round" filter="url(#gl)"/>
            <circle cx="74" cy="26" r="2.5" fill="#00e5c8" filter="url(#gl)"/>
            <circle cx="26" cy="26" r="2.5" fill="#00a896" filter="url(#gl)"/>
            <rect x="38" y="45" width="24" height="8" rx="2.5" fill="url(#lg1)" filter="url(#gl)"/>
            <rect x="46" y="37" width="8" height="24" rx="2.5" fill="url(#lg1)" filter="url(#gl)"/>
            <polyline points="14,50 20,50 24,41 28,59 32,46 36,52 44,50 56,50 60,42 64,58 68,50 72,50 76,44 79,55 83,50 88,50"
              fill="none" stroke="#00c2a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            <line x1="103" y1="22" x2="103" y2="78" stroke="#1e2d3d" strokeWidth="1"/>
            <text x="118" y="44" fill="#e8f0f8" fontSize="26" fontFamily="Arial Black, sans-serif" fontWeight="900" letterSpacing="1">
              TRIAGE<tspan fill="url(#lg1)">360</tspan>
            </text>
            <text x="118" y="60" fill="#7a90a8" fontSize="9" fontFamily="Arial, sans-serif" letterSpacing="3">GESTIÓN CLÍNICA INTELIGENTE</text>
            <text x="118" y="78" fill="#2d3f52" fontSize="8" fontFamily="Arial, sans-serif" letterSpacing="1">Powered by <tspan fill="#00c2a8" fontWeight="700">SGTRUMAO</tspan></text>
          </svg>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Email</label>
          <input style={S.input} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Contraseña</label>
          <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>{error}</div>}
        <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", fontSize: 15, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <div style={{ marginTop: 20, padding: "12px 14px", background: C.surface2, borderRadius: 8, fontSize: 12, color: C.textMuted }}>
          <strong>💡 Primera vez:</strong> Los usuarios son creados por el administrador en Supabase → Authentication → Users
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [carros, setCarros] = useState(CARROS_INICIALES);
  const [atenciones, setAtenciones] = useState(ATENCIONES_INICIALES);
  const [usuario, setUsuario] = useState(null);
  const [industriaKey, setIndustriaKey] = useState("eventos");
  const industria = getIndustria(industriaKey);
  const isMobile = useIsMobile();
  const handleLogin = (user) => setUsuario(user);
  const handleLogout = () => setUsuario(null);
  if (!usuario) return <Login onLogin={handleLogin} />;

  const esAdmin = usuario?.rol === 'admin';
  const permisos = getPermisos(usuario);
  const allMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const alertCarros = carros.flatMap(c => c.insumos).filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;
  const alertBolso = allMeds.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  // Nav items según rol
  const navItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    ...(esAdmin || permisos.verInventario ? [{ id: "carros", label: "Carros", icon: "carro", badge: alertCarros }] : []),
    ...(esAdmin || permisos.verBolso ? [{ id: "bolso", label: "Medicamentos", icon: "bolso", badge: alertBolso }] : []),
    { id: "atenciones", label: "Atenciones", icon: "event" },
    ...(esAdmin ? [{ id: "eventos", label: "Eventos", icon: "event" }] : []),
    ...(esAdmin ? [{ id: "reportes", label: "Reportes", icon: "report" }] : []),
    { id: "configuracion", label: "Config", icon: "report" },
    ...(esAdmin ? [{ id: "usuarios", label: "Usuarios", icon: "med" }] : []),
  ];

  const nav = [
    { section: "General" },
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    ...(esAdmin ? [{ section: "Inventario" }] : []),
    ...(esAdmin || permisos.verInventario ? [{ id: "carros", label: "Carros Clínicos", icon: "carro", badge: alertCarros }] : []),
    ...(esAdmin || permisos.verBolso ? [{ id: "bolso", label: "Bolso de Medicamentos 💊", icon: "bolso", badge: alertBolso }] : []),
    { section: "Operación" },
    { id: "atenciones", label: "Atenciones 🏥", icon: "event" },
    ...(esAdmin || permisos.verBolsoKine ? [{ id: "bolsoKine", label: "Bolso Kinesiólogo/a", icon: "bolso" }] : []),    ...(esAdmin ? [{ id: "eventos", label: "Eventos", icon: "event" }] : []),
    ...(esAdmin ? [{ id: "reportes", label: "Reportes", icon: "report" }] : []),
    { id: "configuracion", label: "Config", icon: "report" },
    ...(esAdmin ? [{ id: "usuarios", label: "Usuarios", icon: "med" }] : []),
  ];

  return (
    <div style={{ ...S.app, flexDirection: isMobile ? "column" : "row" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* SIDEBAR - solo desktop */}
      {!isMobile && (
        <div style={S.sidebar}>
          <div style={S.logo}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: 1, lineHeight: 1 }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Gestión clínica inteligente, donde la necesites</div>
          </div>
          <nav style={S.nav}>
            {nav.map((item, i) =>
              item.section ? (
                <div key={i} style={S.navSection}>{item.section}</div>
              ) : (
                <div key={item.id} style={S.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
                  <Icon name={item.icon} size={15} color={tab === item.id ? C.accent : C.textMuted} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "1px 5px" }}>{item.badge}</span>}
                </div>
              )
            )}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Powered by</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>SGTRUMAO</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, marginBottom: 10 }}>{usuario?.email}</div>
            <button style={{ ...S.btn("ghost"), width: "100%", fontSize: 12, padding: "7px" }} onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {/* HEADER MÓVIL */}
      {isMobile && (
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
          <button style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={handleLogout}>Salir</button>
        </div>
      )}

      <main style={{ ...S.main, padding: isMobile ? "16px 16px 80px" : 28 }}>
        {tab === "dashboard" && <Dashboard carros={carros} usuario={usuario} esAdmin={esAdmin} permisos={permisos} />}
        {tab === "carros" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Carros Clínicos</div>
              <div style={S.subtitle}>7 carros · cada uno asignado a su evento</div>
            </div>
            <VistaCarros carros={carros} setCarros={setCarros} permisos={permisos} esAdmin={esAdmin} />
          </div>
        )}
        {tab === "bolso" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso Naranja 🟠</div>
              <div style={S.subtitle}>Medicamentos separados del carro · 3 cajas internas</div>
            </div>
            <VistaBolsoNaranja />
          </div>
        )}
        {tab === "atenciones" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Atenciones en Carpa Médica 🏥</div>
              <div style={S.subtitle}>Registro por evento · Médico, Enfermero/a, Paramédico, Kinesiólogo/a, Masoterapeuta</div>
            </div>
            <VistaAtenciones carros={carros} usuario={usuario} permisos={permisos} industria={industria} />
          </div>
        )}
{tab === "bolsoKine" && (
  <div>
    <div style={{ marginBottom: 24 }}>
      <div style={S.title}>Bolso de Kinesiólogo/a 🏥</div>
      <div style={S.subtitle}>Insumos de kinesiología</div>
    </div>
    <VistaBolsoKinesiologia usuario={usuario} />
  </div>
)}        {tab === "eventos" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Gestión de Eventos</div>
<div style={S.subtitle}>Crear y asignar equipos a eventos</div>
</div>
<VistaGestionEventos usuario={usuario} />
</div>
        )}
        {tab === "configuracion" && (
          <Configuracion industriaKey={industriaKey} setIndustriaKey={setIndustriaKey} usuario={usuario} />
        )}
        {tab === "usuarios" && esAdmin && (
          <GestionUsuarios usuario={usuario} carros={carros} />
        )}
        {tab === "reportes" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Reportes</div>
              <div style={S.subtitle}>Resumen del inventario completo</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🚑 Insumos por Carro</div>
                {carros.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                    <span style={{ color: c.color, fontWeight: 600 }}>{c.nombre}</span>
                    <span style={{ color: C.textMuted }}>{c.insumos.length} insumos · {c.evento_asignado === "Sin asignar" ? "Sin evento" : c.evento_asignado.slice(0, 25)}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🟠 Bolso Naranja</div>
                {[
                  { label: "💉 Inyectables", count: MEDICAMENTOS_INYECTABLES.length, color: C.blue },
                  { label: "💊 Orales", count: MEDICAMENTOS_ORALES.length, color: C.green },
                  { label: "🌬️ Aerosoles", count: MEDICAMENTOS_AEROSOLES.length, color: C.purple },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}15`, fontSize: 13 }}>
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: C.textMuted }}>{count} medicamentos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV - solo móvil */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px 8px", cursor: "pointer", position: "relative", color: tab === item.id ? C.accent : C.textFaint }}>
              {item.badge > 0 && <span style={{ position: "absolute", top: 6, right: "18%", background: C.red, color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 6, padding: "0 3px", minWidth: 14, textAlign: "center" }}>{item.badge}</span>}
              <Icon name={item.icon} size={22} color={tab === item.id ? C.accent : C.textFaint} />
              <span style={{ fontSize: 9, fontWeight: tab === item.id ? 700 : 400, marginTop: 3, textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
