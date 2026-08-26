"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { TrainingScreen } from "@/components/training/TrainingScreen";
import { getRoutine } from "@/lib/api/routines";
import { listExercises } from "@/lib/api/exercises";
import type { Routine } from "@/types/domain";

/**
 * Modo entrenar (`docs/screens.md` §5, ruta `/entrenar/:routineId/:dayId`).
 * Trae el árbol completo de la rutina y el mapa de nombres de ejercicio
 * (los `BlockExercise` anidados no traen el nombre, `docs/data-model.md`
 * "Importante" en el contrato de Routines) antes de arrancar la sesión.
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
    Promise.all([getRoutine(routineId), listExercises()])
      .then(([routine, exercises]) => {
        const day = routine.days.find((d) => d.id === dayId);
        if (!day) {
          setState({ status: "not-found" });
          return;
        }
        const exerciseNameById = new Map(exercises.map((e) => [e.id, e.name]));
        setState({ status: "ready", routine, exerciseNameById });
      })
      .catch(() => setState({ status: "error" }));
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
