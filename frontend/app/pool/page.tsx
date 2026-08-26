"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArchiveBoxIcon, ListBulletIcon, TrashIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteExercise, listExercises } from "@/lib/api/exercises";
import { deleteBlock, listBlocks } from "@/lib/api/blocks";
import type {
  Block,
  Exercise,
  FuerzaTimerConfig,
  IntervalosTimerConfig,
  MetconTimerConfig,
} from "@/types/domain";

/**
 * Pool de bloques y ejercicios (`docs/screens.md` §4). Alcance de Fase 1
 * (`docs/roadmap.md`): sin elementos, sin grupos de equipo, sin filtro —
 * eso llega en la Fase 2.
 */

type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

const TYPE_LABEL: Record<Block["type"], string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos",
  cardio_libre: "Libre (cardio)",
};

function blockSummary(block: Block): string {
  switch (block.type) {
    case "fuerza": {
      const config = block.timerConfig as FuerzaTimerConfig;
      return `${TYPE_LABEL.fuerza} · ${config.totalDurationSeconds}s totales, tarea cada ${config.taskIntervalSeconds}s`;
    }
    case "metcon": {
      const config = block.timerConfig as MetconTimerConfig;
      return `${TYPE_LABEL.metcon} · ${config.totalDurationSeconds}s`;
    }
    case "intervalos": {
      const config = block.timerConfig as IntervalosTimerConfig;
      return `${TYPE_LABEL.intervalos} · ${config.workSeconds}s trabajo / ${config.restSeconds}s descanso · ${config.rounds} rondas`;
    }
    case "cardio_libre":
      return `${TYPE_LABEL.cardio_libre} · ${block.exercises.length} fases`;
  }
}

export default function PoolPage() {
  const [exercises, setExercises] = useState<Loadable<Exercise[]>>({ status: "loading" });
  const [blocks, setBlocks] = useState<Loadable<Block[]>>({ status: "loading" });
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);

  const fetchExercises = useCallback(() => {
    listExercises()
      .then((data) => setExercises({ status: "ready", data }))
      .catch(() => setExercises({ status: "error" }));
  }, []);

  const loadExercises = useCallback(() => {
    setExercises({ status: "loading" });
    fetchExercises();
  }, [fetchExercises]);

  const fetchBlocks = useCallback(() => {
    listBlocks()
      .then((data) => setBlocks({ status: "ready", data }))
      .catch(() => setBlocks({ status: "error" }));
  }, []);

  const loadBlocks = useCallback(() => {
    setBlocks({ status: "loading" });
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    fetchExercises();
    fetchBlocks();
  }, [fetchExercises, fetchBlocks]);

  async function confirmDeleteExercise() {
    if (!exerciseToDelete) return;
    const target = exerciseToDelete;
    setExerciseToDelete(null);
    try {
      await deleteExercise(target.id);
      loadExercises();
    } catch {
      // El toast de error (incluido EXERCISE_IN_USE, RN-007) ya lo dispara api-client.
    }
  }

  async function confirmDeleteBlock() {
    if (!blockToDelete) return;
    const target = blockToDelete;
    setBlockToDelete(null);
    try {
      await deleteBlock(target.id);
      loadBlocks();
    } catch {
      // Idem: toast centralizado.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Pool
      </h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Ejercicios
          </h2>
          <Link
            href="/pool/ejercicios/nuevo"
            className="text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            + Nuevo ejercicio
          </Link>
        </div>

        {exercises.status === "loading" ? <ListSkeleton rows={3} /> : null}
        {exercises.status === "error" ? <ErrorState message="No se pudieron cargar los ejercicios." onRetry={loadExercises} /> : null}
        {exercises.status === "ready" && exercises.data.length === 0 ? (
          <EmptyState
            icon={ListBulletIcon}
            title="Todavía no hay ejercicios"
            description="Creá tu primer ejercicio para poder usarlo en los bloques."
          />
        ) : null}
        {exercises.status === "ready" && exercises.data.length === 0 ? (
          <div className="-mt-2 flex justify-center">
            <Link href="/pool/ejercicios/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Crear ejercicio
            </Link>
          </div>
        ) : null}
        {exercises.status === "ready" && exercises.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {exercises.data.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-[var(--r-lg)] border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/pool/ejercicios/${exercise.id}/editar`} className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {exercise.name}
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${exercise.name}`}
                  onClick={() => setExerciseToDelete(exercise)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Bloques
          </h2>
          <Link href="/pool/bloques/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            + Nuevo bloque
          </Link>
        </div>

        {blocks.status === "loading" ? <ListSkeleton rows={3} /> : null}
        {blocks.status === "error" ? <ErrorState message="No se pudieron cargar los bloques." onRetry={loadBlocks} /> : null}
        {blocks.status === "ready" && blocks.data.length === 0 ? (
          <EmptyState
            icon={ArchiveBoxIcon}
            title="Todavía no hay bloques"
            description="Creá tu primer bloque para poder agregarlo a una rutina."
          />
        ) : null}
        {blocks.status === "ready" && blocks.data.length === 0 ? (
          <div className="-mt-2 flex justify-center">
            <Link href="/pool/bloques/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Crear bloque
            </Link>
          </div>
        ) : null}
        {blocks.status === "ready" && blocks.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {blocks.data.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-[var(--r-lg)] border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/pool/bloques/${block.id}/editar`} className="flex flex-col text-sm" style={{ color: "var(--text)" }}>
                  <span className="font-medium">{block.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{blockSummary(block)}</span>
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${block.name}`}
                  onClick={() => setBlockToDelete(block)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ConfirmDialog
        open={exerciseToDelete !== null}
        title={`¿Borrar ${exerciseToDelete?.name ?? "el ejercicio"}?`}
        description="Se borra el ejercicio del pool. Si está en uso en algún bloque, no se va a poder borrar."
        confirmLabel="Borrar ejercicio"
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
      />

      <ConfirmDialog
        open={blockToDelete !== null}
        title={`¿Borrar ${blockToDelete?.name ?? "el bloque"}?`}
        description="Se borra el bloque del pool. Las rutinas que ya lo usan no se ven afectadas, porque tienen su propia copia."
        confirmLabel="Borrar bloque"
        onConfirm={confirmDeleteBlock}
        onCancel={() => setBlockToDelete(null)}
      />
    </div>
  );
}
