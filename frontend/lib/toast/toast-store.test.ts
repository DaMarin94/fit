import { afterEach, describe, expect, it, vi } from "vitest";
import { clearToasts, dismissToast, showToast, subscribeToasts } from "./toast-store";

afterEach(() => {
  clearToasts();
});

describe("toast-store", () => {
  it("showToast agrega un toast y notifica a los suscriptores", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);

    showToast({ message: "No se pudo guardar." });

    expect(listener).toHaveBeenCalled();
    const lastCall = listener.mock.calls.at(-1)?.[0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0]).toMatchObject({ message: "No se pudo guardar." });
    expect(lastCall[0].id).toBeTruthy();

    unsubscribe();
  });

  it("por defecto la variante es 'error'", () => {
    let toasts: Array<{ variant: string }> = [];
    const unsubscribe = subscribeToasts((all) => {
      toasts = all;
    });

    showToast({ message: "Algo pasó." });

    expect(toasts[0].variant).toBe("error");
    unsubscribe();
  });

  it("dismissToast saca el toast del listado", () => {
    let toasts: Array<{ id: string }> = [];
    const unsubscribe = subscribeToasts((all) => {
      toasts = all;
    });

    const id = showToast({ message: "Se cae." });
    expect(toasts).toHaveLength(1);

    dismissToast(id);
    expect(toasts).toHaveLength(0);

    unsubscribe();
  });

  it("subscribeToasts devuelve una función para dejar de escuchar", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    unsubscribe();

    showToast({ message: "No debería llegar." });

    // Solo la llamada inicial de suscripción (si la hubiera); ninguna después de unsubscribe.
    const callsAfterUnsubscribe = listener.mock.calls.length;
    showToast({ message: "Tampoco esta." });
    expect(listener.mock.calls.length).toBe(callsAfterUnsubscribe);
  });
});
