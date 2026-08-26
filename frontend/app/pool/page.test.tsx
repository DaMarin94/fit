import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PoolPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("PoolPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra los esqueletos mientras carga", () => {
    vi.spyOn(exercisesApi, "listExercises").mockReturnValue(new Promise(() => {}));
    vi.spyOn(blocksApi, "listBlocks").mockReturnValue(new Promise(() => {}));

    render(<PoolPage />);

    expect(screen.getAllByRole("status", { name: /cargando/i }).length).toBeGreaterThan(0);
  });

  it("lista ejercicios y bloques con datos", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Burpees", deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([
      {
        id: "b-1",
        name: "Fuerza EMOM 12'",
        type: "fuerza",
        timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
        advanceMode: "manual",
        exercises: [],
        deletedAt: null,
      },
    ]);

    render(<PoolPage />);

    expect(await screen.findByText("Burpees")).toBeInTheDocument();
    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
  });

  it("estado vacío con CTA de creación en cada listado", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);

    render(<PoolPage />);

    expect(await screen.findByText(/todavía no hay ejercicios/i)).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay bloques/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /crear ejercicio/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /crear bloque/i }).length).toBeGreaterThan(0);
  });

  it("error con reintentar", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockRejectedValue(new Error("network"));
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);

    render(<PoolPage />);

    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("borrar un ejercicio pide confirmación y llama al DELETE", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Burpees", deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    const deleteSpy = vi.spyOn(exercisesApi, "deleteExercise").mockResolvedValue({
      id: "ex-1",
      name: "Burpees",
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<PoolPage />);
    await screen.findByText("Burpees");

    await user.click(screen.getByRole("button", { name: /borrar burpees/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/burpees/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /borrar ejercicio/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("ex-1"));
  });
});
