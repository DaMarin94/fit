import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../http/api-client";
import { createWorkoutLog, listWorkoutLogs } from "./workout-logs";

describe("lib/api/workout-logs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listWorkoutLogs pega a GET /workout-logs", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);
    await listWorkoutLogs();
    expect(spy).toHaveBeenCalledWith("/workout-logs");
  });

  it("createWorkoutLog pega a POST /routines/:routineId/days/:dayId/workout-logs", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "w1",
      performedAt: "2026-01-01T00:00:00.000Z",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    await createWorkoutLog("r1", "d1");

    expect(spy).toHaveBeenCalledWith("/routines/r1/days/d1/workout-logs", {
      method: "POST",
      body: {},
    });
  });
});
