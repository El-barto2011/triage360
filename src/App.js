import { useState, useEffect } from "react";
import { C, S, Icon } from "./config/theme";
import { MEDICAMENTOS_INYECTABLES, MEDICAMENTOS_ORALES, MEDICAMENTOS_AEROSOLES, CARROS_INICIALES, estadoVenc, estadoStock } from "./config/constants";
import { getIndustria, getPermisos } from "./config/permisos";
import { sb } from "./config/supabase";
import { useIsMobile } from "./hooks/useIsMobile";

import { Login } from "./components/auth/Login";
import { Dashboard } from "./components/dashboard/Dashboard";
import { VistaCarros } from "./components/inventario/VistaCarros";
import { VistaCarrosClinicosDB } from "./components/inventario/VistaCarrosClinicosDB";
import { VistaBolsoNaranja } from "./components/inventario/VistaBolsoNaranja";
import { VistaBolsosMedicamentos } from "./components/inventario/VistaBolsosMedicamentos";
import { VistaBolsoKinesiologia } from "./components/inventario/VistaBolsoKinesiologia";
import { VistaGestionEventos } from "./components/eventos/VistaGestionEventos";
import { VistaAtenciones } from "./components/atenciones/VistaAtenciones";
import { VistaAtencionesMedicas } from "./components/atenciones/VistaAtencionesMedicas";
import { VistaAdministracionMedicamentos } from "./components/atenciones/VistaAdministracionMedicamentos";
import { VistaAtencionesKinesiologia } from "./components/kinesiologia/VistaAtencionesKinesiologia";
import ColaTriaje from "./components/atenciones/ColaTriaje";
import { VistaMasoterapiaUnificada } from "./components/masoterapia/VistaMasoterapiaUnificada";
import { VistaReportes } from "./components/reportes/VistaReportes";
import { VistaGestionCostos } from "./components/reportes/VistaGestionCostos";
import { GestionPreciosMedicamentos } from "./components/reportes/GestionPreciosMedicamentos";
import { GestionPreciosKinesiologia } from "./components/reportes/GestionPreciosKinesiologia";
import { GestionInsumosGenerales } from "./components/reportes/GestionInsumosGenerales";
import { GestionUsuarios } from "./components/admin/GestionUsuarios";
import { Configuracion } from "./components/admin/Configuracion";
import { EventoProvider, SelectorEvento } from "./components/common/SelectorEvento";
import { HistorialPaciente } from "./components/pacientes/HistorialPaciente";
import { HistorialMedicamentos } from "./components/atenciones/HistorialMedicamentos";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./components/ui/use-toast";

const PERMISOS_TAB = {
  // Solo admin
  usuarios:          (_u, admin) => admin,
  reportes:          (_u, admin) => admin,
  costos:            (_u, admin) => admin,
  preciosMeds:       (_u, admin) => admin,
  preciosKine:       (_u, admin) => admin,
  insumosGrales:     (_u, admin) => admin,
  configuracion:     (_u, admin) => admin,
  historialMeds:     (_u, admin) => admin,
  // Médico + admin
  atencionMedica:    (u, admin) => admin || u?.profesion === "Médico",
  colaTriaje:        (u, admin) => admin || u?.profesion === "Médico",
  // Enfermero/Paramédico + admin
  adminMedicamentos: (u, admin) => admin || u?.profesion === "Enfermero/a" || u?.profesion === "Paramédico",
  // Kinesiólogo + admin
  atencionKine:      (u, admin) => admin || u?.profesion === "Kinesiólogo/a",
  bolsoKine:         (u, admin) => admin || u?.profesion === "Kinesiólogo/a",
  // Masoterapeuta + admin
  masoterapia:       (u, admin) => admin || u?.profesion === "Masoterapeuta",
};

function tienePermiso(tab, usuario, esAdmin) {
  const check = PERMISOS_TAB[tab];
  return check ? check(usuario, esAdmin) : true;
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const [carros, setCarros] = useState(CARROS_INICIALES);
  const [usuario, setUsuario] = useState(null);
  const [industriaKey, setIndustriaKey] = useState("eventos");
  const [alertCarros, setAlertCarros] = useState(0);
  const industria = getIndustria(industriaKey);
  const isMobile = useIsMobile();

  const handleLogin = (user) => setUsuario(user);
  const handleLogout = () => setUsuario(null);

  // Registrar handler global de errores de red para supabase.js
  useEffect(() => {
    window.__toastError = (msg) => toast({ title: "Error de conexión", description: msg, variant: "destructive" });
    return () => { delete window.__toastError; };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    sb("contenedores_medicamentos?tipo=eq.carro&select=nombre,stock,minimo,fecha_vencimiento", {}, usuario.token)
      .then(data => {
        if (!data) return;
        const carrosConAlerta = new Set(
          data
            .filter(i => {
              const stockMal = estadoStock({ stock: Number(i.stock), minimo: Number(i.minimo) }) !== "ok";
              const vencMal = i.fecha_vencimiento && estadoVenc(i.fecha_vencimiento) !== "ok";
              return stockMal || vencMal;
            })
            .map(i => i.nombre)
        );
        setAlertCarros(carrosConAlerta.size);
      });
  }, [usuario]);

  if (!usuario) return <Login onLogin={handleLogin} />;

  const esAdmin = usuario?.rol === "admin";
  const permisos = getPermisos(usuario);
  const allMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const alertBolso = allMeds.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

  const getMobileNavConfig = () => {
    const prof = usuario?.profesion;
    const T = {
      dashboard:         { id: "dashboard",         label: "Inicio",       icon: "dashboard" },
      atenciones:        { id: "atenciones",         label: "Atenciones",   icon: "event" },
      atencionMedica:    { id: "atencionMedica",     label: "Prescripción", icon: "med" },
      colaTriaje:        { id: "colaTriaje",         label: "Triaje",       icon: "alert" },
      adminMedicamentos: { id: "adminMedicamentos",  label: "Administrar",  icon: "bolso" },
      atencionKine:      { id: "atencionKine",       label: "Kinesiología", icon: "event" },
      masoterapia:       { id: "masoterapia",        label: "Masoterapia",  icon: "bolso" },
      bolsoKine:         { id: "bolsoKine",          label: "Mi Bolso",     icon: "bolso" },
      carros:            { id: "carros",             label: "Carros",       icon: "carro", badge: alertCarros },
      bolsos:            { id: "bolsos",             label: "Medicamentos", icon: "bolso", badge: alertBolso },
      reportes:          { id: "reportes",           label: "Reportes",     icon: "report" },
      costos:            { id: "costos",             label: "Valorización", icon: "report" },
      historialPaciente: { id: "historialPaciente",  label: "Historial",    icon: "med" },
      configuracion:     { id: "configuracion",      label: "Config",       icon: "report" },
      usuarios:          { id: "usuarios",           label: "Usuarios",     icon: "med" },
      eventos:           { id: "eventos",            label: "Eventos",      icon: "event" },
      preciosMeds:       { id: "preciosMeds",        label: "Precios Meds", icon: "bolso" },
      preciosKine:       { id: "preciosKine",        label: "Kine Maestro", icon: "bolso" },
      insumosGrales:     { id: "insumosGrales",      label: "Insumos",      icon: "carro" },
      historialMeds:     { id: "historialMeds",      label: "Historial Meds", icon: "report" },
    };
    if (esAdmin) return {
      primary: [T.dashboard, T.atenciones, T.carros, T.reportes],
      more: [
        T.costos, T.eventos, T.historialPaciente, T.historialMeds, T.usuarios,
        T.configuracion, T.preciosMeds, T.preciosKine, T.insumosGrales,
        T.bolsos, T.bolsoKine, T.atencionMedica, T.atencionKine,
        T.masoterapia, T.adminMedicamentos, T.colaTriaje,
      ],
    };
    if (prof === "Médico") return {
      primary: [T.dashboard, T.atenciones, T.atencionMedica, T.colaTriaje],
      more: [T.historialPaciente, T.configuracion],
    };
    if (prof === "Enfermero/a" || prof === "Paramédico") return {
      primary: [T.dashboard, T.atenciones, T.atencionMedica, T.adminMedicamentos],
      more: [T.historialPaciente, T.configuracion],
    };
    if (prof === "Kinesiólogo/a") return {
      primary: [T.dashboard, T.atencionKine, T.bolsoKine, T.atenciones],
      more: [T.historialPaciente, T.configuracion],
    };
    if (prof === "Masoterapeuta") return {
      primary: [T.dashboard, T.masoterapia, T.atenciones, T.historialPaciente],
      more: [T.configuracion],
    };
    return {
      primary: [T.dashboard, T.atenciones, T.historialPaciente, T.configuracion],
      more: [],
    };
  };
  const { primary: primaryTabs, more: moreTabs } = getMobileNavConfig();

  const navItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    ...(esAdmin || permisos.verInventario ? [{ id: "carros", label: "Carros", icon: "carro", badge: alertCarros }] : []),
    ...(esAdmin || permisos.verBolso ? [{ id: "bolso", label: "Medicamentos", icon: "bolso", badge: alertBolso }] : []),
    { id: "atenciones", label: "Atenciones", icon: "event" },
    ...(esAdmin ? [{ id: "eventos", label: "Eventos", icon: "event" }] : []),
    ...(esAdmin ? [{ id: "reportes", label: "Reportes", icon: "report" }] : []),
    ...(esAdmin ? [{ id: "costos", label: "Costos", icon: "report" }] : []),
    ...(esAdmin ? [{ id: "preciosMeds", label: "Precios", icon: "bolso" }] : []),
    { id: "historialPaciente", label: "Historial", icon: "med" },
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
    ...(esAdmin || permisos.recetarMedicamentos || usuario?.profesion === "Enfermero/a" || usuario?.profesion === "Paramédico" ? [{ id: "atencionMedica", label: "Prescripción", icon: "med" }] : []),
    ...((esAdmin || usuario?.profesion === "Médico") ? [{ id: "colaTriaje", label: "🚨 Cola Triaje", icon: "alert" }] : []),
    ...((esAdmin || usuario?.profesion === "Enfermero/a" || usuario?.profesion === "Paramédico") ? [{ id: "adminMedicamentos", label: "Administración", icon: "bolso" }] : []),
    ...((esAdmin || usuario?.profesion === "Kinesiólogo/a") ? [{ id: "atencionKine", label: "Kinesiología", icon: "event" }] : []),
    ...((esAdmin || usuario?.profesion === "Masoterapeuta") ? [{ id: "masoterapia", label: "Masoterapia", icon: "bolso" }] : []),
    ...(esAdmin || permisos.verBolsoKine ? [{ id: "bolsoKine", label: "Bolso Kinesiólogo/a", icon: "bolso" }] : []),
    ...(esAdmin ? [{ id: "eventos", label: "Eventos", icon: "event" }] : []),
    ...(esAdmin ? [{ id: "reportes", label: "Reportes", icon: "report" }] : []),
    ...(esAdmin ? [{ section: "Costos" }] : []),
    ...(esAdmin ? [{ id: "costos",         label: "Valorización",          icon: "report" }] : []),
    ...(esAdmin ? [{ id: "preciosMeds",    label: "Precios Medicamentos",  icon: "bolso"  }] : []),
    ...(esAdmin ? [{ id: "preciosKine",    label: "Bolso Kines Maestro",   icon: "event"  }] : []),
    ...(esAdmin ? [{ id: "insumosGrales",  label: "Insumos Generales",     icon: "carro"  }] : []),
    ...(esAdmin ? [{ id: "historialMeds", label: "Historial Medicamentos", icon: "report" }] : []),
    { section: "Pacientes" },
    { id: "historialPaciente", label: "Historial Paciente", icon: "med" },
    { id: "configuracion", label: "Config", icon: "report" },
    ...(esAdmin ? [{ id: "usuarios", label: "Usuarios", icon: "med" }] : []),
  ];

  return (
    <EventoProvider usuario={usuario}>
    <div style={{ ...S.app, flexDirection: isMobile ? "column" : "row" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {!isMobile && (
        <div style={S.sidebar}>
          <div style={S.logo}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: 1, lineHeight: 1 }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Gestión clínica inteligente, donde la necesites</div>
          </div>
          <SelectorEvento />
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
            <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>TRIAGE360</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, marginBottom: 10 }}>{usuario?.email}</div>
            <button style={{ ...S.btn("ghost"), width: "100%", fontSize: 12, padding: "7px" }} onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {isMobile && (
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.accent, letterSpacing: 0.5 }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {usuario?.profesion && (
                <span style={{ fontSize: 10, color: C.textFaint, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {usuario.profesion}
                </span>
              )}
              <button style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={handleLogout}>Salir</button>
            </div>
          </div>
          <SelectorEvento />
        </div>
      )}

      <main style={{ ...S.main, padding: isMobile ? "16px 16px 80px" : 28 }}>
        {tab === "dashboard" && <Dashboard carros={carros} usuario={usuario} esAdmin={esAdmin} permisos={permisos} onNavigate={setTab} />}
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
              <div style={S.title}>Atenciones Mensuales 🏥</div>
              <div style={S.subtitle}>Registro mensual · Todas las atenciones del sistema</div>
            </div>
            <VistaAtenciones carros={carros} usuario={usuario} permisos={permisos} industria={industria} />
          </div>
        )}
        {tab === "bolsoKine" && tienePermiso("bolsoKine", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso de Kinesiólogo/a 🏥</div>
              <div style={S.subtitle}>Insumos de kinesiología</div>
            </div>
            <VistaBolsoKinesiologia usuario={usuario} />
          </div>
        )}
        {tab === "eventos" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Gestión de Eventos</div>
              <div style={S.subtitle}>Crear y asignar equipos a eventos</div>
            </div>
            <VistaGestionEventos usuario={usuario} />
          </div>
        )}
        {tab === "atencionMedica" && tienePermiso("atencionMedica", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Atenciones Médicas</div>
              <div style={S.subtitle}>Evaluación y prescripción médica</div>
            </div>
            <VistaAtencionesMedicas usuario={usuario} carros={carros} />
          </div>
        )}
        {tab === "colaTriaje" && tienePermiso("colaTriaje", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>🚨 Cola de Triaje</div>
              <div style={S.subtitle}>Pacientes ordenados por urgencia · Se actualiza cada 30 segundos</div>
            </div>
            <ColaTriaje usuario={usuario} />
          </div>
        )}
        {tab === "adminMedicamentos" && tienePermiso("adminMedicamentos", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Administración de Medicamentos</div>
              <div style={S.subtitle}>Pendientes de administración</div>
            </div>
            <VistaAdministracionMedicamentos usuario={usuario} />
          </div>
        )}
        {tab === "atencionKine" && tienePermiso("atencionKine", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Atenciones de Kinesiología</div>
              <div style={S.subtitle}>Registro de atenciones con bolso individual</div>
            </div>
            <VistaAtencionesKinesiologia usuario={usuario} />
          </div>
        )}
        {tab === "masoterapia" && tienePermiso("masoterapia", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Masoterapia</div>
              <div style={S.subtitle}>Gestión de atenciones masivas y específicas</div>
            </div>
            <VistaMasoterapiaUnificada usuario={usuario} />
          </div>
        )}
        {tab === "configuracion" && tienePermiso("configuracion", usuario, esAdmin) && (
          <Configuracion industriaKey={industriaKey} setIndustriaKey={setIndustriaKey} usuario={usuario} />
        )}
        {tab === "usuarios" && tienePermiso("usuarios", usuario, esAdmin) && (
          <GestionUsuarios usuario={usuario} carros={carros} />
        )}
        {tab === "reportes" && tienePermiso("reportes", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Reportes</div>
              <div style={S.subtitle}>Análisis completo por evento</div>
            </div>
            <VistaReportes usuario={usuario} esAdmin={esAdmin} />
          </div>
        )}
        {tab === "costos" && tienePermiso("costos", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Valorización de Medicamentos</div>
              <div style={S.subtitle}>Costos por evento · Top medicamentos · Resumen global</div>
            </div>
            <VistaGestionCostos usuario={usuario} />
          </div>
        )}
        {tab === "preciosMeds" && tienePermiso("preciosMeds", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Precios de Medicamentos 💊</div>
              <div style={S.subtitle}>Edita el precio unitario de cada medicamento</div>
            </div>
            <GestionPreciosMedicamentos usuario={usuario} />
          </div>
        )}
        {tab === "preciosKine" && tienePermiso("preciosKine", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso Kines Maestro 🎒</div>
              <div style={S.subtitle}>Define el contenido y precios del bolso standard de kinesiología</div>
            </div>
            <GestionPreciosKinesiologia usuario={usuario} />
          </div>
        )}
        {tab === "insumosGrales" && tienePermiso("insumosGrales", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Insumos Generales 🔧</div>
              <div style={S.subtitle}>123 insumos · Edita precio, categoría y proveedor</div>
            </div>
            <GestionInsumosGenerales usuario={usuario} />
          </div>
        )}
        {tab === "historialMeds" && tienePermiso("historialMeds", usuario, esAdmin) && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Historial de Medicamentos</div>
              <div style={S.subtitle}>Auditoría completa de cambios · INSERT, UPDATE y DELETE con datos anteriores y nuevos</div>
            </div>
            <HistorialMedicamentos usuario={usuario} />
          </div>
        )}
        {tab === "historialPaciente" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Historial del Paciente</div>
              <div style={S.subtitle}>Busca todas las atenciones de un paciente por RUT o Pasaporte</div>
            </div>
            <HistorialPaciente usuario={usuario} />
          </div>
        )}
        {!tienePermiso(tab, usuario, esAdmin) && (
          <Dashboard carros={carros} usuario={usuario} esAdmin={esAdmin} permisos={permisos} onNavigate={setTab} />
        )}
      </main>

      <Toaster />

      {isMobile && (
        <>
          {/* ── Bottom nav bar ─────────────────────────────── */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: C.surface, borderTop: `1px solid ${C.border}`,
            display: "flex", zIndex: 200,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}>
            {primaryTabs.map(item => (
              <div
                key={item.id}
                onClick={() => { setTab(item.id); setMoreOpen(false); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "10px 4px 8px", cursor: "pointer",
                  position: "relative", minHeight: 56,
                  color: tab === item.id ? C.accent : C.textFaint,
                }}
              >
                {item.badge > 0 && (
                  <span style={{ position: "absolute", top: 6, right: "18%", background: C.red, color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 6, padding: "0 3px", minWidth: 14, textAlign: "center" }}>
                    {item.badge}
                  </span>
                )}
                <Icon name={item.icon} size={22} color={tab === item.id ? C.accent : C.textFaint} />
                <span style={{ fontSize: 10, fontWeight: tab === item.id ? 700 : 400, marginTop: 3, textAlign: "center", lineHeight: 1.2 }}>
                  {item.label}
                </span>
              </div>
            ))}
            {moreTabs.length > 0 && (
              <div
                onClick={() => setMoreOpen(prev => !prev)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "10px 4px 8px", cursor: "pointer",
                  minHeight: 56,
                  color: moreOpen ? C.accent : C.textFaint,
                }}
              >
                <Icon name="more" size={22} color={moreOpen ? C.accent : C.textFaint} />
                <span style={{ fontSize: 10, fontWeight: moreOpen ? 700 : 400, marginTop: 3 }}>Más</span>
              </div>
            )}
          </div>

          {/* ── "Más" overlay ──────────────────────────────── */}
          {moreOpen && (
            <div
              style={{ position: "fixed", inset: 0, background: "#00000070", zIndex: 190 }}
              onClick={() => setMoreOpen(false)}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
                  left: 0, right: 0,
                  background: C.surface,
                  borderRadius: "16px 16px 0 0",
                  padding: "12px 16px 20px",
                  borderTop: `1px solid ${C.border}`,
                  boxShadow: "0 -4px 24px #00000050",
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 14px" }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                  Más opciones
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {moreTabs.map(item => (
                    <div
                      key={item.id}
                      onClick={() => { setTab(item.id); setMoreOpen(false); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "12px 4px 10px", borderRadius: 10, cursor: "pointer",
                        minHeight: 64, gap: 6,
                        background: tab === item.id ? C.accentDim : C.surface2,
                        border: `1px solid ${tab === item.id ? C.accent + "40" : C.border}`,
                        color: tab === item.id ? C.accent : C.textMuted,
                      }}
                    >
                      <Icon name={item.icon} size={20} color={tab === item.id ? C.accent : C.textMuted} />
                      <span style={{ fontSize: 10, textAlign: "center", lineHeight: 1.3, fontWeight: tab === item.id ? 700 : 400 }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </EventoProvider>
  );
}
