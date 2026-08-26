import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { syncPendingWorkoutLogs } from "./workout-log-sync";
import { enqueueWorkoutLog, listPendingWorkoutLogs } from "./workout-log-queue";
import { deleteFitDbForTests } from "./db";
import * as workoutLogsApi from "../api/workout-logs";
import { ApiError } from "../http/api-client";

describe("lib/offline/workout-log-sync", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
    vi.restoreAllMocks();
  });

  it("sin nada pendiente, no llama a la API y devuelve synced: 0", async () => {
    const createSpy = vi.spyOn(workoutLogsApi, "createWorkoutLog");

    const result = await syncPendingWorkoutLogs();

    expect(createSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ synced: 0 });
  });

  it("envía cada pendiente y lo saca de la cola cuando el envío tiene éxito", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    await enqueueWorkoutLog("r1", "d2", "2026-08-26T11:00:00.000Z");
    const createSpy = vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "x",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    const result = await syncPendingWorkoutLogs();

    expect(createSpy).toHaveBeenNthCalledWith(1, "r1", "d1", "2026-08-26T10:00:00.000Z");
    expect(createSpy).toHaveBeenNthCalledWith(2, "r1", "d2", "2026-08-26T11:00:00.000Z");
    expect(await listPendingWorkoutLogs()).toEqual([]);
    expect(result).toEqual({ synced: 2 });
  });

  it("si un envío falla por red, corta ahí y deja esa entrada y las siguientes en la cola", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    await enqueueWorkoutLog("r1", "d2", "2026-08-26T11:00:00.000Z");
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockRejectedValue(
      new ApiError("No se pudo conectar.", "NETWORK_ERROR"),
    );

    const result = await syncPendingWorkoutLogs();

    const pending = await listPendingWorkoutLogs();
    expect(pending).toHaveLength(2);
    expect(result).toEqual({ synced: 0 });
  });

  it("si un envío falla por un error real del servidor, lo deja en la cola pero sigue con el siguiente", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    await enqueueWorkoutLog("r1", "d2", "2026-08-26T11:00:00.000Z");
    const createSpy = vi
      .spyOn(workoutLogsApi, "createWorkoutLog")
      .mockRejectedValueOnce(new ApiError("Error del servidor.", "UNKNOWN_ERROR"))
      .mockResolvedValueOnce({
        id: "w2",
        performedAt: "x",
        snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
      });

    const result = await syncPendingWorkoutLogs();

    expect(createSpy).toHaveBeenCalledTimes(2);
    const pending = await listPendingWorkoutLogs();
    expect(pending).toHaveLength(1);
    expect(pending[0].dayId).toBe("d1");
    expect(result).toEqual({ synced: 1 });
  });
});
