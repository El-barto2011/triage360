import { useState, useEffect } from "react";
import { C, S, Icon } from "./config/theme";
import { MEDICAMENTOS_INYECTABLES, MEDICAMENTOS_ORALES, MEDICAMENTOS_AEROSOLES, CARROS_INICIALES, estadoVenc, estadoStock } from "./config/constants";
import { getIndustria, getPermisos } from "./config/permisos";
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
import { Toaster } from "./components/ui/toaster";
import { toast } from "./components/ui/use-toast";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [carros, setCarros] = useState(CARROS_INICIALES);
  const [usuario, setUsuario] = useState(null);
  const [industriaKey, setIndustriaKey] = useState("eventos");
  const industria = getIndustria(industriaKey);
  const isMobile = useIsMobile();

  const handleLogin = (user) => setUsuario(user);
  const handleLogout = () => setUsuario(null);

  // Registrar handler global de errores de red para supabase.js
  useEffect(() => {
    window.__toastError = (msg) => toast({ title: "Error de conexión", description: msg, variant: "destructive" });
    return () => { delete window.__toastError; };
  }, []);

  if (!usuario) return <Login onLogin={handleLogin} />;

  const esAdmin = usuario?.rol === "admin";
  const permisos = getPermisos(usuario);
  const allMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const alertCarros = 0;
  const alertBolso = allMeds.filter(i => estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok").length;

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
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>TRIAGE<span style={{ color: C.text }}>360</span></div>
          <button style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={handleLogout}>Salir</button>
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
        {tab === "bolsoKine" && (
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
        {tab === "atencionMedica" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Atenciones Médicas</div>
              <div style={S.subtitle}>Evaluación y prescripción médica</div>
            </div>
            <VistaAtencionesMedicas usuario={usuario} carros={carros} />
          </div>
        )}
        {tab === "colaTriaje" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>🚨 Cola de Triaje</div>
              <div style={S.subtitle}>Pacientes ordenados por urgencia · Se actualiza cada 30 segundos</div>
            </div>
            <ColaTriaje usuario={usuario} />
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
        {tab === "masoterapia" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Masoterapia</div>
              <div style={S.subtitle}>Gestión de atenciones masivas y específicas</div>
            </div>
            <VistaMasoterapiaUnificada usuario={usuario} />
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
              <div style={S.title}>Valorización de Medicamentos</div>
              <div style={S.subtitle}>Costos por evento · Top medicamentos · Resumen global</div>
            </div>
            <VistaGestionCostos usuario={usuario} />
          </div>
        )}
        {tab === "preciosMeds" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Precios de Medicamentos 💊</div>
              <div style={S.subtitle}>Edita el precio unitario de cada medicamento</div>
            </div>
            <GestionPreciosMedicamentos usuario={usuario} />
          </div>
        )}
        {tab === "preciosKine" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Bolso Kines Maestro 🎒</div>
              <div style={S.subtitle}>Define el contenido y precios del bolso standard de kinesiología</div>
            </div>
            <GestionPreciosKinesiologia usuario={usuario} />
          </div>
        )}
        {tab === "insumosGrales" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={S.title}>Insumos Generales 🔧</div>
              <div style={S.subtitle}>123 insumos · Edita precio, categoría y proveedor</div>
            </div>
            <GestionInsumosGenerales usuario={usuario} />
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
      </main>

      <Toaster />

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
    </EventoProvider>
  );
}
