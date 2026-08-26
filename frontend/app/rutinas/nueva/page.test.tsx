import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewRoutinePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";
import * as routinesApi from "@/lib/api/routines";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("NewRoutinePage", () => {
  it("crea la rutina y vuelve a Mis rutinas", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", equipmentGroups: [], deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([
      {
        id: "pb-1",
        name: "Fuerza EMOM 12'",
        type: "fuerza",
        timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
        advanceMode: "manual",
        exercises: [{ id: "be-1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
        deletedAt: null,
      },
    ]);
    const createSpy = vi.spyOn(routinesApi, "createRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: null,
      days: [],
    });

    render(<NewRoutinePage />);

    await user.type(screen.getByLabelText(/nombre de la rutina/i), "Plan semanal");
    await user.click(await screen.findByRole("button", { name: /agregar bloque del pool/i }));
    await user.click(await screen.findByRole("button", { name: "Fuerza EMOM 12'" }));
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(createSpy).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
