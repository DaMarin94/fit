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

  it("createExercise pega a POST /exercises con el nombre", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Sentadillas",
      deletedAt: null,
    });

    const result = await createExercise({ name: "Sentadillas" });

    expect(spy).toHaveBeenCalledWith("/exercises", {
      method: "POST",
      body: { name: "Sentadillas" },
    });
    expect(result.name).toBe("Sentadillas");
  });

  it("updateExercise pega a PATCH /exercises/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Nuevo nombre",
      deletedAt: null,
    });

    await updateExercise("1", { name: "Nuevo nombre" });

    expect(spy).toHaveBeenCalledWith("/exercises/1", {
      method: "PATCH",
      body: { name: "Nuevo nombre" },
    });
  });

  it("deleteExercise pega a DELETE /exercises/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "x",
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    await deleteExercise("1");

    expect(spy).toHaveBeenCalledWith("/exercises/1", { method: "DELETE" });
  });
});
