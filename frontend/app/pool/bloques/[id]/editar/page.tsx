"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BlockForm } from "@/components/pool/BlockForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { listBlocks, updateBlock } from "@/lib/api/blocks";
import { listExercises } from "@/lib/api/exercises";
import type { Block, Exercise } from "@/types/domain";

/** Editar bloque. Sin `GET /blocks/:id`: se resuelve desde el listado, igual que ejercicios. */
export default function EditBlockPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "not-found" } | { status: "ready"; block: Block }
  >({ status: "loading" });

  function fetchBlock() {
    listBlocks()
      .then((data) => {
        const block = data.find((b) => b.id === id);
        setState(block ? { status: "ready", block } : { status: "not-found" });
      })
      .catch(() => setState({ status: "error" }));
  }

  function load() {
    setState({ status: "loading" });
    fetchBlock();
  }

  useEffect(fetchBlock, [id]);
  useEffect(() => {
    listExercises()
      .then(setExercises)
      .catch(() => setExercises([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Editar bloque
      </h1>
      {state.status === "loading" ? <ListSkeleton rows={4} /> : null}
      {state.status === "error" ? <ErrorState message="No se pudo cargar el bloque." onRetry={load} /> : null}
      {state.status === "not-found" ? <p style={{ color: "var(--text-muted)" }}>No encontramos este bloque.</p> : null}
      {state.status === "ready" ? (
        <BlockForm
          initialValues={{
            name: state.block.name,
            type: state.block.type,
            advanceMode: state.block.advanceMode,
            timerConfig: state.block.timerConfig as Record<string, number>,
            exercises: state.block.exercises
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((e) => ({ exerciseId: e.exerciseId, reps: e.reps, duration: e.duration })),
          }}
          poolExercises={exercises}
          onCreateExercise={() => router.push("/pool/ejercicios/nuevo")}
          submitLabel="Guardar cambios"
          onCancel={() => router.push("/pool")}
          onSubmit={async (values) => {
            await updateBlock(id, values);
            router.push("/pool");
          }}
        />
      ) : null}
    </div>
  );
}
