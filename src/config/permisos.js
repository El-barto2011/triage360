export const PROFESIONES = ["Médico", "Enfermero/a", "Paramédico", "Kinesiólogo/a", "Masoterapeuta"];

export const INDUSTRIAS = {
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

export const getIndustria = (key) => INDUSTRIAS[key] || INDUSTRIAS["eventos"];

export const PERMISOS = {
  "Médico":          { recetarMedicamentos: true,  verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Enfermero/a":     { recetarMedicamentos: false, verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Paramédico":      { recetarMedicamentos: false, verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: false },
  "Kinesiólogo/a":   { recetarMedicamentos: false, verInventario: false, modificarStock: false, verBolso: false, verBolsoKine: false  },
  "Masoterapeuta":   { recetarMedicamentos: false, verInventario: false, modificarStock: false, verBolso: false, verBolsoKine: false },
  "Administrador":   { recetarMedicamentos: true,  verInventario: true,  modificarStock: true,  verBolso: true,  verBolsoKine: true  },
};

export const getPermisos = (usuario) => {
  if (usuario?.rol === "admin") return PERMISOS["Administrador"];
  return PERMISOS[usuario?.profesion] || PERMISOS["Kinesiólogo/a"];
};
