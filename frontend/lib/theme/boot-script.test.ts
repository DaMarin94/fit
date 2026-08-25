import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "./theme";
import { getThemeBootScript } from "./boot-script";

/**
 * El boot script se inyecta como texto plano en un <script> del <head>,
 * así que lo probamos ejecutándolo tal cual correría en el navegador,
 * contra un `document`, `localStorage` y `matchMedia` controlados.
 */
function runBootScript(options: {
  storedValue?: string | null;
  systemPrefersDark: boolean;
  localStorageThrows?: boolean;
}) {
  const setAttribute = vi.fn();
  const fakeDocument = {
    documentElement: { setAttribute },
  };

  const getItem = options.localStorageThrows
    ? vi.fn(() => {
        throw new Error("blocked");
      })
    : vi.fn(() => options.storedValue ?? null);

  const fakeLocalStorage = { getItem };
  const fakeMatchMedia = vi.fn((query: string) => ({
    matches: query.includes("dark") && options.systemPrefersDark,
  }));

  const script = getThemeBootScript();
  const run = new Function(
    "document",
    "localStorage",
    "window",
    `${script}`,
  );

  run(fakeDocument, fakeLocalStorage, { matchMedia: fakeMatchMedia });

  return setAttribute;
}

describe("getThemeBootScript", () => {
  it("referencia la misma clave de storage que usa el resto de la app", () => {
    expect(getThemeBootScript()).toContain(THEME_STORAGE_KEY);
  });

  it("sin preferencia guardada, aplica 'dark' si el sistema prefiere oscuro", () => {
    const setAttribute = runBootScript({
      storedValue: null,
      systemPrefersDark: true,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
  });

  it("sin preferencia guardada, aplica 'light' si el sistema prefiere claro", () => {
    const setAttribute = runBootScript({
      storedValue: null,
      systemPrefersDark: false,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "light");
  });

  it("la preferencia guardada pisa al sistema operativo", () => {
    const setAttribute = runBootScript({
      storedValue: "light",
      systemPrefersDark: true,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "light");
  });

  it("ignora un valor guardado inválido y sigue al sistema", () => {
    const setAttribute = runBootScript({
      storedValue: "auto",
      systemPrefersDark: true,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
  });

  it("si localStorage tira una excepción, no explota y sigue al sistema", () => {
    expect(() =>
      runBootScript({ localStorageThrows: true, systemPrefersDark: true }),
    ).not.toThrow();

    const setAttribute = runBootScript({
      localStorageThrows: true,
      systemPrefersDark: true,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
