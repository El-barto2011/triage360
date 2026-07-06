/* ════════════════════════════════════════════════════════════
   HELPER COMPARTIDO — Identificación y cruce de pacientes
   Única fuente de verdad para normalizar RUT/pasaporte,
   construir filtros PostgREST seguros y chequear alergias.
   Usado por: HistorialPaciente, VistaAtencionesMedicas,
   VistaAtencionesEnfermeria, VistaAtencionesKinesiologia,
   VistaMasoterapiaEspecifica.
   ════════════════════════════════════════════════════════════ */

/** Normaliza igual que fn_norm_ident en la BD: solo [0-9A-Z] en mayúsculas */
export const normIdent = (v) => (v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");

/** Limpia el input del usuario para uso seguro en URLs PostgREST
    (elimina comas, paréntesis y cualquier char fuera de [0-9a-zA-Z.-]) */
export const cleanIdent = (v) => (v || "").trim().replace(/[^0-9a-zA-Z.\-]/g, "");

/** ¿Es pasaporte? (inicia con letra) */
export const esPasaporte = (v) => /^[a-zA-Z]/.test((v || "").trim());

/** Genera variantes de RUT con y sin puntos (misma lógica en toda la app) */
export function rutVariants(raw) {
  const v = cleanIdent(raw);
  const sinPuntos = v.replace(/\./g, "");
  if (sinPuntos === v) {
    const m = sinPuntos.match(/^(\d+)(-[\dkK])?$/);
    if (m) {
      const num = m[1], dv = m[2] ? "-" + m[2].slice(1) : "";
      let conPuntos = "";
      if      (num.length === 8) conPuntos = `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5)}${dv}`;
      else if (num.length === 7) conPuntos = `${num.slice(0, 1)}.${num.slice(1, 4)}.${num.slice(4)}${dv}`;
      return [...new Set([v, conPuntos].filter(Boolean))];
    }
    return [v];
  }
  return [...new Set([v, sinPuntos])];
}

/** Filtro PostgREST seguro que matchea todas las variantes de la identificación.
    Ej: identFilter("paciente_rut", "12.345.678-9")
        → "or=(paciente_rut.eq.12.345.678-9,paciente_rut.eq.12345678-9)" */
export function identFilter(campo, valor) {
  const v = cleanIdent(valor);
  const variants = esPasaporte(v) ? [v] : rutVariants(v);
  return variants.length > 1
    ? `or=(${variants.map(x => `${campo}.eq.${encodeURIComponent(x)}`).join(",")})`
    : `${campo}=eq.${encodeURIComponent(variants[0])}`;
}

/** Busca la ficha unificada del paciente en la tabla `pacientes`.
    Devuelve { id, nombre, edad, alergias, antecedentes } o null. */
export async function fetchPaciente(sb, ident, token) {
  const norm = normIdent(ident);
  if (!norm) return null;
  const res = await sb(
    `pacientes?identificacion=eq.${norm}&select=id,nombre,edad,alergias,antecedentes`,
    {}, token
  );
  return res?.[0] || null;
}

/** Valida el dígito verificador de un RUT chileno (módulo 11).
    Devuelve true si es válido. Los pasaportes no se validan (true). */
export function validarRut(valor) {
  const v = cleanIdent(valor);
  if (esPasaporte(v)) return true;               // pasaporte: sin DV
  const limpio = v.replace(/\./g, "").replace("-", "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalc = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvCalc;
}

/* ── Chequeo de alergias vs medicamentos prescritos ──────────
   Match directo por palabra + grupos farmacológicos comunes.  */
const GRUPOS_FARMACOS = {
  aines:       ["ibuprofeno", "ketorolaco", "diclofenaco", "naproxeno", "ketoprofeno", "aspirina", "acido acetilsalicilico", "meloxicam", "piroxicam", "celecoxib"],
  aine:        null, // alias → aines
  penicilina:  ["amoxicilina", "ampicilina", "cloxacilina", "penicilina", "amoxicilina/clavulanico"],
  penicilinas: null,
  sulfas:      ["sulfametoxazol", "cotrimoxazol", "sulfadiazina"],
  sulfa:       null,
};
const ALIAS = { aine: "aines", penicilinas: "penicilina", sulfa: "sulfas" };

const sinAcentos = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Devuelve array de conflictos [{ alergia, medicamento }] entre el texto
    libre de alergias del paciente y los medicamentos a prescribir. */
export function chequearAlergias(alergiasTexto, medicamentos) {
  if (!alergiasTexto || !Array.isArray(medicamentos) || medicamentos.length === 0) return [];
  const tokens = sinAcentos(alergiasTexto).split(/[^a-z0-9\/]+/).filter(t => t.length >= 4);
  const conflictos = [];
  for (const med of medicamentos) {
    const nombreMed = sinAcentos(med?.nombre || med?.medicamento || "");
    if (!nombreMed) continue;
    for (const t of tokens) {
      const grupoKey = ALIAS[t] || t;
      const grupo = GRUPOS_FARMACOS[grupoKey];
      const primeraPalabra = nombreMed.split(" ")[0];
      const matchDirecto = nombreMed.includes(t) || (primeraPalabra.length >= 4 && t.includes(primeraPalabra));
      const matchGrupo   = Array.isArray(grupo) && grupo.some(g => nombreMed.includes(g));
      if (matchDirecto || matchGrupo) {
        conflictos.push({ alergia: t, medicamento: med.nombre || med.medicamento });
        break;
      }
    }
  }
  return conflictos;
}
