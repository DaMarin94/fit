"use client";

import { useRouter } from "next/navigation";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { createRoutine } from "@/lib/api/routines";

/** Crear rutina (`docs/screens.md` §3, RF-004). */
export default function NewRoutinePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Nueva rutina
      </h1>
      <RoutineEditor
        onSave={async (values) => {
          await createRoutine(values);
          router.push("/");
        }}
      />
    </div>
  );
}
