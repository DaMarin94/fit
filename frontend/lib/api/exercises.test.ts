import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../http/api-client";
import { createExercise, deleteExercise, listExercises, updateExercise } from "./exercises";

describe("lib/api/exercises", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listExercises pega a GET /exercises", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);

    await listExercises();

    expect(spy).toHaveBeenCalledWith("/exercises");
  });

  it("listExercises con filtro por elemento pega a GET /exercises?equipmentId=<id> (RF-018)", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);

    await listExercises({ equipmentId: "eq-1" });

    expect(spy).toHaveBeenCalledWith("/exercises?equipmentId=eq-1");
  });

  it("listExercises con filtro 'sin equipo' pega a GET /exercises?equipmentId=none", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);

    await listExercises({ equipmentId: "none" });

    expect(spy).toHaveBeenCalledWith("/exercises?equipmentId=none");
  });

  it("listExercises con options.silent reenvía silent: true a apiFetch", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);

    await listExercises(undefined, { silent: true });

    expect(spy).toHaveBeenCalledWith("/exercises", { silent: true });
  });

  it("createExercise pega a POST /exercises con el nombre y los grupos de equipo", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Sentadillas",
      equipmentGroups: [],
      deletedAt: null,
    });

    const result = await createExercise({ name: "Sentadillas", equipmentGroups: [["eq-1"]] });

    expect(spy).toHaveBeenCalledWith("/exercises", {
      method: "POST",
      body: { name: "Sentadillas", equipmentGroups: [["eq-1"]] },
    });
    expect(result.name).toBe("Sentadillas");
  });

  it("updateExercise pega a PATCH /exercises/:id con el reemplazo completo de grupos", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Nuevo nombre",
      equipmentGroups: [["eq-1", "eq-2"]],
      deletedAt: null,
    });

    await updateExercise("1", { name: "Nuevo nombre", equipmentGroups: [["eq-1", "eq-2"]] });

    expect(spy).toHaveBeenCalledWith("/exercises/1", {
      method: "PATCH",
      body: { name: "Nuevo nombre", equipmentGroups: [["eq-1", "eq-2"]] },
    });
  });

  it("deleteExercise pega a DELETE /exercises/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "x",
      equipmentGroups: [],
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    await deleteExercise("1");

    expect(spy).toHaveBeenCalledWith("/exercises/1", { method: "DELETE" });
  });
});
