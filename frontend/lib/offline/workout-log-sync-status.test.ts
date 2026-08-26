import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runWorkoutLogSync, subscribeWorkoutLogSyncEvents } from "./workout-log-sync-status";
import { enqueueWorkoutLog } from "./workout-log-queue";
import { deleteFitDbForTests } from "./db";
import * as workoutLogsApi from "../api/workout-logs";
import { ApiError } from "../http/api-client";

describe("lib/offline/workout-log-sync-status", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
    vi.restoreAllMocks();
  });

  it("sin nada pendiente, no emite start y emite done con synced: 0", async () => {
    const events: unknown[] = [];
    const unsubscribe = subscribeWorkoutLogSyncEvents((e) => events.push(e));

    await runWorkoutLogSync();

    unsubscribe();
    expect(events).toEqual([{ type: "done", synced: 0 }]);
  });

  it("con algo pendiente que sincroniza con éxito, emite start y después done con el conteo drenado", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "x",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    const events: unknown[] = [];
    const unsubscribe = subscribeWorkoutLogSyncEvents((e) => events.push(e));

    await runWorkoutLogSync();

    unsubscribe();
    expect(events).toEqual([{ type: "start" }, { type: "done", synced: 1 }]);
  });

  it("si falla por red, emite start y done con lo que llegó a drenar antes del corte", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    await enqueueWorkoutLog("r1", "d2", "2026-08-26T11:00:00.000Z");
    vi.spyOn(workoutLogsApi, "createWorkoutLog")
      .mockResolvedValueOnce({
        id: "w1",
        performedAt: "x",
        snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
      })
      .mockRejectedValueOnce(new ApiError("No se pudo conectar.", "NETWORK_ERROR"));

    const events: unknown[] = [];
    const unsubscribe = subscribeWorkoutLogSyncEvents((e) => events.push(e));

    await runWorkoutLogSync();

    unsubscribe();
    expect(events).toEqual([{ type: "start" }, { type: "done", synced: 1 }]);
  });

  it("un suscriptor que se da de baja no recibe más eventos", async () => {
    const events: unknown[] = [];
    const unsubscribe = subscribeWorkoutLogSyncEvents((e) => events.push(e));
    unsubscribe();

    await runWorkoutLogSync();

    expect(events).toEqual([]);
  });
});
