"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockForm } from "@/components/pool/BlockForm";
import { createBlock } from "@/lib/api/blocks";
import { listExercises } from "@/lib/api/exercises";
import type { Exercise } from "@/types/domain";

/** Crear bloque (`docs/screens.md` §4, RF-002/RF-003). Pantalla propia. */
export default function NewBlockPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);

  useEffect(() => {
    listExercises()
      .then(setExercises)
      .catch(() => setExercises([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Nuevo bloque
      </h1>
      <BlockForm
        poolExercises={exercises}
        onCreateExercise={() => router.push("/pool/ejercicios/nuevo")}
        submitLabel="Crear bloque"
        onCancel={() => router.push("/pool")}
        onSubmit={async (values) => {
          await createBlock(values);
          router.push("/pool");
        }}
      />
    </div>
  );
}
