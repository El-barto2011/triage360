import { useState, useEffect, useMemo } from "react";
import { C } from "../../config/theme";
import { sb } from "../../config/supabase";
import { CAJONES_META } from "../../config/constants";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../../lib/utils";
import { ArrowUpDown, Search, Save, Pencil, X, Truck, AlertTriangle } from "lucide-react";

const CARRO_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#06b6d4"];

export function VistaCarrosClinicosDB({ usuario }) {
  const [carros,          setCarros]          = useState([]);
  const [carroSel,        setCarroSel]        = useState(null);
  const [cajonAbierto,    setCajonAbierto]    = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [editando,        setEditando]        = useState(null);
  const [formEdit,        setFormEdit]        = useState({});
  const [carrosPermitidos,setCarrosPermitidos]= useState([]);

  /* TanStack state */
  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const esAdmin = usuario?.rol === "admin";

  /* ── Data loading (unchanged) ───────────────────────── */
  const cargarCarros = async () => {
    if (esAdmin) {
      const data = await sb("contenedores_medicamentos?tipo=eq.carro&select=*", {}, usuario?.token);
      if (data) {
        setCarros(data);
        setCarrosPermitidos(["Carro 1","Carro 2","Carro 3","Carro 4","Carro 5","Carro 6","Carro 7"]);
        if (data.length > 0 && !carroSel) setCarroSel(data[0].nombre);
      }
    } else {
      const eventos = await sb("equipos_evento?estado=eq.activo", {}, usuario?.token);
      let carrosAsignados = [];
      if (eventos) {
        eventos.forEach(ev => {
          const estaAsignado =
            (ev.medicos     || []).includes(usuario.id) ||
            (ev.enfermeros  || []).includes(usuario.id) ||
            (ev.paramedicos || []).includes(usuario.id);
          if (estaAsignado && ev.carros_asignados)
            carrosAsignados = [...carrosAsignados, ...ev.carros_asignados];
        });
      }
      carrosAsignados = [...new Set(carrosAsignados)];
      setCarrosPermitidos(carrosAsignados);
      if (carrosAsignados.length > 0) {
        const data = await sb("contenedores_medicamentos?tipo=eq.carro&select=*", {}, usuario?.token);
        if (data) {
          const filtrados = data.filter(c => carrosAsignados.includes(c.nombre));
          setCarros(filtrados);
          if (filtrados.length > 0 && !carroSel) setCarroSel(filtrados[0].nombre);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { cargarCarros(); }, []);

  /* ── Helpers (unchanged) ────────────────────────────── */
  const carroActual       = carros.filter(c => c.nombre === carroSel);
  const insumosCajon      = (id) => carroActual.filter(i => i.cajon === id);
  const alertasCajon      = (id) => insumosCajon(id).filter(i => i.stock <= i.minimo).length;
  const alertasCarro      = (n)  => carros.filter(c => c.nombre === n && c.stock <= c.minimo).length;
  const carrosUnicos      = [...new Set(carros.map(c => c.nombre))];
  const toggleCajon       = (id) => { setCajonAbierto(p => p === id ? null : id); setGlobalFilter(""); setSorting([]); };

  const abrirEditar  = (insumo) => { setEditando(insumo.id); setFormEdit({ stock: insumo.stock, minimo: insumo.minimo }); };
  const cancelarEdit = ()       => setEditando(null);

  const guardarEdicion = async (id) => {
    await sb(`contenedores_medicamentos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: +formEdit.stock, minimo: +formEdit.minimo }),
    }, usuario?.token);
    setEditando(null);
    cargarCarros();
  };

  /* ── TanStack columns ───────────────────────────────── */
  const columns = useMemo(() => [
    {
      accessorFn: (row) => row.nombre_insumo || "",
      id: "nombre_insumo",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medicamento <ArrowUpDown size={11} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-sm">{row.original.nombre_insumo || "Sin nombre"}</span>
      ),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock <ArrowUpDown size={11} />
        </button>
      ),
      cell: ({ row }) => {
        const ins = row.original;
        const bajStock = ins.stock <= ins.minimo;
        if (editando === ins.id) {
          return (
            <Input
              type="number"
              value={formEdit.stock}
              onChange={e => setFormEdit(f => ({ ...f, stock: e.target.value }))}
              className="w-16 h-7 text-center text-xs"
            />
          );
        }
        return (
          <span className={cn("font-semibold", bajStock ? "text-red-400" : "")}>
            {ins.stock}
          </span>
        );
      },
    },
    {
      accessorKey: "minimo",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mínimo <ArrowUpDown size={11} />
        </button>
      ),
      cell: ({ row }) => {
        const ins = row.original;
        if (editando === ins.id) {
          return (
            <Input
              type="number"
              value={formEdit.minimo}
              onChange={e => setFormEdit(f => ({ ...f, minimo: e.target.value }))}
              className="w-16 h-7 text-center text-xs"
            />
          );
        }
        return <span className="text-xs text-muted-foreground">{ins.minimo}</span>;
      },
    },
    {
      accessorKey: "unidad",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Unidad</span>,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.unidad}</span>,
    },
    {
      id: "estado",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Estado</span>,
      cell: ({ row }) => {
        const ins = row.original;
        if (ins.stock === 0)        return <Badge variant="danger"  className="text-xs">Agotado</Badge>;
        if (ins.stock <= ins.minimo) return <Badge variant="warning" className="text-xs">Stock bajo</Badge>;
        return <Badge variant="success" className="text-xs">OK</Badge>;
      },
    },
    {
      id: "acciones",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Acciones</span>,
      cell: ({ row }) => {
        const ins = row.original;
        if (editando === ins.id) {
          return (
            <div className="flex gap-1.5">
              <Button size="sm" variant="teal"  className="h-7 text-xs px-2" onClick={() => guardarEdicion(ins.id)}>
                <Save size={11} /> Guardar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={cancelarEdit}>
                <X size={11} />
              </Button>
            </div>
          );
        }
        return (
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => abrirEditar(ins)}>
            <Pencil size={11} /> Editar
          </Button>
        );
      },
    },
  ], [editando, formEdit]);

  /* ── TanStack table instance ────────────────────────── */
  const tableData = useMemo(
    () => cajonAbierto ? insumosCajon(cajonAbierto) : [],
    [cajonAbierto, carros, carroSel]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state:  { sorting, globalFilter },
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  /* ── Early returns ──────────────────────────────────── */
  if (loading) return <div className="p-10 text-center text-sm" style={{ color: C.textMuted }}>Cargando carros...</div>;

  if (!esAdmin && carrosPermitidos.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <div className="text-5xl mb-4">🚑</div>
          <p className="text-lg font-bold mb-2">No tienes carros asignados</p>
          <p className="text-sm" style={{ color: C.textMuted }}>Solicita al administrador que te asigne a un evento con un carro clínico.</p>
        </CardContent>
      </Card>
    );
  }

  const cajonMeta  = CAJONES_META.find(c => c.id === cajonAbierto);
  const carroColor = CARRO_COLORS[carrosUnicos.indexOf(carroSel) % CARRO_COLORS.length];

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="flex gap-4">

      {/* ── Sidebar: selección de carro ─────────────────── */}
      <div className="w-44 shrink-0 space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.textFaint }}>
          Seleccionar carro
        </p>
        {carrosUnicos.map((nombre, idx) => {
          const alertas = alertasCarro(nombre);
          const activo  = carroSel === nombre;
          const color   = CARRO_COLORS[idx % CARRO_COLORS.length];
          const total   = carros.filter(c => c.nombre === nombre).length;
          return (
            <div
              key={nombre}
              onClick={() => { setCarroSel(nombre); setCajonAbierto(null); setGlobalFilter(""); }}
              className="rounded-lg border p-3 cursor-pointer transition-all"
              style={{
                borderLeft:   `3px solid ${color}`,
                borderColor:  activo ? `${color}50` : C.border,
                borderLeftColor: color,
                background:   activo ? C.surface : "transparent",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: activo ? C.text : C.textMuted }}>{nombre}</span>
                {alertas > 0 && (
                  <span className="text-xs font-bold text-white rounded-full px-1.5 py-0.5" style={{ background: C.red, fontSize: 9 }}>{alertas}</span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{total} meds.</p>
            </div>
          );
        })}
      </div>

      {/* ── Detalle del carro ───────────────────────────── */}
      <div className="flex-1 space-y-4">
        {carroSel && (
          <>
            {/* Header carro */}
            <Card style={{ borderLeft: `3px solid ${carroColor}` }}>
              <CardContent className="p-5">
                <h2 className="text-xl font-extrabold" style={{ color: carroColor }}>{carroSel}</h2>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                  {carroActual.length} medicamentos totales · {CAJONES_META.length} cajones
                </p>
              </CardContent>
            </Card>

            {/* Grid de cajones */}
            <div className="grid grid-cols-5 gap-3">
              {CAJONES_META.map(cj => {
                const items   = insumosCajon(cj.id);
                const alertas = alertasCajon(cj.id);
                const abierto = cajonAbierto === cj.id;
                return (
                  <div
                    key={cj.id}
                    onClick={() => toggleCajon(cj.id)}
                    className="relative rounded-xl border-2 p-4 text-center cursor-pointer transition-all hover:shadow-md"
                    style={{
                      borderColor: abierto ? cj.color : C.border,
                      background:  abierto ? `${cj.color}15` : C.surface,
                    }}
                  >
                    {alertas > 0 && (
                      <span className="absolute top-2 right-2 text-white text-xs font-bold rounded-full px-1.5 py-0.5" style={{ background: C.red, fontSize: 9 }}>
                        {alertas}
                      </span>
                    )}
                    <div className="text-2xl mb-1.5">{cj.emoji}</div>
                    <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: abierto ? cj.color : C.text }}>{cj.id}</p>
                    <p className="text-xs mt-1 leading-tight" style={{ color: C.textMuted }}>{cj.nombre}</p>
                    <p className="text-sm font-bold mt-2" style={{ color: cj.color }}>{items.length} items</p>
                    <p className="text-xs mt-1" style={{ color: alertas > 0 ? C.red : C.green }}>
                      {alertas > 0 ? `⚠️ ${alertas} alertas` : "✅ OK"}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: C.textFaint }}>{abierto ? "▲ Cerrar" : "▼ Ver"}</p>
                  </div>
                );
              })}
            </div>

            {/* Tabla del cajón abierto */}
            {cajonAbierto && cajonMeta && (
              <Card style={{ borderTop: `3px solid ${cajonMeta.color}` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm" style={{ color: cajonMeta.color }}>
                    <span className="text-lg">{cajonMeta.emoji}</span>
                    {cajonAbierto} — {cajonMeta.nombre}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {table.getFilteredRowModel().rows.length} / {tableData.length} items
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">

                  {/* Buscador */}
                  <div className="flex items-center gap-2 max-w-xs">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Buscar medicamento..."
                      value={globalFilter}
                      onChange={e => setGlobalFilter(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Tabla */}
                  <div className="rounded-md border" style={{ borderColor: C.border }}>
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map(hg => (
                          <TableRow key={hg.id}>
                            {hg.headers.map(h => (
                              <TableHead key={h.id}>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.length ? (
                          table.getRowModel().rows.map(row => (
                            <TableRow
                              key={row.id}
                              className={cn(row.original.stock <= row.original.minimo && "bg-red-500/5")}
                            >
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-20 text-center text-sm text-muted-foreground">
                              {globalFilter ? "Sin resultados para esa búsqueda." : "Sin medicamentos en este cajón."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {table.getPageCount() > 1 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                          ← Anterior
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                          Siguiente →
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
