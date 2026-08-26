import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PoolPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";
import * as equipmentApi from "@/lib/api/equipment";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function mockDefaults() {
  vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
  vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([]);
}

describe("PoolPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra los esqueletos mientras carga", () => {
    vi.spyOn(exercisesApi, "listExercises").mockReturnValue(new Promise(() => {}));
    vi.spyOn(blocksApi, "listBlocks").mockReturnValue(new Promise(() => {}));
    vi.spyOn(equipmentApi, "listEquipment").mockReturnValue(new Promise(() => {}));

    render(<PoolPage />);

    expect(screen.getAllByRole("status", { name: /cargando/i }).length).toBeGreaterThan(0);
  });

  it("lista ejercicios, bloques y elementos con datos, en orden Ejercicios -> Bloques -> Elementos", async () => {
    mockDefaults();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
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
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);

    render(<PoolPage />);

    expect(await screen.findByText("Burpees")).toBeInTheDocument();
    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
    expect(screen.getByText("Kettlebell")).toBeInTheDocument();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf("Ejercicios")).toBeLessThan(headings.indexOf("Bloques"));
    expect(headings.indexOf("Bloques")).toBeLessThan(headings.indexOf("Elementos"));
  });

  it("estado vacío con CTA de creación en cada listado, incluido Elementos", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([]);
    mockDefaults();

    render(<PoolPage />);

    expect(await screen.findByText(/todavía no hay ejercicios/i)).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay bloques/i)).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay elementos/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /crear ejercicio/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /crear bloque/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /crear elemento/i }).length).toBeGreaterThan(0);
  });

  it("error con reintentar", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockRejectedValue(new Error("network"));
    mockDefaults();

    render(<PoolPage />);

    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("borrar un ejercicio pide confirmación y llama al DELETE", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
    ]);
    mockDefaults();
    const deleteSpy = vi.spyOn(exercisesApi, "deleteExercise").mockResolvedValue({
      id: "ex-1",
      name: "Burpees",
      equipmentGroups: [],
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

  it("borrar un elemento pide confirmación y llama al DELETE", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);
    const deleteSpy = vi.spyOn(equipmentApi, "deleteEquipment").mockResolvedValue({
      id: "eq-1",
      name: "Kettlebell",
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<PoolPage />);
    await screen.findByText("Kettlebell");

    await user.click(screen.getByRole("button", { name: /borrar kettlebell/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/kettlebell/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /borrar elemento/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("eq-1"));
  });

  it("línea de equipo del ejercicio: sin equipo se muestra como texto, un grupo como chip, dos grupos con conector Y", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
      { id: "ex-2", name: "Remos", equipmentGroups: [["eq-1", "eq-2"]], deletedAt: null },
      { id: "ex-3", name: "Press de banca", equipmentGroups: [["eq-2"], ["eq-3"]], deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
      { id: "eq-2", name: "Mancuernas", deletedAt: null },
      { id: "eq-3", name: "Banco", deletedAt: null },
    ]);

    render(<PoolPage />);

    await screen.findByText("Burpees");
    expect(screen.getByText("Sin equipo")).toBeInTheDocument();

    const remosRow = screen.getByText("Remos").closest("li");
    expect(remosRow).not.toBeNull();
    expect(within(remosRow as HTMLElement).getByText("Kettlebell")).toBeInTheDocument();
    expect(within(remosRow as HTMLElement).getByText("o")).toBeInTheDocument();

    const pressRow = screen.getByText("Press de banca").closest("li");
    expect(pressRow).not.toBeNull();
    expect(within(pressRow as HTMLElement).getByText("Y")).toBeInTheDocument();
  });

  it("filtro: elegir un elemento acota el listado de ejercicios (RF-018)", async () => {
    const user = userEvent.setup();
    const listSpy = vi
      .spyOn(exercisesApi, "listExercises")
      .mockResolvedValueOnce([
        { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
        { id: "ex-2", name: "Remos", equipmentGroups: [["eq-1"]], deletedAt: null },
      ])
      .mockResolvedValueOnce([{ id: "ex-2", name: "Remos", equipmentGroups: [["eq-1"]], deletedAt: null }]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);

    render(<PoolPage />);

    await screen.findByText("Burpees");
    await user.click(screen.getByRole("button", { name: /todos los equipos/i }));
    await user.click(screen.getByRole("button", { name: "Kettlebell" }));

    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith({ equipmentId: "eq-1" }));
    expect(await screen.findByRole("button", { name: "Kettlebell" })).toBeInTheDocument();
  });

  it("filtro: 'Sin equipo' filtra a los que no necesitan nada", async () => {
    const user = userEvent.setup();
    const listSpy = vi
      .spyOn(exercisesApi, "listExercises")
      .mockResolvedValueOnce([
        { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
      ])
      .mockResolvedValueOnce([{ id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null }]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([]);

    render(<PoolPage />);

    await screen.findByText("Burpees");
    await user.click(screen.getByRole("button", { name: /todos los equipos/i }));
    await user.click(screen.getByRole("button", { name: "Sin equipo" }));

    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith({ equipmentId: "none" }));
  });

  it("filtro activo: la X lo limpia y vuelve a listar todo", async () => {
    const user = userEvent.setup();
    const listSpy = vi
      .spyOn(exercisesApi, "listExercises")
      .mockResolvedValueOnce([{ id: "ex-2", name: "Remos", equipmentGroups: [["eq-1"]], deletedAt: null }])
      .mockResolvedValueOnce([{ id: "ex-2", name: "Remos", equipmentGroups: [["eq-1"]], deletedAt: null }])
      .mockResolvedValueOnce([
        { id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null },
        { id: "ex-2", name: "Remos", equipmentGroups: [["eq-1"]], deletedAt: null },
      ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);

    render(<PoolPage />);
    await screen.findByText("Remos");

    await user.click(screen.getByRole("button", { name: /todos los equipos/i }));
    await user.click(screen.getByRole("button", { name: "Kettlebell" }));
    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith({ equipmentId: "eq-1" }));

    await user.click(screen.getByRole("button", { name: /quitar filtro/i }));

    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith());
    expect(await screen.findByText("Burpees")).toBeInTheDocument();
  });

  it("filtro sin resultados: mensaje y botón para limpiar", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises")
      .mockResolvedValueOnce([{ id: "ex-1", name: "Burpees", equipmentGroups: [], deletedAt: null }])
      .mockResolvedValueOnce([]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);

    render(<PoolPage />);
    await screen.findByText("Burpees");

    await user.click(screen.getByRole("button", { name: /todos los equipos/i }));
    await user.click(screen.getByRole("button", { name: "Kettlebell" }));

    expect(await screen.findByText(/no encontramos ejercicios/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /limpiar filtro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kettlebell" })).toBeInTheDocument();
  });
});
