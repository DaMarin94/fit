import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EntrenarPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as routinesApi from "@/lib/api/routines";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ routineId: "r1", dayId: "d1" }),
}));

describe("EntrenarPage", () => {
  it("carga la rutina, resuelve el día y los nombres de ejercicios, y muestra Modo entrenar", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", deletedAt: null },
    ]);
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
              id: "b1",
              order: 0,
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
              advanceMode: "manual",
              exercises: [{ id: "be1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
            },
          ],
        },
      ],
    });

    render(<EntrenarPage />);

    expect(await screen.findByText(/plan semanal/i)).toBeInTheDocument();
    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar/i })).toBeInTheDocument();
  });

  it("error al cargar: muestra reintentar", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([]);
    vi.spyOn(routinesApi, "getRoutine").mockRejectedValue(new Error("x"));

    render(<EntrenarPage />);

    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });
});
