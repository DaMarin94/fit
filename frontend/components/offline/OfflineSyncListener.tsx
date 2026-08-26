"use client";

import { useEffect } from "react";
import { getIsOnline, subscribeConnectivity } from "@/lib/offline/connectivity-store";
import { runWorkoutLogSync } from "@/lib/offline/workout-log-sync-status";

/**
 * Dispara la sincronización de la cola de `WorkoutLog` pendientes
 * (`lib/offline/workout-log-sync.ts`, vía `workout-log-sync-status.ts` para
 * difundir su ciclo de vida) al reconectar y también al arrancar la app si
 * ya hay red en ese momento (`docs/technical.md` §8). No renderiza nada: es
 * un montaje de efecto puro, igual que `ThemeScript` pero sin necesidad de
 * correr antes de la hidratación.
 *
 * Es el único punto de la app que dispara el sync: la franja de estado de
 * `TrainingScreen` solo escucha sus eventos, nunca lo vuelve a disparar
 * (evitaría una carrera de dos syncs concurrentes contra la misma cola).
 */
export function OfflineSyncListener() {
  useEffect(() => {
    if (getIsOnline()) {
      void runWorkoutLogSync();
    }
    return subscribeConnectivity(() => {
      if (getIsOnline()) {
        void runWorkoutLogSync();
      }
    });
  }, []);

  return null;
}
