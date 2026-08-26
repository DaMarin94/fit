import { apiFetch } from "../http/api-client";
import type { EquipmentGroups, Exercise } from "@/types/domain";

/**
 * Llamadas a `/exercises` (`docs/data-model.md` §4.3, RF-001). `equipmentGroups`
 * (RF-017) viaja como `string[][]` de `equipmentId`; `PATCH` reemplaza el
 * conjunto completo. El filtro por elemento (RF-018) usa
 * `?equipmentId=<id>` o `?equipmentId=none`.
 */

export function listExercises(filter?: { equipmentId?: string }): Promise<Exercise[]> {
  const path = filter?.equipmentId
    ? `/exercises?equipmentId=${encodeURIComponent(filter.equipmentId)}`
    : "/exercises";
  return apiFetch<Exercise[]>(path);
}

export function createExercise(input: {
  name: string;
  equipmentGroups?: EquipmentGroups;
}): Promise<Exercise> {
  return apiFetch<Exercise>("/exercises", { method: "POST", body: input });
}

export function updateExercise(
  id: string,
  input: { name: string; equipmentGroups?: EquipmentGroups },
): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, { method: "PATCH", body: input });
}

export function deleteExercise(id: string): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, { method: "DELETE" });
}
