"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buildSessionPlan } from "@/lib/timer/session-plan";
import { useSessionEngine } from "@/lib/timer/use-session";
import { formatClock } from "@/lib/timer/format";
import { clearExitGuard, setExitGuard } from "@/lib/training/exit-guard-store";
import { createWorkoutLog } from "@/lib/api/workout-logs";
import { ApiError, isNetworkError } from "@/lib/http/api-client";
import { enqueueWorkoutLog } from "@/lib/offline/workout-log-queue";
import { useOfflineIndicatorState, type OfflineIndicatorVariant } from "@/lib/offline/use-offline-indicator-state";
import { showToast } from "@/lib/toast/toast-store";
import type { RoutineDayBlock } from "@/types/domain";

/**
 * Modo entrenar (`docs/screens.md` §5, RF-007 a RF-013). El timer corre
 * client-side (RNF-004): la sesión (`useSessionEngine`) nunca consulta al
 * backend mientras cuenta.
 *
 * RF-009 ("avisa las transiciones") se resuelve con la propia pantalla
 * reactiva a sangre completa (color de fase + etiqueta + número cambian
 * al instante, legible a un metro — `docs/design.md` §1) más una región
 * `aria-live` para lectores de pantalla; no se agrega un toast aparte
 * para no competir visualmente con el timer.
 *
 * Offline (RN-004, RF-013, `docs/technical.md` §8): si "Terminar
 * entrenamiento" falla por red, el registro se encola en IndexedDB
 * (`lib/offline/workout-log-queue.ts`) y la sesión termina igual —nunca se
 * bloquea al usuario por falta de conexión—; se sincroniza después
 * (`lib/offline/workout-log-sync.ts`, disparado por `OfflineSyncListener`).
 * Ese llamado va con `silent: true` (`docs/technical.md` §2.2) porque la
 * app no trata la falta de red como una falla mientras se entrena
 * (`docs/design.md` §12.1): el toast automático de `apiFetch` se
 * suprimiría igual para el caso offline, así que en vez de dejarlo
 * disparar y filtrarlo después, se apaga en origen y se reemite a mano
 * para el único caso que sigue necesitando avisar — un error real del
 * servidor con red disponible.
 *
 * La franja de estado "Sin conexión" (`docs/design.md` §12) vive en
 * `lib/offline/use-offline-indicator-state.ts` (máquina de estados del
 * ciclo de vida) + el componente `StatusPill` de este archivo (geometría,
 * color heredado de la fase, fade).
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
  const indicatorVariant = useOfflineIndicatorState();

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
      // `silent: true`: la app no trata la falta de red como una falla
      // mientras se entrena (`docs/design.md` §12.1), así que el toast
      // automático de `apiFetch` se apaga acá y se reemite a mano abajo
      // solo para el error real del servidor.
      await createWorkoutLog(routineId, dayId, undefined, { silent: true });
      clearExitGuard();
      router.push("/");
    } catch (error) {
      if (isNetworkError(error)) {
        // Sin red: se encola para sincronizar después y la sesión termina
        // igual (RF-013, `docs/technical.md` §8) — nunca se bloquea al
        // usuario por falta de conexión, y no hay toast: no fue una falla.
        await enqueueWorkoutLog(routineId, dayId, new Date().toISOString());
        clearExitGuard();
        router.push("/");
      } else if (error instanceof ApiError) {
        // Error real del servidor: sí es una falla y sí hay que avisar; el
        // llamado fue silencioso, así que lo mostramos acá.
        showToast({ message: error.message });
      }
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
        {indicatorVariant ? (
          <div role="status" aria-live="polite" className="-mt-3">
            <StatusPill variant={indicatorVariant} tone="neutral" />
          </div>
        ) : null}
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

      {/*
        Franja de estado de la sesión (`docs/design.md` §12.2): slot de
        alto reservado siempre (esté ocupado o vacío) para que el timer de
        88px de abajo nunca se corra cuando la píldora aparece o
        desaparece. Es su propia región `aria-live`, separada de la del
        timer (§12.10): si viviera adentro, cada cambio de fase
        reanunciaría "Sin conexión".
      */}
      <div
        role="status"
        aria-live="polite"
        className="mt-2 flex h-10 items-center justify-center px-4 wide:h-12"
      >
        <StatusPill variant={indicatorVariant} tone="phase" />
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

const VARIANT_CONFIG: Record<
  OfflineIndicatorVariant,
  { text: string; Icon: typeof SignalSlashIcon }
> = {
  offline: { text: "Sin conexión · se guarda al reconectar", Icon: SignalSlashIcon },
  syncing: { text: "Sincronizando", Icon: ArrowPathIcon },
  saved: { text: "Guardado", Icon: CheckCircleIcon },
};

/**
 * Píldora de la franja de estado (`docs/design.md` §12.3, §12.4). Hereda
 * `currentColor` (par `--phase-*-fg` de la fase activa cuando `tone`
 * es "phase") y se rellena con `--phase-veil`; en `tone="neutral"`
 * (sub-pantalla "Listo para empezar", §12.7) usa `--surface-2` / `--border`
 * / `--text-muted` en vez de heredar color de fase.
 *
 * Nunca un color semántico ni el acento pisan la superficie de fase
 * (§12.4, prohibición 14 de §14): las tres variantes se distinguen por
 * ícono y palabra, no por color.
 *
 * Maneja su propio fade de entrada/salida (200ms, §9 y §12.6): sigue
 * montada un instante después de que la variante lógica pasa a `null`
 * para que la opacidad llegue a 0 antes de desaparecer del DOM, y hace un
 * cross-fade de 200ms cuando cambia de una variante visible a otra (el
 * ancho de la píldora nunca se anima).
 */
function StatusPill({
  variant,
  tone,
}: {
  variant: OfflineIndicatorVariant | null;
  tone: "phase" | "neutral";
}) {
  const [rendered, setRendered] = useState<OfflineIndicatorVariant | null>(variant);
  const [entered, setEntered] = useState(variant !== null);

  useEffect(() => {
    if (variant === rendered) return undefined;

    if (variant === null) {
      setEntered(false);
      const timeout = setTimeout(() => setRendered(null), 200);
      return () => clearTimeout(timeout);
    }

    if (rendered === null) {
      setRendered(variant);
      // Un tick de macrotask (en vez de `requestAnimationFrame`, que las
      // suites de test no siempre destraban con fake timers) para que el
      // navegador pinte un frame en opacidad 0 antes de pasar a 1 y así
      // dispare la transición CSS en vez de arrancar ya visible.
      const timeout = setTimeout(() => setEntered(true), 16);
      return () => clearTimeout(timeout);
    }

    // Cambia de variante con la píldora ya visible: cross-fade de 200ms.
    setEntered(false);
    const timeout = setTimeout(() => {
      setRendered(variant);
      setTimeout(() => setEntered(true), 16);
    }, 100);
    return () => clearTimeout(timeout);
  }, [variant, rendered]);

  if (rendered === null) return null;

  const { text, Icon } = VARIANT_CONFIG[rendered];
  const toneStyle: CSSProperties =
    tone === "phase"
      ? {
          background: "var(--phase-veil)",
          borderColor: "color-mix(in srgb, currentColor 35%, transparent)",
        }
      : {
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        };

  return (
    <div
      style={toneStyle}
      className={`inline-flex h-8 max-w-[calc(100%-32px)] items-center gap-2 whitespace-nowrap rounded-[var(--r-full)] border px-3 text-[13px] leading-[18px] font-semibold transition-opacity duration-200 motion-reduce:duration-100 wide:h-9 wide:text-sm wide:leading-5 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${rendered === "syncing" ? "fit-sync-icon" : ""}`} />
      <span>{text}</span>
    </div>
  );
}
