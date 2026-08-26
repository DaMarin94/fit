import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EntrenarPage from "./page";
import * as exercisesApi from "@/lib/api/exercises";
import * as routinesApi from "@/lib/api/routines";
import { ApiError } from "@/lib/http/api-client";
import { deleteFitDbForTests } from "@/lib/offline/db";
import { loadTrainingCache, saveTrainingCache } from "@/lib/offline/training-cache";
import { clearToasts, getToasts } from "@/lib/toast/toast-store";
import type { Routine } from "@/types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ routineId: "r1", dayId: "d1" }),
}));

const cachedRoutine: Routine = {
  id: "r1",
  name: "Plan semanal (cache)",
  deletedAt: null,
  days: [
    {
      id: "d1",
      order: 0,
      blocks: [
        {
          id: "b1",
          order: 0,
          name: "Fuerza EMOM 12' (cache)",
          type: "fuerza",
          timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
          advanceMode: "manual",
          exercises: [{ id: "be1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
        },
      ],
    },
  ],
};

describe("EntrenarPage", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
    clearToasts();
  });

  it("carga la rutina, resuelve el día y los nombres de ejercicios, y muestra Modo entrenar", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", equipmentGroups: [], deletedAt: null },
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

  it("al cargar online con éxito, cachea la rutina completa y el mapa de nombres para uso offline", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([
      { id: "ex-1", name: "Goblet squats", equipmentGroups: [], deletedAt: null },
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
    await screen.findByText(/plan semanal/i);

    const cached = await vi.waitFor(async () => {
      const result = await loadTrainingCache("r1");
      if (!result) throw new Error("todavía no se cacheó");
      return result;
    });

    expect(cached.routine.name).toBe("Plan semanal");
    expect(cached.exerciseNameById.get("ex-1")).toBe("Goblet squats");
  });

  it("sin red, usa la cache de la última rutina traída con éxito como fallback, sin toast de error", async () => {
    await saveTrainingCache("r1", cachedRoutine, new Map([["ex-1", "Goblet squats (cache)"]]));
    vi.spyOn(exercisesApi, "listExercises").mockRejectedValue(
      new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"),
    );
    vi.spyOn(routinesApi, "getRoutine").mockRejectedValue(
      new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"),
    );

    render(<EntrenarPage />);

    expect(await screen.findByText(/plan semanal \(cache\)/i)).toBeInTheDocument();
    expect(screen.getByText("Fuerza EMOM 12' (cache)")).toBeInTheDocument();
    // La pantalla se degrada con gracia a la cache: no es una falla, no hay
    // toast (mismo criterio que `TrainingScreen.handleFinish`, `docs/design.md` §12).
    expect(getToasts()).toEqual([]);
  });

  it("las llamadas de red van silenciadas (silent: true) para no arriesgar un toast que la cache resuelve", async () => {
    await saveTrainingCache("r1", cachedRoutine, new Map([["ex-1", "Goblet squats (cache)"]]));
    const getRoutineSpy = vi
      .spyOn(routinesApi, "getRoutine")
      .mockRejectedValue(new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"));
    const listExercisesSpy = vi
      .spyOn(exercisesApi, "listExercises")
      .mockRejectedValue(new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"));

    render(<EntrenarPage />);

    await screen.findByText(/plan semanal \(cache\)/i);
    expect(getRoutineSpy).toHaveBeenCalledWith("r1", { silent: true });
    expect(listExercisesSpy).toHaveBeenCalledWith(undefined, { silent: true });
  });

  it("sin red y sin nada cacheado, muestra el estado de error y avisa con un toast (el llamado fue silencioso)", async () => {
    vi.spyOn(exercisesApi, "listExercises").mockResolvedValue([]);
    vi.spyOn(routinesApi, "getRoutine").mockRejectedValue(
      new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"),
    );

    render(<EntrenarPage />);

    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
    expect(getToasts()).toEqual([
      { id: expect.any(String), message: "No se pudo conectar con el servidor.", variant: "error" },
    ]);
  });
});
