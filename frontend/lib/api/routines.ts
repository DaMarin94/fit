import { apiFetch } from "../http/api-client";
import type { Routine, RoutineInput, RoutineSummary } from "@/types/domain";

/** Llamadas a `/routines` (`docs/data-model.md` §4.3, RF-004 a RF-006). */

export function listRoutines(): Promise<RoutineSummary[]> {
  return apiFetch<RoutineSummary[]>("/routines");
}

export function getRoutine(id: string): Promise<Routine> {
  return apiFetch<Routine>(`/routines/${id}`);
}

export function createRoutine(input: RoutineInput): Promise<Routine> {
  return apiFetch<Routine>("/routines", { method: "POST", body: input });
}

/** Reemplazo completo del árbol de la rutina. */
export function updateRoutine(id: string, input: RoutineInput): Promise<Routine> {
  return apiFetch<Routine>(`/routines/${id}`, { method: "PUT", body: input });
}

export function deleteRoutine(id: string): Promise<Routine> {
  return apiFetch<Routine>(`/routines/${id}`, { method: "DELETE" });
}
