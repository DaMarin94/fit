"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardDocumentListIcon, PlayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DayPickerDialog } from "@/components/routines/DayPickerDialog";
import { deleteRoutine, getRoutine, listRoutines } from "@/lib/api/routines";
import type { Routine, RoutineSummary } from "@/types/domain";

/**
 * Mis rutinas (`docs/screens.md` §2). Home: punto de entrada al flujo
 * core. Acá vive el toggle de tema en compacto (RF-015, RN-011,
 * `docs/design.md` §2.2) — en amplio vive en la barra superior (`NavBar`).
 */

type Loadable<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: T };

export default function RutinasPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Loadable<RoutineSummary[]>>({ status: "loading" });
  const [routineToDelete, setRoutineToDelete] = useState<RoutineSummary | null>(null);
  const [trainingRoutineId, setTrainingRoutineId] = useState<string | null>(null);
  const [dayPicker, setDayPicker] = useState<Routine | null>(null);

  const fetchRoutines = useCallback(() => {
    listRoutines()
      .then((data) => setRoutines({ status: "ready", data }))
      .catch(() => setRoutines({ status: "error" }));
  }, []);

  const load = useCallback(() => {
    setRoutines({ status: "loading" });
    fetchRoutines();
  }, [fetchRoutines]);

  useEffect(fetchRoutines, [fetchRoutines]);

  async function handleConfirmDelete() {
    if (!routineToDelete) return;
    const target = routineToDelete;
    setRoutineToDelete(null);
    try {
      await deleteRoutine(target.id);
      load();
    } catch {
      // Toast centralizado (docs/technical.md §2.2).
    }
  }

  async function handleTrain(routine: RoutineSummary) {
    setTrainingRoutineId(routine.id);
    try {
      const full = await getRoutine(routine.id);
      if (full.days.length <= 1) {
        const day = full.days[0];
        if (day) router.push(`/entrenar/${full.id}/${day.id}`);
      } else {
        setDayPicker(full);
      }
    } catch {
      // Toast centralizado.
    } finally {
      setTrainingRoutineId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Mis rutinas
        </h1>
        <div className="wide:hidden">
          <ThemeToggle />
        </div>
      </div>

      <div>
        <Link href="/rutinas/nueva">
          <Button fullWidth>Crear rutina</Button>
        </Link>
      </div>

      {routines.status === "loading" ? <ListSkeleton rows={3} /> : null}
      {routines.status === "error" ? <ErrorState message="No se pudieron cargar tus rutinas." onRetry={load} /> : null}
      {routines.status === "ready" && routines.data.length === 0 ? (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title="Todavía no tenés rutinas"
          description="Una rutina agrupa los días y bloques que vas a entrenar. Creá la primera para empezar."
          actionLabel="Crear rutina"
          onAction={() => router.push("/rutinas/nueva")}
        />
      ) : null}

      {routines.status === "ready" && routines.data.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 wide:grid-cols-2">
          {routines.data.map((routine) => (
            <li
              key={routine.id}
              className="flex flex-col gap-3 rounded-[var(--r-lg)] border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {routine.name}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {routine.dayCount} {routine.dayCount === 1 ? "día" : "días"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  aria-label={`Entrenar ${routine.name}`}
                  onClick={() => handleTrain(routine)}
                  loading={trainingRoutineId === routine.id}
                >
                  <PlayIcon className="h-4 w-4" aria-hidden="true" />
                  Entrenar
                </Button>
                <Link
                  href={`/rutinas/${routine.id}/editar`}
                  aria-label={`Editar ${routine.name}`}
                  className="inline-flex min-h-11 items-center rounded-[var(--r-md)] border px-4 text-sm font-semibold"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
                >
                  Editar
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${routine.name}`}
                  onClick={() => setRoutineToDelete(routine)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={routineToDelete !== null}
        title={`¿Borrar ${routineToDelete?.name ?? "la rutina"}?`}
        description={`Se borra la rutina ${routineToDelete?.name ?? ""}. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar rutina"
        onConfirm={handleConfirmDelete}
        onCancel={() => setRoutineToDelete(null)}
      />

      <DayPickerDialog
        open={dayPicker !== null}
        days={dayPicker?.days.map((d) => ({ id: d.id, order: d.order })) ?? []}
        onSelect={(dayId) => {
          if (dayPicker) router.push(`/entrenar/${dayPicker.id}/${dayId}`);
          setDayPicker(null);
        }}
        onCancel={() => setDayPicker(null)}
      />
    </div>
  );
}
