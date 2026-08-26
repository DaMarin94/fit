"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "@/lib/theme/theme-store";

/**
 * Toggle de tema claro/oscuro (RF-015, RN-011). Dos posiciones, sin tercer
 * estado "auto" (`docs/design.md` §2.1). Vive en dos lugares a la vez
 * (`docs/design.md` §2.2): la barra superior en amplio, y la cabecera de
 * Mis rutinas en compacto; ambas instancias comparten estado por
 * `lib/theme/theme-store.ts`.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ color: "var(--text)", outlineColor: "var(--accent)" }}
    >
      {isDark ? (
        <SunIcon className="h-6 w-6" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  );
}
