import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  resetThemeStoreForTests,
  setTheme,
  subscribeTheme,
} from "./theme-store";
import { THEME_STORAGE_KEY } from "./theme";

describe("theme-store", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    resetThemeStoreForTests();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("getServerThemeSnapshot devuelve un valor fijo (evita mismatch de hidratación)", () => {
    expect(getServerThemeSnapshot()).toBe("light");
  });

  it("getThemeSnapshot lee el data-theme ya resuelto por el boot script", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    expect(getThemeSnapshot()).toBe("dark");
  });

  it("setTheme actualiza el atributo data-theme, persiste en localStorage y notifica", () => {
    document.documentElement.setAttribute("data-theme", "light");
    let notified: string | null = null;
    const unsubscribe = subscribeTheme((theme) => {
      notified = theme;
    });

    setTheme("dark");

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(getThemeSnapshot()).toBe("dark");
    expect(notified).toBe("dark");

    unsubscribe();
  });
});
