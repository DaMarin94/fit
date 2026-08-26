import { apiFetch } from "../http/api-client";
import type { Equipment } from "@/types/domain";

/** Llamadas a `/equipment` (`docs/data-model.md` §2.1, RF-016). Mismo patrón que `exercises.ts`. */

export function listEquipment(): Promise<Equipment[]> {
  return apiFetch<Equipment[]>("/equipment");
}

export function createEquipment(input: { name: string }): Promise<Equipment> {
  return apiFetch<Equipment>("/equipment", { method: "POST", body: input });
}

export function updateEquipment(
  id: string,
  input: { name: string },
): Promise<Equipment> {
  return apiFetch<Equipment>(`/equipment/${id}`, { method: "PATCH", body: input });
}

export function deleteEquipment(id: string): Promise<Equipment> {
  return apiFetch<Equipment>(`/equipment/${id}`, { method: "DELETE" });
}
