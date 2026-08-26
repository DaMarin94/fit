import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { loadTrainingCache, saveTrainingCache } from "./training-cache";
import { deleteFitDbForTests } from "./db";
import type { Routine } from "@/types/domain";

const routine: Routine = {
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
};

describe("lib/offline/training-cache", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
  });

  it("sin nada cacheado, devuelve null", async () => {
    const result = await loadTrainingCache("nope");
    expect(result).toBeNull();
  });

  it("guarda la rutina completa y el mapa de nombres, y los devuelve tal cual", async () => {
    const exerciseNameById = new Map([["ex-1", "Goblet squats"]]);

    await saveTrainingCache("r1", routine, exerciseNameById);
    const result = await loadTrainingCache("r1");

    expect(result).not.toBeNull();
    expect(result?.routine).toEqual(routine);
    expect(result?.exerciseNameById.get("ex-1")).toBe("Goblet squats");
  });

  it("guardar de nuevo para la misma rutina reemplaza la entrada anterior", async () => {
    await saveTrainingCache("r1", routine, new Map([["ex-1", "Goblet squats"]]));
    const updatedRoutine: Routine = { ...routine, name: "Plan semanal v2" };
    await saveTrainingCache("r1", updatedRoutine, new Map([["ex-1", "Goblet squats v2"]]));

    const result = await loadTrainingCache("r1");

    expect(result?.routine.name).toBe("Plan semanal v2");
    expect(result?.exerciseNameById.get("ex-1")).toBe("Goblet squats v2");
  });
});
