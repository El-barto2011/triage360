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
function VistaBolsoNaranja({ usuario }) {
  const [tabActiva, setTabActiva] = useState("inyectables");
const [inyectables, setInyectables] = useState([]);
const [orales, setOrales] = useState([]);
const [aerosoles, setAerosoles] = useState([]);

// Cargar medicamentos desde Supabase
useEffect(() => {
async function cargarMedicamentos() {
const data = await sb("medicamentos?order=id", {}, usuario?.token);
if (data) {
setInyectables(data.filter(m => m.tipo === "inyectable"));
setOrales(data.filter(m => m.tipo === "oral"));
setAerosoles(data.filter(m => m.tipo === "aerosol"));
}
}
if (usuario?.token) cargarMedicamentos();
}, [usuario?.token]);
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

const guardar = async () => {
if (!form.nombre || !form.vencimiento) return;
const datos = { nombre: form.nombre, dosis: form.dosis, tipo: form.tipo, stock: +form.stock, minimo: +form.minimo, unidad: form.unidad, vencimiento: form.vencimiento };
if (modal === "nuevo") {
const res = await sb("medicamentos", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
if (res) tab.set(prev => [...prev, res[0]]);
} else {
const res = await sb(`medicamentos?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
if (res) tab.set(prev => prev.map(i => i.id === form.id ? res[0] : i));
}
setModal(null);
};

const eliminar = async (id) => {
await sb(`medicamentos?id=eq.${id}`, { method: "DELETE" }, usuario?.token);
tab.set(prev => prev.filter(i => i.id !== id));
};

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
// COMPONENTE: VISTA GESTIÓN DE EVENTOS
function VistaBolsoKinesiologia({ usuario }) {
  const [kines, setKines] = useState([]);
  const [kineSeleccionado, setKineSeleccionado] = useState(null);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const esAdmin = usuario?.rol === 'admin';
  const esKine = usuario?.profesion === 'Kinesiólogo/a';

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      if (esAdmin) {
        const data = await sb("perfiles?profesion=eq.Kinesiólogo/a&order=nombre", {}, usuario?.token);
        if (data) setKines(data);
      } else if (esKine) {
        const data = await sb(`insumos_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=nombre`, {}, usuario?.token);
        if (data) setInsumos(data);
      }
      setLoading(false);
    };
    cargar();
  }, [usuario, esAdmin, esKine]);

  const cargarBolsoKine = async (kineId) => {
    setLoading(true);
    const data = await sb(`insumos_kinesiologia?kinesiologo_id=eq.${kineId}&order=nombre`, {}, usuario?.token);
    if (data) setInsumos(data);
    setKineSeleccionado(kineId);
    setLoading(false);
  };

  const volverALista = () => { setKineSeleccionado(null); setInsumos([]); };
  const alertas = insumos.filter(i => i.stock < i.minimo).length;
  const abrirNuevo = () => { setForm({ nombre: "", stock: "", minimo: "", unidad: "unid.", kinesiologo_id: esKine ? usuario.id : kineSeleccionado }); setModal("nuevo"); };
  const abrirEditar = (ins) => { setForm({ ...ins }); setModal("editar"); };

  const guardar = async () => {
    if (!form.nombre) return;
    const kineId = esKine ? usuario.id : kineSeleccionado;
    const datos = { nombre: form.nombre, stock: +form.stock, minimo: +form.minimo, unidad: form.unidad, kinesiologo_id: kineId };
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

  if (esAdmin && !kineSeleccionado) {
    return (
      <div>
        <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.blue}12, ${C.surface})`, borderColor: C.blue + "40", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>🏥 Bolsos de Kinesiólogos</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Selecciona un kinesiólogo para ver su inventario</div>
        </div>
        <div style={S.card}>
          <div style={{ display: "grid", gap: 12 }}>
            {kines.map(kine => (
              <button key={kine.id} onClick={() => cargarBolsoKine(kine.id)} style={{ ...S.btn("ghost"), padding: 16, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{kine.nombre}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Kinesiólogo/a</div>
                </div>
                <Icon name="arrowRight" size={18} color={C.textMuted} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kineActual = esKine ? usuario.nombre : kines.find(k => k.id === kineSeleccionado)?.nombre;
  return (
    <div>
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${C.blue}12, ${C.surface})`, borderColor: C.blue + "40", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {esAdmin && <button onClick={volverALista} style={{ ...S.btn("ghost"), padding: "4px 8px" }}><Icon name="arrowLeft" size={16} color={C.blue} /></button>}
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>🏥 Bolso de {kineActual}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Insumos de kinesiología</div>
              </div>
            </div>
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
                  {ins.stock === 0 ? <span style={S.pill(C.red, C.redDim)}>Agotado</span> : ins.stock < ins.minimo ? <span style={S.pill(C.yellow, C.yellowDim)}>Bajo</span> : <span style={S.pill(C.green, C.greenDim)}>OK</span>}
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
                <label style={S.formLabel}>Mínimo</label>
                <input style={S.input} type="number" value={form.minimo || ""} onChange={e => setForm(p => ({ ...p, minimo: e.target.value }))} />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.formLabel}>Unidad</label>
              <input style={S.input} value={form.unidad || ""} onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={S.btn("primary")} onClick={guardar}>Guardar</button>
              <button style={S.btn("secondary")} onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      ubicacion: "",
      tipo_evento: "Deportivo",
      tipo_masoterapia: "Masivo",
      medicos: [],
      enfermeros: [],
      paramedicos: [],
      kinesiologos: [],
      masoterapeutas: [],
      carros_asignados: [],
      bolsos_asignados: []
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
      ubicacion: form.ubicacion || "",
      tipo_evento: form.tipo_evento,
      tipo_masoterapia: form.tipo_masoterapia,
      medicos: form.medicos || [],
      enfermeros: form.enfermeros || [],
      paramedicos: form.paramedicos || [],
      kinesiologos: form.kinesiologos || [],
      masoterapeutas: form.masoterapeutas || [],
      carros_asignados: form.carros_asignados || [],
      bolsos_asignados: form.bolsos_asignados || [],
      estado: "activo"
    };

    let eventoGuardado = null;
    let profesionalesANotificar = [];

    if (modal === "nuevo") {
      // CREAR NUEVO EVENTO
      const res = await sb("equipos_evento", { method: "POST", body: JSON.stringify(datos) }, usuario?.token);
      if (res) {
        eventoGuardado = res[0];
        setEventos(prev => [eventoGuardado, ...prev]);
        
        // Notificar a TODOS los profesionales asignados
        profesionalesANotificar = [
          ...datos.medicos,
          ...datos.enfermeros,
          ...datos.paramedicos,
          ...datos.kinesiologos,
          ...datos.masoterapeutas
        ];
      }
    } else {
      // EDITAR EVENTO EXISTENTE
      const eventoAnterior = eventos.find(e => e.id === form.id);
      const res = await sb(`equipos_evento?id=eq.${form.id}`, { method: "PATCH", body: JSON.stringify(datos) }, usuario?.token);
      
      if (res) {
        eventoGuardado = res[0];
        setEventos(prev => prev.map(e => e.id === form.id ? eventoGuardado : e));
        
        // Detectar NUEVOS profesionales agregados
        const profesionalesAnteriores = [
          ...(eventoAnterior?.medicos || []),
          ...(eventoAnterior?.enfermeros || []),
          ...(eventoAnterior?.paramedicos || []),
          ...(eventoAnterior?.kinesiologos || []),
          ...(eventoAnterior?.masoterapeutas || [])
        ];
        
        const profesionalesActuales = [
          ...datos.medicos,
          ...datos.enfermeros,
          ...datos.paramedicos,
          ...datos.kinesiologos,
          ...datos.masoterapeutas
        ];
        
        // Notificar solo a los NUEVOS
        profesionalesANotificar = profesionalesActuales.filter(
          id => !profesionalesAnteriores.includes(id)
        );
      }
    }

    // Enviar emails a los profesionales
    if (eventoGuardado && profesionalesANotificar.length > 0) {
      await enviarEmailsAsignacion(eventoGuardado, profesionalesANotificar);
    }

    setModal(null);
  };

  const enviarEmailsAsignacion = async (evento, profesionalesIds) => {
    try {
      // Obtener datos completos de los profesionales a notificar
      const profesionalesNotificar = profesionales.filter(p => profesionalesIds.includes(p.id));
      
      // Obtener datos completos del equipo para mostrar en el email
      const equipoCompleto = {
        medicos: profesionales.filter(p => evento.medicos?.includes(p.id)).map(p => p.nombre),
        enfermeros: profesionales.filter(p => evento.enfermeros?.includes(p.id)).map(p => p.nombre),
        paramedicos: profesionales.filter(p => evento.paramedicos?.includes(p.id)).map(p => p.nombre),
        kinesiologos: profesionales.filter(p => evento.kinesiologos?.includes(p.id)).map(p => p.nombre),
        masoterapeutas: profesionales.filter(p => evento.masoterapeutas?.includes(p.id)).map(p => p.nombre)
      };

      // Enviar email a cada profesional
      for (const prof of profesionalesNotificar) {
        // Determinar el rol del profesional
        let rol = "";
        if (evento.medicos?.includes(prof.id)) rol = "Médico";
        else if (evento.enfermeros?.includes(prof.id)) rol = "Enfermero/a";
        else if (evento.paramedicos?.includes(prof.id)) rol = "Paramédico";
        else if (evento.kinesiologos?.includes(prof.id)) rol = "Kinesiólogo/a";
        else if (evento.masoterapeutas?.includes(prof.id)) rol = "Masoterapeuta";

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "asignacion_evento",
            destinatario: prof.email,
            nombreProfesional: prof.nombre,
            rol: rol,
            evento: {
              nombre: evento.nombre_evento,
              fecha: evento.fecha_evento,
              ubicacion: evento.ubicacion || "Por confirmar",
              carros: evento.carros_asignados || [],
              bolsos: evento.bolsos_asignados || []
            },
            equipo: equipoCompleto
          })
        });
      }
      
      console.log(`Emails enviados a ${profesionalesNotificar.length} profesionales`);
    } catch (error) {
      console.error("Error al enviar emails:", error);
    }
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

  const toggleBolso = (bolso) => {
    const bolsos = form.bolsos_asignados || [];
    const index = bolsos.indexOf(bolso);
    if (index > -1) {
      setForm(p => ({ ...p, bolsos_asignados: bolsos.filter(b => b !== bolso) }));
    } else {
      setForm(p => ({ ...p, bolsos_asignados: [...bolsos, bolso] }));
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

            <div style={S.formRow}>
              <label style={S.formLabel}>Ubicación</label>
              <input 
                style={S.input} 
                value={form.ubicacion || ""} 
                onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} 
                placeholder="Parque Bicentenario, Vitacura"
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

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Bolsos de Medicamentos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[1, 2, 3].map(num => (
                    <label key={num} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6,
                      cursor: "pointer",
                      background: (form.bolsos_asignados || []).includes(`Bolso ${num}`) ? C.blueDim : "transparent"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(form.bolsos_asignados || []).includes(`Bolso ${num}`)}
                        onChange={() => toggleBolso(`Bolso ${num}`)}
                      />
                      <span style={{ fontSize: 12 }}>💊 Bolso {num}</span>
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
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ATENCIONES MÉDICAS (Para Médicos)
// Agregar después de VistaGestionEventos
// ═══════════════════════════════════════════════════════════════════════════

function VistaAtencionesMedicas({ usuario, carros }) {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [eventos, setEventos] = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);
  const [buscandoHistorial, setBuscandoHistorial] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const buscarHistorialPaciente = async (rut) => {
    if (!rut || rut.length < 4) { setHistorialPaciente([]); return; }
    setBuscandoHistorial(true);
    const [kine, med] = await Promise.all([
      sb(`atenciones_kinesiologia?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_medicas?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
    ]);
    const historial = [
      ...(kine || []).map(a => ({ ...a, tipo: "Kinesiología" })),
      ...(med || []).map(a => ({ ...a, tipo: "Médica" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistorialPaciente(historial);
    setBuscandoHistorial(false);
  };

  const cargarDatos = async () => {
    setLoading(true);
    const [ats, evs] = await Promise.all([
      sb("atenciones_medicas?order=created_at.desc&limit=50", {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token)
    ]);
    if (ats) setAtenciones(ats);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const abrirNuevaAtencion = () => {
    setForm({
      paciente_nombre: "",
      paciente_rut: "",
      paciente_edad: "",
      evento: eventos.length > 0 ? eventos[0].nombre_evento : "",
      motivo_consulta: "",
      diagnostico: "",
      tratamiento: "",
      observaciones: "",
      medicamentos_prescritos: [],
      insumos_medico: [],
      requiere_administracion: false
    });
    setModal("nueva");
  };

  const agregarMedicamento = () => {
    const meds = form.medicamentos_prescritos || [];
    setForm(f => ({
      ...f,
      medicamentos_prescritos: [...meds, { 
        nombre: "", 
        dosis: "", 
        via: "Oral", 
        cantidad: 1,
        urgente: false 
      }]
    }));
  };

  const actualizarMedicamento = (index, campo, valor) => {
    const meds = [...(form.medicamentos_prescritos || [])];
    meds[index][campo] = valor;
    setForm(f => ({ ...f, medicamentos_prescritos: meds }));
  };

  const eliminarMedicamento = (index) => {
    const meds = [...(form.medicamentos_prescritos || [])];
    meds.splice(index, 1);
    setForm(f => ({ ...f, medicamentos_prescritos: meds }));
  };

  const agregarInsumo = () => {
    const ins = form.insumos_medico || [];
    setForm(f => ({
      ...f,
      insumos_medico: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...(form.insumos_medico || [])];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...(form.insumos_medico || [])];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_medico: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      alert("Por favor completa al menos: nombre del paciente, evento y motivo de consulta");
      return;
    }

    // Validación anti-duplicado: misma atención en los últimos 5 minutos
    const hace5min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicado = atenciones.find(a =>
      a.paciente_nombre?.trim().toLowerCase() === form.paciente_nombre?.trim().toLowerCase() &&
      a.evento === form.evento &&
      a.motivo_consulta === form.motivo_consulta &&
      a.created_at > hace5min
    );
    if (duplicado) {
      alert("⚠️ Ya existe una atención registrada para este paciente en este evento hace menos de 5 minutos. ¿Es un registro duplicado?");
      return;
    }

    const datos = {
      medico_id: usuario.id,
      medico_nombre: usuario.nombre || usuario.email,
      paciente_nombre: form.paciente_nombre,
      paciente_rut: form.paciente_rut || null,
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      evento: form.evento,
      evento_id: form.evento_id || null,
      motivo_consulta: form.motivo_consulta,
      diagnostico: form.diagnostico || null,
      tratamiento: form.tratamiento || null,
      observaciones: form.observaciones || null,
      medicamentos_prescritos: form.medicamentos_prescritos || [],
      insumos_medico: form.insumos_medico || [],
      requiere_administracion: form.requiere_administracion || false,
      administracion_completada: false
    };

    const res = await sb("atenciones_medicas", { 
      method: "POST", 
      body: JSON.stringify(datos) 
    }, usuario?.token);

    if (res) {
      setAtenciones(prev => [res[0], ...prev]);
      setModal(null);
      alert("Atención registrada exitosamente");
    }
  };

  const verDetalleAtencion = (atencion) => {
    setForm(atencion);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  const atencionesHoy = atenciones.filter(a => {
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  const pendientesAdmin = atenciones.filter(a => 
    a.requiere_administracion && !a.administracion_completada
  );

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Atenciones Médicas</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {atencionesHoy.length} atenciones hoy · {pendientesAdmin.length} pendientes de administración
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaAtencion}>
            + Nueva Atención
          </button>
        </div>
      </div>

      {pendientesAdmin.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20, border: `2px solid ${C.orange}` }}>
          <div style={{ fontWeight: 700, color: C.orange, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span>
            <span>Pendientes de Administración ({pendientesAdmin.length})</span>
          </div>
          {pendientesAdmin.slice(0, 3).map(a => (
            <div key={a.id} style={{ 
              padding: 12, 
              background: C.orangeDim, 
              borderRadius: 6, 
              marginBottom: 8,
              fontSize: 13
            }}>
              <div style={{ fontWeight: 600 }}>{a.paciente_nombre}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>
                Evento: {a.evento} · Médico: {a.medico_nombre}
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                Medicamentos: {a.medicamentos_prescritos?.length || 0} prescritos
                {a.medicamentos_prescritos?.some(m => m.urgente) && (
                  <span style={{ marginLeft: 8, color: C.red, fontWeight: 700 }}>🚨 URGENTE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {atencionesHoy.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Atenciones de Hoy</div>
          {atencionesHoy.map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 16, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => verDetalleAtencion(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · 
                    {atencion.evento}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Motivo:</strong> {atencion.motivo_consulta}
                  </div>
                  {atencion.diagnostico && (
                    <div style={{ fontSize: 13, color: C.blue }}>
                      <strong>Dx:</strong> {atencion.diagnostico}
                    </div>
                  )}
                  {atencion.medicamentos_prescritos?.length > 0 && (
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                      💊 {atencion.medicamentos_prescritos.length} medicamento(s) prescrito(s)
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {atencion.requiere_administracion && !atencion.administracion_completada && (
                    <span style={{ ...S.badge(C.orange, C.orangeDim), fontSize: 10 }}>Pendiente admin.</span>
                  )}
                  {atencion.administracion_completada && (
                    <span style={{ ...S.badge(C.green, C.greenDim), fontSize: 10 }}>Administrado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {atenciones.filter(a => {
        const hoy = new Date().toISOString().split('T')[0];
        const fecha = new Date(a.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Atenciones Anteriores</div>
          {atenciones.filter(a => {
            const hoy = new Date().toISOString().split('T')[0];
            const fecha = new Date(a.created_at).toISOString().split('T')[0];
            return fecha !== hoy;
          }).slice(0, 5).map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 6, 
              marginBottom: 8,
              cursor: "pointer",
              opacity: 0.7
            }} onClick={() => verDetalleAtencion(atencion)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{atencion.paciente_nombre}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {new Date(atencion.created_at).toLocaleDateString('es-CL')} · {atencion.evento}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {modal === "nueva" ? "Nueva Atención Médica" : "Detalle de Atención"}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            {modal === "nueva" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Nombre del Paciente *</label>
                    <input 
                      style={S.input} 
                      value={form.paciente_nombre || ""} 
                      onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} 
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>RUT</label>

                    <input 
                      style={S.input} 
                      value={form.paciente_rut || ""} 
                      onChange={e => { 
                        setForm(f => ({ ...f, paciente_rut: e.target.value }));
                        buscarHistorialPaciente(e.target.value);
                      }} 
                      placeholder="12.345.678-9"
                    />
                  </div>
                </div>

                {/* Historial automático por RUT */}
                {buscandoHistorial && (
                  <div style={{ padding: "10px 14px", background: "#1a2a3a", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#64B4B4" }}>
                    🔍 Buscando historial...
                  </div>
                )}
                {!buscandoHistorial && historialPaciente.length > 0 && (
                  <div style={{ padding: 14, background: "#1a2a1a", border: "1px solid #2a5a2a", borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4caf50", marginBottom: 10 }}>
                      ⚠️ Paciente con historial previo ({historialPaciente.length} atenciones)
                    </div>
                    {historialPaciente.map((h, i) => (
                      <div key={i} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "#B4DCDC" }}>
                            {h.tipo === "Kinesiología" ? "🦴" : "🩺"} {h.tipo}
                          </span>
                          <span style={{ color: "#64B4B4" }}>{new Date(h.created_at).toLocaleDateString("es-CL")}</span>
                        </div>
                        <div style={{ color: "#aaa" }}>📍 {h.evento}</div>
                        <div style={{ color: "#ccc", marginTop: 2 }}>{h.motivo_consulta || h.diagnostico}</div>
                        <div style={{ color: "#64B4B4", marginTop: 2, fontSize: 11 }}>👨‍⚕️ {h.kinesiologo_nombre || h.medico_nombre}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Edad</label>
                    <input 
                      style={S.input} 
                      type="number"
                      value={form.paciente_edad || ""} 
                      onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))} 
                      placeholder="35"
                    />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.formLabel}>Evento *</label>
                    <select 
                      style={{ ...S.select, width: "100%" }} 
                      value={form.evento || ""} 
                      onChange={e => {
                    const ev = eventos.find(ev => ev.nombre_evento === e.target.value);
                    setForm(f => ({ ...f, evento: e.target.value, evento_id: ev ? ev.id : null }));
                  }}
                    >
                      {eventos.map(ev => (
                        <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Motivo de Consulta *</label>
                  <textarea 
                    style={{ ...S.input, minHeight: 60 }} 
                    value={form.motivo_consulta || ""} 
                    onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))} 
                    placeholder="Descripción del motivo de consulta..."
                  />
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Diagnóstico</label>
                  <textarea 
                    style={{ ...S.input, minHeight: 60 }} 
                    value={form.diagnostico || ""} 
                    onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} 
                    placeholder="Diagnóstico médico..."
                  />
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Tratamiento</label>
                  <textarea 
                    style={{ ...S.input, minHeight: 60 }} 
                    value={form.tratamiento || ""} 
                    onChange={e => setForm(f => ({ ...f, tratamiento: e.target.value }))} 
                    placeholder="Tratamiento indicado..."
                  />
                </div>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>Medicamentos Prescritos</div>
                    <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarMedicamento}>
                      + Agregar Medicamento
                    </button>
                  </div>
                  {(form.medicamentos_prescritos || []).map((med, index) => (
                    <div key={index} style={{ 
                      padding: 12, 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6, 
                      marginBottom: 12,
                      background: med.urgente ? C.redDim : C.surface
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input 
                          style={S.input}
                          placeholder="Nombre del medicamento"
                          value={med.nombre}
                          onChange={e => actualizarMedicamento(index, "nombre", e.target.value)}
                        />
                        <input 
                          style={S.input}
                          placeholder="Dosis"
                          value={med.dosis}
                          onChange={e => actualizarMedicamento(index, "dosis", e.target.value)}
                        />
                        <select 
                          style={S.select}
                          value={med.via}
                          onChange={e => actualizarMedicamento(index, "via", e.target.value)}
                        >
                          <option>Oral</option>
                          <option>Intravenosa</option>
                          <option>Intramuscular</option>
                          <option>Subcutánea</option>
                          <option>Tópica</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input 
                          type="number"
                          style={{ ...S.input, width: 80 }}
                          placeholder="Cant."
                          value={med.cantidad}
                          onChange={e => actualizarMedicamento(index, "cantidad", parseInt(e.target.value) || 1)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <input 
                            type="checkbox"
                            checked={med.urgente}
                            onChange={e => actualizarMedicamento(index, "urgente", e.target.checked)}
                          />
                          <span style={{ color: med.urgente ? C.red : C.text }}>Urgente 🚨</span>
                        </label>
                        <button 
                          style={{ ...S.btn("ghost"), fontSize: 12, marginLeft: "auto" }}
                          onClick={() => eliminarMedicamento(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>Insumos Utilizados (del Carro)</div>
                    <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                      + Agregar Insumo
                    </button>
                  </div>
                  {(form.insumos_medico || []).map((ins, index) => (
                    <div key={index} style={{ 
                      padding: 12, 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6, 
                      marginBottom: 8,
                      display: "flex",
                      gap: 12,
                      alignItems: "center"
                    }}>
                      <input 
                        style={{ ...S.input, flex: 2 }}
                        placeholder="Nombre del insumo"
                        value={ins.nombre}
                        onChange={e => actualizarInsumo(index, "nombre", e.target.value)}
                      />
                      <input 
                        type="number"
                        style={{ ...S.input, width: 80 }}
                        placeholder="Cant."
                        value={ins.cantidad}
                        onChange={e => actualizarInsumo(index, "cantidad", parseInt(e.target.value) || 1)}
                      />
                      <select 
                        style={{ ...S.select, width: 100 }}
                        value={ins.unidad}
                        onChange={e => actualizarInsumo(index, "unidad", e.target.value)}
                      >
                        <option>unid.</option>
                        <option>ml</option>
                        <option>mg</option>
                        <option>amp.</option>
                      </select>
                      <button 
                        style={{ ...S.btn("ghost"), fontSize: 12 }}
                        onClick={() => eliminarInsumo(index)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div style={S.formRow}>
                  <label style={S.formLabel}>Observaciones</label>
                  <textarea 
                    style={{ ...S.input, minHeight: 60 }} 
                    value={form.observaciones || ""} 
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} 
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <input 
                      type="checkbox"
                      checked={form.requiere_administracion}
                      onChange={e => setForm(f => ({ ...f, requiere_administracion: e.target.checked }))}
                    />
                    <span>Requiere administración por Enfermero/Paramédico</span>
                  </label>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, marginLeft: 24 }}>
                    Si marcas esta opción, la atención aparecerá en la lista de pendientes para enfermeros/paramédicos
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                  <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
                  <button style={S.btn("primary")} onClick={guardarAtencion}>
                    Guardar Atención
                  </button>
                </div>
              </>
            )}

            {modal === "detalle" && form && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
                  {form.paciente_rut && <div style={{ fontSize: 13, color: C.textMuted }}>RUT: {form.paciente_rut}</div>}
                  {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                    Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted }}>
                    Médico: {form.medico_nombre}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Motivo de Consulta:</div>
                  <div style={{ fontSize: 14 }}>{form.motivo_consulta}</div>
                </div>

                {form.diagnostico && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Diagnóstico:</div>
                    <div style={{ fontSize: 14 }}>{form.diagnostico}</div>
                  </div>
                )}

                {form.tratamiento && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Tratamiento:</div>
                    <div style={{ fontSize: 14 }}>{form.tratamiento}</div>
                  </div>
                )}

                {form.medicamentos_prescritos && form.medicamentos_prescritos.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Medicamentos Prescritos:</div>
                    {form.medicamentos_prescritos.map((med, i) => (
                      <div key={i} style={{ 
                        padding: 10, 
                        background: med.urgente ? C.redDim : C.surface2, 
                        borderRadius: 6, 
                        marginBottom: 6,
                        fontSize: 13
                      }}>
                        <div style={{ fontWeight: 600 }}>
                          {med.nombre} - {med.dosis}
                          {med.urgente && <span style={{ marginLeft: 8, color: C.red }}>🚨 URGENTE</span>}
                        </div>
                        <div style={{ color: C.textMuted, fontSize: 12 }}>
                          Vía: {med.via} · Cantidad: {med.cantidad}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {form.insumos_medico && form.insumos_medico.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                    {form.insumos_medico.map((ins, i) => (
                      <div key={i} style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                        • {ins.nombre} - {ins.cantidad} {ins.unidad}
                      </div>
                    ))}
                  </div>
                )}

                {form.observaciones && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Observaciones:</div>
                    <div style={{ fontSize: 14 }}>{form.observaciones}</div>
                  </div>
                )}

                <div style={{ marginTop: 20, padding: 12, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Estado de Administración:</div>
                  {form.requiere_administracion ? (
                    form.administracion_completada ? (
                      <span style={{ ...S.badge(C.green, C.greenDim) }}>✅ Administrado</span>
                    ) : (
                      <span style={{ ...S.badge(C.orange, C.orangeDim) }}>⏳ Pendiente de administración</span>
                    )
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: 13 }}>No requiere administración</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ADMINISTRACIÓN DE MEDICAMENTOS (Para Enfermeros/Paramédicos)
// Agregar después de VistaAtencionesMedicas
// ═══════════════════════════════════════════════════════════════════════════

function VistaAdministracionMedicamentos({ usuario }) {
  const [pendientes, setPendientes] = useState([]);
  const [misCasos, setMisCasos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Cargar atenciones pendientes
    const pend = await sb(
      "atenciones_medicas?requiere_administracion=eq.true&administracion_completada=eq.false&order=created_at.asc",
      {},
      usuario?.token
    );

    // Cargar administraciones completadas
    const hist = await sb(
      "administracion_medicamentos?order=created_at.desc&limit=50",
      {},
      usuario?.token
    );

    if (pend) setPendientes(pend);
    if (hist) {
      // Filtrar mis casos (que yo administré)
      const mios = hist.filter(h => h.administrador_id === usuario.id);
      setMisCasos(mios);
      setHistorial(hist);
    }

    setLoading(false);
  };

  const tomarCaso = (atencion) => {
    setForm({
      atencion_id: atencion.id,
      atencion: atencion,
      medicamentos_administrados: atencion.medicamentos_prescritos?.map(m => ({
        ...m,
        administrado: false,
        hora_admin: "",
        observaciones: ""
      })) || [],
      insumos_administracion: [],
      observaciones_generales: ""
    });
    setModal("administrar");
  };

  const toggleMedicamentoAdministrado = (index) => {
    const meds = [...form.medicamentos_administrados];
    meds[index].administrado = !meds[index].administrado;
    if (meds[index].administrado && !meds[index].hora_admin) {
      meds[index].hora_admin = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }
    setForm(f => ({ ...f, medicamentos_administrados: meds }));
  };

  const actualizarMedicamento = (index, campo, valor) => {
    const meds = [...form.medicamentos_administrados];
    meds[index][campo] = valor;
    setForm(f => ({ ...f, medicamentos_administrados: meds }));
  };

  const agregarInsumo = () => {
    const ins = form.insumos_administracion || [];
    setForm(f => ({
      ...f,
      insumos_administracion: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...form.insumos_administracion];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_administracion: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...form.insumos_administracion];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_administracion: ins }));
  };

  const completarAdministracion = async () => {
    const administrados = form.medicamentos_administrados.filter(m => m.administrado);
    
    if (administrados.length === 0) {
      alert("Debes marcar al menos un medicamento como administrado");
      return;
    }

    // 1. Registrar la administración
    const datosAdmin = {
      atencion_id: form.atencion_id,
      administrador_id: usuario.id,
      administrador_nombre: usuario.nombre || usuario.email,
      administrador_tipo: usuario.profesion || "Enfermero/a",
      medicamentos_administrados: form.medicamentos_administrados,
      insumos_administracion: form.insumos_administracion || [],
      observaciones: form.observaciones_generales || null
    };

    const resAdmin = await sb(
      "administracion_medicamentos",
      { method: "POST", body: JSON.stringify(datosAdmin) },
      usuario?.token
    );

    // 2. Marcar la atención como completada
    if (resAdmin) {
      const resAtencion = await sb(
        `atenciones_medicas?id=eq.${form.atencion_id}`,
        { method: "PATCH", body: JSON.stringify({ administracion_completada: true }) },
        usuario?.token
      );

      if (resAtencion) {
        alert("Administración registrada exitosamente");
        setModal(null);
        cargarDatos(); // Recargar datos
      }
    }
  };

  const verDetalleAdministracion = (admin) => {
    setForm(admin);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando pendientes...</div>;

  const urgentes = pendientes.filter(p => 
    p.medicamentos_prescritos?.some(m => m.urgente)
  );

  const hoy = new Date().toISOString().split('T')[0];
  const administracionesHoy = misCasos.filter(a => {
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Administración de Medicamentos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {pendientes.length} casos pendientes · {urgentes.length} urgentes · {administracionesHoy.length} administrados hoy por mí
            </div>
          </div>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20, border: `2px solid ${C.red}` }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🚨</span>
            <span>CASOS URGENTES ({urgentes.length})</span>
          </div>
          {urgentes.map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 14, 
              background: C.redDim, 
              borderRadius: 8, 
              marginBottom: 12,
              cursor: "pointer"
            }} onClick={() => tomarCaso(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    Prescrito: {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · 
                    Médico: {atencion.medico_nombre}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <strong>Diagnóstico:</strong> {atencion.diagnostico || "No especificado"}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    💊 {atencion.medicamentos_prescritos?.length || 0} medicamento(s)
                    {atencion.medicamentos_prescritos?.filter(m => m.urgente).map(m => (
                      <div key={m.nombre} style={{ fontSize: 12, color: C.red, marginTop: 4 }}>
                        🚨 {m.nombre} - {m.dosis} ({m.via})
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  style={{ ...S.btn("primary"), fontSize: 12, background: C.red }}
                  onClick={(e) => { e.stopPropagation(); tomarCaso(atencion); }}
                >
                  Tomar Caso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendientes.filter(p => !urgentes.includes(p)).length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>
            Pendientes de Administración ({pendientes.filter(p => !urgentes.includes(p)).length})
          </div>
          {pendientes.filter(p => !urgentes.includes(p)).map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 14, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => tomarCaso(atencion)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {atencion.paciente_nombre}
                    {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                    Prescrito: {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · 
                    Médico: {atencion.medico_nombre} · Evento: {atencion.evento}
                  </div>
                  {atencion.diagnostico && (
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>Dx:</strong> {atencion.diagnostico}
                    </div>
                  )}
                  <div style={{ fontSize: 13 }}>
                    💊 {atencion.medicamentos_prescritos?.length || 0} medicamento(s) prescritos
                  </div>
                </div>
                <button 
                  style={{ ...S.btn("primary"), fontSize: 12 }}
                  onClick={(e) => { e.stopPropagation(); tomarCaso(atencion); }}
                >
                  Tomar Caso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {administracionesHoy.length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.green, marginBottom: 12 }}>
            Mis Administraciones de Hoy ({administracionesHoy.length})
          </div>
          {administracionesHoy.map(admin => (
            <div key={admin.id} style={{ 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 6, 
              marginBottom: 8,
              background: C.greenDim,
              cursor: "pointer"
            }} onClick={() => verDetalleAdministracion(admin)}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Caso #{admin.atencion_id}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                {new Date(admin.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · 
                {admin.medicamentos_administrados?.filter(m => m.administrado).length || 0} medicamento(s) administrado(s)
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "administrar" && form.atencion && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                Administrar Medicamentos
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: C.surface2, borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                Paciente: {form.atencion.paciente_nombre}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                {form.atencion.paciente_edad && `${form.atencion.paciente_edad} años · `}
                Evento: {form.atencion.evento}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                Médico: {form.atencion.medico_nombre}
              </div>
              {form.atencion.diagnostico && (
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  <strong>Diagnóstico:</strong> {form.atencion.diagnostico}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Medicamentos Prescritos:</div>
              {form.medicamentos_administrados.map((med, index) => (
                <div key={index} style={{ 
                  padding: 14, 
                  border: `2px solid ${med.urgente ? C.red : med.administrado ? C.green : C.border}`, 
                  borderRadius: 8, 
                  marginBottom: 12,
                  background: med.administrado ? C.greenDim : med.urgente ? C.redDim : C.surface
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "start", marginBottom: 10 }}>
                    <input 
                      type="checkbox"
                      checked={med.administrado}
                      onChange={() => toggleMedicamentoAdministrado(index)}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {med.nombre} - {med.dosis}
                        {med.urgente && <span style={{ marginLeft: 8, color: C.red, fontSize: 13 }}>🚨 URGENTE</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>
                        Vía: {med.via} · Cantidad: {med.cantidad}
                      </div>
                    </div>
                  </div>
                  
                  {med.administrado && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4 }}>
                            Hora de administración
                          </label>
                          <input 
                            type="time"
                            style={S.input}
                            value={med.hora_admin || ""}
                            onChange={e => actualizarMedicamento(index, "hora_admin", e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4 }}>
                            Observaciones
                          </label>
                          <input 
                            style={S.input}
                            placeholder="Reacción del paciente, efectos, etc."
                            value={med.observaciones || ""}
                            onChange={e => actualizarMedicamento(index, "observaciones", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Insumos Utilizados (Jeringas, Agujas, etc.)</div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                  + Agregar Insumo
                </button>
              </div>
              {(form.insumos_administracion || []).map((ins, index) => (
                <div key={index} style={{ 
                  padding: 10, 
                  border: `1px solid ${C.border}`, 
                  borderRadius: 6, 
                  marginBottom: 8,
                  display: "flex",
                  gap: 12,
                  alignItems: "center"
                }}>
                  <input 
                    style={{ ...S.input, flex: 2 }}
                    placeholder="Nombre del insumo"
                    value={ins.nombre}
                    onChange={e => actualizarInsumo(index, "nombre", e.target.value)}
                  />
                  <input 
                    type="number"
                    style={{ ...S.input, width: 80 }}
                    placeholder="Cant."
                    value={ins.cantidad}
                    onChange={e => actualizarInsumo(index, "cantidad", parseInt(e.target.value) || 1)}
                  />
                  <select 
                    style={{ ...S.select, width: 100 }}
                    value={ins.unidad}
                    onChange={e => actualizarInsumo(index, "unidad", e.target.value)}
                  >
                    <option>unid.</option>
                    <option>ml</option>
                    <option>amp.</option>
                  </select>
                  <button 
                    style={{ ...S.btn("ghost"), fontSize: 12 }}
                    onClick={() => eliminarInsumo(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Observaciones Generales
              </label>
              <textarea 
                style={{ ...S.input, minHeight: 80 }}
                placeholder="Reacciones del paciente, complicaciones, etc."
                value={form.observaciones_generales || ""}
                onChange={e => setForm(f => ({ ...f, observaciones_generales: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button 
                style={S.btn("primary")}
                onClick={completarAdministracion}
                disabled={!form.medicamentos_administrados?.some(m => m.administrado)}
              >
                Completar Administración
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                Detalle de Administración
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                Administrado por: {form.administrador_nombre} ({form.administrador_tipo})
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Fecha: {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Medicamentos Administrados:</div>
              {form.medicamentos_administrados?.filter(m => m.administrado).map((med, i) => (
                <div key={i} style={{ 
                  padding: 12, 
                  background: C.greenDim, 
                  borderRadius: 6, 
                  marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    ✓ {med.nombre} - {med.dosis}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                    Vía: {med.via} · Cantidad: {med.cantidad} · Hora: {med.hora_admin || "No especificada"}
                  </div>
                  {med.observaciones && (
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <strong>Obs:</strong> {med.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {form.insumos_administracion && form.insumos_administracion.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                {form.insumos_administracion.map((ins, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                    • {ins.nombre} - {ins.cantidad} {ins.unidad}
                  </div>
                ))}
              </div>
            )}

            {form.observaciones && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Observaciones:</div>
                <div style={{ fontSize: 14 }}>{form.observaciones}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ATENCIONES DE KINESIOLOGÍA (Con bolso individual)
// Agregar después de VistaAdministracionMedicamentos
// ═══════════════════════════════════════════════════════════════════════════

function VistaAtencionesKinesiologia({ usuario }) {
  const [atenciones, setAtenciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [eventos, setEventos] = useState([]);
  const [historialPaciente, setHistorialPaciente] = useState([]);
  const [buscandoHistorial, setBuscandoHistorial] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const buscarHistorialPaciente = async (rut) => {
    if (!rut || rut.length < 4) { setHistorialPaciente([]); return; }
    setBuscandoHistorial(true);
    const [kine, med] = await Promise.all([
      sb(`atenciones_kinesiologia?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_medicas?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
    ]);
    const historial = [
      ...(kine || []).map(a => ({ ...a, tipo: "Kinesiología" })),
      ...(med || []).map(a => ({ ...a, tipo: "Médica" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistorialPaciente(historial);
    setBuscandoHistorial(false);
  };

  const cargarDatos = async () => {
    setLoading(true);
    const [ats, ins, evs] = await Promise.all([
      sb(`atenciones_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=created_at.desc&limit=50`, {}, usuario?.token),
      sb(`insumos_kinesiologia?kinesiologo_id=eq.${usuario.id}&order=nombre`, {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&order=created_at.desc", {}, usuario?.token)
    ]);
    if (ats) setAtenciones(ats);
    if (ins) setInsumos(ins);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const abrirNuevaAtencion = () => {
    setForm({
      paciente_nombre: "",
      paciente_rut: "",
      paciente_edad: "",
      evento: eventos.length > 0 ? eventos[0].nombre_evento : "",
      motivo_consulta: "",
      evaluacion_inicial: "",
      tratamiento_realizado: "",
      observaciones: "",
      recomendaciones: "",
      insumos_usados: []
    });
    setModal("nueva");
  };

  const agregarInsumo = () => {
    const ins = form.insumos_usados || [];
    setForm(f => ({
      ...f,
      insumos_usados: [...ins, { nombre: "", cantidad: 1, unidad: "unid." }]
    }));
  };

  const actualizarInsumo = (index, campo, valor) => {
    const ins = [...(form.insumos_usados || [])];
    ins[index][campo] = valor;
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const eliminarInsumo = (index) => {
    const ins = [...(form.insumos_usados || [])];
    ins.splice(index, 1);
    setForm(f => ({ ...f, insumos_usados: ins }));
  };

  const guardarAtencion = async () => {
    if (!form.paciente_nombre || !form.evento || !form.motivo_consulta) {
      alert("Por favor completa al menos: nombre del paciente, evento y motivo de consulta");
      return;
    }

    // Validación anti-duplicado: misma atención en los últimos 5 minutos
    const hace5min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicado = atenciones.find(a =>
      a.paciente_nombre?.trim().toLowerCase() === form.paciente_nombre?.trim().toLowerCase() &&
      a.evento === form.evento &&
      a.motivo_consulta === form.motivo_consulta &&
      a.created_at > hace5min
    );
    if (duplicado) {
      alert("⚠️ Ya existe una atención registrada para este paciente en este evento hace menos de 5 minutos. ¿Es un registro duplicado?");
      return;
    }

    const datos = {
      kinesiologo_id: usuario.id,
      kinesiologo_nombre: usuario.nombre || usuario.email,
      paciente_nombre: form.paciente_nombre,
      paciente_rut: form.paciente_rut || null,
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      evento: form.evento,
      evento_id: form.evento_id || null,
      motivo_consulta: form.motivo_consulta,
      evaluacion_inicial: form.evaluacion_inicial || null,
      tratamiento_realizado: form.tratamiento_realizado || null,
      observaciones: form.observaciones || null,
      recomendaciones: form.recomendaciones || null,
      insumos_usados: form.insumos_usados || []
    };

    const res = await sb("atenciones_kinesiologia", { 
      method: "POST", 
      body: JSON.stringify(datos) 
    }, usuario?.token);

    if (res) {
      // Descontar insumos del bolso
      const insumosStockBajo = [];
      for (const insumo of form.insumos_usados || []) {
        const insumoEnBolso = insumos.find(i => i.nombre === insumo.nombre);
        if (insumoEnBolso) {
          const nuevoStock = insumoEnBolso.stock - insumo.cantidad;
          await sb(`insumos_kinesiologia?id=eq.${insumoEnBolso.id}`, {
            method: "PATCH",
            body: JSON.stringify({ stock: nuevoStock })
          }, usuario?.token);
          // Detectar si queda bajo el mínimo
          if (nuevoStock <= insumoEnBolso.minimo) {
            insumosStockBajo.push({ ...insumoEnBolso, stockActual: nuevoStock });
          }
        }
      }

      // Enviar email inmediato si hay stock bajo
      if (insumosStockBajo.length > 0) {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "alerta_stock",
              destinatario: "alfredo.jara@sgtrumao.cl",
              insumos: insumosStockBajo.map(i => ({
                nombre: i.nombre,
                stockActual: i.stockActual,
                minimo: i.minimo,
                unidad: i.unidad
              })),
              profesional: usuario.nombre || usuario.email,
              evento: form.evento
            })
          });
        } catch (e) {
          console.error("Error enviando alerta stock:", e);
        }
      }

      setAtenciones(prev => [res[0], ...prev]);
      setModal(null);
      alert("Atención registrada exitosamente");
      cargarDatos(); // Recargar para actualizar stock
    }
  };

  const verDetalleAtencion = (atencion) => {
    setForm(atencion);
    setModal("detalle");
  };

  const abrirGestionBolso = () => {
    setModal("bolso");
  };

  const agregarInsumoAlBolso = async () => {
    const nombre = prompt("Nombre del insumo:");
    if (!nombre) return;

    const stock = prompt("Stock inicial:");
    if (!stock) return;

    const minimo = prompt("Stock mínimo:");
    if (!minimo) return;

    const datos = {
      kinesiologo_id: usuario.id,
      nombre: nombre,
      stock: parseFloat(stock),
      minimo: parseFloat(minimo),
      unidad: "unid.",
      categoria: "General"
    };

    const res = await sb("insumos_kinesiologia", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setInsumos(prev => [...prev, res[0]]);
      alert("Insumo agregado al bolso");
    }
  };

  const ajustarStockInsumo = async (insumo) => {
    const nuevoStock = prompt(`Stock actual: ${insumo.stock} ${insumo.unidad}\nNuevo stock:`, insumo.stock);
    if (nuevoStock === null) return;

    const res = await sb(`insumos_kinesiologia?id=eq.${insumo.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: parseFloat(nuevoStock) })
    }, usuario?.token);

    if (res) {
      setInsumos(prev => prev.map(i => i.id === insumo.id ? { ...i, stock: parseFloat(nuevoStock) } : i));
      alert("Stock actualizado");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando atenciones...</div>;

  const hoy = new Date().toISOString().split('T')[0];
  const atencionesHoy = atenciones.filter(a => {
    const fecha = new Date(a.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  const insumosAlerta = insumos.filter(i => i.stock <= i.minimo);

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Atenciones de Kinesiología</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {atencionesHoy.length} atenciones hoy · {insumos.length} insumos en mi bolso
              {insumosAlerta.length > 0 && <span style={{ color: C.red, marginLeft: 8 }}>⚠️ {insumosAlerta.length} con stock bajo</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={abrirGestionBolso}>
              🎒 Mi Bolso
            </button>
            <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaAtencion}>
              + Nueva Atención
            </button>
          </div>
        </div>
      </div>

      {atencionesHoy.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Atenciones de Hoy</div>
          {atencionesHoy.map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 16, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => verDetalleAtencion(atencion)}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {atencion.paciente_nombre}
                {atencion.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({atencion.paciente_edad} años)</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                {new Date(atencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · {atencion.evento}
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Motivo:</strong> {atencion.motivo_consulta}
              </div>
              {atencion.insumos_usados?.length > 0 && (
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                  🎒 {atencion.insumos_usados.length} insumo(s) utilizados
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {atenciones.filter(a => {
        const fecha = new Date(a.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Atenciones Anteriores</div>
          {atenciones.filter(a => {
            const fecha = new Date(a.created_at).toISOString().split('T')[0];
            return fecha !== hoy;
          }).slice(0, 5).map(atencion => (
            <div key={atencion.id} style={{ 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 6, 
              marginBottom: 8,
              cursor: "pointer",
              opacity: 0.7
            }} onClick={() => verDetalleAtencion(atencion)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{atencion.paciente_nombre}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {new Date(atencion.created_at).toLocaleDateString('es-CL')} · {atencion.evento}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "nueva" && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Nueva Atención Kinesiológica</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del Paciente *</label>
                <input 
                  style={S.input} 
                  value={form.paciente_nombre || ""} 
                  onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} 
                  placeholder="Juan Pérez"
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>RUT</label>
                <input 
                  style={S.input} 
                  value={form.paciente_rut || ""} 
                  onChange={e => { 
                    setForm(f => ({ ...f, paciente_rut: e.target.value }));
                    buscarHistorialPaciente(e.target.value);
                  }} 
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            {buscandoHistorial && (
              <div style={{ padding: "10px 14px", background: "#1a2a3a", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#64B4B4" }}>
                🔍 Buscando historial...
              </div>
            )}
            {!buscandoHistorial && historialPaciente.length > 0 && (
              <div style={{ padding: 14, background: "#1a2a1a", border: "1px solid #2a5a2a", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4caf50", marginBottom: 10 }}>
                  ⚠️ Paciente con historial previo ({historialPaciente.length} atenciones)
                </div>
                {historialPaciente.map((h, i) => (
                  <div key={i} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#B4DCDC" }}>
                        {h.tipo === "Kinesiología" ? "🦴" : "🩺"} {h.tipo}
                      </span>
                      <span style={{ color: "#64B4B4" }}>{new Date(h.created_at).toLocaleDateString("es-CL")}</span>
                    </div>
                    <div style={{ color: "#aaa" }}>📍 {h.evento}</div>
                    <div style={{ color: "#ccc", marginTop: 2 }}>{h.motivo_consulta || h.diagnostico}</div>
                    <div style={{ color: "#64B4B4", marginTop: 2, fontSize: 11 }}>👨‍⚕️ {h.kinesiologo_nombre || h.medico_nombre}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Edad</label>
                <input 
                  style={S.input} 
                  type="number"
                  value={form.paciente_edad || ""} 
                  onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))} 
                  placeholder="35"
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Evento *</label>
                <select 
                  style={{ ...S.select, width: "100%" }} 
                  value={form.evento || ""} 
                  onChange={e => {
                    const ev = eventos.find(ev => ev.nombre_evento === e.target.value);
                    setForm(f => ({ ...f, evento: e.target.value, evento_id: ev ? ev.id : null }));
                  }}
                >
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Motivo de Consulta *</label>
              <textarea 
                style={{ ...S.input, minHeight: 60 }} 
                value={form.motivo_consulta || ""} 
                onChange={e => setForm(f => ({ ...f, motivo_consulta: e.target.value }))} 
                placeholder="Descripción del motivo..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Evaluación Inicial</label>
              <textarea 
                style={{ ...S.input, minHeight: 60 }} 
                value={form.evaluacion_inicial || ""} 
                onChange={e => setForm(f => ({ ...f, evaluacion_inicial: e.target.value }))} 
                placeholder="Hallazgos de la evaluación..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Tratamiento Realizado</label>
              <textarea 
                style={{ ...S.input, minHeight: 60 }} 
                value={form.tratamiento_realizado || ""} 
                onChange={e => setForm(f => ({ ...f, tratamiento_realizado: e.target.value }))} 
                placeholder="Descripción del tratamiento..."
              />
            </div>

            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Insumos Utilizados (de mi bolso)</div>
                <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={agregarInsumo}>
                  + Agregar Insumo
                </button>
              </div>
              {(form.insumos_usados || []).map((ins, index) => (
                <div key={index} style={{ 
                  padding: 12, 
                  border: `1px solid ${C.border}`, 
                  borderRadius: 6, 
                  marginBottom: 8,
                  display: "flex",
                  gap: 12,
                  alignItems: "center"
                }}>
                  <select 
                    style={{ ...S.select, flex: 2 }}
                    value={ins.nombre}
                    onChange={e => actualizarInsumo(index, "nombre", e.target.value)}
                  >
                    <option value="">Selecciona insumo...</option>
                    {insumos.map(i => (
                      <option key={i.id} value={i.nombre}>
                        {i.nombre} (Stock: {i.stock} {i.unidad})
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number"
                    style={{ ...S.input, width: 80 }}
                    placeholder="Cant."
                    value={ins.cantidad}
                    onChange={e => actualizarInsumo(index, "cantidad", parseFloat(e.target.value) || 1)}
                  />
                  <button 
                    style={{ ...S.btn("ghost"), fontSize: 12 }}
                    onClick={() => eliminarInsumo(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea 
                style={{ ...S.input, minHeight: 60 }} 
                value={form.observaciones || ""} 
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} 
                placeholder="Observaciones..."
              />
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Recomendaciones</label>
              <textarea 
                style={{ ...S.input, minHeight: 60 }} 
                value={form.recomendaciones || ""} 
                onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} 
                placeholder="Recomendaciones para el paciente..."
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardarAtencion}>Guardar Atención</button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Detalle de Atención</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
              {form.paciente_rut && <div style={{ fontSize: 13, color: C.textMuted }}>RUT: {form.paciente_rut}</div>}
              {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Motivo de Consulta:</div>
              <div style={{ fontSize: 14 }}>{form.motivo_consulta}</div>
            </div>

            {form.evaluacion_inicial && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Evaluación Inicial:</div>
                <div style={{ fontSize: 14 }}>{form.evaluacion_inicial}</div>
              </div>
            )}

            {form.tratamiento_realizado && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Tratamiento Realizado:</div>
                <div style={{ fontSize: 14 }}>{form.tratamiento_realizado}</div>
              </div>
            )}

            {form.insumos_usados && form.insumos_usados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Insumos Utilizados:</div>
                {form.insumos_usados.map((ins, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>
                    • {ins.nombre} - {ins.cantidad} {ins.unidad || "unid."}
                  </div>
                ))}
              </div>
            )}

            {form.observaciones && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Observaciones:</div>
                <div style={{ fontSize: 14 }}>{form.observaciones}</div>
              </div>
            )}

            {form.recomendaciones && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Recomendaciones:</div>
                <div style={{ fontSize: 14 }}>{form.recomendaciones}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {modal === "bolso" && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>🎒 Mi Bolso de Insumos</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <button style={{ ...S.btn("primary"), marginBottom: 16, width: "100%" }} onClick={agregarInsumoAlBolso}>
              + Agregar Insumo al Bolso
            </button>

            {insumos.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
                No tienes insumos en tu bolso. Agrega algunos para comenzar.
              </div>
            ) : (
              insumos.map(insumo => (
                <div key={insumo.id} style={{ 
                  padding: 14, 
                  border: `1px solid ${insumo.stock <= insumo.minimo ? C.red : C.border}`, 
                  borderRadius: 8, 
                  marginBottom: 12,
                  background: insumo.stock <= insumo.minimo ? C.redDim : C.surface
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{insumo.nombre}</div>
                      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                        Stock: {insumo.stock} {insumo.unidad} · Mínimo: {insumo.minimo} {insumo.unidad}
                      </div>
                      {insumo.stock <= insumo.minimo && (
                        <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>
                          ⚠️ Stock bajo
                        </div>
                      )}
                    </div>
                    <button 
                      style={{ ...S.btn("ghost"), fontSize: 12 }}
                      onClick={() => ajustarStockInsumo(insumo)}
                    >
                      Ajustar Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: MASOTERAPIA MASIVA (Contador para eventos masivos)
// Agregar después de VistaAtencionesKinesiologia
// ═══════════════════════════════════════════════════════════════════════════

function VistaMasoterapiaMasiva({ usuario }) {
  const [registroHoy, setRegistroHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const [evs, hist] = await Promise.all([
      sb("equipos_evento?estado=eq.activo&tipo_masoterapia=eq.Masivo&order=created_at.desc", {}, usuario?.token),
      sb(`atenciones_masoterapia_masiva?masoterapeuta_id=eq.${usuario.id}&order=created_at.desc&limit=30`, {}, usuario?.token)
    ]);

    if (evs) {
      setEventos(evs);
      if (evs.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(evs[0].nombre_evento);
      }
    }

    if (hist) {
      setHistorial(hist);
      // Buscar registro de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const regHoy = hist.find(h => {
        const fechaReg = new Date(h.created_at).toISOString().split('T')[0];
        return fechaReg === hoy && h.evento === (eventoSeleccionado || evs?.[0]?.nombre_evento);
      });
      setRegistroHoy(regHoy || null);
    }

    setLoading(false);
  };

  const iniciarContador = async () => {
    if (!eventoSeleccionado) {
      alert("Selecciona un evento primero");
      return;
    }

    const datos = {
      masoterapeuta_id: usuario.id,
      masoterapeuta_nombre: usuario.nombre || usuario.email,
      evento: eventoSeleccionado,
      masajes_realizados: 0,
      fecha: new Date().toISOString().split('T')[0]
    };

    const res = await sb("atenciones_masoterapia_masiva", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setRegistroHoy(res[0]);
      setHistorial(prev => [res[0], ...prev]);
    }
  };

  const sumarMasaje = async () => {
    if (!registroHoy) {
      await iniciarContador();
      return;
    }

    const nuevoConteo = registroHoy.masajes_realizados + 1;
    const res = await sb(`atenciones_masoterapia_masiva?id=eq.${registroHoy.id}`, {
      method: "PATCH",
      body: JSON.stringify({ masajes_realizados: nuevoConteo })
    }, usuario?.token);

    if (res) {
      setRegistroHoy(res[0]);
      setHistorial(prev => prev.map(h => h.id === registroHoy.id ? res[0] : h));
    }
  };

  const restarMasaje = async () => {
    if (!registroHoy || registroHoy.masajes_realizados === 0) return;

    const nuevoConteo = registroHoy.masajes_realizados - 1;
    const res = await sb(`atenciones_masoterapia_masiva?id=eq.${registroHoy.id}`, {
      method: "PATCH",
      body: JSON.stringify({ masajes_realizados: nuevoConteo })
    }, usuario?.token);

    if (res) {
      setRegistroHoy(res[0]);
      setHistorial(prev => prev.map(h => h.id === registroHoy.id ? res[0] : h));
    }
  };

  const cambiarEvento = async (nuevoEvento) => {
    setEventoSeleccionado(nuevoEvento);
    
    // Buscar si ya existe registro de hoy para este evento
    const hoy = new Date().toISOString().split('T')[0];
    const regHoy = historial.find(h => {
      const fechaReg = new Date(h.created_at).toISOString().split('T')[0];
      return fechaReg === hoy && h.evento === nuevoEvento;
    });
    
    setRegistroHoy(regHoy || null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando...</div>;

  if (eventos.length === 0) {
    return (
      <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No hay eventos masivos activos</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Los eventos deben estar configurados con tipo de masoterapia "Masivo"
        </div>
      </div>
    );
  }

  const conteo = registroHoy?.masajes_realizados || 0;
  const horaInicio = registroHoy ? new Date(registroHoy.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const horasTranscurridas = registroHoy ? (Date.now() - new Date(registroHoy.created_at).getTime()) / (1000 * 60 * 60) : 0;
  const promedioPorHora = horasTranscurridas > 0 ? (conteo / horasTranscurridas).toFixed(1) : 0;

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.blue, marginBottom: 12 }}>
          Masoterapia Masiva - Contador
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Evento: {eventoSeleccionado}
        </div>
        {eventos.length > 1 && (
          <select 
            style={{ ...S.select, width: "100%", marginTop: 12 }}
            value={eventoSeleccionado}
            onChange={e => cambiarEvento(e.target.value)}
          >
            {eventos.map(ev => (
              <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ ...S.card, marginBottom: 20, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 20 }}>
          MASAJES REALIZADOS HOY
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: C.blue, marginBottom: 30 }}>
          {conteo}
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
          <button 
            style={{ 
              ...S.btn("ghost"), 
              width: 80, 
              height: 80, 
              fontSize: 40,
              opacity: conteo === 0 ? 0.3 : 1
            }}
            onClick={restarMasaje}
            disabled={conteo === 0}
          >
            −
          </button>
          <button 
            style={{ 
              ...S.btn("primary"), 
              width: 120, 
              height: 120, 
              fontSize: 60
            }}
            onClick={sumarMasaje}
          >
            +
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Presiona + para sumar un masaje
        </div>
      </div>

      {registroHoy && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Estadísticas del Día</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Inicio</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{horaInicio}</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tiempo</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{horasTranscurridas.toFixed(1)}h</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, background: C.surface2, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Promedio/hora</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{promedioPorHora}</div>
            </div>
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Historial Reciente</div>
          {historial.slice(0, 10).map(reg => {
            const esHoy = new Date(reg.created_at).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            return (
              <div key={reg.id} style={{ 
                padding: 12, 
                border: `1px solid ${C.border}`, 
                borderRadius: 6, 
                marginBottom: 8,
                opacity: esHoy ? 1 : 0.6
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{reg.evento}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {new Date(reg.created_at).toLocaleDateString('es-CL')}
                      {esHoy && <span style={{ marginLeft: 8, color: C.green }}>• Hoy</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>
                    {reg.masajes_realizados}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: MASOTERAPIA ESPECÍFICA (Fichas individuales para torneos)
// Agregar después de VistaMasoterapiaMasiva
// ═══════════════════════════════════════════════════════════════════════════

function VistaMasoterapiaEspecifica({ usuario }) {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [eventos, setEventos] = useState([]);

  const zonasDisponibles = [
    "Cuello", "Hombros", "Espalda alta", "Espalda baja", "Brazos", 
    "Antebrazos", "Manos", "Glúteos", "Isquiotibiales", "Gemelos", 
    "Cuádriceps", "Aductores", "Pies", "Zona lumbar"
  ];

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    const [fs, evs] = await Promise.all([
      sb(`fichas_masoterapia?masoterapeuta_id=eq.${usuario.id}&order=created_at.desc&limit=50`, {}, usuario?.token),
      sb("equipos_evento?estado=eq.activo&tipo_masoterapia=eq.Específico&order=created_at.desc", {}, usuario?.token)
    ]);
    if (fs) setFichas(fs);
    if (evs) setEventos(evs);
    setLoading(false);
  };

  const abrirNuevaFicha = () => {
    setForm({
      paciente_nombre: "",
      paciente_edad: "",
      evento: eventos.length > 0 ? eventos[0].nombre_evento : "",
      zonas_trabajadas: [],
      dolor_inicial: 5,
      dolor_posterior: 5,
      duracion_minutos: 30,
      observaciones: ""
    });
    setModal("nueva");
  };

  const toggleZona = (zona) => {
    const zonas = form.zonas_trabajadas || [];
    if (zonas.includes(zona)) {
      setForm(f => ({ ...f, zonas_trabajadas: zonas.filter(z => z !== zona) }));
    } else {
      setForm(f => ({ ...f, zonas_trabajadas: [...zonas, zona] }));
    }
  };

  const guardarFicha = async () => {
    if (!form.paciente_nombre || !form.evento) {
      alert("Por favor completa al menos el nombre del paciente y el evento");
      return;
    }

    if (!form.zonas_trabajadas || form.zonas_trabajadas.length === 0) {
      alert("Selecciona al menos una zona trabajada");
      return;
    }

    const datos = {
      evento: form.evento,
      evento_id: form.evento_id || null,
      masoterapeuta_id: usuario.id,
      masoterapeuta_nombre: usuario.nombre || usuario.email,
      paciente_nombre: form.paciente_nombre,
      paciente_edad: form.paciente_edad ? parseInt(form.paciente_edad) : null,
      fecha_atencion: new Date().toISOString().split('T')[0],
      duracion_minutos: parseInt(form.duracion_minutos) || 30,
      zonas_trabajadas: form.zonas_trabajadas,
      dolor_inicial: parseInt(form.dolor_inicial) || 5,
      dolor_posterior: parseInt(form.dolor_posterior) || 5,
      observaciones: form.observaciones || null
    };

    const res = await sb("fichas_masoterapia", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setFichas(prev => [res[0], ...prev]);
      setModal(null);
      alert("Ficha registrada exitosamente");
    }
  };

  const verDetalleFicha = (ficha) => {
    setForm(ficha);
    setModal("detalle");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando fichas...</div>;

  if (eventos.length === 0) {
    return (
      <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No hay eventos específicos activos</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Los eventos deben estar configurados con tipo de masoterapia "Específico"
        </div>
      </div>
    );
  }

  const hoy = new Date().toISOString().split('T')[0];
  const fichasHoy = fichas.filter(f => {
    const fecha = new Date(f.created_at).toISOString().split('T')[0];
    return fecha === hoy;
  });

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Masoterapia Específica</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {fichasHoy.length} fichas hoy · {fichas.length} fichas totales
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevaFicha}>
            + Nueva Ficha
          </button>
        </div>
      </div>

      {fichasHoy.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: C.blue, marginBottom: 12 }}>Fichas de Hoy</div>
          {fichasHoy.map(ficha => (
            <div key={ficha.id} style={{ 
              padding: 16, 
              border: `1px solid ${C.border}`, 
              borderRadius: 8, 
              marginBottom: 12,
              background: C.surface,
              cursor: "pointer"
            }} onClick={() => verDetalleFicha(ficha)}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {ficha.paciente_nombre}
                {ficha.paciente_edad && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({ficha.paciente_edad} años)</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                {new Date(ficha.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · 
                {ficha.evento} · {ficha.duracion_minutos} min
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Zonas:</strong> {ficha.zonas_trabajadas?.join(", ") || "N/A"}
              </div>
              <div style={{ fontSize: 13 }}>
                <strong>Dolor:</strong> {ficha.dolor_inicial}/10 → {ficha.dolor_posterior}/10
                {ficha.dolor_posterior < ficha.dolor_inicial && (
                  <span style={{ marginLeft: 8, color: C.green }}>✓ Mejoró</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {fichas.filter(f => {
        const fecha = new Date(f.created_at).toISOString().split('T')[0];
        return fecha !== hoy;
      }).length > 0 && (
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Fichas Anteriores</div>
          {fichas.filter(f => {
            const fecha = new Date(f.created_at).toISOString().split('T')[0];
            return fecha !== hoy;
          }).slice(0, 10).map(ficha => (
            <div key={ficha.id} style={{ 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 6, 
              marginBottom: 8,
              cursor: "pointer",
              opacity: 0.7
            }} onClick={() => verDetalleFicha(ficha)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ficha.paciente_nombre}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {new Date(ficha.created_at).toLocaleDateString('es-CL')} · {ficha.evento}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "nueva" && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Nueva Ficha de Masoterapia</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Nombre del Paciente *</label>
                <input 
                  style={S.input} 
                  value={form.paciente_nombre || ""} 
                  onChange={e => setForm(f => ({ ...f, paciente_nombre: e.target.value }))} 
                  placeholder="Nombre del deportista"
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Edad</label>
                <input 
                  style={S.input} 
                  type="number"
                  value={form.paciente_edad || ""} 
                  onChange={e => setForm(f => ({ ...f, paciente_edad: e.target.value }))} 
                  placeholder="35"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Evento *</label>
                <select 
                  style={{ ...S.select, width: "100%" }} 
                  value={form.evento || ""} 
                  onChange={e => {
                    const ev = eventos.find(ev => ev.nombre_evento === e.target.value);
                    setForm(f => ({ ...f, evento: e.target.value, evento_id: ev ? ev.id : null }));
                  }}
                >
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.nombre_evento}>{ev.nombre_evento}</option>
                  ))}
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Duración (min)</label>
                <input 
                  style={S.input} 
                  type="number"
                  value={form.duracion_minutos || 30} 
                  onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))} 
                  placeholder="30"
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ ...S.formLabel, marginBottom: 12, display: "block" }}>Zonas Trabajadas *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {zonasDisponibles.map(zona => (
                  <label key={zona} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6, 
                    padding: "8px 12px", 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 6,
                    cursor: "pointer",
                    background: (form.zonas_trabajadas || []).includes(zona) ? C.blueDim : "transparent",
                    fontSize: 13
                  }}>
                    <input 
                      type="checkbox" 
                      checked={(form.zonas_trabajadas || []).includes(zona)}
                      onChange={() => toggleZona(zona)}
                    />
                    <span>{zona}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Dolor Inicial (1-10)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input 
                    style={{ ...S.input, flex: 1 }}
                    type="range"
                    min="1"
                    max="10"
                    value={form.dolor_inicial || 5} 
                    onChange={e => setForm(f => ({ ...f, dolor_inicial: e.target.value }))} 
                  />
                  <span style={{ fontSize: 20, fontWeight: 700, width: 40, textAlign: "center" }}>
                    {form.dolor_inicial || 5}
                  </span>
                </div>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Dolor Final (1-10)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input 
                    style={{ ...S.input, flex: 1 }}
                    type="range"
                    min="1"
                    max="10"
                    value={form.dolor_posterior || 5} 
                    onChange={e => setForm(f => ({ ...f, dolor_posterior: e.target.value }))} 
                  />
                  <span style={{ fontSize: 20, fontWeight: 700, width: 40, textAlign: "center" }}>
                    {form.dolor_posterior || 5}
                  </span>
                </div>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Observaciones</label>
              <textarea 
                style={{ ...S.input, minHeight: 80 }} 
                value={form.observaciones || ""} 
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} 
                placeholder="Observaciones sobre la sesión, reacciones del paciente, etc."
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={guardarFicha}>Guardar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {modal === "detalle" && form && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Detalle de Ficha</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{form.paciente_nombre}</div>
              {form.paciente_edad && <div style={{ fontSize: 13, color: C.textMuted }}>Edad: {form.paciente_edad} años</div>}
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                Evento: {form.evento} · {new Date(form.created_at).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Duración: {form.duracion_minutos} minutos
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Zonas Trabajadas:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(form.zonas_trabajadas || []).map(zona => (
                  <span key={zona} style={{ 
                    ...S.badge(C.blue, C.blueDim), 
                    fontSize: 12 
                  }}>
                    {zona}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Dolor:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor Inicial</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{form.dolor_inicial}/10</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Dolor Final</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{form.dolor_posterior}/10</div>
                </div>
              </div>
              {form.dolor_posterior < form.dolor_inicial && (
                <div style={{ marginTop: 12, padding: 12, background: C.greenDim, borderRadius: 6, textAlign: "center" }}>
                  <span style={{ color: C.green, fontWeight: 600 }}>
                    ✓ Mejoría de {form.dolor_inicial - form.dolor_posterior} puntos
                  </span>
                </div>
              )}
            </div>

            {form.observaciones && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Observaciones:</div>
                <div style={{ fontSize: 14 }}>{form.observaciones}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: REPORTES COMPLETOS (Con costos y exportación)
// Reemplazar el componente VistaReportes existente
// ═══════════════════════════════════════════════════════════════════════════

function VistaReportes({ usuario, esAdmin }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [loading, setLoading] = useState(true);
  const [datosReporte, setDatosReporte] = useState(null);
  const [modal, setModal] = useState(null);
  const [busquedaRut, setBusquedaRut] = useState("");
  const [historialBusqueda, setHistorialBusqueda] = useState(null);
  const [buscandoRut, setBuscandoRut] = useState(false);

  const buscarPaciente = async (rut) => {
    if (!rut || rut.length < 4) { setHistorialBusqueda(null); return; }
    setBuscandoRut(true);
    const [kine, med, maso] = await Promise.all([
      sb(`atenciones_kinesiologia?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_medicas?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_masoterapia_masiva?paciente_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc`, {}, usuario?.token),
    ]);
    const historial = [
      ...(kine || []).map(a => ({ ...a, tipo: "Kinesiología", profesional: a.kinesiologo_nombre })),
      ...(med || []).map(a => ({ ...a, tipo: "Médica", profesional: a.medico_nombre })),
      ...(maso || []).map(a => ({ ...a, tipo: "Masoterapia", profesional: a.masoterapeuta_nombre })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistorialBusqueda(historial);
    setBuscandoRut(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  useEffect(() => {
    if (eventoSeleccionado) {
      generarReporte();
    }
  }, [eventoSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    const evs = await sb("equipos_evento?order=created_at.desc", {}, usuario?.token);
    if (evs) {
      setEventos(evs);
      if (evs.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(String(evs[0].id));
      }
    }
    setLoading(false);
  };

  const generarReporte = async () => {
    if (!eventoSeleccionado) return;

    setLoading(true);

    // Cargar todas las atenciones del evento
    const [
      atencionesKine,
      atencionesMed,
      adminMed,
      masoterapiaMasiva,
      fichasMasoterapia
    ] = await Promise.all([
      sb(`atenciones_kinesiologia?evento_id=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`atenciones_medicas?evento_id=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`administracion_medicamentos?order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_masoterapia_masiva?evento_id=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`fichas_masoterapia?evento_id=eq.${eventoSeleccionado}`, {}, usuario?.token)
    ]);

    // Cargar costos (solo si es admin)
    let costos = [];
    if (esAdmin) {
      costos = await sb("costos_insumos", {}, usuario?.token) || [];
    }

    // Calcular totales
    const totalKine = atencionesKine?.length || 0;
    const totalMedicas = atencionesMed?.length || 0;
    const totalMasajes = masoterapiaMasiva?.reduce((sum, m) => sum + (m.masajes_realizados || 0), 0) || 0;
    const totalFichasMasoterapia = fichasMasoterapia?.length || 0;

    // Desglose por profesional
    const desgloseKine = {};
    atencionesKine?.forEach(a => {
      const nombre = a.kinesiologo_nombre || "Sin nombre";
      desgloseKine[nombre] = (desgloseKine[nombre] || 0) + 1;
    });

    const desgloseMedico = {};
    atencionesMed?.forEach(a => {
      const nombre = a.medico_nombre || "Sin nombre";
      desgloseMedico[nombre] = (desgloseMedico[nombre] || 0) + 1;
    });

    const desgloseMasoterapeuta = {};
    masoterapiaMasiva?.forEach(a => {
      const nombre = a.masoterapeuta_nombre || "Sin nombre";
      desgloseMasoterapeuta[nombre] = (desgloseMasoterapeuta[nombre] || 0) + 1;
    });
    fichasMasoterapia?.forEach(a => {
      const nombre = a.masoterapeuta_nombre || "Sin nombre";
      desgloseMasoterapeuta[nombre] = (desgloseMasoterapeuta[nombre] || 0) + 1;
    });

    // Calcular medicamentos
    const medicamentosUsados = {};
    atencionesMed?.forEach(atencion => {
      atencion.medicamentos_prescritos?.forEach(med => {
        const key = med.nombre;
        if (!medicamentosUsados[key]) {
          medicamentosUsados[key] = { nombre: med.nombre, cantidad: 0, via: med.via };
        }
        medicamentosUsados[key].cantidad += med.cantidad || 1;
      });
    });

    // Calcular insumos
    const insumosUsados = {};
    
    // Insumos de atenciones médicas
    atencionesMed?.forEach(atencion => {
      atencion.insumos_medico?.forEach(ins => {
        const key = ins.nombre;
        if (!insumosUsados[key]) {
          insumosUsados[key] = { nombre: ins.nombre, cantidad: 0, unidad: ins.unidad || "unid." };
        }
        insumosUsados[key].cantidad += parseFloat(ins.cantidad) || 0;
      });
    });

    // Insumos de administración
    adminMed?.forEach(admin => {
      admin.insumos_administracion?.forEach(ins => {
        const key = ins.nombre;
        if (!insumosUsados[key]) {
          insumosUsados[key] = { nombre: ins.nombre, cantidad: 0, unidad: ins.unidad || "unid." };
        }
        insumosUsados[key].cantidad += parseFloat(ins.cantidad) || 0;
      });
    });

    // Insumos de kinesiología
    atencionesKine?.forEach(atencion => {
      atencion.insumos_usados?.forEach(ins => {
        const key = ins.nombre;
        if (!insumosUsados[key]) {
          insumosUsados[key] = { nombre: ins.nombre, cantidad: 0, unidad: ins.unidad || "unid." };
        }
        insumosUsados[key].cantidad += parseFloat(ins.cantidad) || 0;
      });
    });

    // Calcular costos (solo para admins)
    let costoTotal = 0;
    if (esAdmin && costos.length > 0) {
      Object.values(insumosUsados).forEach(insumo => {
        const costoDB = costos.find(c => c.nombre_insumo === insumo.nombre);
        if (costoDB) {
          costoTotal += (costoDB.costo_unitario || 0) * insumo.cantidad;
        }
      });

      Object.values(medicamentosUsados).forEach(med => {
        const costoDB = costos.find(c => c.nombre_insumo === med.nombre);
        if (costoDB) {
          costoTotal += (costoDB.costo_unitario || 0) * med.cantidad;
        }
      });
    }

    setDatosReporte({
      evento: eventoSeleccionado,
      totalKine,
      totalMedicas,
      totalMasajes,
      totalFichasMasoterapia,
      desgloseKine,
      desgloseMedico,
      desgloseMasoterapeuta,
      medicamentosUsados: Object.values(medicamentosUsados),
      insumosUsados: Object.values(insumosUsados),
      costoTotal: esAdmin ? costoTotal : null,
      atencionesKine,
      atencionesMed,
      masoterapiaMasiva,
      fichasMasoterapia
    });

    setLoading(false);
  };

  const exportarPDF = () => {
    if (!datosReporte) return;

    const eventoNombre = eventos.find(e => String(e.id) === eventoSeleccionado)?.nombre_evento || eventoSeleccionado;
    const fecha = new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });

    const desgloseKineHTML = Object.entries(datosReporte.desgloseKine || {}).map(([nombre, total]) =>
      `<tr><td>${nombre}</td><td>${total} atenciones</td></tr>`
    ).join("");

    const desgloseMedicoHTML = Object.entries(datosReporte.desgloseMedico || {}).map(([nombre, total]) =>
      `<tr><td>${nombre}</td><td>${total} atenciones</td></tr>`
    ).join("");

    const desgloseMasoHTML = Object.entries(datosReporte.desgloseMasoterapeuta || {}).map(([nombre, total]) =>
      `<tr><td>${nombre}</td><td>${total} atenciones</td></tr>`
    ).join("");

    const medicamentosHTML = datosReporte.medicamentosUsados.map(m =>
      `<tr><td>${m.nombre}</td><td>${m.cantidad}</td><td>${m.via || "-"}</td></tr>`
    ).join("");

    const insumosHTML = datosReporte.insumosUsados.map(i =>
      `<tr><td>${i.nombre}</td><td>${i.cantidad}</td><td>${i.unidad}</td></tr>`
    ).join("");

    const atencionesKineHTML = (datosReporte.atencionesKine || []).map(a =>
      `<tr>
        <td>${a.paciente_nombre}</td>
        <td>${a.paciente_rut || "-"}</td>
        <td>${a.motivo_consulta}</td>
        <td>${a.tratamiento_realizado || "-"}</td>
        <td>${a.kinesiologo_nombre}</td>
        <td>${new Date(a.created_at).toLocaleDateString("es-CL")}</td>
      </tr>`
    ).join("");

    const atencionesMedHTML = (datosReporte.atencionesMed || []).map(a =>
      `<tr>
        <td>${a.paciente_nombre}</td>
        <td>${a.paciente_rut || "-"}</td>
        <td>${a.motivo_consulta}</td>
        <td>${a.diagnostico || "-"}</td>
        <td>${a.medico_nombre}</td>
        <td>${new Date(a.created_at).toLocaleDateString("es-CL")}</td>
      </tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte - ${eventoNombre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1e293b; font-size: 13px; }
    .header { background: linear-gradient(135deg, #002850, #148C8C); color: white; padding: 28px 32px; }
    .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
    .body { padding: 24px 32px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #002850; border-bottom: 2px solid #148C8C; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .summary-card { background: #f1f5f9; border-left: 3px solid #148C8C; padding: 12px; border-radius: 6px; }
    .summary-card .num { font-size: 28px; font-weight: 800; color: #002850; }
    .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:last-child td { border-bottom: none; }
    .desglose-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .cost-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; text-align: center; }
    .cost-box .amount { font-size: 28px; font-weight: 800; color: #15803d; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚕️ TRIAGE360 — Reporte de Evento</h1>
    <p>${eventoNombre} &nbsp;·&nbsp; Generado el ${fecha}</p>
  </div>
  <div class="body">

    <div class="section">
      <div class="section-title">📊 Resumen General</div>
      <div class="summary-grid">
        <div class="summary-card"><div class="num">${datosReporte.totalKine}</div><div class="label">Kinesiología</div></div>
        <div class="summary-card"><div class="num">${datosReporte.totalMedicas}</div><div class="label">Atenciones Médicas</div></div>
        <div class="summary-card"><div class="num">${datosReporte.totalMasajes}</div><div class="label">Masajes Masivos</div></div>
        <div class="summary-card"><div class="num">${datosReporte.totalFichasMasoterapia}</div><div class="label">Fichas Masoterapia</div></div>
      </div>
    </div>

    ${(desgloseKineHTML || desgloseMedicoHTML || desgloseMasoHTML) ? `
    <div class="section">
      <div class="section-title">👨‍⚕️ Desglose por Profesional</div>
      <div class="desglose-grid">
        ${desgloseKineHTML ? `<div><strong style="color:#148C8C">🦴 Kinesiología</strong><table style="margin-top:8px">${desgloseKineHTML}</table></div>` : ""}
        ${desgloseMedicoHTML ? `<div><strong style="color:#148C8C">🩺 Médicos</strong><table style="margin-top:8px">${desgloseMedicoHTML}</table></div>` : ""}
        ${desgloseMasoHTML ? `<div><strong style="color:#148C8C">💆 Masoterapeutas</strong><table style="margin-top:8px">${desgloseMasoHTML}</table></div>` : ""}
      </div>
    </div>` : ""}

    ${atencionesKineHTML ? `
    <div class="section">
      <div class="section-title">🦴 Atenciones de Kinesiología</div>
      <table>
        <thead><tr><th>Paciente</th><th>RUT</th><th>Motivo</th><th>Tratamiento</th><th>Profesional</th><th>Fecha</th></tr></thead>
        <tbody>${atencionesKineHTML}</tbody>
      </table>
    </div>` : ""}

    ${atencionesMedHTML ? `
    <div class="section">
      <div class="section-title">🩺 Atenciones Médicas</div>
      <table>
        <thead><tr><th>Paciente</th><th>RUT</th><th>Motivo</th><th>Diagnóstico</th><th>Médico</th><th>Fecha</th></tr></thead>
        <tbody>${atencionesMedHTML}</tbody>
      </table>
    </div>` : ""}

    ${medicamentosHTML ? `
    <div class="section">
      <div class="section-title">💊 Medicamentos Prescritos</div>
      <table>
        <thead><tr><th>Medicamento</th><th>Cantidad</th><th>Vía</th></tr></thead>
        <tbody>${medicamentosHTML}</tbody>
      </table>
    </div>` : ""}

    ${insumosHTML ? `
    <div class="section">
      <div class="section-title">📦 Insumos Utilizados</div>
      <table>
        <thead><tr><th>Insumo</th><th>Cantidad</th><th>Unidad</th></tr></thead>
        <tbody>${insumosHTML}</tbody>
      </table>
    </div>` : ""}

    ${esAdmin && datosReporte.costoTotal !== null ? `
    <div class="section">
      <div class="section-title">💰 Costo Total del Evento</div>
      <div class="cost-box">
        <div class="amount">$${datosReporte.costoTotal.toLocaleString("es-CL")} CLP</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">Basado en costos registrados en el sistema</div>
      </div>
    </div>` : ""}

    <div class="footer">
      <p>TRIAGE360 · Gestión Clínica Inteligente · Powered by SGTRUMAO SPA</p>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const ventana = window.open("", "_blank");
    ventana.document.write(html);
    ventana.document.close();
  };

  const exportarExcel = () => {
    if (!datosReporte) return;

    let csv = "REPORTE DE EVENTO - " + datosReporte.evento + "\n\n";
    
    csv += "RESUMEN GENERAL\n";
    csv += "Atenciones Kinesiología," + datosReporte.totalKine + "\n";
    csv += "Atenciones Médicas," + datosReporte.totalMedicas + "\n";
    csv += "Masajes (Masivos)," + datosReporte.totalMasajes + "\n";
    csv += "Fichas Masoterapia (Específicas)," + datosReporte.totalFichasMasoterapia + "\n\n";

    csv += "MEDICAMENTOS PRESCRITOS\n";
    csv += "Nombre,Cantidad,Vía\n";
    datosReporte.medicamentosUsados.forEach(med => {
      csv += `${med.nombre},${med.cantidad},${med.via}\n`;
    });
    csv += "\n";

    csv += "INSUMOS UTILIZADOS\n";
    csv += "Nombre,Cantidad,Unidad\n";
    datosReporte.insumosUsados.forEach(ins => {
      csv += `${ins.nombre},${ins.cantidad},${ins.unidad}\n`;
    });
    csv += "\n";

    if (esAdmin && datosReporte.costoTotal !== null) {
      csv += "COSTO TOTAL,$" + datosReporte.costoTotal.toLocaleString('es-CL') + "\n";
    }

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${datosReporte.evento.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cerrarEvento = async () => {
    const eventoObj = eventos.find(e => String(e.id) === eventoSeleccionado);
    if (!eventoObj) return;

    const confirmar = confirm(
      `¿Estás seguro de cerrar el evento "${eventoSeleccionado}"?\n\n` +
      `Una vez cerrado:\n` +
      `- No se podrán agregar más atenciones\n` +
      `- Los datos quedarán bloqueados\n` +
      `- Se generará un reporte automático\n\n` +
      `Esta acción NO se puede deshacer.`
    );

    if (!confirmar) return;

    const res = await sb(`equipos_evento?id=eq.${eventoObj.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        estado: "cerrado",
        fecha_cierre: new Date().toISOString(),
        cerrado_por: usuario.id
      })
    }, usuario?.token);
    if (res) {
      // Enviar email con reporte del evento
      try {
        const stats = {
          total_atenciones: (datosReporte?.totalMedicas || 0) + (datosReporte?.totalKine || 0) + (datosReporte?.totalMasajes || 0) + (datosReporte?.totalFichasMasoterapia || 0),
          total_profesionales: new Set([...(datosReporte?.atencionesMedicas || []).map(a => a.medico), ...(datosReporte?.atencionesKine || []).map(a => a.kinesiologo)]).size,
          por_profesional: Object.values([...(datosReporte?.atencionesMedicas || []).map(a => ({medico: a.medico, rol: 'Médico'})), ...(datosReporte?.atencionesKine || []).map(a => ({medico: a.kinesiologo, rol: 'Kinesiólogo'}))].reduce((acc, {medico, rol}) => { if (!acc[medico]) acc[medico] = {nombre: medico, rol, atenciones: 0}; acc[medico].atenciones++; return acc; }, {}))
        };
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "reporte_evento",
            data: {
              evento: eventoSeleccionado,
              fecha_cierre: new Date().toISOString(),
              stats: stats
            }
          })
        });
      } catch (error) {
        console.error("Error al enviar email:", error);
      }
      alert("Evento cerrado exitosamente. Se ha enviado el reporte por email.");
      cargarDatos();
    }
  };

  if (loading && !datosReporte) {
    return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando reportes...</div>;
  }

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Reportes de Eventos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              Resumen detallado de atenciones y costos
            </div>
          </div>
          {datosReporte && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={exportarExcel}>
                📊 Exportar Excel
              </button>
              <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={exportarPDF}>
                📄 Exportar PDF
              </button>
              {esAdmin && eventos.find(e => e.nombre_evento === eventoSeleccionado)?.estado === "activo" && (
                <button 
                  style={{ ...S.btn("ghost"), fontSize: 12, color: C.red, borderColor: C.red }} 
                  onClick={cerrarEvento}
                >
                  🔒 Cerrar Evento
                </button>
              )}
            </div>
          )}
        </div>

        {esAdmin && (
          <div style={{ ...S.card, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>🔍 Historial de Paciente por RUT</div>
            <input
              style={{ ...S.input, width: "100%", marginBottom: 12 }}
              value={busquedaRut}
              onChange={e => { setBusquedaRut(e.target.value); buscarPaciente(e.target.value); }}
              placeholder="Ingresa RUT del paciente (ej: 12.345.678-9)"
            />
            {buscandoRut && <div style={{ fontSize: 13, color: "#64B4B4" }}>🔍 Buscando...</div>}
            {historialBusqueda !== null && !buscandoRut && (
              historialBusqueda.length === 0 ? (
                <div style={{ fontSize: 13, color: C.textMuted }}>No se encontraron atenciones para este RUT.</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4caf50", marginBottom: 10 }}>
                    👤 {historialBusqueda[0]?.paciente_nombre} · {historialBusqueda.length} atenciones en total
                  </div>
                  {historialBusqueda.map((h, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: C.surface2, borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>
                          {h.tipo === "Kinesiología" ? "🦴" : h.tipo === "Médica" ? "🩺" : "💆"} {h.tipo}
                        </span>
                        <span style={{ fontSize: 12, color: C.textMuted }}>{new Date(h.created_at).toLocaleDateString("es-CL")}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 2 }}>📍 {h.evento}</div>
                      <div style={{ fontSize: 13 }}>{h.motivo_consulta || h.diagnostico || h.tipo_masaje}</div>
                      <div style={{ fontSize: 11, color: "#64B4B4", marginTop: 4 }}>👨‍⚕️ {h.profesional}</div>
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
            Selecciona un Evento:
          </label>
          <select 
            style={{ ...S.select, width: "100%" }}
            value={eventoSeleccionado}
            onChange={e => setEventoSeleccionado(e.target.value)}
          >
            {eventos.map(ev => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.nombre_evento} - {ev.estado === "cerrado" ? "🔒 CERRADO" : "✅ Activo"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {datosReporte && (
        <>
          <div style={{ ...S.card, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>📊 Resumen General</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Kinesiología</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{datosReporte.totalKine}</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Atenciones Médicas</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{datosReporte.totalMedicas}</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Masajes Masivos</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{datosReporte.totalMasajes}</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, background: C.surface2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Fichas Masoterapia</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{datosReporte.totalFichasMasoterapia}</div>
              </div>
            </div>
          </div>

          {/* Desglose por profesional */}
          {(Object.keys(datosReporte.desgloseKine || {}).length > 0 || Object.keys(datosReporte.desgloseMedico || {}).length > 0 || Object.keys(datosReporte.desgloseMasoterapeuta || {}).length > 0) && (
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>👨‍⚕️ Desglose por Profesional</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {Object.keys(datosReporte.desgloseKine || {}).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>🦴 Kinesiología</div>
                    {Object.entries(datosReporte.desgloseKine).map(([nombre, total]) => (
                      <div key={nombre} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.surface2, borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{nombre}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{total} atenciones</span>
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(datosReporte.desgloseMedico || {}).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>🩺 Médicos</div>
                    {Object.entries(datosReporte.desgloseMedico).map(([nombre, total]) => (
                      <div key={nombre} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.surface2, borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{nombre}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{total} atenciones</span>
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(datosReporte.desgloseMasoterapeuta || {}).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>💆 Masoterapeutas</div>
                    {Object.entries(datosReporte.desgloseMasoterapeuta).map(([nombre, total]) => (
                      <div key={nombre} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.surface2, borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{nombre}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{total} atenciones</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {datosReporte.medicamentosUsados.length > 0 && (
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>💊 Medicamentos Prescritos</div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {datosReporte.medicamentosUsados.map((med, i) => (
                  <div key={i} style={{ 
                    padding: 12, 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 6, 
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{med.nombre}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>Vía: {med.via}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>
                      {med.cantidad}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {datosReporte.insumosUsados.length > 0 && (
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🎒 Insumos Utilizados</div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {datosReporte.insumosUsados.map((ins, i) => (
                  <div key={i} style={{ 
                    padding: 12, 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 6, 
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ins.nombre}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>
                      {ins.cantidad} {ins.unidad}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {esAdmin && datosReporte.costoTotal !== null && (
            <div style={{ ...S.card, border: `2px solid ${C.blue}` }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>💰 Costo Total del Evento</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>
                * Basado en costos registrados en el sistema. Insumos sin costo registrado no se incluyen.
              </div>
              <div style={{ textAlign: "center", padding: 24, background: C.blueDim, borderRadius: 8 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: C.blue }}>
                  ${datosReporte.costoTotal.toLocaleString('es-CL')}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>CLP</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: GESTIÓN DE COSTOS DE INSUMOS (Solo Administradores)
// Agregar después de VistaReportes
// ═══════════════════════════════════════════════════════════════════════════

function VistaGestionCostos({ usuario }) {
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    cargarCostos();
  }, [usuario]);

  const cargarCostos = async () => {
    setLoading(true);
    const res = await sb("costos_insumos?order=nombre_insumo", {}, usuario?.token);
    if (res) setCostos(res);
    setLoading(false);
  };

  const abrirNuevoCosto = () => {
    setForm({
      nombre_insumo: "",
      costo_unitario: "",
      categoria: "General",
      unidad: "unid.",
      proveedor: ""
    });
    setModal("nuevo");
  };

  const guardarCosto = async () => {
    if (!form.nombre_insumo || !form.costo_unitario) {
      alert("Completa al menos el nombre y costo del insumo");
      return;
    }

    const datos = {
      nombre_insumo: form.nombre_insumo,
      costo_unitario: parseFloat(form.costo_unitario),
      categoria: form.categoria || "General",
      unidad: form.unidad || "unid.",
      proveedor: form.proveedor || null
    };

    const res = await sb("costos_insumos", {
      method: "POST",
      body: JSON.stringify(datos)
    }, usuario?.token);

    if (res) {
      setCostos(prev => [...prev, res[0]].sort((a, b) => a.nombre_insumo.localeCompare(b.nombre_insumo)));
      setModal(null);
      alert("Costo registrado exitosamente");
    }
  };

  const editarCosto = (costo) => {
    setForm(costo);
    setModal("editar");
  };

  const actualizarCosto = async () => {
    if (!form.nombre_insumo || !form.costo_unitario) {
      alert("Completa al menos el nombre y costo del insumo");
      return;
    }

    const res = await sb(`costos_insumos?id=eq.${form.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nombre_insumo: form.nombre_insumo,
        costo_unitario: parseFloat(form.costo_unitario),
        categoria: form.categoria || "General",
        unidad: form.unidad || "unid.",
        proveedor: form.proveedor || null
      })
    }, usuario?.token);

    if (res) {
      setCostos(prev => prev.map(c => c.id === form.id ? res[0] : c));
      setModal(null);
      alert("Costo actualizado exitosamente");
    }
  };

  const eliminarCosto = async (costo) => {
    const confirmar = confirm(`¿Eliminar el costo de "${costo.nombre_insumo}"?`);
    if (!confirmar) return;

    const res = await sb(`costos_insumos?id=eq.${costo.id}`, {
      method: "DELETE"
    }, usuario?.token);

    if (res !== null) {
      setCostos(prev => prev.filter(c => c.id !== costo.id));
      alert("Costo eliminado");
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Cargando costos...</div>;
  }

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>Gestión de Costos de Insumos</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {costos.length} insumos con costo registrado
            </div>
          </div>
          <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={abrirNuevoCosto}>
            + Nuevo Costo
          </button>
        </div>
      </div>

      {costos.length === 0 ? (
        <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No hay costos registrados</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            Agrega costos para que aparezcan en los reportes
          </div>
          <button style={S.btn("primary")} onClick={abrirNuevoCosto}>
            + Agregar Primer Costo
          </button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 12, padding: 12, background: C.surface2, borderRadius: 6, marginBottom: 12, fontSize: 12, fontWeight: 700 }}>
            <div>Insumo</div>
            <div>Costo Unitario</div>
            <div>Categoría</div>
            <div>Proveedor</div>
            <div></div>
          </div>
          {costos.map(costo => (
            <div key={costo.id} style={{ 
              display: "grid", 
              gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", 
              gap: 12, 
              padding: 12, 
              border: `1px solid ${C.border}`, 
              borderRadius: 6, 
              marginBottom: 8,
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{costo.nombre_insumo}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{costo.unidad}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>
                ${costo.costo_unitario?.toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: 13 }}>{costo.categoria}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{costo.proveedor || "-"}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button 
                  style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 8px" }}
                  onClick={() => editarCosto(costo)}
                >
                  ✏️
                </button>
                <button 
                  style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 8px", color: C.red }}
                  onClick={() => eliminarCosto(costo)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "nuevo" || modal === "editar") && (
        <div style={S.modal} onClick={() => setModal(null)}>
          <div style={{ ...S.modalBox, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {modal === "nuevo" ? "Nuevo Costo de Insumo" : "Editar Costo"}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Nombre del Insumo *</label>
              <input 
                style={S.input} 
                value={form.nombre_insumo || ""} 
                onChange={e => setForm(f => ({ ...f, nombre_insumo: e.target.value }))} 
                placeholder="Ej: Suero fisiológico 500ml"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={S.formRow}>
                <label style={S.formLabel}>Costo Unitario (CLP) *</label>
                <input 
                  style={S.input} 
                  type="number"
                  value={form.costo_unitario || ""} 
                  onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))} 
                  placeholder="1500"
                />
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Unidad</label>
                <select 
                  style={S.select}
                  value={form.unidad || "unid."}
                  onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                >
                  <option>unid.</option>
                  <option>ml</option>
                  <option>mg</option>
                  <option>amp.</option>
                  <option>litros</option>
                  <option>kg</option>
                </select>
              </div>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Categoría</label>
              <select 
                style={S.select}
                value={form.categoria || "General"}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              >
                <option>General</option>
                <option>Medicamentos</option>
                <option>Insumos Médicos</option>
                <option>Kinesiología</option>
                <option>Masoterapia</option>
              </select>
            </div>

            <div style={S.formRow}>
              <label style={S.formLabel}>Proveedor</label>
              <input 
                style={S.input} 
                value={form.proveedor || ""} 
                onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} 
                placeholder="Nombre del proveedor"
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={S.btn("ghost")} onClick={() => setModal(null)}>Cancelar</button>
              <button 
                style={S.btn("primary")} 
                onClick={modal === "nuevo" ? guardarCosto : actualizarCosto}
              >
                {modal === "nuevo" ? "Guardar" : "Actualizar"}
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

      {/* Banner alerta stock en tiempo real */}
      {stockBajo.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #3a1a00, #5a2a00)",
          border: "1px solid #ff6b00",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          animation: "pulse 2s infinite"
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ff9944", marginBottom: 10 }}>
            🚨 Stock bajo mínimo — {stockBajo.length} insumo{stockBajo.length > 1 ? "s" : ""} requieren reposición
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stockBajo.map((i, idx) => (
              <div key={idx} style={{ background: "rgba(255,107,0,0.15)", border: "1px solid #ff6b0055", borderRadius: 6, padding: "6px 12px", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#ffaa55" }}>{i.nombre}</span>
                <span style={{ color: "#ff6b00", marginLeft: 6 }}>
                  {i.stock} / {i.minimo} {i.unidad || ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
  "Kinesiólogo/a":   { recetarMedicamentos: false, verInventario: false, modificarStock: false, verBolso: false, verBolsoKine: false  },
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
    const res = await sb(`perfiles?user_id=eq.${editando}`, {
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
      const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${userId}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
      });
      const perfiles = await perfilRes.json();
      const perfil = perfiles?.[0] || {};
      onLogin({
        token,
        id: perfil.id,
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

// ============================================
// VISTA CARROS CLÍNICOS DB
// ============================================
function VistaCarrosClinicosDB({ usuario }) {
console.log("VistaCarrosClinicosDB renderizado, usuario:", usuario);
  const [carros, setCarros] = useState([]);
  const [carroSel, setCarroSel] = useState(null);
  const [cajonAbierto, setCajonAbierto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [carrosPermitidos, setCarrosPermitidos] = useState([]);

  const esAdmin = usuario?.rol === 'admin';

  const cargarCarros = async () => {
    console.log("cargarCarros ejecutándose...");
    
    // Si es admin, cargar todos los carros
    if (esAdmin) {
      const data = await sb('contenedores_medicamentos?tipo=eq.carro&select=*', {}, usuario?.token);
      console.log("DEBUG Carros (Admin):", data);
      if (data) {
        setCarros(data);
        setCarrosPermitidos(['Carro 1', 'Carro 2', 'Carro 3', 'Carro 4', 'Carro 5', 'Carro 6', 'Carro 7']);
        if (data.length > 0 && !carroSel) setCarroSel(data[0].nombre);
      }
    } else {
      // Si es profesional, obtener eventos donde está asignado
      const eventos = await sb('equipos_evento?estado=eq.activo', {}, usuario?.token);
      console.log("DEBUG Eventos activos:", eventos);
      
      let carrosAsignados = [];
      if (eventos) {
        eventos.forEach(evento => {
          // Verificar si el usuario está en alguna lista de profesionales
          const estaAsignado = 
            (evento.medicos || []).includes(usuario.id) ||
            (evento.enfermeros || []).includes(usuario.id) ||
            (evento.paramedicos || []).includes(usuario.id);
          
          if (estaAsignado && evento.carros_asignados) {
            carrosAsignados = [...carrosAsignados, ...evento.carros_asignados];
          }
        });
      }
      
      // Eliminar duplicados
      carrosAsignados = [...new Set(carrosAsignados)];
      console.log("DEBUG Carros asignados al usuario:", carrosAsignados);
      setCarrosPermitidos(carrosAsignados);
      
      // Cargar solo los carros asignados
      if (carrosAsignados.length > 0) {
        const data = await sb('contenedores_medicamentos?tipo=eq.carro&select=*', {}, usuario?.token);
        if (data) {
          const carrosFiltrados = data.filter(c => carrosAsignados.includes(c.nombre));
          setCarros(carrosFiltrados);
          if (carrosFiltrados.length > 0 && !carroSel) setCarroSel(carrosFiltrados[0].nombre);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("useEffect ejecutándose...");
    cargarCarros();
  }, []);

  const carroActual = carros.filter(c => c.nombre === carroSel);
  const insumosCarroActual = carroActual;
  
  const insumosCajon = (cajonId) => insumosCarroActual.filter(i => i.cajon === cajonId);
  const alertasCajon = (cajonId) => insumosCajon(cajonId).filter(i => i.stock <= i.minimo).length;
  const alertasCarro = (nombreCarro) => carros.filter(c => c.nombre === nombreCarro && c.stock <= c.minimo).length;

  const toggleCajon = (cajonId) => setCajonAbierto(prev => prev === cajonId ? null : cajonId);

  const abrirEditar = (insumo) => {
    setEditando(insumo.id);
    setFormEdit({ stock: insumo.stock, minimo: insumo.minimo });
  };

  const guardarEdicion = async (id) => {
    const { error } = await sb(`contenedores_medicamentos?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: +formEdit.stock, minimo: +formEdit.minimo })
    }, usuario?.token);
    
    if (!error) {
      setEditando(null);
      cargarCarros();
    }
  };

  const carrosUnicos = [...new Set(carros.map(c => c.nombre))];
  const colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Cargando carros...</div>;

  if (!esAdmin && carrosPermitidos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚑</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          No tienes carros asignados
        </div>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          Solicita al administrador que te asigne a un evento con un carro clínico.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Lista de carros */}
      <div style={{ width: 185, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Seleccionar carro</div>
        {carrosUnicos.map((nombreCarro, idx) => {
          const alertas = alertasCarro(nombreCarro);
          const activo = carroSel === nombreCarro;
          const color = colores[idx % colores.length];
          const totalInsumos = carros.filter(c => c.nombre === nombreCarro).length;
          
          return (
            <div key={nombreCarro} onClick={() => { setCarroSel(nombreCarro); setCajonAbierto(null); }} 
                 style={{ cursor: 'pointer', background: activo ? C.surface : 'transparent', border: `1px solid ${activo ? color + '50' : C.border}`, borderRadius: 10, padding: '11px 13px', marginBottom: 7, borderLeft: `3px solid ${color}`, transition: 'all 0.12s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: activo ? C.text : C.textMuted }}>{nombreCarro}</span>
                {alertas > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{alertas}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{totalInsumos} medicamentos</div>
            </div>
          );
        })}
      </div>

      {/* Detalle del carro */}
      <div style={{ flex: 1 }}>
        {carroSel && (
          <>
            {/* Header */}
            <div style={{ ...S.card, borderLeft: `3px solid ${colores[carrosUnicos.indexOf(carroSel) % colores.length]}`, marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: colores[carrosUnicos.indexOf(carroSel) % colores.length] }}>{carroSel}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                {insumosCarroActual.length} medicamentos totales · 5 cajones
              </div>
            </div>

            {/* Tarjetas de cajones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
              {CAJONES_META.map(cj => {
                const items = insumosCajon(cj.id);
                const alertas = alertasCajon(cj.id);
                const abierto = cajonAbierto === cj.id;
                
                return (
                  <div key={cj.id} onClick={() => toggleCajon(cj.id)} 
                       style={{ cursor: 'pointer', background: abierto ? cj.color + '15' : C.surface, border: `2px solid ${abierto ? cj.color : C.border}`, borderRadius: 12, padding: '16px 12px', textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}>
                    {alertas > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: C.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{alertas}</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cj.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: abierto ? cj.color : C.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cj.id}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, lineHeight: 1.3 }}>{cj.nombre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cj.color, marginTop: 8 }}>{items.length} items</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: alertas > 0 ? C.red : C.green }}>
                      {alertas > 0 ? `⚠️ ${alertas} alertas` : '✅ OK'}
                    </div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>{abierto ? '▲ Cerrar' : '▼ Ver medicamentos'}</div>
                  </div>
                );
              })}
            </div>

            {/* Contenido del cajón abierto */}
            {cajonAbierto && (
              <div style={{ ...S.card, borderTop: `3px solid ${CAJONES_META.find(c => c.id === cajonAbierto)?.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: CAJONES_META.find(c => c.id === cajonAbierto)?.color }}>{cajonAbierto}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{CAJONES_META.find(c => c.id === cajonAbierto)?.nombre}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>MEDICAMENTO</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>STOCK</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>MÍNIMO</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>UNIDAD</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: 11, color: C.textFaint, fontWeight: 700 }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosCajon(cajonAbierto).map(insumo => {
                      const enEdicion = editando === insumo.id;
                      const bajStock = insumo.stock <= insumo.minimo;
                      
                      return (
                        <tr key={insumo.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '10px', fontSize: 13, fontWeight: 600 }}>{insumo.nombre_insumo || "Sin nombre"}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {enEdicion ? (
                              <input type="number" value={formEdit.stock} onChange={e => setFormEdit({...formEdit, stock: e.target.value})} 
                                     style={{ width: 60, padding: 4, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }} />
                            ) : (
                              <span style={{ color: bajStock ? C.red : C.text, fontWeight: bajStock ? 700 : 400 }}>{insumo.stock}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {enEdicion ? (
                              <input type="number" value={formEdit.minimo} onChange={e => setFormEdit({...formEdit, minimo: e.target.value})} 
                                     style={{ width: 60, padding: 4, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }} />
                            ) : (
                              <span style={{ fontSize: 12, color: C.textMuted }}>{insumo.minimo}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: C.textMuted }}>{insumo.unidad}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {enEdicion ? (
                              <>
                                <button onClick={() => guardarEdicion(insumo.id)} style={{ ...S.btn('primary'), fontSize: 11, padding: '4px 10px', marginRight: 5 }}>💾 Guardar</button>
                                <button onClick={() => setEditando(null)} style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }}>✖️</button>
                              </>
                            ) : (
                              <button onClick={() => abrirEditar(insumo)} style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }}>✏️ Editar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VistaBolsosMedicamentos({ usuario }) {
  const [bolsos, setBolsos] = useState([]);
  const [bolsoSel, setBolsoSel] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [bolsosPermitidos, setBolsosPermitidos] = useState([]);

  const esAdmin = usuario?.rol === 'admin';

  const cargarBolsos = async () => {
    // Si es admin, cargar todos los bolsos
    if (esAdmin) {
      const data = await sb('contenedores_medicamentos?tipo=eq.bolso&select=*', {}, usuario?.token);
      console.log("DEBUG Bolsos (Admin):", data);
      if (data) {
        setBolsos(data);
        setBolsosPermitidos(['Bolso 1', 'Bolso 2', 'Bolso 3']);
        if (data.length > 0 && !bolsoSel) setBolsoSel(data[0].nombre);
      }
    } else {
      // Si es profesional, obtener eventos donde está asignado
      const eventos = await sb('equipos_evento?estado=eq.activo', {}, usuario?.token);
      console.log("DEBUG Eventos activos:", eventos);
      
      let bolsosAsignados = [];
      if (eventos) {
        eventos.forEach(evento => {
          // Verificar si el usuario está en alguna lista de profesionales
          const estaAsignado = 
            (evento.medicos || []).includes(usuario.id) ||
            (evento.enfermeros || []).includes(usuario.id) ||
            (evento.paramedicos || []).includes(usuario.id);
          
          if (estaAsignado && evento.bolsos_asignados) {
            bolsosAsignados = [...bolsosAsignados, ...evento.bolsos_asignados];
          }
        });
      }
      
      // Eliminar duplicados
      bolsosAsignados = [...new Set(bolsosAsignados)];
      console.log("DEBUG Bolsos asignados al usuario:", bolsosAsignados);
      setBolsosPermitidos(bolsosAsignados);
      
      // Cargar solo los bolsos asignados
      if (bolsosAsignados.length > 0) {
        const data = await sb('contenedores_medicamentos?tipo=eq.bolso&select=*', {}, usuario?.token);
        if (data) {
          const bolsosFiltrados = data.filter(b => bolsosAsignados.includes(b.nombre));
          setBolsos(bolsosFiltrados);
          if (bolsosFiltrados.length > 0 && !bolsoSel) setBolsoSel(bolsosFiltrados[0].nombre);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarBolsos();
  }, []);

  const bolsoActual = bolsos.filter(b => b.nombre === bolsoSel);
  const medicamentosBolsoActual = bolsoActual;
  
  const medicamentosCaja = (cajaId) => medicamentosBolsoActual.filter(m => m.cajon === cajaId);
  const alertasCaja = (cajaId) => medicamentosCaja(cajaId).filter(m => m.stock <= m.minimo).length;
  const alertasBolso = (nombreBolso) => bolsos.filter(b => b.nombre === nombreBolso && b.stock <= b.minimo).length;

  const toggleCaja = (cajaId) => setCajaAbierta(prev => prev === cajaId ? null : cajaId);

  const iniciarEdicion = (medicamento) => {
    setEditando(medicamento.id);
    setFormEdit({ stock: medicamento.stock, minimo: medicamento.minimo });
  };

  const guardarEdicion = async (medicamento) => {
    const data = await sb(
      `contenedores_medicamentos?id=eq.${medicamento.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ stock: formEdit.stock, minimo: formEdit.minimo })
      },
      usuario?.token
    );
    if (data) {
      await cargarBolsos();
      setEditando(null);
      setFormEdit({});
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormEdit({});
  };

  const CAJAS_META = [
    { id: "Caja 1 · Inyectables", emoji: "💉", nombre: "Inyectables", color: C.red },
    { id: "Caja 2 · Orales", emoji: "💊", nombre: "Orales", color: C.blue },
    { id: "Caja 3 · Aerosoles", emoji: "🫁", nombre: "Aerosoles", color: C.purple }
  ];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Cargando bolsos...</div>;
  }

  if (!esAdmin && bolsosPermitidos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          No tienes bolsos asignados
        </div>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          Solicita al administrador que te asigne a un evento con un bolso de medicamentos.
        </div>
      </div>
    );
  }

  const bolsosUnicos = [...new Set(bolsos.map(b => b.nombre))];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* SIDEBAR - Lista de bolsos */}
      <div style={{ width: 280, borderRight: `1px solid ${C.border}`, padding: 20, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Bolsos de Medicamentos
        </div>
        {bolsosUnicos.map(nombreBolso => {
          const alertas = alertasBolso(nombreBolso);
          const activo = bolsoSel === nombreBolso;
          return (
            <div
              key={nombreBolso}
              onClick={() => setBolsoSel(nombreBolso)}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 8,
                cursor: 'pointer',
                background: activo ? C.accentDim : C.surface2,
                border: `1px solid ${activo ? C.accent : C.border}`,
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: activo ? C.accent : C.text }}>
                    💊 {nombreBolso}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                    26 medicamentos
                  </div>
                </div>
                {alertas > 0 && (
                  <div style={{
                    background: C.red,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 12
                  }}>
                    {alertas}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN - Cajas del bolso seleccionado */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {bolsoSel ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={S.title}>💊 {bolsoSel}</div>
              <div style={S.subtitle}>26 medicamentos totales · 3 cajas</div>
            </div>

            {/* Grid de cajas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              {CAJAS_META.map(caja => {
                const meds = medicamentosCaja(caja.id);
                const alertas = alertasCaja(caja.id);
                const abierta = cajaAbierta === caja.id;

                return (
                  <div
                    key={caja.id}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${caja.color}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Header de la caja */}
                    <div
                      onClick={() => toggleCaja(caja.id)}
                      style={{
                        padding: '18px 20px',
                        cursor: 'pointer',
                        background: abierta ? C.surface2 : 'transparent',
                        borderBottom: abierta ? `1px solid ${C.border}` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{caja.emoji}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: caja.color }}>
                            {caja.nombre}
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                            {meds.length} items
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {alertas > 0 ? (
                            <div style={{
                              background: C.redDim,
                              color: C.red,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              marginBottom: 8
                            }}>
                              ⚠️ {alertas} alertas
                            </div>
                          ) : (
                            <div style={{
                              background: C.greenDim,
                              color: C.green,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              marginBottom: 8
                            }}>
                              ✓ OK
                            </div>
                          )}
                          <div style={{ fontSize: 20, color: C.textMuted }}>
                            {abierta ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la caja (medicamentos) */}
                    {abierta && (
                      <div style={{ padding: 20 }}>
                        <table style={{ width: '100%', fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th style={{ ...S.th, textAlign: 'left' }}>Medicamento</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Stock</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Mín</th>
                              <th style={{ ...S.th, textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meds.map(med => {
                              const bajo = med.stock <= med.minimo;
                              const editandoEste = editando === med.id;

                              return (
                                <tr key={med.id}>
                                  <td style={{ padding: '10px', fontSize: 13, fontWeight: 600 }}>
                                    {med.nombre_insumo || "Sin nombre"}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <input
                                        type="number"
                                        value={formEdit.stock}
                                        onChange={e => setFormEdit(f => ({ ...f, stock: parseInt(e.target.value) }))}
                                        style={{ ...S.input, width: 60, padding: '4px 8px', textAlign: 'center' }}
                                      />
                                    ) : (
                                      <span style={{ color: bajo ? C.red : C.text, fontWeight: bajo ? 700 : 400 }}>
                                        {med.stock} {med.unidad}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <input
                                        type="number"
                                        value={formEdit.minimo}
                                        onChange={e => setFormEdit(f => ({ ...f, minimo: parseInt(e.target.value) }))}
                                        style={{ ...S.input, width: 60, padding: '4px 8px', textAlign: 'center' }}
                                      />
                                    ) : (
                                      <span style={{ color: C.textMuted }}>{med.minimo}</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {editandoEste ? (
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                        <button onClick={() => guardarEdicion(med)} style={{ ...S.btn('primary'), padding: '4px 12px', fontSize: 12 }}>
                                          Guardar
                                        </button>
                                        <button onClick={cancelarEdicion} style={{ ...S.btn('ghost'), padding: '4px 12px', fontSize: 12 }}>
                                          Cancelar
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => iniciarEdicion(med)} style={{ ...S.btn('ghost'), padding: '4px 12px', fontSize: 12 }}>
                                        Editar
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
            Selecciona un bolso para ver su contenido
          </div>
        )}
      </div>
    </div>
  );
}
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
  const alertCarros = 0; // TODO: Calcular desde BD
  const alertBolso = allMeds.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  // Nav items según rol
  const navItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    ...(esAdmin || permisos.verInventario ? [{ id: "carros", label: "Carros", icon: "carro", badge: alertCarros }] : []),
    ...(esAdmin || permisos.verBolso ? [{ id: "bolso", label: "Medicamentos", icon: "bolso", badge: alertBolso }] : []),
    { id: "atenciones", label: "Atenciones", icon: "event" },
    ...(esAdmin ? [{ id: "eventos", label: "Eventos", icon: "event" }] : []),
    ...(esAdmin ? [{ id: "reportes", label: "Reportes", icon: "report" }] : []),
...(esAdmin ? [{ id: "costos", label: "Costos", icon: "report" }] : []),
    { id: "configuracion", label: "Config", icon: "report" },
    ...(esAdmin ? [{ id: "usuarios", label: "Usuarios", icon: "med" }] : []),
  ];

  const nav = [
    { section: "General" },
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    ...(esAdmin ? [{ section: "Inventario" }] : []),
    ...(esAdmin || permisos.verInventario ? [{ id: "carros", label: "Carros Clínicos", icon: "carro", badge: alertCarros }] : []),
...(esAdmin || permisos.verBolso ? [{ id: "bolsos", label: "Bolso de Medicamentos", icon: "bolso" }] : []),
    { section: "Operación" },
    { id: "atenciones", label: "Atenciones 🏥", icon: "event" },
...(esAdmin || permisos.recetarMedicamentos ? [{ id: "atencionMedica", label: "Prescripción", icon: "med" }] : []),
...((esAdmin || usuario?.profesion === "Enfermero/a" || usuario?.profesion === "Paramédico") ? [{ id: "adminMedicamentos", label: "Administración", icon: "bolso" }] : []),
...((esAdmin || usuario?.profesion === "Kinesiólogo/a") ? [{ id: "atencionKine", label: "Kinesiología", icon: "event" }] : []),
...((esAdmin || usuario?.profesion === "Masoterapeuta") ? [{ id: "masoterapiaMasiva", label: "Masoterapia Masiva", icon: "bolso" }] : []),
...((esAdmin || usuario?.profesion === "Masoterapeuta") ? [{ id: "masoterapiaEspecifica", label: "Masoterapia Específica", icon: "event" }] : []),
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
            <VistaCarrosClinicosDB usuario={usuario} />
          </div>
        )}
        {tab === "bolsos" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolsos de Medicamentos 💊</div>
              <div style={S.subtitle}>3 bolsos · 26 medicamentos cada uno · 3 cajas internas</div>
            </div>
            <VistaBolsosMedicamentos usuario={usuario} />
          </div>
        )}
        {tab === "bolso" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso Naranja 🟠</div>
              <div style={S.subtitle}>Medicamentos separados del carro · 3 cajas internas</div>
            </div>
<VistaBolsoNaranja usuario={usuario} />
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
{tab === "atencionMedica" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Atenciones Médicas</div>
<div style={S.subtitle}>Evaluación y prescripción médica</div>
</div>
<VistaAtencionesMedicas usuario={usuario} carros={carros} />
</div>
)}
{tab === "adminMedicamentos" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Administración de Medicamentos</div>
<div style={S.subtitle}>Pendientes de administración</div>
</div>
<VistaAdministracionMedicamentos usuario={usuario} />
</div>
)}
{tab === "atencionKine" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Atenciones de Kinesiología</div>
<div style={S.subtitle}>Registro de atenciones con bolso individual</div>
</div>
<VistaAtencionesKinesiologia usuario={usuario} />
</div>
)}
{tab === "masoterapiaMasiva" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Masoterapia Masiva</div>
<div style={S.subtitle}>Contador de masajes para eventos masivos</div>
</div>
<VistaMasoterapiaMasiva usuario={usuario} />
</div>
)}
{tab === "masoterapiaEspecifica" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Masoterapia Específica</div>
<div style={S.subtitle}>Fichas individuales para torneos</div>
</div>
<VistaMasoterapiaEspecifica usuario={usuario} />
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
<div style={S.subtitle}>Análisis completo por evento</div>
</div>
<VistaReportes usuario={usuario} esAdmin={esAdmin} />
</div>
)}
{tab === "costos" && (
<div>
<div style={{ marginBottom: 24 }}>
<div style={S.title}>Gestión de Costos</div>
<div style={S.subtitle}>Registro de costos de insumos</div>
</div>
<VistaGestionCostos usuario={usuario} />
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
