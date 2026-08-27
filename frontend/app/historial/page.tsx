"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, ClockIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { HistorialSkeleton } from "@/components/historial/HistorialSkeleton";
import { listWorkoutLogs } from "@/lib/api/workout-logs";
import { groupWorkoutLogsByWeek } from "@/lib/historial/group-workout-logs";
import { formatDayHeading, formatEntryTime, formatWeekHeading } from "@/lib/historial/format-historial-heading";
import type { WorkoutLog, WorkoutLogSnapshotEquipmentGroups } from "@/types/domain";

/**
 * Historial (`docs/screens.md` §7). Agrupado por semana (lunes a domingo)
 * y día calendario según RN-012 (`docs/requirements.md`), con el detalle
 * del snapshot completo al hacer click.
 *
 * Estructura visual y de tres niveles (semana / día / entrada) según
 * `docs/design.md` §13: un solo nivel enuncia la fecha completa (el día);
 * la tarjeta pierde la fecha y se queda solo con la hora.
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

/**
 * Tarjeta de entrada (`docs/design.md` §13.5): solo nombre de rutina y
 * hora — la fecha la lleva el encabezado de día, 8px más arriba. El
 * chevron es el único affordance de que la tarjeta expande.
 */
function WorkoutLogCard({ log, open, onToggle }: { log: WorkoutLog; open: boolean; onToggle: () => void }) {
  return (
    <li
      className="flex flex-col rounded-[var(--r-lg)] border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <button
        type="button"
        aria-label={`Ver detalle de ${log.snapshot.routineName}`}
        aria-expanded={open}
        onClick={onToggle}
        className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-transform hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ${
          open ? "rounded-t-[var(--r-lg)]" : "rounded-[var(--r-lg)]"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 wide:flex-row wide:items-center wide:justify-between wide:gap-3">
          <span
            className="text-[17px] leading-6 font-semibold"
            style={{ color: "var(--text)", overflowWrap: "anywhere" }}
          >
            {log.snapshot.routineName}
          </span>
          <span
            className="text-[12px] leading-4 font-medium tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="sr-only">Hora: </span>
            {formatEntryTime(log.performedAt)}
          </span>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center" aria-hidden="true">
          <ChevronDownIcon
            data-testid="chevron-icon"
            className={`h-6 w-6 transition-transform duration-[120ms] ease-out motion-reduce:duration-0 ${
              open ? "rotate-180" : ""
            }`}
            style={{ color: "var(--text-muted)" }}
          />
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
}

export default function HistorialPage() {
  const router = useRouter();
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

      {logs.status === "loading" ? <HistorialSkeleton /> : null}
      {logs.status === "error" ? <ErrorState message="No se pudo cargar el historial." onRetry={load} /> : null}
      {logs.status === "ready" && logs.data.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="Todavía no entrenaste"
          description="Acá van a aparecer los entrenamientos que termines."
          actionLabel="Ir a Mis rutinas"
          onAction={() => router.push("/")}
        />
      ) : null}

      {logs.status === "ready" && logs.data.length > 0 ? (
        <div className="flex flex-col">
          {groupWorkoutLogsByWeek(logs.data).map((week, weekIndex) => (
            <section key={week.weekKey} className={weekIndex > 0 ? "mt-8" : undefined}>
              <h2
                className="sticky top-0 z-10 py-3 text-[20px] leading-[26px] font-semibold wide:top-14"
                style={{ color: "var(--text)", background: "var(--bg)" }}
              >
                {formatWeekHeading(week.weekStart, week.weekEnd)}
              </h2>

              <div className="flex flex-col">
                {week.days.map((day, dayIndex) => (
                  <div key={day.dateKey} className={dayIndex > 0 ? "mt-5" : "mt-1"}>
                    <h3
                      className="text-[13px] leading-[18px] font-semibold"
                      style={{ color: "var(--text-muted)", letterSpacing: "0.02em" }}
                    >
                      {formatDayHeading(day.date)}
                    </h3>
                    <ul className="mt-2 flex flex-col gap-3">
                      {day.logs.map((log) => (
                        <WorkoutLogCard
                          key={log.id}
                          log={log}
                          open={openId === log.id}
                          onToggle={() => setOpenId(openId === log.id ? null : log.id)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
