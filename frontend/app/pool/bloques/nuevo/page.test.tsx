import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewBlockPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("NewBlockPage", () => {
  it("crea el bloque y vuelve al pool", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", equipmentGroups: [], deletedAt: null },
    ]);
    const createSpy = vi.spyOn(blocksApi, "createBlock").mockResolvedValue({
      id: "b-1",
      name: "Fuerza EMOM 12'",
      type: "fuerza",
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      advanceMode: "manual",
      exercises: [],
      deletedAt: null,
    });

    render(<NewBlockPage />);

    await user.type(await screen.findByLabelText(/nombre del bloque/i), "Fuerza EMOM 12'");
    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(await screen.findByRole("button", { name: "Goblet squats" }));
    const repsInput = screen.getByLabelText(/reps/i);
    await user.clear(repsInput);
    await user.type(repsInput, "12");
    await user.click(screen.getByRole("button", { name: /crear bloque/i }));

    expect(createSpy).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
