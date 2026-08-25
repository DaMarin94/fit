/**
 * Resolución del tema claro/oscuro (RN-011).
 *
 * Reglas:
 * - Mientras el usuario no haya elegido manualmente, la app sigue
 *   `prefers-color-scheme` del sistema operativo.
 * - En cuanto el usuario elige (toggle, fuera de esta fase), esa elección
 *   se guarda en `localStorage` y prevalece sobre el sistema.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "fit-theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

/** Lee la preferencia guardada. `null` si no hay, es inválida, o el storage no está disponible. */
export function getStoredTheme(
  storage: ReadableStorage | null | undefined,
): Theme | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persiste la elección manual del usuario. Silenciosa si el storage no está disponible. */
export function setStoredTheme(
  storage: WritableStorage | null | undefined,
  theme: Theme,
): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage bloqueado (modo privado, cuota, etc.): no hay nada más para hacer acá.
  }
}

/** Tema final: la preferencia guardada gana; si no hay, sigue al sistema. */
export function resolveTheme(params: {
  stored: Theme | null;
  systemPrefersDark: boolean;
}): Theme {
  if (params.stored) return params.stored;
  return params.systemPrefersDark ? "dark" : "light";
}
