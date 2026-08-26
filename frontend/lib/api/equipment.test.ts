import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../http/api-client";
import { createEquipment, deleteEquipment, listEquipment, updateEquipment } from "./equipment";

describe("lib/api/equipment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listEquipment pega a GET /equipment", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue([]);

    await listEquipment();

    expect(spy).toHaveBeenCalledWith("/equipment");
  });

  it("createEquipment pega a POST /equipment con el nombre", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Kettlebell",
      deletedAt: null,
    });

    const result = await createEquipment({ name: "Kettlebell" });

    expect(spy).toHaveBeenCalledWith("/equipment", {
      method: "POST",
      body: { name: "Kettlebell" },
    });
    expect(result.name).toBe("Kettlebell");
  });

  it("updateEquipment pega a PATCH /equipment/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "Nuevo nombre",
      deletedAt: null,
    });

    await updateEquipment("1", { name: "Nuevo nombre" });

    expect(spy).toHaveBeenCalledWith("/equipment/1", {
      method: "PATCH",
      body: { name: "Nuevo nombre" },
    });
  });

  it("deleteEquipment pega a DELETE /equipment/:id", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue({
      id: "1",
      name: "x",
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    await deleteEquipment("1");

    expect(spy).toHaveBeenCalledWith("/equipment/1", { method: "DELETE" });
  });
});
