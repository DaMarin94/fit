import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RutinasPage from "./page";
import * as routinesApi from "@/lib/api/routines";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("RutinasPage (Mis rutinas)", () => {
  it("muestra el esqueleto mientras carga", () => {
    vi.spyOn(routinesApi, "listRoutines").mockReturnValue(new Promise(() => {}));
    render(<RutinasPage />);
    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
  });

  it("estado vacío con CTA para crear la primera rutina", async () => {
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([]);
    render(<RutinasPage />);
    expect(await screen.findByText(/todavía no tenés rutinas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear rutina/i })).toHaveAttribute("href", "/rutinas/nueva");
  });

  it("lista rutinas con nombre y cantidad de días", async () => {
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([
      { id: "r1", name: "Plan semanal", dayCount: 5 },
    ]);
    render(<RutinasPage />);
    expect(await screen.findByText("Plan semanal")).toBeInTheDocument();
    expect(screen.getByText(/5 días/i)).toBeInTheDocument();
  });

  it("error con reintentar", async () => {
    vi.spyOn(routinesApi, "listRoutines").mockRejectedValue(new Error("x"));
    render(<RutinasPage />);
    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("editar navega al editor de rutina cargado", async () => {
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([
      { id: "r1", name: "Plan semanal", dayCount: 1 },
    ]);
    render(<RutinasPage />);
    expect(await screen.findByRole("link", { name: /editar plan semanal/i })).toHaveAttribute(
      "href",
      "/rutinas/r1/editar",
    );
  });

  it("borrar pide confirmación con el nombre y llama al DELETE", async () => {
    const user = userEvent.setup();
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([
      { id: "r1", name: "Plan semanal", dayCount: 1 },
    ]);
    const deleteSpy = vi.spyOn(routinesApi, "deleteRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: "x",
      days: [],
    });

    render(<RutinasPage />);
    await screen.findByText("Plan semanal");

    await user.click(screen.getByRole("button", { name: /borrar plan semanal/i }));
    const dialog = screen.getByRole("alertdialog", { name: /plan semanal/i });
    await user.click(within(dialog).getByRole("button", { name: /borrar rutina/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("r1"));
  });

  it("entrenar con un solo día va directo a Modo entrenar", async () => {
    const user = userEvent.setup();
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([
      { id: "r1", name: "Plan semanal", dayCount: 1 },
    ]);
    vi.spyOn(routinesApi, "getRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: null,
      days: [{ id: "d1", order: 0, blocks: [] }],
    });

    render(<RutinasPage />);
    await user.click(await screen.findByRole("button", { name: /entrenar plan semanal/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/entrenar/r1/d1"));
  });

  it("entrenar con más de un día abre el selector de día", async () => {
    const user = userEvent.setup();
    vi.spyOn(routinesApi, "listRoutines").mockResolvedValue([
      { id: "r1", name: "Plan semanal", dayCount: 2 },
    ]);
    vi.spyOn(routinesApi, "getRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: null,
      days: [
        { id: "d1", order: 0, blocks: [] },
        { id: "d2", order: 1, blocks: [] },
      ],
    });

    render(<RutinasPage />);
    await user.click(await screen.findByRole("button", { name: /entrenar plan semanal/i }));

    await screen.findByRole("dialog", { name: /elegí el día/i });
    await user.click(screen.getByRole("button", { name: "Día 2" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/entrenar/r1/d2"));
  });
});
