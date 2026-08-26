import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../http/api-client";
import { createBlock, deleteBlock, listBlocks, updateBlock } from "./blocks";
import type { BlockInput } from "@/types/domain";

describe("lib/api/blocks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const input: BlockInput = {
    name: "Fuerza EMOM 12'",
    type: "fuerza",
    advanceMode: "manual",
    timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
    exercises: [{ exerciseId: "ex-1", reps: 12 }],
  };

  it("listBlocks pega a GET /blocks", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);
    await listBlocks();
    expect(spy).toHaveBeenCalledWith("/blocks");
  });

  it("createBlock pega a POST /blocks con el body completo", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({ ...input, id: "b1", exercises: [], deletedAt: null });
    await createBlock(input);
    expect(spy).toHaveBeenCalledWith("/blocks", { method: "POST", body: input });
  });

  it("updateBlock pega a PATCH /blocks/:id con el body completo (reemplazo)", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({ ...input, id: "b1", exercises: [], deletedAt: null });
    await updateBlock("b1", input);
    expect(spy).toHaveBeenCalledWith("/blocks/b1", { method: "PATCH", body: input });
  });

  it("deleteBlock pega a DELETE /blocks/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({ ...input, id: "b1", exercises: [], deletedAt: "x" });
    await deleteBlock("b1");
    expect(spy).toHaveBeenCalledWith("/blocks/b1", { method: "DELETE" });
  });
});
