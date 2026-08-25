/**
 * Store mínimo de toasts (pub-sub), sin dependencia de React.
 *
 * Existe porque el interceptor HTTP (`lib/http/api-client.ts`) dispara
 * toasts de error desde fuera del árbol de componentes (`docs/technical.md`
 * §2.2). `components/toast/ToastProvider.tsx` se suscribe acá para
 * renderizarlos.
 */

export type ToastVariant = "error" | "success";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function showToast(input: { message: string; variant?: ToastVariant }): string {
  const toast: Toast = {
    id: createId(),
    message: input.message,
    variant: input.variant ?? "error",
  };
  toasts = [...toasts, toast];
  notify();
  return toast.id;
}

export function dismissToast(id: string): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  notify();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): Toast[] {
  return toasts;
}

/** Solo para tests: vacía el store entre casos. */
export function clearToasts(): void {
  toasts = [];
  notify();
}
