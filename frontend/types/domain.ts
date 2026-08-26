/**
 * Tipos de dominio del frontend — espejo del contrato de la API
 * (`docs/data-model.md`). No hay paquete de tipos compartido con el
 * backend: este archivo es la única fuente de verdad del lado cliente.
 */

export type BlockType = "fuerza" | "metcon" | "intervalos" | "cardio_libre";

export type AdvanceMode = "automatico" | "manual";

export type FuerzaTimerConfig = {
  totalDurationSeconds: number;
  taskIntervalSeconds: number;
};

export type MetconTimerConfig = {
  totalDurationSeconds: number;
};

export type IntervalosTimerConfig = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

export type CardioLibreTimerConfig = Record<string, never>;

export type TimerConfig =
  | FuerzaTimerConfig
  | MetconTimerConfig
  | IntervalosTimerConfig
  | CardioLibreTimerConfig;

export type Exercise = {
  id: string;
  name: string;
  deletedAt: string | null;
};

export type BlockExercise = {
  id: string;
  exerciseId: string;
  order: number;
  reps: number | null;
  duration: number | null;
};

/** Ejercicio elegido para un bloque, previo a persistir (sin id/order propios todavía). */
export type BlockExerciseInput = {
  exerciseId: string;
  reps?: number | null;
  duration?: number | null;
};

export type Block = {
  id: string;
  name: string;
  type: BlockType;
  timerConfig: TimerConfig;
  advanceMode: AdvanceMode;
  exercises: BlockExercise[];
  deletedAt: string | null;
};

export type BlockInput = {
  name: string;
  type: BlockType;
  advanceMode: AdvanceMode;
  timerConfig: TimerConfig;
  exercises: BlockExerciseInput[];
};

export type RoutineSummary = {
  id: string;
  name: string;
  dayCount: number;
};

/** Bloque copiado dentro de un día de rutina (RN-002): mismos campos que `Block`, sin `deletedAt`. */
export type RoutineDayBlock = {
  id: string;
  order: number;
  name: string;
  type: BlockType;
  timerConfig: TimerConfig;
  advanceMode: AdvanceMode;
  exercises: BlockExercise[];
};

export type RoutineDay = {
  id: string;
  order: number;
  blocks: RoutineDayBlock[];
};

export type Routine = {
  id: string;
  name: string;
  deletedAt: string | null;
  days: RoutineDay[];
};

export type RoutineDayInput = {
  blocks: BlockInput[];
};

export type RoutineInput = {
  name: string;
  days: RoutineDayInput[];
};

export type WorkoutLogSnapshotExercise = {
  name: string;
  order: number;
  reps: number | null;
  duration: number | null;
};

export type WorkoutLogSnapshotBlock = {
  name: string;
  type: BlockType;
  timerConfig: TimerConfig;
  advanceMode: AdvanceMode;
  exercises: WorkoutLogSnapshotExercise[];
};

export type WorkoutLogSnapshot = {
  routineName: string;
  day: { order: number };
  blocks: WorkoutLogSnapshotBlock[];
};

export type WorkoutLog = {
  id: string;
  performedAt: string;
  snapshot: WorkoutLogSnapshot;
};
