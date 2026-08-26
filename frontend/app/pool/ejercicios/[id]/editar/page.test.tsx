import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditExercisePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "ex-1" }),
}));

describe("EditExercisePage", () => {
  it("precarga el ejercicio existente y lo actualiza", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Sentadillas", deletedAt: null },
      { id: "ex-2", name: "Burpees", deletedAt: null },
    ]);
    const updateSpy = vi
      .spyOn(exercisesApi, "updateExercise")
      .mockResolvedValue({ id: "ex-1", name: "Sentadillas con salto", deletedAt: null });

    render(<EditExercisePage />);

    const input = await screen.findByLabelText(/nombre/i);
    expect(input).toHaveValue("Sentadillas");

    await user.clear(input);
    await user.type(input, "Sentadillas con salto");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(updateSpy).toHaveBeenCalledWith("ex-1", { name: "Sentadillas con salto" });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
