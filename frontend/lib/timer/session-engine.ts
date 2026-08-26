import { NO_TRANSITIONS } from "./types";
import type {
  BlockStep,
  Phase,
  SessionPlan,
  SessionState,
  SessionView,
  TransitionFlags,
} from "./types";

/**
 * Motor de la sesión de entrenamiento (RF-007 a RF-011). Reducer puro:
 * cada función recibe el plan (`session-plan.ts`, fijo para todo el día) y
 * el estado actual, y devuelve el próximo estado — nunca muta nada ni
 * depende del reloj real. La UI es quien llama a `tick()` periódicamente
 * (con `setInterval`/`requestAnimationFrame`) y a las acciones del
 * usuario (`pause`, `resume`, `advance`, `continueNextBlock`).
 *
 * `state.transitions` describe qué cambió **en esta llamada**, para que la
 * UI avise las transiciones (RF-009) sin tener que diffear a mano.
 */

export function createInitialState(plan: SessionPlan): SessionState {
  const first = plan[0]?.steps[0];
  return {
    status: "idle",
    blockIndex: 0,
    stepIndex: 0,
    remainingSeconds: first ? first.durationSeconds : 0,
    cursorExerciseIndex: first && first.exerciseMode === "fixed" ? first.exerciseIndex : 0,
    cursorRound: first && first.exerciseMode === "fixed" ? (first.round ?? 1) : 1,
    transitions: NO_TRANSITIONS,
  };
}

export function start(plan: SessionPlan, state: SessionState): SessionState {
  if (state.status !== "idle") return { ...state, transitions: NO_TRANSITIONS };

  if (plan.length === 0) {
    return {
      ...state,
      status: "finished",
      transitions: { ...NO_TRANSITIONS, sessionFinished: true },
    };
  }

  return {
    ...state,
    status: "running",
    transitions: {
      phaseChanged: true,
      exerciseChanged: true,
      roundChanged: true,
      blockChanged: true,
      blockCompleted: false,
      sessionFinished: false,
    },
  };
}

export function pause(plan: SessionPlan, state: SessionState): SessionState {
  if (state.status !== "running") return { ...state, transitions: NO_TRANSITIONS };
  return { ...state, status: "paused", transitions: NO_TRANSITIONS };
}

export function resume(plan: SessionPlan, state: SessionState): SessionState {
  if (state.status !== "paused") return { ...state, transitions: NO_TRANSITIONS };
  return { ...state, status: "running", transitions: NO_TRANSITIONS };
}

export function tick(plan: SessionPlan, state: SessionState, deltaSeconds: number): SessionState {
  if (state.status !== "running" || deltaSeconds <= 0) {
    return { ...state, transitions: NO_TRANSITIONS };
  }

  const remaining = state.remainingSeconds - deltaSeconds;
  if (remaining > 0) {
    return { ...state, remainingSeconds: remaining, transitions: NO_TRANSITIONS };
  }

  return consumeStep(plan, state, -remaining);
}

/**
 * Avanza al siguiente paso (RF-010). En pasos de ciclo manual (AMRAP) no
 * hay "siguiente paso" temporal — el bloque es un único reloj — así que
 * acá solo se mueve el cursor de ejercicio/ronda, sin tocar el tiempo.
 */
export function advance(plan: SessionPlan, state: SessionState): SessionState {
  if (state.status !== "running") return { ...state, transitions: NO_TRANSITIONS };

  const step = currentStep(plan, state);
  if (!step) return { ...state, transitions: NO_TRANSITIONS };

  if (step.exerciseMode === "manual-cycle") {
    return advanceCursor(state, step.exerciseCount);
  }

  return consumeStep(plan, state, 0);
}

/** Confirma el paso al siguiente bloque cuando su avance es manual (RN-009). */
export function continueNextBlock(plan: SessionPlan, state: SessionState): SessionState {
  if (state.status !== "waiting-next-block") return { ...state, transitions: NO_TRANSITIONS };
  return startBlock(plan, state, state.blockIndex + 1, {});
}

export function getView(plan: SessionPlan, state: SessionState): SessionView {
  const blockPlan = plan[state.blockIndex] ?? null;
  const step = blockPlan?.steps[state.stepIndex] ?? null;

  // Fuera de "running" no hay color de fase (pausa, espera, terminado,
  // listo para empezar): `docs/screens.md` §5, estado "En pausa".
  const phase: Phase = state.status === "running" ? (step?.phase ?? "idle") : "idle";

  return {
    status: state.status,
    phase,
    block: blockPlan?.block ?? null,
    blockIndex: state.blockIndex,
    totalBlocks: plan.length,
    exerciseIndex: step ? state.cursorExerciseIndex : null,
    round: step
      ? step.exerciseMode === "fixed"
        ? step.round
        : state.cursorRound
      : null,
    totalRounds: step && step.exerciseMode === "fixed" ? step.totalRounds : null,
    remainingSeconds: state.remainingSeconds,
    stepDurationSeconds: step?.durationSeconds ?? 0,
    advanceMode: blockPlan?.block.advanceMode ?? null,
  };
}

// --- internals ---

function currentStep(plan: SessionPlan, state: SessionState): BlockStep | null {
  return plan[state.blockIndex]?.steps[state.stepIndex] ?? null;
}

function advanceCursor(state: SessionState, exerciseCount: number): SessionState {
  const nextIndex = (state.cursorExerciseIndex + 1) % exerciseCount;
  const wrapped = nextIndex === 0;
  return {
    ...state,
    cursorExerciseIndex: nextIndex,
    cursorRound: wrapped ? state.cursorRound + 1 : state.cursorRound,
    transitions: {
      ...NO_TRANSITIONS,
      exerciseChanged: true,
      roundChanged: wrapped,
    },
  };
}

function mergeTransitions(a: TransitionFlags, b: TransitionFlags): TransitionFlags {
  return {
    phaseChanged: a.phaseChanged || b.phaseChanged,
    exerciseChanged: a.exerciseChanged || b.exerciseChanged,
    roundChanged: a.roundChanged || b.roundChanged,
    blockChanged: a.blockChanged || b.blockChanged,
    blockCompleted: a.blockCompleted || b.blockCompleted,
    sessionFinished: a.sessionFinished || b.sessionFinished,
  };
}

/**
 * Cierra el paso actual (por tiempo agotado o por "avanzar") y mueve la
 * posición al siguiente paso del bloque, o completa el bloque si no
 * quedan más pasos. `overflowSeconds` es cuánto tiempo "de más" ya pasó
 * (0 cuando lo dispara `advance()`; el resto cuando lo dispara `tick()`
 * con un delta más grande que el tiempo restante).
 */
function consumeStep(plan: SessionPlan, state: SessionState, overflowSeconds: number): SessionState {
  const blockPlan = plan[state.blockIndex];
  const prevStep = blockPlan.steps[state.stepIndex];
  const nextStepIndex = state.stepIndex + 1;

  if (nextStepIndex >= blockPlan.steps.length) {
    return completeBlock(plan, state);
  }

  const nextStep = blockPlan.steps[nextStepIndex];
  const prevExerciseIndex = prevStep.exerciseMode === "fixed" ? prevStep.exerciseIndex : state.cursorExerciseIndex;
  const prevRound = prevStep.exerciseMode === "fixed" ? (prevStep.round ?? 1) : state.cursorRound;
  const cursorExerciseIndex = nextStep.exerciseMode === "fixed" ? nextStep.exerciseIndex : state.cursorExerciseIndex;
  const cursorRound = nextStep.exerciseMode === "fixed" ? (nextStep.round ?? 1) : state.cursorRound;

  const transitions: TransitionFlags = {
    ...NO_TRANSITIONS,
    phaseChanged: nextStep.phase !== prevStep.phase,
    exerciseChanged: cursorExerciseIndex !== prevExerciseIndex,
    roundChanged: cursorRound !== prevRound,
  };

  const remaining = nextStep.durationSeconds - overflowSeconds;
  const nextState: SessionState = {
    ...state,
    stepIndex: nextStepIndex,
    remainingSeconds: remaining,
    cursorExerciseIndex,
    cursorRound,
    transitions,
  };

  if (remaining <= 0) {
    const deeper = consumeStep(plan, nextState, -remaining);
    return { ...deeper, transitions: mergeTransitions(transitions, deeper.transitions) };
  }

  return nextState;
}

function completeBlock(plan: SessionPlan, state: SessionState): SessionState {
  const isLastBlock = state.blockIndex >= plan.length - 1;

  if (isLastBlock) {
    return {
      ...state,
      status: "finished",
      remainingSeconds: 0,
      transitions: { ...NO_TRANSITIONS, blockCompleted: true, sessionFinished: true },
    };
  }

  const blockPlan = plan[state.blockIndex];
  if (blockPlan.block.advanceMode === "manual") {
    return {
      ...state,
      status: "waiting-next-block",
      remainingSeconds: 0,
      transitions: { ...NO_TRANSITIONS, blockCompleted: true },
    };
  }

  return startBlock(plan, state, state.blockIndex + 1, { blockCompleted: true });
}

function startBlock(
  plan: SessionPlan,
  state: SessionState,
  blockIndex: number,
  extraFlags: Partial<TransitionFlags>,
): SessionState {
  const blockPlan = plan[blockIndex];
  const firstStep = blockPlan.steps[0];
  const cursorExerciseIndex = firstStep.exerciseMode === "fixed" ? firstStep.exerciseIndex : 0;
  const cursorRound = firstStep.exerciseMode === "fixed" ? (firstStep.round ?? 1) : 1;

  return {
    ...state,
    blockIndex,
    stepIndex: 0,
    remainingSeconds: firstStep.durationSeconds,
    cursorExerciseIndex,
    cursorRound,
    status: "running",
    transitions: {
      phaseChanged: true,
      exerciseChanged: true,
      roundChanged: true,
      blockChanged: true,
      blockCompleted: false,
      sessionFinished: false,
      ...extraFlags,
    },
  };
}
