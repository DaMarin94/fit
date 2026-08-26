import type { RoutineDay, RoutineDayBlock } from "@/types/domain";

/**
 * Motor de timer de Modo entrenar (`docs/screens.md` §5, RF-007 a RF-011).
 * Lógica pura, desacoplada de React: se testea con Vitest antes de
 * conectarse a la UI (`docs/technical.md` §5).
 *
 * Fases: `work` / `rest` son las únicas con color propio (`--phase-*`,
 * `docs/design.md` §3.3). `idle` es "sin color de fase": se usa para
 * pausa, espera de avance manual y los extremos (antes de empezar / al
 * terminar) — no hay cuenta regresiva de preparación en esta fase (no está
 * especificada como requerimiento, solo mencionada como posibilidad de
 * tipografía en `design.md` §4.2).
 */
export type Phase = "work" | "rest" | "idle";

/** Paso con exercise fijo: EMOM, intervalos y cardio libre (RF-008). */
export type FixedExerciseStep = {
  exerciseMode: "fixed";
  exerciseIndex: number;
  phase: Phase;
  durationSeconds: number;
  round: number | null;
  totalRounds: number | null;
};

/**
 * Paso de ciclo manual: AMRAP. El bloque entero es una única cuenta
 * regresiva (`durationSeconds`); qué ejercicio y qué ronda se muestran lo
 * decide el cursor del estado de sesión, que solo avanza con la acción
 * "avanzar" (RF-010) — el timer no tiene forma de saber cuánto tarda el
 * usuario en cada ejercicio.
 */
export type ManualCycleStep = {
  exerciseMode: "manual-cycle";
  exerciseCount: number;
  phase: Phase;
  durationSeconds: number;
};

export type BlockStep = FixedExerciseStep | ManualCycleStep;

export type BlockPlan = {
  blockIndex: number;
  block: RoutineDayBlock;
  steps: BlockStep[];
};

export type SessionPlan = BlockPlan[];

export type SessionStatus =
  | "idle"
  | "running"
  | "paused"
  | "waiting-next-block"
  | "finished";

export type TransitionFlags = {
  phaseChanged: boolean;
  exerciseChanged: boolean;
  roundChanged: boolean;
  blockChanged: boolean;
  blockCompleted: boolean;
  sessionFinished: boolean;
};

export const NO_TRANSITIONS: TransitionFlags = {
  phaseChanged: false,
  exerciseChanged: false,
  roundChanged: false,
  blockChanged: false,
  blockCompleted: false,
  sessionFinished: false,
};

export type SessionState = {
  status: SessionStatus;
  blockIndex: number;
  stepIndex: number;
  remainingSeconds: number;
  /** Ejercicio mostrado. Para pasos fijos, siempre igual al del paso actual. */
  cursorExerciseIndex: number;
  /** Ronda mostrada. `1` si el bloque no tiene rondas. */
  cursorRound: number;
  transitions: TransitionFlags;
};

export type SessionView = {
  status: SessionStatus;
  phase: Phase;
  block: RoutineDayBlock | null;
  blockIndex: number;
  totalBlocks: number;
  exerciseIndex: number | null;
  round: number | null;
  totalRounds: number | null;
  remainingSeconds: number;
  stepDurationSeconds: number;
  advanceMode: RoutineDayBlock["advanceMode"] | null;
};

export type { RoutineDay, RoutineDayBlock };
