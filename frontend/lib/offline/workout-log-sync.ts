import { createWorkoutLog } from "../api/workout-logs";
import { isNetworkError } from "../http/api-client";
import { listPendingWorkoutLogs, removePendingWorkoutLog } from "./workout-log-queue";

/** Resultado de una corrida de sincronización: cuántos `WorkoutLog` pendientes se drenaron con éxito. */
export type WorkoutLogSyncResult = { synced: number };

/**
 * Vacía la cola de `WorkoutLog` pendientes contra el backend
 * (`docs/technical.md` §8, `docs/architecture.md` §5: "el backend no
 * participa", recibe la sincronización como escrituras normales). La
 * dispara `OfflineSyncListener` al reconectar y al arrancar la app si ya
 * hay red, a través de `workout-log-sync-status.ts` (que además difunde el
 * ciclo de vida para la franja de estado de `TrainingScreen`,
 * `docs/design.md` §12).
 *
 * Recorre la cola en orden de encolado. Si un envío falla por red, corta
 * ahí: `apiFetch` ya disparó su propio toast de error para ese intento, y
 * si seguimos sin conexión el resto va a fallar igual — seguir probando
 * solo apila toasts redundantes. Si falla por otro motivo (error real del
 * servidor), esa entrada queda en la cola para el próximo intento, pero se
 * sigue con las siguientes.
 *
 * Devuelve cuántos se sincronizaron con éxito en esta corrida: es la señal
 * que necesita la UI para distinguir "no había nada pendiente" (no muestra
 * "Guardado") de "se sincronizó algo" (sí lo muestra).
 */
export async function syncPendingWorkoutLogs(): Promise<WorkoutLogSyncResult> {
  const pending = await listPendingWorkoutLogs();
  let synced = 0;

  for (const item of pending) {
    try {
      await createWorkoutLog(item.routineId, item.dayId, item.performedAt);
      await removePendingWorkoutLog(item.id);
      synced += 1;
    } catch (error) {
      if (isNetworkError(error)) {
        return { synced };
      }
      // Error real del servidor: queda en la cola, se sigue con el siguiente.
    }
  }

  return { synced };
}
