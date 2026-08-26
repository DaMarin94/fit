"use client";

import { useEffect, useRef, useState } from "react";
import { useIsOnline } from "./connectivity-store";
import { subscribeWorkoutLogSyncEvents } from "./workout-log-sync-status";

/**
 * Máquina de estados de la franja de estado de Modo entrenar
 * (`docs/design.md` §12). Devuelve la variante activa, o `null` cuando la
 * franja está vacía. El fade de entrada/salida (200ms) y el cross-fade de
 * contenido son responsabilidad del componente que consume este hook (vía
 * CSS): acá solo vive el timing funcional del ciclo de vida (§12.6).
 */
export type OfflineIndicatorVariant = "offline" | "syncing" | "saved";

const SYNCING_MIN_MS = 1000;
const SAVED_MS = 3000;
/**
 * Piso de permanencia en pantalla y de estabilidad de red antes de
 * retirar la franja (§12.6 "anti-parpadeo"): con señal intermitente, un
 * elemento que estrobea molesta más de lo que informa. Con cola pendiente
 * el propio recorrido Sincronizando (≥1s) + Guardado (3s) ya excede este
 * piso; solo importa como espera explícita en el camino "sin cola".
 */
const MIN_VISIBLE_MS = 2000;

export function useOfflineIndicatorState(): OfflineIndicatorVariant | null {
  const isOnline = useIsOnline();
  const [variant, setVariant] = useState<OfflineIndicatorVariant | null>(isOnline ? null : "offline");

  const isOnlineRef = useRef(isOnline);
  const visibleSinceRef = useRef<number | null>(isOnline ? null : Date.now());
  const syncingSinceRef = useRef<number | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  function schedule(fn: () => void, ms: number) {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
  }

  function clearScheduled() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }

  function hideRespectingMinVisible() {
    const now = Date.now();
    const visibleSince = visibleSinceRef.current ?? now;
    const wait = Math.max(0, MIN_VISIBLE_MS - (now - visibleSince));
    schedule(() => {
      setVariant(null);
      visibleSinceRef.current = null;
      syncingSinceRef.current = null;
    }, wait);
  }

  // Se cae la red: la franja pasa a "offline" de inmediato y cualquier
  // cuenta regresiva de retiro que estuviera corriendo se cancela (nunca
  // hay que "retirar hacia offline").
  useEffect(() => {
    if (!isOnline) {
      clearScheduled();
      visibleSinceRef.current = Date.now();
      syncingSinceRef.current = null;
      setVariant("offline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Eventos de sincronización: los dispara `OfflineSyncListener` (único
  // punto que llama a `runWorkoutLogSync`); acá solo se reacciona.
  useEffect(() => {
    return subscribeWorkoutLogSyncEvents((event) => {
      // Si para cuando llega el evento ya se volvió a caer la red, el
      // efecto de arriba ya dejó la franja en "offline": no lo pisamos.
      if (!isOnlineRef.current) return;

      if (event.type === "start") {
        if (visibleSinceRef.current === null) visibleSinceRef.current = Date.now();
        syncingSinceRef.current = Date.now();
        setVariant("syncing");
        return;
      }

      if (event.synced === 0) {
        // Nada para sincronizar: se retira sin pasar por "Guardado".
        hideRespectingMinVisible();
        return;
      }

      const elapsed = syncingSinceRef.current ? Date.now() - syncingSinceRef.current : SYNCING_MIN_MS;
      const wait = Math.max(0, SYNCING_MIN_MS - elapsed);
      schedule(() => {
        setVariant("saved");
        schedule(hideRespectingMinVisible, SAVED_MS);
      }, wait);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return variant;
}
