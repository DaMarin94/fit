"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { getRoutine, updateRoutine } from "@/lib/api/routines";
import type { Routine } from "@/types/domain";

/** Editar rutina (`docs/screens.md` §3). */
export default function EditRoutinePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; routine: Routine }
  >({ status: "loading" });

  function fetchRoutine() {
    getRoutine(id)
      .then((routine) => setState({ status: "ready", routine }))
      .catch(() => setState({ status: "error" }));
  }

  function load() {
    setState({ status: "loading" });
    fetchRoutine();
  }

  useEffect(fetchRoutine, [id]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Editar rutina
      </h1>
      {state.status === "loading" ? <ListSkeleton rows={4} /> : null}
      {state.status === "error" ? <ErrorState message="No se pudo cargar la rutina." onRetry={load} /> : null}
      {state.status === "ready" ? (
        <RoutineEditor
          initialRoutine={state.routine}
          onSave={async (values) => {
            await updateRoutine(id, values);
            router.push("/");
          }}
        />
      ) : null}
    </div>
  );
}
