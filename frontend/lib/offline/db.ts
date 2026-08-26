import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Routine } from "@/types/domain";

/**
 * Base local de Modo entrenar offline (RN-004, `docs/architecture.md` §5,
 * `docs/technical.md` §8). Primera vez que se usa IndexedDB en el proyecto:
 * se eligió la librería `idb` (wrapper con promesas sobre la API nativa,
 * sin lógica propia) en vez de la API nativa a mano, para no reescribir el
 * boilerplate basado en eventos. Dos object stores:
 *
 * - `training-cache`: última `Routine` completa traída con éxito por
 *   `routineId`, más el mapa de nombres de ejercicio. Fallback de lectura
 *   de Modo entrenar cuando el fetch en vivo falla.
 * - `workout-log-queue`: `WorkoutLog` pendientes de sincronizar (RF-013
 *   sin red), uno por intento de "Terminar entrenamiento" que no pudo
 *   llegar al backend.
 */

export const TRAINING_CACHE_STORE = "training-cache";
export const WORKOUT_LOG_QUEUE_STORE = "workout-log-queue";

export type TrainingCacheRecord = {
  routineId: string;
  routine: Routine;
  exerciseNameById: [string, string][];
  cachedAt: string;
};

export type PendingWorkoutLogRecord = {
  id: string;
  routineId: string;
  dayId: string;
  performedAt: string;
  queuedAt: string;
  seq: number;
};

interface FitOfflineDB extends DBSchema {
  [TRAINING_CACHE_STORE]: {
    key: string;
    value: TrainingCacheRecord;
  };
  [WORKOUT_LOG_QUEUE_STORE]: {
    key: string;
    value: PendingWorkoutLogRecord;
  };
}

const DB_NAME = "fit-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FitOfflineDB>> | null = null;

export function getFitDb(): Promise<IDBPDatabase<FitOfflineDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB no está disponible en este entorno."));
  }
  if (!dbPromise) {
    dbPromise = openDB<FitOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TRAINING_CACHE_STORE)) {
          db.createObjectStore(TRAINING_CACHE_STORE, { keyPath: "routineId" });
        }
        if (!db.objectStoreNames.contains(WORKOUT_LOG_QUEUE_STORE)) {
          db.createObjectStore(WORKOUT_LOG_QUEUE_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/** Solo para tests: fuerza reabrir la conexión (ej. entre casos con `fake-indexeddb`). */
export function resetFitDbConnection(): void {
  dbPromise = null;
}

/** Solo para tests: borra la base entera para aislar casos (`fake-indexeddb` persiste entre tests de un mismo archivo). */
export async function deleteFitDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    db?.close();
  }
  dbPromise = null;
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
