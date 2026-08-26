import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewExercisePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as equipmentApi from "@/lib/api/equipment";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("NewExercisePage", () => {
  it("crea el ejercicio y vuelve al pool", async () => {
    const user = userEvent.setup();
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([]);
    const createSpy = vi
      .spyOn(exercisesApi, "createExercise")
      .mockResolvedValue({ id: "1", name: "Sentadillas", equipmentGroups: [], deletedAt: null });

    render(<NewExercisePage />);

    await user.type(screen.getByLabelText(/nombre/i), "Sentadillas");
    await user.click(screen.getByRole("button", { name: /crear ejercicio/i }));

    expect(createSpy).toHaveBeenCalledWith({ name: "Sentadillas", equipmentGroups: [] });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });

  it("agrega un grupo de equipo con el selector y lo manda en equipmentGroups", async () => {
    const user = userEvent.setup();
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);
    const createSpy = vi
      .spyOn(exercisesApi, "createExercise")
      .mockResolvedValue({ id: "1", name: "Goblet squats", equipmentGroups: [["eq-1"]], deletedAt: null });

    render(<NewExercisePage />);

    await user.type(screen.getByLabelText(/nombre/i), "Goblet squats");
    await user.click(await screen.findByRole("button", { name: "Agregar equipo" }));
    await user.click(screen.getByRole("button", { name: "Kettlebell" }));
    await user.click(screen.getByRole("button", { name: /crear ejercicio/i }));

    expect(createSpy).toHaveBeenCalledWith({ name: "Goblet squats", equipmentGroups: [["eq-1"]] });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });

  it("el pool de elementos vacío: 'Crear elemento' navega afuera del formulario", async () => {
    const user = userEvent.setup();
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([]);

    render(<NewExercisePage />);

    await user.click(await screen.findByRole("button", { name: "Agregar equipo" }));
    await user.click(screen.getByRole("button", { name: "Crear elemento" }));

    expect(pushMock).toHaveBeenCalledWith("/pool/elementos/nuevo");
  });
});
