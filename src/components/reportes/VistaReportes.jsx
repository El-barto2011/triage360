import { useState, useEffect } from "react";
import { C, S, Icon } from "../../config/theme";
import { sb } from "../../config/supabase";

export function VistaReportes({ usuario, esAdmin }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [datosReporte, setDatosReporte] = useState(null);
  const [modal, setModal] = useState(null);

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
      if (evs.length > 0 && eventoSeleccionado === "todos") {
        setEventoSeleccionado(evs[0].nombre_evento);
      }
    }
    setLoading(false);
  };

  const generarReporte = async () => {
    if (!eventoSeleccionado || eventoSeleccionado === "todos") return;

    setLoading(true);

    // Cargar todas las atenciones del evento
    const [
      atencionesKine,
      atencionesMed,
      adminMed,
      masoterapiaMasiva,
      fichasMasoterapia
    ] = await Promise.all([
      sb(`atenciones_kinesiologia?evento=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`atenciones_medicas?evento=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`administracion_medicamentos?order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_masoterapia_masiva?evento=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`fichas_masoterapia?evento=eq.${eventoSeleccionado}`, {}, usuario?.token)
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
    const eventoObj = eventos.find(e => e.nombre_evento === eventoSeleccionado);
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
              <option key={ev.id} value={ev.nombre_evento}>
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
