"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

/**
 * Diálogo de confirmación genérico (`docs/screens.md` §8, "Confirmación
 * destructiva"; forma exacta de la variante de salida en
 * `docs/design.md` §7.3). Se reutiliza para borrar, descartar cambios y
 * salir de Modo entrenar con el timer corriendo (RN-010).
 *
 * - El foco inicial es siempre "cancelar": el default seguro es quedarse.
 * - Esc y click en el backdrop cancelan.
 * - `variant="danger"` usa el botón de confirmación en `--danger`
 *   (borrar/salir); el default es el botón primario (confirmaciones no
 *   destructivas, ej. "hay cambios sin guardar" solo si se decide pedir
 *   confirmación ahí también).
 */
export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(18,21,28,.40)" }}
    >
      <div
        data-testid="confirm-dialog-backdrop"
        className="absolute inset-0"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm rounded-[var(--r-lg)] p-6 shadow-lg"
        style={{ background: "var(--surface)", color: "var(--text)" }}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="subtle" onClick={onCancel} ref={cancelRef}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "primary"}
            onClick={onConfirm}
            style={
              variant === "danger"
                ? { background: "var(--danger)", color: "#fff", border: "none" }
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
