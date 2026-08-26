"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseForm } from "@/components/pool/ExerciseForm";
import { createExercise } from "@/lib/api/exercises";
import { listEquipment } from "@/lib/api/equipment";
import type { Equipment } from "@/types/domain";

/** Crear ejercicio (`docs/screens.md` §4, RF-001/RF-017). Pantalla propia, no modal (§8). */
export default function NewExercisePage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[] | null>(null);

  useEffect(() => {
    listEquipment()
      .then(setEquipment)
      .catch(() => setEquipment([]));
  }, []);

  async function handleSubmit(values: { name: string; equipmentGroups: string[][] }) {
    await createExercise(values);
    router.push("/pool");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Nuevo ejercicio
      </h1>
      <ExerciseForm
        submitLabel="Crear ejercicio"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/pool")}
        poolEquipment={equipment}
        onCreateEquipment={() => router.push("/pool/elementos/nuevo")}
      />
    </div>
  );
}
