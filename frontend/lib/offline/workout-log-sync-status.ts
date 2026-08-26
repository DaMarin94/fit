import { syncPendingWorkoutLogs } from "./workout-log-sync";
import { listPendingWorkoutLogs } from "./workout-log-queue";

/**
 * Difunde el ciclo de vida de una corrida de sincronización de
 * `WorkoutLog` pendientes (`docs/design.md` §12.4/§12.6), sin duplicar el
 * disparo del sync en sí. `OfflineSyncListener` (montado una sola vez en
 * el layout raíz) es el único que llama a `runWorkoutLogSync`; cualquier
 * UI que esté montada en ese momento —hoy, la franja de estado de
 * `TrainingScreen`— se suscribe acá para reflejar "Sincronizando" /
 * "Guardado" sin volver a leer la cola por su cuenta ni disparar un
 * segundo sync en paralelo (evita una carrera con el propio listener).
 */
export type WorkoutLogSyncEvent = { type: "start" } | { type: "done"; synced: number };

type Listener = (event: WorkoutLogSyncEvent) => void;

const listeners = new Set<Listener>();

function notify(event: WorkoutLogSyncEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribeWorkoutLogSyncEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Si la cola está vacía no emite "start": nunca hay un flash de
 * "Sincronizando" para una corrida que no tiene nada que sincronizar, y
 * "done" con `synced: 0` es la señal de "no se muestra Guardado"
 * (`docs/design.md` §12.6, "vuelve la red, sin nada en cola").
 */
export async function runWorkoutLogSync(): Promise<void> {
  const pending = await listPendingWorkoutLogs();
  if (pending.length === 0) {
    notify({ type: "done", synced: 0 });
    return;
  }

  notify({ type: "start" });
  const { synced } = await syncPendingWorkoutLogs();
  notify({ type: "done", synced });
}
