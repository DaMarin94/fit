import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditRoutinePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";
import * as routinesApi from "@/lib/api/routines";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "r1" }),
}));

describe("EditRoutinePage", () => {
  it("precarga la rutina y guarda con PUT", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([]);
    vi.spyOn(routinesApi, "getRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: null,
      days: [
        {
          id: "d1",
          order: 0,
          blocks: [
            {
              id: "db1",
              order: 0,
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
              advanceMode: "manual",
              exercises: [{ id: "be1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
            },
          ],
        },
      ],
    });
    const updateSpy = vi.spyOn(routinesApi, "updateRoutine").mockResolvedValue({
      id: "r1",
      name: "Plan semanal",
      deletedAt: null,
      days: [],
    });

    render(<EditRoutinePage />);

    expect(await screen.findByDisplayValue("Plan semanal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(updateSpy).toHaveBeenCalledWith("r1", expect.objectContaining({ name: "Plan semanal" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
