"use client";

import { useSyncExternalStore } from "react";
import { dismissToast, getToasts, subscribeToasts } from "@/lib/toast/toast-store";

/**
 * Visor de toasts. Se suscribe al store desacoplado de React
 * (`lib/toast/toast-store.ts`) para que el interceptor HTTP pueda disparar
 * avisos de error desde fuera del árbol de componentes.
 *
 * Nota de diseño: `docs/design.md` todavía no define un spec visual propio
 * para el toast; se usan tokens ya documentados (superficie, borde
 * semántico, radio `--r-md`) sin inventar valores nuevos.
 */
export function ToastProvider() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pb-[calc(56px+env(safe-area-inset-bottom)+12px)] wide:pb-0 bottom-0 wide:top-[68px]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--r-md)] border px-4 py-3 shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor:
              toast.variant === "error" ? "var(--danger)" : "var(--success)",
            color: "var(--text)",
          }}
        >
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-[var(--text-muted)]"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
