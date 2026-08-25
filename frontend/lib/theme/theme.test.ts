import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  getStoredTheme,
  isTheme,
  resolveTheme,
} from "./theme";

describe("isTheme", () => {
  it("acepta 'light' y 'dark'", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
  });

  it("rechaza cualquier otro valor", () => {
    expect(isTheme("auto")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(1)).toBe(false);
  });
});

describe("getStoredTheme", () => {
  it("devuelve null si no hay storage disponible", () => {
    expect(getStoredTheme(null)).toBeNull();
    expect(getStoredTheme(undefined)).toBeNull();
  });

  it("devuelve null si el storage no tiene la clave guardada", () => {
    const storage = { getItem: () => null };
    expect(getStoredTheme(storage)).toBeNull();
  });

  it("devuelve null si el valor guardado no es un tema válido", () => {
    const storage = { getItem: () => "auto" };
    expect(getStoredTheme(storage)).toBeNull();
  });

  it("devuelve el tema guardado cuando es válido", () => {
    const storage = { getItem: () => "dark" };
    expect(getStoredTheme(storage)).toBe("dark");
  });

  it("devuelve null si leer el storage tira una excepción", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(getStoredTheme(storage)).toBeNull();
  });

  it("usa la clave de storage esperada", () => {
    expect(THEME_STORAGE_KEY).toBe("fit-theme");
  });
});

describe("resolveTheme", () => {
  it("usa la preferencia guardada del usuario aunque el sistema diga otra cosa", () => {
    expect(resolveTheme({ stored: "light", systemPrefersDark: true })).toBe(
      "light",
    );
    expect(resolveTheme({ stored: "dark", systemPrefersDark: false })).toBe(
      "dark",
    );
  });

  it("si no hay preferencia guardada, sigue al sistema operativo", () => {
    expect(resolveTheme({ stored: null, systemPrefersDark: true })).toBe(
      "dark",
    );
    expect(resolveTheme({ stored: null, systemPrefersDark: false })).toBe(
      "light",
    );
  });
});
