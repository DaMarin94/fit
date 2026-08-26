import type {
  FuerzaTimerConfig,
  IntervalosTimerConfig,
  MetconTimerConfig,
  RoutineDay,
  RoutineDayBlock,
} from "@/types/domain";
import type { BlockStep, SessionPlan } from "./types";

/**
 * Traduce la estructura de un día (`docs/data-model.md` §2.8) a un plan de
 * pasos por bloque, según el tipo (RF-008). Pura: no conoce React ni el
 * paso del tiempo, solo la forma final de cada bloque.
 */
export function buildSessionPlan(day: RoutineDay): SessionPlan {
  return day.blocks.map((block, blockIndex) => ({
    blockIndex,
    block,
    steps: buildBlockSteps(block),
  }));
}

function buildBlockSteps(block: RoutineDayBlock): BlockStep[] {
  switch (block.type) {
    case "fuerza":
      return buildFuerzaSteps(block);
    case "metcon":
      return buildMetconSteps(block);
    case "intervalos":
      return buildIntervalosSteps(block);
    case "cardio_libre":
      return buildCardioLibreSteps(block);
  }
}

function exerciseCount(block: RoutineDayBlock): number {
  return Math.max(block.exercises.length, 1);
}

/** EMOM: un intervalo por ejercicio, ciclando la lista hasta agotar la duración total. */
function buildFuerzaSteps(block: RoutineDayBlock): BlockStep[] {
  const { totalDurationSeconds, taskIntervalSeconds } =
    block.timerConfig as FuerzaTimerConfig;
  const count = exerciseCount(block);
  const totalIntervals = Math.max(
    Math.round(totalDurationSeconds / taskIntervalSeconds),
    0,
  );
  const totalRounds = Math.max(Math.ceil(totalIntervals / count), 1);

  return Array.from({ length: totalIntervals }, (_, i) => ({
    exerciseMode: "fixed" as const,
    exerciseIndex: i % count,
    phase: "work" as const,
    durationSeconds: taskIntervalSeconds,
    round: Math.floor(i / count) + 1,
    totalRounds,
  }));
}

/**
 * AMRAP: un único paso de ciclo manual — la cuenta regresiva corre sola,
 * pero qué ejercicio/ronda se muestra lo decide la acción "avanzar"
 * (RF-010), porque el timer no sabe cuánto tarda cada ronda.
 */
function buildMetconSteps(block: RoutineDayBlock): BlockStep[] {
  const { totalDurationSeconds } = block.timerConfig as MetconTimerConfig;

  return [
    {
      exerciseMode: "manual-cycle",
      exerciseCount: exerciseCount(block),
      phase: "work",
      durationSeconds: totalDurationSeconds,
    },
  ];
}

/** Work/rest por ronda, ciclando la lista de ejercicios una vez por ronda. */
function buildIntervalosSteps(block: RoutineDayBlock): BlockStep[] {
  const { workSeconds, restSeconds, rounds } =
    block.timerConfig as IntervalosTimerConfig;
  const count = exerciseCount(block);
  const steps: BlockStep[] = [];

  for (let round = 1; round <= rounds; round++) {
    for (let exerciseIndex = 0; exerciseIndex < count; exerciseIndex++) {
      steps.push({
        exerciseMode: "fixed",
        exerciseIndex,
        phase: "work",
        durationSeconds: workSeconds,
        round,
        totalRounds: rounds,
      });
      steps.push({
        exerciseMode: "fixed",
        exerciseIndex,
        phase: "rest",
        durationSeconds: restSeconds,
        round,
        totalRounds: rounds,
      });
    }
  }

  return steps;
}

/** Fases secuenciales de duración propia, sin rondas. */
function buildCardioLibreSteps(block: RoutineDayBlock): BlockStep[] {
  return block.exercises.map((exercise, exerciseIndex) => ({
    exerciseMode: "fixed" as const,
    exerciseIndex,
    phase: "work" as const,
    durationSeconds: exercise.duration ?? 0,
    round: null,
    totalRounds: null,
  }));
}
