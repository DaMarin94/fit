import { getFitDb, TRAINING_CACHE_STORE } from "./db";
import type { Routine } from "@/types/domain";

/**
 * Cache local de Modo entrenar (RN-004, `docs/architecture.md` §5): guarda
 * la última `Routine` completa traída con éxito, indexada por `routineId`,
 * más el mapa de nombres de ejercicio (`docs/data-model.md`: los
 * `BlockExercise` anidados no traen el nombre). Se escribe en cada fetch
 * online exitoso —más simple y más correcto que tratar de distinguir el
 * motivo del fallo cuando el fetch en vivo falla después— y se lee como
 * fallback en ese momento.
 *
 * Falla en silencio (no hay IndexedDB disponible, cuota agotada, etc.): es
 * una optimización best-effort, nunca debe bloquear el camino online.
 */
export async function saveTrainingCache(
  routineId: string,
  routine: Routine,
  exerciseNameById: Map<string, string>,
): Promise<void> {
  try {
    const db = await getFitDb();
    await db.put(TRAINING_CACHE_STORE, {
      routineId,
      routine,
      exerciseNameById: Array.from(exerciseNameById.entries()),
      cachedAt: new Date().toISOString(),
    });
  } catch {
    // Cache best-effort: un fallo acá no debe afectar el flujo online.
  }
}

export async function loadTrainingCache(
  routineId: string,
): Promise<{ routine: Routine; exerciseNameById: Map<string, string> } | null> {
  try {
    const db = await getFitDb();
    const record = await db.get(TRAINING_CACHE_STORE, routineId);
    if (!record) return null;
    return { routine: record.routine, exerciseNameById: new Map(record.exerciseNameById) };
  } catch {
    return null;
  }
}
