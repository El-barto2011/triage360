import { useState, useEffect, useMemo } from "react";
import { toast } from "../ui/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { C } from "../../config/theme";
import { sb, getToken } from "../../config/supabase";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import { confirmDialog } from "../ui/confirm";
import { selectCls } from "../common/FormControls";
import {
  BarChart2, Download, Lock, Search, ArrowUpDown,
  Pill, Package, Stethoscope, Activity, Waves,
  FileSpreadsheet, FileText,
} from "lucide-react";

/* ── Reusable sortable TanStack table ─────────────────── */
function DataTable({ data, columns, searchPlaceholder = "Buscar...", pageSize = 10 }) {
  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state:  { sorting, globalFilter },
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 max-w-xs">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="h-8 text-sm"
        />
        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
          {table.getFilteredRowModel().rows.length} resultado{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </span>
      </div>

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
                <TableRow key={row.id}>
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
                  {globalFilter ? "Sin resultados para esa búsqueda." : "Sin datos disponibles."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {data.length} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Anterior</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente →</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sortable header helper ───────────────────────────── */
const SortHeader = ({ column, label }) => (
  <button
    className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:text-foreground transition-colors"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {label} <ArrowUpDown size={11} />
  </button>
);

export function VistaReportes({ usuario, esAdmin }) {
  const [eventos,           setEventos]           = useState([]);
  const [eventoSeleccionado,setEventoSeleccionado] = useState("todos");
  const [loading,           setLoading]           = useState(true);
  const [datosReporte,      setDatosReporte]      = useState(null);

  useEffect(() => { cargarDatos(); }, [usuario]);

  useEffect(() => {
    if (eventoSeleccionado) generarReporte();
  }, [eventoSeleccionado]);

  /* ── Data loading (unchanged) ───────────────────────── */
  const cargarDatos = async () => {
    setLoading(true);
    const evs = await sb("equipos_evento?order=created_at.desc", {}, usuario?.token);
    if (evs) {
      setEventos(evs);
      if (evs.length > 0 && eventoSeleccionado === "todos") setEventoSeleccionado(evs[0].nombre_evento);
    }
    setLoading(false);
  };

  const generarReporte = async () => {
    if (!eventoSeleccionado || eventoSeleccionado === "todos") return;
    setLoading(true);
    const [atencionesKine, atencionesMed, adminMed, masoterapiaMasiva, fichasMasoterapia] = await Promise.all([
      sb(`atenciones_kinesiologia?evento=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`atenciones_medicas?evento=eq.${eventoSeleccionado}`,      {}, usuario?.token),
      sb(`administracion_medicamentos?evento=eq.${eventoSeleccionado}&order=created_at.desc`, {}, usuario?.token),
      sb(`atenciones_masoterapia_masiva?evento=eq.${eventoSeleccionado}`, {}, usuario?.token),
      sb(`fichas_masoterapia?evento=eq.${eventoSeleccionado}`,      {}, usuario?.token),
    ]);

    let costos = [];
    if (esAdmin) costos = await sb("costos_insumos", {}, usuario?.token) || [];

    const totalKine              = atencionesKine?.length  || 0;
    const totalMedicas           = atencionesMed?.length   || 0;
    const totalMasajes           = masoterapiaMasiva?.reduce((s, m) => s + (m.masajes_realizados || 0), 0) || 0;
    const totalFichasMasoterapia = fichasMasoterapia?.length || 0;

    const medicamentosMap = {};
    atencionesMed?.forEach(a => {
      a.medicamentos_prescritos?.forEach(m => {
        if (!medicamentosMap[m.nombre]) medicamentosMap[m.nombre] = { nombre: m.nombre, cantidad: 0, via: m.via };
        medicamentosMap[m.nombre].cantidad += m.cantidad || 1;
      });
    });

    const insumosMap = {};
    const agregarInsumo = (ins) => {
      if (!insumosMap[ins.nombre]) insumosMap[ins.nombre] = { nombre: ins.nombre, cantidad: 0, unidad: ins.unidad || "unid." };
      insumosMap[ins.nombre].cantidad += parseFloat(ins.cantidad) || 0;
    };
    atencionesMed?.forEach(a => a.insumos_medico?.forEach(agregarInsumo));
    adminMed?.forEach(a => a.insumos_administracion?.forEach(agregarInsumo));
    atencionesKine?.forEach(a => a.insumos_usados?.forEach(agregarInsumo));

    let costoTotal = 0;
    if (esAdmin && costos.length > 0) {
      [...Object.values(insumosMap), ...Object.values(medicamentosMap)].forEach(item => {
        const costo = costos.find(c => c.nombre_insumo === item.nombre);
        if (costo) costoTotal += (costo.costo_unitario || 0) * item.cantidad;
      });
    }

    setDatosReporte({
      evento: eventoSeleccionado, totalKine, totalMedicas, totalMasajes, totalFichasMasoterapia,
      medicamentosUsados: Object.values(medicamentosMap),
      insumosUsados:      Object.values(insumosMap),
      costoTotal:         esAdmin ? costoTotal : null,
      atencionesKine, atencionesMed, masoterapiaMasiva, fichasMasoterapia,
    });
    setLoading(false);
  };

  /* ── Export CSV ─────────────────────────────────────── */
  const exportarCSV = () => {
    if (!datosReporte) return;
    let csv = "REPORTE DE EVENTO - " + datosReporte.evento + "\n\n";
    csv += "RESUMEN GENERAL\n";
    csv += "Atenciones Kinesiología," + datosReporte.totalKine + "\n";
    csv += "Atenciones Médicas,"      + datosReporte.totalMedicas + "\n";
    csv += "Masajes (Masivos),"       + datosReporte.totalMasajes + "\n";
    csv += "Fichas Masoterapia,"      + datosReporte.totalFichasMasoterapia + "\n\n";
    csv += "MEDICAMENTOS PRESCRITOS\nNombre,Cantidad,Vía\n";
    datosReporte.medicamentosUsados.forEach(m => { csv += `${m.nombre},${m.cantidad},${m.via}\n`; });
    csv += "\nINSUMOS UTILIZADOS\nNombre,Cantidad,Unidad\n";
    datosReporte.insumosUsados.forEach(i => { csv += `${i.nombre},${i.cantidad},${i.unidad}\n`; });
    if (esAdmin && datosReporte.costoTotal !== null) csv += "\nCOSTO TOTAL,$" + datosReporte.costoTotal.toLocaleString("es-CL") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `reporte_${datosReporte.evento.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Export Excel (.xlsx) ───────────────────────────── */
  const exportarExcel = () => {
    if (!datosReporte) return;
    const wb   = XLSX.utils.book_new();
    const slug = datosReporte.evento.replace(/\s/g, "_");
    const hoy  = new Date().toLocaleDateString("es-CL");

    // Hoja Resumen
    const resumenRows = [
      ["REPORTE DE EVENTO", datosReporte.evento],
      ["Fecha de generación", hoy],
      [],
      ["RESUMEN GENERAL", ""],
      ["Atenciones Kinesiología", datosReporte.totalKine],
      ["Atenciones Médicas",      datosReporte.totalMedicas],
      ["Masajes Masivos",         datosReporte.totalMasajes],
      ["Fichas Masoterapia",      datosReporte.totalFichasMasoterapia],
    ];
    if (esAdmin && datosReporte.costoTotal !== null)
      resumenRows.push([], ["Costo Total (CLP)", datosReporte.costoTotal]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumenRows), "Resumen");

    // Hoja Atenciones Médicas
    if (datosReporte.atencionesMed?.length > 0) {
      const ws = XLSX.utils.json_to_sheet(
        datosReporte.atencionesMed.map(a => ({
          Paciente:         a.paciente_nombre  || "",
          Edad:             a.paciente_edad    || "",
          Triaje:           a.codigo_triaje    || "",
          Motivo:           a.motivo_consulta  || "",
          "Médico/Enfermero": (a.medico_nombre || a.enfermero_nombre || "").split("@")[0],
          Diagnóstico:      a.diagnostico      || "",
          Fecha:            a.created_at ? new Date(a.created_at).toLocaleString("es-CL") : "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Atenciones Médicas");
    }

    // Hoja Kinesiología
    if (datosReporte.atencionesKine?.length > 0) {
      const ws = XLSX.utils.json_to_sheet(
        datosReporte.atencionesKine.map(a => ({
          Paciente:      a.paciente_nombre || "",
          Edad:          a.paciente_edad   || "",
          "Kinesiólogo/a": (a.kinesiologo_nombre || "").split("@")[0],
          Motivo:        a.motivo_consulta || "",
          Fecha:         a.created_at ? new Date(a.created_at).toLocaleString("es-CL") : "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Kinesiología");
    }

    // Hoja Masoterapia
    const masoRows = [];
    if (datosReporte.masoterapiaMasiva?.length > 0) {
      masoRows.push(["MASOTERAPIA MASIVA"], ["Masajes realizados", "Fecha"]);
      datosReporte.masoterapiaMasiva.forEach(m =>
        masoRows.push([m.masajes_realizados || 0, m.created_at ? new Date(m.created_at).toLocaleString("es-CL") : ""])
      );
      masoRows.push([]);
    }
    if (datosReporte.fichasMasoterapia?.length > 0) {
      masoRows.push(["FICHAS INDIVIDUALES"], ["Paciente", "Terapeuta", "Fecha"]);
      datosReporte.fichasMasoterapia.forEach(f =>
        masoRows.push([
          f.paciente_nombre || "",
          (f.terapeuta_nombre || f.kinesiologo_nombre || "").split("@")[0],
          f.created_at ? new Date(f.created_at).toLocaleString("es-CL") : "",
        ])
      );
    }
    if (masoRows.length > 0)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(masoRows), "Masoterapia");

    // Hoja Medicamentos e Insumos
    const medRows = [
      ["MEDICAMENTOS PRESCRITOS"], ["Nombre", "Cantidad", "Vía"],
      ...datosReporte.medicamentosUsados.map(m => [m.nombre, m.cantidad, m.via || ""]),
      [],
      ["INSUMOS UTILIZADOS"], ["Nombre", "Cantidad", "Unidad"],
      ...datosReporte.insumosUsados.map(i => [i.nombre, i.cantidad, i.unidad || ""]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(medRows), "Medicamentos");

    // Hoja Costos (admin)
    if (esAdmin && datosReporte.costoTotal !== null) {
      const ws = XLSX.utils.aoa_to_sheet([
        ["VALORIZACIÓN DEL EVENTO"],
        ["Evento",          datosReporte.evento],
        ["Fecha",           hoy],
        ["Costo Total (CLP)", datosReporte.costoTotal],
        [],
        ["* Insumos sin costo registrado no se incluyen en el total."],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Costos");
    }

    XLSX.writeFile(wb, `reporte_${slug}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  /* ── Export PDF ─────────────────────────────────────── */
  const exportarPDF = () => {
    if (!datosReporte) return;
    const doc  = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 16;

    // Encabezado
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 194, 168);
    doc.text("TRIAGE360", pageW / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(datosReporte.evento, pageW / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generado el ${new Date().toLocaleDateString("es-CL")}`, pageW / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 10;

    // KPIs
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen General", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Tipo de Atención", "Total"]],
      body: [
        ["Kinesiología",      datosReporte.totalKine],
        ["Atenciones Médicas", datosReporte.totalMedicas],
        ["Masajes Masivos",    datosReporte.totalMasajes],
        ["Fichas Masoterapia", datosReporte.totalFichasMasoterapia],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 194, 168] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Atenciones Médicas
    if (datosReporte.atencionesMed?.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Atenciones Médicas", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Paciente", "Triaje", "Motivo", "Médico", "Fecha"]],
        body: datosReporte.atencionesMed.map(a => [
          a.paciente_nombre || "",
          a.codigo_triaje   || "",
          (a.motivo_consulta || "").substring(0, 35),
          (a.medico_nombre || a.enfermero_nombre || "").split("@")[0],
          a.created_at ? new Date(a.created_at).toLocaleDateString("es-CL") : "",
        ]),
        theme: "striped",
        headStyles: { fillColor: [88, 166, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Kinesiología
    if (datosReporte.atencionesKine?.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Atenciones de Kinesiología", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Paciente", "Kinesiólogo/a", "Motivo", "Fecha"]],
        body: datosReporte.atencionesKine.map(a => [
          a.paciente_nombre || "",
          (a.kinesiologo_nombre || "").split("@")[0],
          (a.motivo_consulta || "").substring(0, 45),
          a.created_at ? new Date(a.created_at).toLocaleDateString("es-CL") : "",
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 194, 168] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Medicamentos
    if (datosReporte.medicamentosUsados.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Medicamentos Prescritos", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Medicamento", "Vía", "Cantidad"]],
        body: datosReporte.medicamentosUsados.map(m => [m.nombre, m.via || "", m.cantidad]),
        theme: "striped",
        headStyles: { fillColor: [188, 140, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Insumos
    if (datosReporte.insumosUsados.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Insumos Utilizados", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Insumo", "Cantidad", "Unidad"]],
        body: datosReporte.insumosUsados.map(i => [i.nombre, i.cantidad, i.unidad || ""]),
        theme: "striped",
        headStyles: { fillColor: [240, 136, 62] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Costo total (admin)
    if (esAdmin && datosReporte.costoTotal !== null) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 200);
      doc.text(
        `Costo Total del Evento: $${datosReporte.costoTotal.toLocaleString("es-CL")} CLP`,
        14, y
      );
      doc.setTextColor(0);
    }

    const slug = datosReporte.evento.replace(/\s/g, "_");
    doc.save(`reporte_${slug}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  /* ── Cerrar evento (unchanged) ───────────────────────── */
  const cerrarEvento = async () => {
    const eventoObj = eventos.find(e => e.nombre_evento === eventoSeleccionado);
    if (!eventoObj) return;
    const confirmar = await confirmDialog({
      title: "Cerrar evento",
      description: `¿Estás seguro de cerrar el evento "${eventoSeleccionado}"?\n\nEsta acción NO se puede deshacer.`,
      confirmText: "Cerrar evento",
      variant: "danger",
    });
    if (!confirmar) return;
    const res = await sb(`equipos_evento?id=eq.${eventoObj.id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: "cerrado", fecha_cierre: new Date().toISOString(), cerrado_por: usuario.id }),
    }, usuario?.token);
    if (res) {
      try {
        const stats = {
          total_atenciones: (datosReporte?.totalMedicas || 0) + (datosReporte?.totalKine || 0) + (datosReporte?.totalMasajes || 0) + (datosReporte?.totalFichasMasoterapia || 0),
          total_profesionales: new Set([...(datosReporte?.atencionesMedicas || []).map(a => a.medico), ...(datosReporte?.atencionesKine || []).map(a => a.kinesiologo)]).size,
          por_profesional: [],
        };
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
          body: JSON.stringify({ tipo: "reporte_evento", data: { evento_id: eventoObj.id, evento_nombre: eventoObj.nombre_evento || eventoSeleccionado, fecha_cierre: new Date().toISOString(), stats } }),
        });
      } catch (err) { console.error("Error al enviar email:", err); }
      toast({ title: "Evento cerrado ✓", description: "El reporte con CSV adjunto fue enviado por correo" });
      cargarDatos();
    }
  };

  /* ── Column definitions ──────────────────────────────── */
  const medicamentosColumns = useMemo(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => <SortHeader column={column} label="Medicamento" />,
      cell: ({ row }) => <span className="font-semibold text-sm">{row.original.nombre}</span>,
    },
    {
      accessorKey: "via",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Vía</span>,
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.via}</Badge>,
    },
    {
      accessorKey: "cantidad",
      header: ({ column }) => <SortHeader column={column} label="Cantidad" />,
      cell: ({ row }) => (
        <span className="text-base font-extrabold" style={{ color: C.blue }}>{row.original.cantidad}</span>
      ),
    },
  ], []);

  const insumosColumns = useMemo(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => <SortHeader column={column} label="Insumo" />,
      cell: ({ row }) => <span className="font-semibold text-sm">{row.original.nombre}</span>,
    },
    {
      accessorKey: "cantidad",
      header: ({ column }) => <SortHeader column={column} label="Cantidad" />,
      cell: ({ row }) => (
        <span className="text-base font-extrabold" style={{ color: C.blue }}>
          {row.original.cantidad} <span className="text-xs font-normal text-muted-foreground">{row.original.unidad}</span>
        </span>
      ),
    },
  ], []);

  const atencionesKineColumns = useMemo(() => [
    {
      accessorKey: "paciente_nombre",
      header: ({ column }) => <SortHeader column={column} label="Paciente" />,
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.paciente_nombre}</p>
          {row.original.paciente_edad && <p className="text-xs text-muted-foreground">{row.original.paciente_edad} años</p>}
        </div>
      ),
    },
    {
      accessorKey: "kinesiologo_nombre",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Kinesiólogo/a</span>,
      cell: ({ row }) => <span className="text-xs">{row.original.kinesiologo_nombre?.split("@")[0] || "—"}</span>,
    },
    {
      accessorKey: "motivo_consulta",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Motivo</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.motivo_consulta?.substring(0, 50)}{row.original.motivo_consulta?.length > 50 ? "…" : ""}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortHeader column={column} label="Fecha" />,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleString("es-CL")}</span>,
    },
  ], []);

  const atencionesMedColumns = useMemo(() => [
    {
      accessorKey: "paciente_nombre",
      header: ({ column }) => <SortHeader column={column} label="Paciente" />,
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.paciente_nombre}</p>
          {row.original.paciente_edad && <p className="text-xs text-muted-foreground">{row.original.paciente_edad} años</p>}
        </div>
      ),
    },
    {
      accessorKey: "codigo_triaje",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Triaje</span>,
      cell: ({ row }) => {
        const c = row.original.codigo_triaje;
        const colorMap = { VERDE: "success", AMARILLO: "warning", ROJO: "danger", NEGRO: "secondary" };
        return c ? <Badge variant={colorMap[c] || "outline"} className="text-xs">{c}</Badge> : null;
      },
    },
    {
      accessorKey: "motivo_consulta",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Motivo</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.motivo_consulta?.substring(0, 45)}{row.original.motivo_consulta?.length > 45 ? "…" : ""}
        </span>
      ),
    },
    {
      accessorKey: "medico_nombre",
      header: () => <span className="text-xs font-bold uppercase tracking-wider">Médico</span>,
      cell: ({ row }) => (
        <span className="text-xs">{(row.original.medico_nombre || row.original.enfermero_nombre || "—").split("@")[0]}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortHeader column={column} label="Fecha" />,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleString("es-CL")}</span>,
    },
  ], []);

  /* ── Render ─────────────────────────────────────────── */
  if (loading && !datosReporte) {
    return <div className="p-10 text-center text-sm" style={{ color: C.textMuted }}>Cargando reportes...</div>;
  }

  const eventoObj = eventos.find(e => e.nombre_evento === eventoSeleccionado);
  const eventoActivo = eventoObj?.estado === "activo";

  return (
    <div className="space-y-4">

      {/* ── Header + selector ───────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: C.blue }}>
                <BarChart2 size={18} /> Reportes de Eventos
              </h2>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>Resumen detallado de atenciones y costos</p>
            </div>
            {datosReporte && (
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" onClick={exportarCSV}>
                  <Download size={13} /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportarExcel}>
                  <FileSpreadsheet size={13} /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF}>
                  <FileText size={13} /> PDF
                </Button>
                {esAdmin && eventoActivo && (
                  <Button variant="destructive" size="sm" onClick={cerrarEvento}>
                    <Lock size={13} /> Cerrar Evento
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Selecciona un Evento</label>
            <select
              className={selectCls}
              value={eventoSeleccionado}
              onChange={e => setEventoSeleccionado(e.target.value)}
            >
              {eventos.map(ev => (
                <option key={ev.id} value={ev.nombre_evento}>
                  {ev.nombre_evento} — {ev.estado === "cerrado" ? "🔒 Cerrado" : "✅ Activo"}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {datosReporte && (
        <>
          {/* ── KPI Summary ─────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Kinesiología",     value: datosReporte.totalKine,              icon: Activity,    color: C.blue   },
              { label: "Atenciones Méd.",  value: datosReporte.totalMedicas,           icon: Stethoscope, color: C.accent },
              { label: "Masajes Masivos",  value: datosReporte.totalMasajes,           icon: Waves,       color: C.purple },
              { label: "Fichas Masot.",    value: datosReporte.totalFichasMasoterapia, icon: Waves,       color: C.orange },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>{label}</p>
                  <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Medicamentos ─────────────────────────────── */}
          {datosReporte.medicamentosUsados.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill size={14} style={{ color: C.accent }} /> Medicamentos Prescritos
                  <Badge variant="teal" className="ml-auto text-xs">{datosReporte.medicamentosUsados.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={datosReporte.medicamentosUsados}
                  columns={medicamentosColumns}
                  searchPlaceholder="Buscar medicamento..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Insumos ──────────────────────────────────── */}
          {datosReporte.insumosUsados.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package size={14} style={{ color: C.orange }} /> Insumos Utilizados
                  <Badge variant="warning" className="ml-auto text-xs">{datosReporte.insumosUsados.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={datosReporte.insumosUsados}
                  columns={insumosColumns}
                  searchPlaceholder="Buscar insumo..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Atenciones Kinesiología ───────────────────── */}
          {datosReporte.atencionesKine?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity size={14} style={{ color: C.blue }} /> Atenciones de Kinesiología
                  <Badge variant="teal" className="ml-auto text-xs">{datosReporte.atencionesKine.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={datosReporte.atencionesKine}
                  columns={atencionesKineColumns}
                  searchPlaceholder="Buscar paciente o kinesiólogo..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Atenciones Médicas ────────────────────────── */}
          {datosReporte.atencionesMed?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Stethoscope size={14} style={{ color: C.accent }} /> Atenciones Médicas
                  <Badge variant="teal" className="ml-auto text-xs">{datosReporte.atencionesMed.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={datosReporte.atencionesMed}
                  columns={atencionesMedColumns}
                  searchPlaceholder="Buscar paciente, médico o motivo..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Costo total (admin) ───────────────────────── */}
          {esAdmin && datosReporte.costoTotal !== null && (
            <Card className="border-2" style={{ borderColor: C.blue }}>
              <CardContent className="p-5">
                <p className="text-base font-bold mb-1 flex items-center gap-2">
                  💰 Costo Total del Evento
                </p>
                <p className="text-xs mb-4" style={{ color: C.textMuted }}>
                  * Basado en costos registrados en el sistema. Insumos sin costo registrado no se incluyen.
                </p>
                <div className="rounded-lg p-6 text-center" style={{ background: C.blueDim }}>
                  <p className="text-5xl font-black" style={{ color: C.blue }}>
                    ${datosReporte.costoTotal.toLocaleString("es-CL")}
                  </p>
                  <p className="text-sm mt-2" style={{ color: C.textMuted }}>CLP</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
