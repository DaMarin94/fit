import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { enqueueWorkoutLog, listPendingWorkoutLogs, removePendingWorkoutLog } from "./workout-log-queue";
import { deleteFitDbForTests } from "./db";

describe("lib/offline/workout-log-queue", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
  });

  it("sin nada encolado, el listado está vacío", async () => {
    expect(await listPendingWorkoutLogs()).toEqual([]);
  });

  it("encola un WorkoutLog pendiente con id propio y lo devuelve en el listado", async () => {
    const entry = await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");

    expect(entry.routineId).toBe("r1");
    expect(entry.dayId).toBe("d1");
    expect(entry.performedAt).toBe("2026-08-26T10:00:00.000Z");
    expect(entry.id).toBeTruthy();

    const pending = await listPendingWorkoutLogs();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toEqual(entry);
  });

  it("permite encolar más de uno, cada uno con id distinto", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    await enqueueWorkoutLog("r1", "d2", "2026-08-26T11:00:00.000Z");

    const pending = await listPendingWorkoutLogs();
    expect(pending).toHaveLength(2);
    expect(pending[0].id).not.toBe(pending[1].id);
  });

  it("removePendingWorkoutLog saca la entrada de la cola", async () => {
    const entry = await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");

    await removePendingWorkoutLog(entry.id);

    expect(await listPendingWorkoutLogs()).toEqual([]);
  });
});
