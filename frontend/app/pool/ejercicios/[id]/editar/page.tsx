"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExerciseForm } from "@/components/pool/ExerciseForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { listExercises, updateExercise } from "@/lib/api/exercises";
import { listEquipment } from "@/lib/api/equipment";
import type { Equipment, Exercise } from "@/types/domain";

/**
 * Editar ejercicio. No hay `GET /exercises/:id` en el contrato
 * (`docs/data-model.md` §4.3): se resuelve buscando en el listado
 * completo, igual que se hace para resolver nombres de ejercicio en
 * bloques/rutinas.
 */
export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [equipment, setEquipment] = useState<Equipment[] | null>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "not-found" } | { status: "ready"; exercise: Exercise }
  >({ status: "loading" });

  useEffect(() => {
    listEquipment()
      .then(setEquipment)
      .catch(() => setEquipment([]));
  }, []);

  useEffect(() => {
    listExercises()
      .then((data) => {
        const exercise = data.find((e) => e.id === id);
        setState(exercise ? { status: "ready", exercise } : { status: "not-found" });
      })
      .catch(() => setState({ status: "error" }));
  }, [id]);

  async function handleSubmit(values: { name: string; equipmentGroups: string[][] }) {
    await updateExercise(id, values);
    router.push("/pool");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Editar ejercicio
      </h1>
      {state.status === "loading" ? <ListSkeleton rows={1} /> : null}
      {state.status === "error" ? (
        <ErrorState
          message="No se pudo cargar el ejercicio."
          onRetry={() => {
            setState({ status: "loading" });
            listExercises()
              .then((data) => {
                const exercise = data.find((e) => e.id === id);
                setState(exercise ? { status: "ready", exercise } : { status: "not-found" });
              })
              .catch(() => setState({ status: "error" }));
          }}
        />
      ) : null}
      {state.status === "not-found" ? (
        <p style={{ color: "var(--text-muted)" }}>No encontramos este ejercicio.</p>
      ) : null}
      {state.status === "ready" ? (
        <ExerciseForm
          initialName={state.exercise.name}
          initialEquipmentGroups={state.exercise.equipmentGroups}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/pool")}
          poolEquipment={equipment}
          onCreateEquipment={() => router.push("/pool/elementos/nuevo")}
        />
      ) : null}
    </div>
  );
}
