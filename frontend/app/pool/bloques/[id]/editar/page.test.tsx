import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditBlockPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "b-1" }),
}));

describe("EditBlockPage", () => {
  it("precarga el bloque existente y lo actualiza (reemplazo completo)", async () => {
    const user = userEvent.setup();
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", deletedAt: null },
    ]);
    vi.spyOn(blocksApi, "listBlocks").mockResolvedValue([
      {
        id: "b-1",
        name: "Fuerza EMOM 12'",
        type: "fuerza",
        timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
        advanceMode: "manual",
        exercises: [{ id: "be-1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
        deletedAt: null,
      },
    ]);
    const updateSpy = vi.spyOn(blocksApi, "updateBlock").mockResolvedValue({
      id: "b-1",
      name: "Fuerza EMOM 12'",
      type: "fuerza",
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      advanceMode: "manual",
      exercises: [],
      deletedAt: null,
    });

    render(<EditBlockPage />);

    expect(await screen.findByDisplayValue("Fuerza EMOM 12'")).toBeInTheDocument();
    expect(screen.getByText("Goblet squats")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(updateSpy).toHaveBeenCalledWith(
      "b-1",
      expect.objectContaining({ name: "Fuerza EMOM 12'", type: "fuerza" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
