import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

/* ════════════════════════════════════════════════════════════
   ConfirmDialog imperativo — reemplaza window.confirm con la UI
   de la app. Uso:

     import { confirmDialog } from "../ui/confirm";
     const ok = await confirmDialog({
       title: "Posible conflicto alérgico",
       description: "El paciente registra alergia a...",
       confirmText: "Prescribir igual",
       variant: "danger",
     });
     if (!ok) return;

   Requiere <ConfirmHost /> montado una vez en el árbol (App.js).
   ════════════════════════════════════════════════════════════ */

let _emit = null;              // setter del host (se registra al montar)
const _queue = [];             // confirmaciones pedidas antes de montar el host

/** Abre el diálogo y resuelve a true (confirmar) o false (cancelar). */
export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    const payload = {
      title:       opts.title       || "¿Confirmar acción?",
      description: opts.description  || "",
      confirmText: opts.confirmText  || "Confirmar",
      cancelText:  opts.cancelText   || "Cancelar",
      variant:     opts.variant      || "default", // "default" | "danger"
      resolve,
    };
    if (_emit) _emit(payload);
    else _queue.push(payload);
  });
}

export function ConfirmHost() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    _emit = setCurrent;
    // drena confirmaciones encoladas antes del montaje
    if (_queue.length && !current) setCurrent(_queue.shift());
    return () => { _emit = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = (result) => {
    if (current) current.resolve(result);
    const next = _queue.shift() || null;
    setCurrent(next);
  };

  if (!current) return null;
  const danger = current.variant === "danger";

  return (
    <Dialog open onOpenChange={(o) => { if (!o) close(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {danger && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {current.title}
          </DialogTitle>
          {current.description && (
            <DialogDescription className="whitespace-pre-line pt-1">
              {current.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            {current.cancelText}
          </Button>
          <Button variant={danger ? "destructive" : "default"} onClick={() => close(true)}>
            {current.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
