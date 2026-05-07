import { useState, useEffect } from "react";
import { C, S } from "../../config/theme";
import { sb } from "../../config/supabase";
import { diasHastaVenc, estadoVenc, estadoStock, MEDICAMENTOS_INYECTABLES, MEDICAMENTOS_ORALES, MEDICAMENTOS_AEROSOLES } from "../../config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import {
  Truck, Package, Pill, AlertTriangle, TrendingDown,
  DollarSign, TrendingUp, TrendingDown as TrendDown, Minus,
  Backpack, CheckCircle2, XCircle, ChevronRight, Activity,
  ShieldAlert,
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {label}
            </p>
            <p className="text-3xl font-extrabold leading-none" style={{ color: accent }}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="rounded-lg p-2 opacity-20" style={{ background: accent }}>
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
  const todosInsumos  = carros.flatMap(c => c.insumos);
  const todosMeds     = [...MEDICAMENTOS_INYECTABLES, ...MEDICAMENTOS_ORALES, ...MEDICAMENTOS_AEROSOLES];
  const todo          = [...todosInsumos, ...todosMeds];
  const alertasVenc   = todo.filter(i => estadoVenc(i.vencimiento) !== "ok");
  const stockBajo     = todo.filter(i => estadoStock(i) !== "ok");

  const [costoMes,    setCostoMes]    = useState(null);
  const [costoMesAnt, setCostoMesAnt] = useState(null);
  const [invData,     setInvData]     = useState(null);
  const [loading,     setLoading]     = useState(true);

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

      {/* ── KPI grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Carros activos"       value={carros.length}         icon={Truck}          accent={C.accent} />
        <StatCard label="Insumos en carros"    value={todosInsumos.length}   icon={Package}        accent={C.blue} />
        <StatCard label="Medicamentos bolso"   value={todosMeds.length}      icon={Pill}           accent={C.orange} />
        <StatCard
          label="Alertas vencimiento"
          value={alertasVenc.length}
          icon={AlertTriangle}
          accent={alertasVenc.length > 0 ? C.red : C.green}
        />
        <StatCard
          label="Stock bajo mínimo"
          value={stockBajo.length}
          icon={TrendingDown}
          accent={stockBajo.length > 0 ? C.yellow : C.green}
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

      {/* ── Estado de carros ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck size={15} style={{ color: C.accent }} />
            Estado de Carros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {carros.map(c => {
              const alertas = c.insumos.filter(i =>
                estadoVenc(i.vencimiento) !== "ok" || estadoStock(i) !== "ok"
              ).length;
              return (
                <div
                  key={c.id}
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
                  <p className="text-xs" style={{ color: C.textMuted }}>{c.insumos.length} insumos</p>
                  <p className="text-xs mt-0.5" style={{ color: c.evento_asignado === "Sin asignar" ? C.textFaint : C.text }}>
                    {c.evento_asignado === "Sin asignar" ? "Sin evento asignado" : `📍 ${c.evento_asignado}`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Alertas críticas ────────────────────────────────── */}
      {(alertasVenc.length > 0 || stockBajo.length > 0) && (
        <Card style={{ borderLeft: `3px solid ${C.red}` }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-400" />
              Alertas Críticas
              <Badge variant="danger" className="ml-auto">
                {alertasVenc.length + stockBajo.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todo.filter(i => estadoVenc(i.vencimiento) === "vencido").map(i => (
              <AlertRow key={`v-${i.id}`} type="vencido" item={i} />
            ))}
            {todo.filter(i => estadoVenc(i.vencimiento) === "proximo").map(i => (
              <AlertRow key={`p-${i.id}`} type="proximo" item={i} />
            ))}
            {todo.filter(i => estadoStock(i) !== "ok").map(i => (
              <AlertRow key={`s-${i.id}`} type="stock"  item={i} />
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
