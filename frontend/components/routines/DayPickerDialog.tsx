"use client";

import { useEffect } from "react";

/**
 * Elegir día antes de entrenar, cuando la rutina tiene más de un día
 * (`docs/screens.md` §2). Diálogo simple, sin búsqueda: la cantidad de
 * días de una rutina es siempre chica.
 */
export function DayPickerDialog({
  open,
  days,
  onSelect,
  onCancel,
}: {
  open: boolean;
  days: { id: string; order: number }[];
  onSelect: (dayId: string) => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const sorted = [...days].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,21,28,.40)" }}>
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elegí el día para entrenar"
        className="relative z-10 flex w-full max-w-sm flex-col gap-3 rounded-[var(--r-lg)] p-6"
        style={{ background: "var(--surface)", color: "var(--text)" }}
      >
        <h2 className="text-lg font-bold">Elegí el día</h2>
        <ul className="flex flex-col gap-2">
          {sorted.map((day) => (
            <li key={day.id}>
              <button
                type="button"
                onClick={() => onSelect(day.id)}
                className="flex min-h-11 w-full items-center rounded-[var(--r-md)] px-3 text-left text-sm"
                style={{ background: "var(--surface-2)" }}
              >
                {`Día ${day.order + 1}`}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
