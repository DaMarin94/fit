import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NavBar } from "./NavBar";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

describe("NavBar", () => {
  it("renderiza los tres destinos, en orden, en las dos disposiciones", () => {
    usePathnameMock.mockReturnValue("/");
    render(<NavBar />);

    const navs = screen.getAllByRole("navigation", { name: /navegación principal/i });
    expect(navs).toHaveLength(2);

    for (const nav of navs) {
      const links = within(nav).getAllByRole("link");
      expect(links.map((l) => l.textContent)).toEqual([
        expect.stringContaining("Rutinas"),
        expect.stringContaining("Pool"),
        expect.stringContaining("Historial"),
      ]);
      expect(within(nav).getByRole("link", { name: /rutinas/i })).toHaveAttribute("href", "/");
      expect(within(nav).getByRole("link", { name: /pool/i })).toHaveAttribute("href", "/pool");
      expect(within(nav).getByRole("link", { name: /historial/i })).toHaveAttribute(
        "href",
        "/historial",
      );
    }
  });

  it("marca como activo el tab que corresponde a la ruta actual", () => {
    usePathnameMock.mockReturnValue("/pool");
    render(<NavBar />);

    const navs = screen.getAllByRole("navigation", { name: /navegación principal/i });
    for (const nav of navs) {
      expect(within(nav).getByRole("link", { name: /pool/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(within(nav).getByRole("link", { name: /rutinas/i })).not.toHaveAttribute(
        "aria-current",
      );
      expect(within(nav).getByRole("link", { name: /historial/i })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("home ('/') solo está activo en la raíz exacta, no en subrutas de otros tabs", () => {
    usePathnameMock.mockReturnValue("/historial");
    render(<NavBar />);

    const navs = screen.getAllByRole("navigation", { name: /navegación principal/i });
    for (const nav of navs) {
      expect(within(nav).getByRole("link", { name: /rutinas/i })).not.toHaveAttribute(
        "aria-current",
      );
      expect(within(nav).getByRole("link", { name: /historial/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });
});
