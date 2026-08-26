import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditExercisePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as equipmentApi from "@/lib/api/equipment";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "ex-1" }),
}));

describe("EditExercisePage", () => {
  it("precarga el ejercicio existente (nombre y grupos de equipo) y lo actualiza", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Sentadillas", equipmentGroups: [["eq-1"]], deletedAt: null },
      { id: "ex-2", name: "Burpees", equipmentGroups: [], deletedAt: null },
    ]);
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
    ]);
    const updateSpy = vi.spyOn(exercisesApi, "updateExercise").mockResolvedValue({
      id: "ex-1",
      name: "Sentadillas con salto",
      equipmentGroups: [["eq-1"]],
      deletedAt: null,
    });

    render(<EditExercisePage />);

    const input = await screen.findByLabelText(/nombre/i);
    expect(input).toHaveValue("Sentadillas");
    expect(await screen.findByText("Kettlebell")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Sentadillas con salto");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(updateSpy).toHaveBeenCalledWith("ex-1", {
      name: "Sentadillas con salto",
      equipmentGroups: [["eq-1"]],
    });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
