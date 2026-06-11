import { useState, useEffect, useRef } from "react";
import { sb } from "../../config/supabase";
import { C } from "../../config/theme";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useEvento } from "../common/SelectorEvento";

const TRIAJE_CONFIG = {
  ROJO:     { color: "#ef4444", emoji: "🔴", label: "URGENTE",   orden: 1, maxEspera: 5   },
  AMARILLO: { color: "#f59e0b", emoji: "🟡", label: "MODERADO",  orden: 2, maxEspera: 30  },
  VERDE:    { color: "#10b981", emoji: "🟢", label: "LEVE",      orden: 3, maxEspera: 120 },
  NEGRO:    { color: "#6b7280", emoji: "⚫", label: "FALLECIDO", orden: 4, maxEspera: null },
};

export default function ColaTriaje({ usuario }) {
  const [cola,    setCola]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const alertasAnteriores = useRef(0);
  const { eventoActual } = useEvento();

  useEffect(() => {
    cargarCola();
    const interval = setInterval(cargarCola, 30000);
    return () => clearInterval(interval);
  }, [usuario, eventoActual]);

  const cargarCola = async () => {
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const filtroEvento = eventoActual ? `&evento_id=eq.${eventoActual}` : "";

      const atenciones = await sb(
        `atenciones_medicas?created_at=gte.${hoy}T00:00:00&order=created_at.asc&limit=200${filtroEvento}`,
        {}, usuario?.token
      );

      if (!atenciones) { setLoading(false); return; }

      const ahora = new Date();
      const colaOrdenada = atenciones
        .filter(a => a.codigo_triaje)
        .map(a => {
          const config   = TRIAJE_CONFIG[a.codigo_triaje] || TRIAJE_CONFIG.VERDE;
          const minutos  = Math.floor((ahora - new Date(a.created_at)) / 60000);
          const urgente  = config.maxEspera != null && minutos > config.maxEspera;
          return { ...a, config, minutosEspera: minutos, urgente };
        })
        .sort((a, b) => {
          if (a.config.orden !== b.config.orden) return a.config.orden - b.config.orden;
          return b.minutosEspera - a.minutosEspera;
        });

      const urgentesActuales = colaOrdenada.filter(a => a.urgente).length;
      if (urgentesActuales > alertasAnteriores.current) {
        toast({
          title: "⚠️ ALERTA DE TRIAJE",
          description: `${urgentesActuales} paciente(s) exceden el tiempo crítico de espera`,
          variant: "destructive",
        });
      }
      alertasAnteriores.current = urgentesActuales;

      setCola(colaOrdenada);
      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error("Error cargando cola:", error);
    } finally {
      setLoading(false);
    }
  };

  const rojos    = cola.filter(a => a.codigo_triaje === "ROJO").length;
  const amarillos = cola.filter(a => a.codigo_triaje === "AMARILLO").length;
  const urgentes  = cola.filter(a => a.urgente).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.red }}>
                <AlertTriangle size={18} /> Cola de Triaje
              </h2>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                Pacientes de hoy ordenados por urgencia · Auto-actualiza cada 30 seg
                {ultimaActualizacion && ` · Última actualización: ${ultimaActualizacion.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={cargarCola} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: C.accent }}>{cola.length}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>Total en cola hoy</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: rojos > 0 ? "#ef444440" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: rojos > 0 ? "#ef4444" : C.textMuted }}>{rojos}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>🔴 Urgentes</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: amarillos > 0 ? "#f59e0b40" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: amarillos > 0 ? "#f59e0b" : C.textMuted }}>{amarillos}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>🟡 Moderados</div>
          </CardContent>
        </Card>
        <Card style={{ borderColor: urgentes > 0 ? "#ef444440" : undefined, background: urgentes > 0 ? "#ef444408" : undefined }}>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold" style={{ color: urgentes > 0 ? "#ef4444" : C.green }}>{urgentes}</div>
            <div className="text-xs mt-1" style={{ color: C.textMuted }}>Con retraso crítico</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Lista ordenada ─────────────────────────────────── */}
      {loading ? (
        <Card><CardContent className="p-8 text-center" style={{ color: C.textMuted }}>Cargando cola de triaje...</CardContent></Card>
      ) : cola.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div className="font-semibold" style={{ color: C.text }}>Cola vacía</div>
            <div className="text-sm mt-1" style={{ color: C.textMuted }}>No hay pacientes registrados hoy{eventoActual ? " para este evento" : ""}. Las atenciones nuevas se crean en la pestaña <strong>Prescripción</strong> y aparecen aquí ordenadas por urgencia.</div>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cola.map((paciente, idx) => (
            <Card
              key={paciente.id}
              style={{
                borderLeft: `4px solid ${paciente.config.color}`,
                borderColor: paciente.urgente ? paciente.config.color : undefined,
                background: paciente.urgente ? `${paciente.config.color}08` : undefined,
                animation: paciente.codigo_triaje === "ROJO" && paciente.urgente ? "pulse 2s infinite" : undefined,
              }}
            >
              <CardContent className="p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

                  {/* Posición */}
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.border, minWidth: 36, textAlign: "center" }}>
                    {idx + 1}
                  </div>

                  {/* Badge triaje */}
                  <div style={{
                    background: `${paciente.config.color}20`,
                    border: `2px solid ${paciente.config.color}`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    minWidth: 120,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18 }}>{paciente.config.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: paciente.config.color, letterSpacing: 1 }}>
                      {paciente.config.label}
                    </div>
                  </div>

                  {/* Info paciente */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{paciente.paciente_nombre}</div>
                    {paciente.paciente_rut && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>RUT: {paciente.paciente_rut}</div>
                    )}
                    {paciente.motivo_consulta && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                        {paciente.motivo_consulta.slice(0, 60)}{paciente.motivo_consulta.length > 60 ? "…" : ""}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
                      {new Date(paciente.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      {paciente.evento && ` · ${paciente.evento}`}
                    </div>
                  </div>

                  {/* Tiempo espera */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <Clock size={14} style={{ color: paciente.urgente ? "#ef4444" : C.textMuted }} />
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: paciente.urgente ? "#ef4444" : C.text,
                      }}>
                        {paciente.minutosEspera} min
                      </span>
                    </div>
                    {paciente.config.maxEspera != null && (
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                        Máx: {paciente.config.maxEspera} min
                      </div>
                    )}
                    {paciente.urgente && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                        <AlertTriangle size={11} /> TIEMPO EXCEDIDO
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
