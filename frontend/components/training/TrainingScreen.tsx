"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buildSessionPlan } from "@/lib/timer/session-plan";
import { useSessionEngine } from "@/lib/timer/use-session";
import { formatClock } from "@/lib/timer/format";
import { clearExitGuard, setExitGuard } from "@/lib/training/exit-guard-store";
import { createWorkoutLog } from "@/lib/api/workout-logs";
import type { RoutineDayBlock } from "@/types/domain";

/**
 * Modo entrenar (`docs/screens.md` §5, RF-007 a RF-013). El timer corre
 * client-side (RNF-004): la sesión (`useSessionEngine`) nunca consulta al
 * backend mientras cuenta. Fase 1: sin cache/sync offline todavía
 * (Fase 3) — corre "en línea" pero sin depender de la red para el timer.
 *
 * RF-009 ("avisa las transiciones") se resuelve con la propia pantalla
 * reactiva a sangre completa (color de fase + etiqueta + número cambian
 * al instante, legible a un metro — `docs/design.md` §1) más una región
 * `aria-live` para lectores de pantalla; no se agrega un toast aparte
 * para no competir visualmente con el timer.
 */

const TYPE_LABEL: Record<RoutineDayBlock["type"], string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos",
  cardio_libre: "Libre (cardio)",
};

export type TrainingScreenProps = {
  routineId: string;
  dayId: string;
  routineName: string;
  dayOrder: number;
  blocks: RoutineDayBlock[];
  exerciseNameById: Map<string, string>;
};

export function TrainingScreen({
  routineId,
  dayId,
  routineName,
  dayOrder,
  blocks,
  exerciseNameById,
}: TrainingScreenProps) {
  const router = useRouter();
  const [plan] = useState(() => buildSessionPlan({ id: dayId, order: dayOrder, blocks }));
  const { view, start, pause, resume, advance, continueNextBlock } = useSessionEngine(plan);
  const [exitAttempt, setExitAttempt] = useState<(() => void) | null>(null);
  const [finishing, setFinishing] = useState(false);

  const isActive = view.status === "running" || view.status === "paused" || view.status === "waiting-next-block";

  function attemptExit(navigate: () => void) {
    if (isActive) {
      setExitAttempt(() => navigate);
    } else {
      navigate();
    }
  }

  useEffect(() => {
    if (!isActive) return undefined;
    setExitGuard((href) => attemptExit(() => router.push(href)));
    return () => clearExitGuard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return undefined;
    window.history.pushState(null, "", window.location.href);
    function onPopState() {
      window.history.pushState(null, "", window.location.href);
      attemptExit(() => router.push("/"));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return undefined;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isActive]);

  async function handleFinish() {
    setFinishing(true);
    try {
      await createWorkoutLog(routineId, dayId);
      clearExitGuard();
      router.push("/");
    } catch {
      // El toast de error ya lo dispara api-client; se puede reintentar.
    } finally {
      setFinishing(false);
    }
  }

  if (view.status === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          {routineName} · Día {dayOrder + 1}
        </h1>
        <ul className="flex flex-col gap-2">
          {blocks.map((block, i) => (
            <li
              key={block.id}
              className="flex flex-col rounded-[var(--r-lg)] border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Bloque {i + 1} de {blocks.length}
              </span>
              <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {block.name}
              </span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {TYPE_LABEL[block.type]}
              </span>
            </li>
          ))}
        </ul>
        <Button fullWidth onClick={start}>
          Iniciar
        </Button>
      </div>
    );
  }

  const bg =
    view.phase === "work"
      ? "var(--phase-work-bg)"
      : view.phase === "rest"
        ? "var(--phase-rest-bg)"
        : "var(--phase-idle-bg)";
  const fg =
    view.phase === "work"
      ? "var(--phase-work-fg)"
      : view.phase === "rest"
        ? "var(--phase-rest-fg)"
        : "var(--phase-idle-fg)";

  const currentExercise =
    view.block && view.exerciseIndex !== null ? view.block.exercises[view.exerciseIndex] : null;
  const exerciseName = currentExercise ? exerciseNameById.get(currentExercise.exerciseId) ?? "" : "";

  const label = (() => {
    if (view.status === "paused") return "Pausa";
    if (view.status === "waiting-next-block") return "Bloque terminado";
    if (view.status === "finished") return "Terminado";
    return view.phase === "work" ? "Trabajo" : view.phase === "rest" ? "Descanso" : "Preparación";
  })();

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto" style={{ background: bg, color: fg }}>
      <div
        className="flex items-center justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))] wide:pt-20"
        style={{ paddingTop: undefined }}
      >
        <button
          type="button"
          aria-label="Volver a Mis rutinas"
          onClick={() => attemptExit(() => router.push("/"))}
          className="flex h-11 w-11 items-center justify-center"
        >
          <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold">
          Bloque {view.blockIndex + 1} de {view.totalBlocks}
          {view.block ? ` · ${view.block.name}` : ""}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center" aria-live="polite">
        <p className="text-xl font-bold uppercase tracking-wide">{label}</p>
        <div className="font-mono text-[88px] font-bold leading-none tabular-nums wide:text-[140px]">
          {formatClock(view.remainingSeconds)}
        </div>
        {view.round !== null ? (
          <p className="font-mono text-2xl tabular-nums">
            Ronda {view.round}
            {view.totalRounds ? ` / ${view.totalRounds}` : ""}
          </p>
        ) : null}
        {exerciseName ? (
          <p className="text-lg font-semibold">
            {exerciseName}
            {currentExercise?.reps ? ` · ${currentExercise.reps} reps` : ""}
            {currentExercise?.duration ? ` · ${currentExercise.duration}s` : ""}
          </p>
        ) : null}
        {view.status === "finished" ? (
          <p className="text-sm opacity-80">Entrenamiento completo. Buen trabajo.</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] wide:pb-10">
        {view.status === "running" || view.status === "paused" ? (
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="secondary"
              className="min-h-[72px]"
              onClick={view.status === "running" ? pause : resume}
            >
              {view.status === "running" ? "Pausar" : "Reanudar"}
            </Button>
            <Button fullWidth className="min-h-[72px]" onClick={advance} disabled={view.status !== "running"}>
              Avanzar
            </Button>
          </div>
        ) : null}

        {view.status === "waiting-next-block" ? (
          <Button fullWidth className="min-h-[72px]" onClick={continueNextBlock}>
            Continuar al siguiente bloque
          </Button>
        ) : null}

        <Button
          fullWidth
          variant={view.status === "finished" ? "primary" : "subtle"}
          onClick={handleFinish}
          loading={finishing}
        >
          Terminar entrenamiento
        </Button>
      </div>

      <ConfirmDialog
        open={exitAttempt !== null}
        title="¿Salir del entrenamiento?"
        description="Se pierde el progreso de esta sesión."
        confirmLabel="Salir y perder el progreso"
        onConfirm={() => {
          const navigate = exitAttempt;
          setExitAttempt(null);
          clearExitGuard();
          navigate?.();
        }}
        onCancel={() => setExitAttempt(null)}
      />
    </div>
  );
}
