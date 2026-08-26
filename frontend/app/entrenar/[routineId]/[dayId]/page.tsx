"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { TrainingScreen } from "@/components/training/TrainingScreen";
import { getRoutine } from "@/lib/api/routines";
import { listExercises } from "@/lib/api/exercises";
import { ApiError } from "@/lib/http/api-client";
import { loadTrainingCache, saveTrainingCache } from "@/lib/offline/training-cache";
import { showToast } from "@/lib/toast/toast-store";
import type { Routine } from "@/types/domain";

/**
 * Modo entrenar (`docs/screens.md` §5, ruta `/entrenar/:routineId/:dayId`).
 * Trae el árbol completo de la rutina y el mapa de nombres de ejercicio
 * (los `BlockExercise` anidados no traen el nombre, `docs/data-model.md`
 * "Importante" en el contrato de Routines) antes de arrancar la sesión.
 *
 * Offline (RN-004, `docs/technical.md` §8): cada fetch online exitoso
 * cachea la `Routine` completa + el mapa de nombres en IndexedDB, indexado
 * por `routineId`. Si el fetch en vivo falla —sin distinguir el motivo,
 * cachear en cada éxito es más simple y correcto que intentar detectarlo—
 * se cae a esa cache como fallback antes de mostrar error.
 *
 * El fetch va con `silent: true` (`docs/technical.md` §2.2): si termina
 * cayendo a la cache, la degradación es prolija (`docs/design.md` §12) y no
 * amerita el toast rojo genérico. Solo cuando ni la cache resuelve —error
 * real, `state.status === "error"`— se reemite el aviso a mano, mismo
 * patrón que `TrainingScreen.handleFinish` con `createWorkoutLog`.
 */
export default function EntrenarPage() {
  const params = useParams<{ routineId: string; dayId: string }>();
  const { routineId, dayId } = params;

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "not-found" }
    | { status: "ready"; routine: Routine; exerciseNameById: Map<string, string> }
  >({ status: "loading" });

  function fetchTraining() {
    Promise.all([
      getRoutine(routineId, { silent: true }),
      listExercises(undefined, { silent: true }),
    ])
      .then(([routine, exercises]) => {
        const exerciseNameById = new Map(exercises.map((e) => [e.id, e.name]));
        void saveTrainingCache(routineId, routine, exerciseNameById);
        const day = routine.days.find((d) => d.id === dayId);
        if (!day) {
          setState({ status: "not-found" });
          return;
        }
        setState({ status: "ready", routine, exerciseNameById });
      })
      .catch((error: unknown) => {
        loadTrainingCache(routineId).then((cached) => {
          if (!cached) {
            showToast({
              message:
                error instanceof ApiError ? error.message : "No se pudo cargar el entrenamiento.",
            });
            setState({ status: "error" });
            return;
          }
          const day = cached.routine.days.find((d) => d.id === dayId);
          if (!day) {
            setState({ status: "not-found" });
            return;
          }
          setState({ status: "ready", routine: cached.routine, exerciseNameById: cached.exerciseNameById });
        });
      });
  }

  function load() {
    setState({ status: "loading" });
    fetchTraining();
  }

  useEffect(fetchTraining, [routineId, dayId]);

  if (state.status === "loading") return <ListSkeleton rows={4} />;
  if (state.status === "error") {
    return <ErrorState message="No se pudo cargar el entrenamiento." onRetry={load} />;
  }
  if (state.status === "not-found") {
    return <p style={{ color: "var(--text-muted)" }}>No encontramos este día de entrenamiento.</p>;
  }

  const day = state.routine.days.find((d) => d.id === dayId)!;

  return (
    <TrainingScreen
      routineId={routineId}
      dayId={dayId}
      routineName={state.routine.name}
      dayOrder={day.order}
      blocks={day.blocks}
      exerciseNameById={state.exerciseNameById}
    />
  );
}
