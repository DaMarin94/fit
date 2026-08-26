import { getFitDb, WORKOUT_LOG_QUEUE_STORE } from "./db";

/**
 * Cola de `WorkoutLog` pendientes de sincronizar (RF-013 sin red,
 * `docs/technical.md` §8). A diferencia de `training-cache.ts`, acá un
 * fallo de IndexedDB sí se propaga: encolar es la única copia del registro
 * mientras no hay red, no una optimización descartable.
 */
export type PendingWorkoutLog = {
  id: string;
  routineId: string;
  dayId: string;
  performedAt: string;
  queuedAt: string;
  /** Orden de encolado. `queuedAt` no alcanza como desempate: dos encolados en el mismo milisegundo son posibles. */
  seq: number;
};

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let seqCounter: number | null = null;

/** Arranca desde el máximo `seq` ya persistido (primer uso por sesión), después incrementa en memoria. */
async function nextSeq(db: Awaited<ReturnType<typeof getFitDb>>): Promise<number> {
  if (seqCounter === null) {
    const all = await db.getAll(WORKOUT_LOG_QUEUE_STORE);
    seqCounter = all.reduce((max, item) => Math.max(max, item.seq), 0);
  }
  seqCounter += 1;
  return seqCounter;
}

export async function enqueueWorkoutLog(
  routineId: string,
  dayId: string,
  performedAt: string,
): Promise<PendingWorkoutLog> {
  const db = await getFitDb();
  const entry: PendingWorkoutLog = {
    id: createId(),
    routineId,
    dayId,
    performedAt,
    queuedAt: new Date().toISOString(),
    seq: await nextSeq(db),
  };
  await db.put(WORKOUT_LOG_QUEUE_STORE, entry);
  return entry;
}

/** Orden de encolado (`seq`), no el orden de clave de IndexedDB: la clave es un uuid, no ordena cronológicamente. */
export async function listPendingWorkoutLogs(): Promise<PendingWorkoutLog[]> {
  const db = await getFitDb();
  const all = await db.getAll(WORKOUT_LOG_QUEUE_STORE);
  return all.sort((a, b) => a.seq - b.seq);
}

export async function removePendingWorkoutLog(id: string): Promise<void> {
  const db = await getFitDb();
  await db.delete(WORKOUT_LOG_QUEUE_STORE, id);
}
