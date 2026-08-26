"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { listWorkoutLogs } from "@/lib/api/workout-logs";
import type { WorkoutLog, WorkoutLogSnapshotEquipmentGroups } from "@/types/domain";

/**
 * Historial (`docs/screens.md` §7). Alcance de Fase 1 (`docs/roadmap.md`):
 * lista simple sin agrupar por semana (eso es Fase 4), pero con el
 * detalle del snapshot completo al hacer click, según instrucción
 * explícita de esta fase.
 */

type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

const TYPE_LABEL: Record<WorkoutLog["snapshot"]["blocks"][number]["type"], string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos",
  cardio_libre: "Libre (cardio)",
};

/**
 * Línea de equipo congelado del snapshot (`docs/design.md` §11.2-§11.5,
 * `docs/requirements.md` RN-015). Mismo lenguaje visual que `EquipmentLine`
 * de `pool/page.tsx`, pero los grupos ya son nombres por valor: no hay
 * `equipmentId` que resolver.
 */
function SnapshotEquipmentLine({ groups }: { groups: WorkoutLogSnapshotEquipmentGroups }) {
  if (groups.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="sr-only">Equipo: </span>
        Sin equipo
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="sr-only">Equipo: </span>
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="inline-flex items-center gap-1.5">
          {groupIndex > 0 ? (
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
            >
              Y
            </span>
          ) : null}
          <span
            className="inline-flex min-h-6 items-center rounded-[var(--r-sm)] border px-2 py-0.5 text-[13px] font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
          >
            {group.map((name, itemIndex) => (
              <span key={`${name}-${itemIndex}`} style={{ overflowWrap: "anywhere" }}>
                {itemIndex > 0 ? (
                  <span className="mx-1" style={{ color: "var(--text-muted)" }}>
                    o
                  </span>
                ) : null}
                {name}
              </span>
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function HistorialPage() {
  const [logs, setLogs] = useState<Loadable<WorkoutLog[]>>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    listWorkoutLogs()
      .then((data) => setLogs({ status: "ready", data }))
      .catch(() => setLogs({ status: "error" }));
  }, []);

  const load = useCallback(() => {
    setLogs({ status: "loading" });
    fetchLogs();
  }, [fetchLogs]);

  useEffect(fetchLogs, [fetchLogs]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Historial
      </h1>

      {logs.status === "loading" ? <ListSkeleton rows={4} /> : null}
      {logs.status === "error" ? <ErrorState message="No se pudo cargar el historial." onRetry={load} /> : null}
      {logs.status === "ready" && logs.data.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="Todavía no entrenaste"
          description="Acá van a aparecer los entrenamientos que termines."
        />
      ) : null}
      {logs.status === "ready" && logs.data.length === 0 ? (
        <div className="-mt-2 flex justify-center">
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            Ir a Mis rutinas
          </Link>
        </div>
      ) : null}

      {logs.status === "ready" && logs.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {logs.data.map((log) => {
            const open = openId === log.id;
            return (
              <li
                key={log.id}
                className="flex flex-col rounded-[var(--r-lg)] border"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <button
                  type="button"
                  aria-label={`Ver detalle de ${log.snapshot.routineName}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : log.id)}
                  className="flex min-h-11 flex-col items-start px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {log.snapshot.routineName}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDate(log.performedAt)}
                  </span>
                </button>
                {open ? (
                  <div
                    data-testid="workout-log-detail"
                    className="flex flex-col gap-3 border-t px-4 py-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Día {log.snapshot.day.order + 1}
                    </p>
                    {log.snapshot.blocks.map((block, i) => (
                      <div key={`${log.id}-${i}`} className="flex flex-col gap-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {block.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {TYPE_LABEL[block.type]}
                        </span>
                        <ul className="flex flex-col gap-0.5 pl-3">
                          {block.exercises.map((exercise) => (
                            <li
                              key={`${exercise.order}-${exercise.name}`}
                              className="flex flex-col gap-0.5 py-0.5 text-sm"
                              style={{ color: "var(--text)" }}
                            >
                              <span>
                                {exercise.name}
                                {exercise.reps ? ` · ${exercise.reps} reps` : ""}
                                {exercise.duration ? ` · ${exercise.duration}s` : ""}
                              </span>
                              <SnapshotEquipmentLine groups={exercise.equipmentGroups} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
