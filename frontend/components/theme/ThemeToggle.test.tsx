import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import { resetThemeStoreForTests } from "@/lib/theme/theme-store";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute("data-theme", "light");
    resetThemeStoreForTests();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("refleja el tema actual y tiene un target de 44x44", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /oscuro/i });
    expect(button).toHaveClass("h-11", "w-11");
  });

  it("al tocarlo, cambia el tema, lo persiste y actualiza su propio label", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /oscuro/i }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: /claro/i })).toBeInTheDocument();
  });
});
