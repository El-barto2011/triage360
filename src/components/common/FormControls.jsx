import { Label } from "../ui/label";

/* ════════════════════════════════════════════════════════════
   Controles de formulario compartidos.
   Antes estaban duplicados en 5 componentes (atenciones médicas,
   enfermería, kinesiología, masoterapia, reportes).
   ════════════════════════════════════════════════════════════ */

/** Clase de <select> nativo con el estilo de los inputs shadcn. */
export const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

/** Campo etiquetado con hint opcional y marca de requerido. */
export const Field = ({ label, children, hint, required }) => (
  <div className="space-y-1.5">
    <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);
