import { getStoredTheme, isTheme, setStoredTheme, type Theme } from "./theme";

/**
 * Store del tema actual, en el mismo patrón pub-sub que
 * `lib/toast/toast-store.ts`: sin dependencia de React, así el toggle de
 * `NavBar` (amplio) y el de la cabecera de Mis rutinas (compacto) — dos
 * instancias montadas a la vez, `docs/design.md` §2.2 — quedan
 * sincronizadas entre sí sin prop drilling.
 */

type Listener = (theme: Theme) => void;

const listeners = new Set<Listener>();
let current: Theme | null = null;

function readFromDom(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : "light";
}

/** Snapshot estable para SSR/primer render: el boot script ya fijó el `data-theme` real en el `<html>` antes de la hidratación (RN-011); este valor solo importa para el ícono del propio toggle durante un instante. */
export function getServerThemeSnapshot(): Theme {
  return "light";
}

export function getThemeSnapshot(): Theme {
  if (current === null) {
    current = readFromDom();
  }
  return current;
}

export function setTheme(theme: Theme): void {
  current = theme;
  document.documentElement.setAttribute("data-theme", theme);
  setStoredTheme(window.localStorage, theme);
  for (const listener of listeners) {
    listener(theme);
  }
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Solo para tests: fuerza a releer el DOM en la próxima lectura. */
export function resetThemeStoreForTests(): void {
  current = null;
}

export { getStoredTheme };
