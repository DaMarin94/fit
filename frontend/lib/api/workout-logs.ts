import { apiFetch } from "../http/api-client";
import type { WorkoutLog } from "@/types/domain";

/** Llamadas a `/workout-logs` (`docs/data-model.md` §4.3, RF-012/RF-013). */

export function listWorkoutLogs(): Promise<WorkoutLog[]> {
  return apiFetch<WorkoutLog[]>("/workout-logs");
}

export function createWorkoutLog(
  routineId: string,
  dayId: string,
  performedAt?: string,
  options?: { silent?: boolean },
): Promise<WorkoutLog> {
  return apiFetch<WorkoutLog>(`/routines/${routineId}/days/${dayId}/workout-logs`, {
    method: "POST",
    body: performedAt ? { performedAt } : {},
    silent: options?.silent,
  });
}
