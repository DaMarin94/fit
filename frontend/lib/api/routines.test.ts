import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../http/api-client";
import {
  createRoutine,
  deleteRoutine,
  getRoutine,
  listRoutines,
  updateRoutine,
} from "./routines";
import type { RoutineInput } from "@/types/domain";

describe("lib/api/routines", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const input: RoutineInput = {
    name: "Plan semanal",
    days: [{ blocks: [] }],
  };

  it("listRoutines pega a GET /routines", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);
    await listRoutines();
    expect(spy).toHaveBeenCalledWith("/routines");
  });

  it("getRoutine pega a GET /routines/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "r1",
      name: "x",
      deletedAt: null,
      days: [],
    });
    await getRoutine("r1");
    expect(spy).toHaveBeenCalledWith("/routines/r1");
  });

  it("createRoutine pega a POST /routines con el árbol completo", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "r1",
      name: input.name,
      deletedAt: null,
      days: [],
    });
    await createRoutine(input);
    expect(spy).toHaveBeenCalledWith("/routines", { method: "POST", body: input });
  });

  it("updateRoutine pega a PUT /routines/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "r1",
      name: input.name,
      deletedAt: null,
      days: [],
    });
    await updateRoutine("r1", input);
    expect(spy).toHaveBeenCalledWith("/routines/r1", { method: "PUT", body: input });
  });

  it("deleteRoutine pega a DELETE /routines/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "r1",
      name: "x",
      deletedAt: "x",
      days: [],
    });
    await deleteRoutine("r1");
    expect(spy).toHaveBeenCalledWith("/routines/r1", { method: "DELETE" });
  });
});
