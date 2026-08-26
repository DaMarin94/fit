import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "./NavBar";
import { clearExitGuard, setExitGuard } from "@/lib/training/exit-guard-store";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
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

  describe("guardia de salida (RN-010)", () => {
    afterEach(() => {
      clearExitGuard();
    });

    it("con guardia activa, el click no navega y le delega la decisión a la guardia", async () => {
      const user = userEvent.setup();
      const guard = vi.fn();
      setExitGuard(guard);
      usePathnameMock.mockReturnValue("/entrenar/r1/d1");
      render(<NavBar />);

      const [link] = screen.getAllByRole("link", { name: /pool/i });
      await user.click(link);

      expect(guard).toHaveBeenCalledWith("/pool");
    });
  });
});
