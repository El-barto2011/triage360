/* ════════════════════════════════════════════════════════════
   FECHAS LOCALES — única fuente de verdad para "hoy"
   new Date().toISOString() entrega la fecha en UTC: en Chile
   (UTC-3/-4) "hoy" cambia a las 20:00–21:00 hora local. En un
   evento nocturno eso hacía que la Cola de Triaje se vaciara,
   que "Atenciones de hoy" se partiera en dos y que la fecha de
   atención por defecto fuera la de mañana.
   Estos helpers usan SIEMPRE la zona horaria del dispositivo.
   ════════════════════════════════════════════════════════════ */

const p2 = (n) => String(n).padStart(2, "0");

/** Fecha local YYYY-MM-DD de un Date / ISO string / timestamp. */
export function fechaLocal(valor = new Date()) {
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** Hoy en hora local, YYYY-MM-DD. */
export const hoyLocal = () => fechaLocal(new Date());

/** Instante (ISO UTC) en que comenzó el día local — para filtros created_at=gte. */
export function inicioDiaLocalISO(valor = new Date()) {
  const d = valor instanceof Date ? valor : new Date(valor);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

/** Instante (ISO UTC) en que comenzó el mes local. */
export function inicioMesLocalISO(valor = new Date()) {
  const d = valor instanceof Date ? valor : new Date(valor);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/** ¿El valor cae en el día local de hoy? */
export const esHoyLocal = (valor) => fechaLocal(valor) === hoyLocal();
