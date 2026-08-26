import { apiFetch } from "../http/api-client";
import type { Exercise } from "@/types/domain";

/** Llamadas a `/exercises` (`docs/data-model.md` §4.3, RF-001). */

export function listExercises(): Promise<Exercise[]> {
  return apiFetch<Exercise[]>("/exercises");
}

export function createExercise(input: { name: string }): Promise<Exercise> {
  return apiFetch<Exercise>("/exercises", { method: "POST", body: input });
}

export function updateExercise(
  id: string,
  input: { name: string },
): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, { method: "PATCH", body: input });
}

export function deleteExercise(id: string): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, { method: "DELETE" });
}
