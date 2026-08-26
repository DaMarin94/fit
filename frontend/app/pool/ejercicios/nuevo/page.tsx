"use client";

import { useRouter } from "next/navigation";
import { ExerciseForm } from "@/components/pool/ExerciseForm";
import { createExercise } from "@/lib/api/exercises";

/** Crear ejercicio (`docs/screens.md` §4, RF-001). Pantalla propia, no modal (§8). */
export default function NewExercisePage() {
  const router = useRouter();

  async function handleSubmit(name: string) {
    await createExercise({ name });
    router.push("/pool");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Nuevo ejercicio
      </h1>
      <ExerciseForm submitLabel="Crear ejercicio" onSubmit={handleSubmit} onCancel={() => router.push("/pool")} />
    </div>
  );
}
