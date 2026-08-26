import { apiFetch } from "../http/api-client";
import type { Routine, RoutineInput, RoutineSummary } from "@/types/domain";

/** Llamadas a `/routines` (`docs/data-model.md` §4.3, RF-004 a RF-006). */

export function listRoutines(): Promise<RoutineSummary[]> {
  return apiFetch<RoutineSummary[]>("/routines");
}

/**
 * `options.silent` reenvía el flag de `apiFetch` (`docs/technical.md` §2.2)
 * para el caso puntual de Modo entrenar, que intenta la carga en silencio
 * antes de resolver contra la cache offline (RN-004).
 */
export function getRoutine(id: string, options?: { silent?: boolean }): Promise<Routine> {
  return options?.silent
    ? apiFetch<Routine>(`/routines/${id}`, { silent: true })
    : apiFetch<Routine>(`/routines/${id}`);
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
