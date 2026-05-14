import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";
import { diasHastaVenc, estadoVenc, estadoStock, MEDICAMENTOS_INYECTABLES, MEDICAMENTOS_ORALES, MEDICAMENTOS_AEROSOLES } from "../../config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import { useEvento } from "../common/SelectorEvento";
import {
  Truck, Package, Pill, AlertTriangle, TrendingDown,
  DollarSign, TrendingUp, TrendingDown as TrendDown, Minus,
  Backpack, CheckCircle2, XCircle, ChevronRight, Activity,
  ShieldAlert, CalendarDays, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const fmt = (n) => n != null ? `$${Number(n).toLocaleString("es-CL")}` : "—";

/* ── Custom Recharts tooltip ─────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-primary">{fmt(payload[0]?.value)}</p>
    </div>
  );
};

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accent, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-l-4 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
      )}
      style={{ borderLeftColor: accent }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {label}
            </p>
            <p className="text-3xl font-extrabold leading-none truncate" style={{ color: accent }}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="rounded-lg p-2 opacity-20 shrink-0" style={{ background: accent }}>
              <Icon size={20} color={accent} style={{ opacity: 5 }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Alert row ───────────────────────────────────────────── */
function AlertRow({ type, item }) {
  const isVencido = type === "vencido";
  const isProximo = type === "proximo";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        isVencido && "border-red-500/20 bg-red-500/10",
        isProximo && "border-yellow-500/20 bg-yellow-500/10",
        !isVencido && !isProximo && "border-yellow-500/20 bg-yellow-500/10",
      )}
    >
      <AlertTriangle
        size={15}
        className={cn("mt-0.5 shrink-0", isVencido ? "text-red-400" : "text-yellow-400")}
      />
      <div>
        <span className={cn("font-bold", isVencido ? "text-red-400" : "text-yellow-400")}>
          {isVencido ? "VENCIDO" : isProximo ? "Próximo a vencer" : "Stock bajo"}
          {": "}
        </span>
        <span className="text-foreground">
          {item.nombre} {item.dosis || ""}
          {isVencido && ` — venció ${new Date(item.vencimiento).toLocaleDateString("es-CL")}`}
          {isProximo && ` — ${diasHastaVenc(item.vencimiento)} días`}
          {type === "stock" && ` — ${item.stock}/${item.minimo} ${item.unidad}`}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export function Dashboard({ carros, usuario, esAdmin, permisos, onNavigate }) {
  const { eventoActual, eventos } = useEvento();
  const eventoObj = eventos.find(e => e.id === eventoActual);

  const todosMeds = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];

  const [carrosDB,      setCarrosDB]      = useState([]);
  const [atencionesHoy, setAtencionesHoy] = useState(null);
  const [atencionesMes, setAtencionesMes] = useState(null);
  const [costoMes,      setCostoMes]      = useState(null);
  const [costoMesAnt,   setCostoMesAnt]   = useState(null);
  const [invData,       setInvData]       = useState(null);
  const [loading,       setLoading]       = useState(true);

  // Datos en tiempo real para todos los usuarios
  useEffect(() => {
    if (!usuario?.token) return;
    const hoyISO    = new Date().toISOString().split("T")[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    Promise.all([
      sb("contenedores_medicamentos?tipo=eq.carro&select=nombre,stock,minimo,fecha_vencimiento,nombre_insumo,cajon,unidad", {}, usuario.token),
      sb(`atenciones_medicas?created_at=gte.${hoyISO}&select=id`, {}, usuario.token),
      sb(`atenciones_medicas?created_at=gte.${inicioMes}&select=id`, {}, usuario.token),
    ]).then(([data, hoy, mes]) => {
      if (data) setCarrosDB(data);
      setAtencionesHoy(hoy?.length ?? 0);
      setAtencionesMes(mes?.length ?? 0);
    });
  }, [usuario?.token]);

  // Costos e inventario valorizado — solo admin
  useEffect(() => {
    if (!esAdmin || !usuario?.token) { setLoading(false); return; }
    const cargar = async () => {
      setLoading(true);
      const [costos, inv] = await Promise.all([
        sb("vista_costos_medicamentos_por_evento", {}, usuario.token),
        sb("vista_valor_inventario_completo_v3",   {}, usuario.token),
      ]);

      if (costos) {
        const hoy        = new Date();
        const mesActual  = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        const mesAnt     = mesActual === 0 ? 11 : mesActual - 1;
        const anioAnt    = mesActual === 0 ? anioActual - 1 : anioActual;
        const sumar = (mes, anio) =>
          costos
            .filter(r => { const f = new Date(r.fecha_evento ?? r.fecha ?? 0); return f.getMonth() === mes && f.getFullYear() === anio; })
            .reduce((s, r) => s + (r.costo_total ?? 0), 0);
        setCostoMes(sumar(mesActual, anioActual));
        setCostoMesAnt(sumar(mesAnt, anioAnt));
      }

      if (inv) {
        const rows  = Array.isArray(inv) ? inv : [inv];
        const total = rows.find(r => (r.categoria ?? "").toUpperCase() === "TOTAL") || rows[rows.length - 1] || {};
        const cats  = rows.filter(r => (r.categoria ?? "").toUpperCase() !== "TOTAL");
        setInvData({
          valorTotal: total.valor_total ?? total.valor ?? rows.reduce((s, r) => s + (r.valor_total ?? 0), 0),
          totalItems: total.total_items ?? total.total ?? rows.reduce((s, r) => s + (r.total_items ?? 0), 0),
          conPrecio:  total.items_con_precio ?? rows.reduce((s, r) => s + (r.items_con_precio ?? 0), 0),
          categorias: cats.map(r => ({ nombre: r.categoria ?? "—", valor: r.valor_total ?? r.valor ?? null })),
        });
      }
      setLoading(false);
    };
    cargar();
  }, [esAdmin, usuario?.token]);

  // Métricas calculadas desde DB de carros
  const totalInsumosDB  = carrosDB.length;
  const alertasVencDB   = carrosDB.filter(i => i.fecha_vencimiento && estadoVenc(i.fecha_vencimiento) !== "ok");
  const stockBajoDB     = carrosDB.filter(i => estadoStock({ stock: Number(i.stock), minimo: Number(i.minimo) }) !== "ok");

  // Alertas del bolso (aún desde constantes estáticas)
  const alertasVencMeds = todosMeds.filter(i => estadoVenc(i.vencimiento) !== "ok");
  const stockBajoMeds   = todosMeds.filter(i => estadoStock(i) !== "ok");

  const totalAlertasVenc = alertasVencDB.length + alertasVencMeds.length;
  const totalStockBajo   = stockBajoDB.length + stockBajoMeds.length;

  // Agrupar filas DB por nombre de carro para la sección Estado de Carros
  const carrosAgrupados = Object.entries(
    carrosDB.reduce((acc, item) => {
      acc[item.nombre] = acc[item.nombre] || [];
      acc[item.nombre].push(item);
      return acc;
    }, {})
  ).map(([nombre, items]) => ({
    nombre,
    items,
    color: carros.find(c => c.nombre === nombre)?.color ?? C.accent,
  }));

  // Normalizar filas DB para AlertRow (unificar nombres de campo con los estáticos)
  const carrosDBNorm = carrosDB.map((i, idx) => ({
    ...i,
    id: `db-${idx}`,
    nombre: i.nombre_insumo,
    vencimiento: i.fecha_vencimiento,
    stock: Number(i.stock),
    minimo: Number(i.minimo),
  }));
  const todoAlertas = [...carrosDBNorm, ...todosMeds];

  const diffPct = costoMes != null && costoMesAnt != null && costoMesAnt > 0
    ? Math.round(((costoMes - costoMesAnt) / costoMesAnt) * 100)
    : null;

  /* Colores arcoíris para las barras del gráfico */
  const BAR_COLORS = [C.accent, C.blue, C.orange, C.purple, C.green, C.yellow];

  const chartData = invData?.categorias
    ?.filter(c => c.valor != null && c.valor > 0)
    .map(c => ({ name: c.nombre, valor: c.valor })) ?? [];

  const today = new Date().toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.text }}>
          {esAdmin ? "Dashboard Operacional" : `Bienvenido/a, ${usuario?.nombre?.split(" ")[0]}`}
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          {esAdmin
            ? `TRIAGE360 · ${today}`
            : usuario?.evento_asignado
              ? `📍 Evento asignado: ${usuario.evento_asignado}`
              : "Sin evento asignado hoy"}
        </p>
      </div>

      {/* ── Panel permisos (no-admin) ───────────────────────── */}
      {!esAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity size={15} style={{ color: C.accent }} />
              {usuario?.profesion} — Permisos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Registrar atenciones",      ok: true },
                { label: "Recetar medicamentos",       ok: permisos?.recetarMedicamentos },
                { label: "Ver inventario carro",       ok: permisos?.verInventario },
                { label: "Modificar stock",            ok: permisos?.modificarStock },
                { label: "Ver bolso medicamentos",     ok: permisos?.verBolso },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {ok
                    ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                    : <XCircle     size={13} className="text-red-400 shrink-0" />}
                  <span style={{ color: ok ? C.text : C.textMuted }}>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI inventario ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Carros activos"
          value={carrosAgrupados.length || carros.length}
          icon={Truck}
          accent={C.accent}
        />
        <StatCard
          label="Insumos en carros"
          value={totalInsumosDB}
          icon={Package}
          accent={C.blue}
        />
        <StatCard
          label="Medicamentos bolso"
          value={todosMeds.length}
          icon={Pill}
          accent={C.orange}
        />
        <StatCard
          label="Alertas vencimiento"
          value={totalAlertasVenc}
          icon={AlertTriangle}
          accent={totalAlertasVenc > 0 ? C.red : C.green}
        />
        <StatCard
          label="Stock bajo mínimo"
          value={totalStockBajo}
          icon={TrendingDown}
          accent={totalStockBajo > 0 ? C.yellow : C.green}
        />
      </div>

      {/* ── KPI operacional — todos los usuarios ───────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Atenciones hoy"
          value={atencionesHoy ?? "—"}
          icon={CalendarDays}
          accent={C.green}
          onClick={() => onNavigate?.("atenciones")}
        />
        <StatCard
          label="Atenciones este mes"
          value={atencionesMes ?? "—"}
          icon={CalendarDays}
          accent={C.blue}
          onClick={() => onNavigate?.("atenciones")}
        />
        <StatCard
          label="Evento activo"
          value={eventoObj?.nombre_evento ?? "Sin evento"}
          icon={Zap}
          accent={eventoObj ? C.accent : C.textMuted}
          onClick={esAdmin ? () => onNavigate?.("eventos") : undefined}
        />
      </div>

      {/* ── Inventario + gráfico (admin) ────────────────────── */}
      {esAdmin && (
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Tarjeta valor inventario — col 3 */}
          <Card
            className="lg:col-span-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ borderLeft: `3px solid ${C.accent}` }}
            onClick={() => onNavigate?.("costos")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <DollarSign size={15} style={{ color: C.accent }} />
                  Valor del Inventario
                </span>
                {onNavigate && <ChevronRight size={15} style={{ color: C.textMuted }} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-extrabold leading-none" style={{ color: C.accent }}>
                    {fmt(invData?.valorTotal)}
                  </div>

                  {invData && (
                    <>
                      <div className="text-xs" style={{ color: C.textMuted }}>
                        Items valorizados:{" "}
                        <strong style={{ color: C.text }}>{invData.conPrecio}</strong> / {invData.totalItems}
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${invData.totalItems > 0 ? Math.round((invData.conPrecio / invData.totalItems) * 100) : 0}%`,
                            background: invData.totalItems > 0 && Math.round((invData.conPrecio / invData.totalItems) * 100) === 100 ? C.green : C.accent,
                          }}
                        />
                      </div>
                      <div className="text-xs" style={{ color: C.textFaint }}>
                        {invData.totalItems > 0 ? Math.round((invData.conPrecio / invData.totalItems) * 100) : 0}% completado
                      </div>

                      <Separator />

                      {/* Desglose por categoría */}
                      <div className="space-y-1.5">
                        {invData.categorias.map(cat => (
                          <div key={cat.nombre} className="flex justify-between text-sm">
                            <span style={{ color: C.textMuted }}>{cat.nombre}</span>
                            <span className="font-semibold" style={{ color: C.text }}>
                              {cat.valor != null ? fmt(cat.valor) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Gasto del mes */}
                      {costoMes != null && (
                        <>
                          <Separator />
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.textMuted }}>
                                Gasto este mes
                              </p>
                              <p className="text-lg font-extrabold mt-0.5" style={{ color: C.orange }}>
                                {fmt(costoMes)}
                              </p>
                            </div>
                            {diffPct != null && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1 text-xs font-bold",
                                  diffPct > 0 ? "border-red-500/40 text-red-400"
                                  : diffPct < 0 ? "border-green-500/40 text-green-400"
                                  : "border-border text-muted-foreground"
                                )}
                              >
                                {diffPct > 0 ? <TrendingUp size={11} /> : diffPct < 0 ? <TrendDown size={11} /> : <Minus size={11} />}
                                {diffPct > 0 ? `+${diffPct}%` : diffPct < 0 ? `${diffPct}%` : "Sin cambio"} vs mes ant.
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Gráfico inventario por categoría — col 2 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity size={15} style={{ color: C.blue }} />
                Distribución por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-end gap-2 h-40 pt-4">
                  {[60, 90, 45, 75, 55].map((h, i) => (
                    <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: C.textMuted }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <ReTooltip content={<ChartTooltip />} cursor={{ fill: `${C.accent}10` }} />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-xs" style={{ color: C.textFaint }}>
                  Sin datos de valorización
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Bolso Kines Standard (admin) ────────────────────── */}
      {esAdmin && invData && (() => {
        const bolsoCat  = invData.categorias?.find(c => c.nombre?.toLowerCase().includes("kines") || c.nombre?.toLowerCase().includes("bolso"));
        const valorBolso = bolsoCat?.valor ?? null;
        return (
          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ borderLeft: `3px solid ${C.purple}` }}
            onClick={() => onNavigate?.("preciosKine")}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{ background: `${C.purple}15` }}>
                    <Backpack size={18} style={{ color: C.purple }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>
                      Bolso Kines Standard
                    </p>
                    <p className="text-2xl font-extrabold leading-none" style={{ color: C.purple }}>
                      {valorBolso != null ? fmt(valorBolso) : "—"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>30 items · 111 unidades</p>
                  </div>
                </div>
                {onNavigate && (
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.purple }}>
                    Editar bolso <ChevronRight size={14} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Estado de Carros ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck size={15} style={{ color: C.accent }} />
            Estado de Carros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {carrosAgrupados.map(c => {
              const alertas = c.items.filter(i =>
                (i.fecha_vencimiento && estadoVenc(i.fecha_vencimiento) !== "ok") ||
                estadoStock({ stock: Number(i.stock), minimo: Number(i.minimo) }) !== "ok"
              ).length;
              return (
                <div
                  key={c.nombre}
                  className="rounded-lg border p-3 transition-colors hover:bg-accent/10"
                  style={{ borderLeft: `3px solid ${c.color}`, borderColor: C.border, borderLeftColor: c.color }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: c.color }}>{c.nombre}</span>
                    {alertas > 0 && (
                      <Badge variant="danger" className="text-xs px-1.5 py-0">
                        {alertas} ⚠️
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: C.textMuted }}>{c.items.length} insumos</p>
                </div>
              );
            })}
            {carrosAgrupados.length === 0 && (
              <p className="text-xs col-span-full text-center py-4" style={{ color: C.textFaint }}>
                Cargando datos de carros...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Alertas críticas ────────────────────────────────── */}
      {(totalAlertasVenc > 0 || totalStockBajo > 0) && (
        <Card style={{ borderLeft: `3px solid ${C.red}` }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-400" />
              Alertas Críticas
              <Badge variant="danger" className="ml-auto">
                {totalAlertasVenc + totalStockBajo}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoAlertas.filter(i => estadoVenc(i.vencimiento) === "vencido").map(i => (
              <AlertRow key={`v-${i.id}`} type="vencido" item={i} />
            ))}
            {todoAlertas.filter(i => estadoVenc(i.vencimiento) === "proximo").map(i => (
              <AlertRow key={`p-${i.id}`} type="proximo" item={i} />
            ))}
            {todoAlertas.filter(i => estadoStock(i) !== "ok").map(i => (
              <AlertRow key={`s-${i.id}`} type="stock" item={i} />
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
