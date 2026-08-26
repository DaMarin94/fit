"use client";

import { useSyncExternalStore } from "react";

/**
 * Store de conectividad (RN-004, `docs/screens.md` §5 estado "Sin
 * conexión"). Sin estado propio: la fuente de verdad es `navigator.onLine`,
 * el store solo sabe cuándo hay que volver a consultarlo (eventos
 * `online`/`offline` de `window`). Mismo patrón pub-sub que
 * `lib/toast/toast-store.ts`, más un hook (`useIsOnline`) con
 * `useSyncExternalStore` para que los componentes se re-rendericen solos.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let attached = false;

function notify() {
  for (const listener of listeners) listener();
}

function ensureListeners() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
}

export function getIsOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/** Snapshot para SSR: se asume en línea hasta que el cliente hidrata y puede consultar `navigator.onLine`. */
export function getIsOnlineServerSnapshot(): boolean {
  return true;
}

export function subscribeConnectivity(listener: Listener): () => void {
  ensureListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Solo para tests: libera los listeners de `window` para re-engancharlos en el próximo test. */
export function resetConnectivityListeners(): void {
  if (attached && typeof window !== "undefined") {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  }
  attached = false;
  listeners.clear();
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeConnectivity, getIsOnline, getIsOnlineServerSnapshot);
}
