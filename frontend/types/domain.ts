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

/**
 * Elemento de equipamiento (RF-016), pool reutilizable propio. Mismo
 * patrón que `Exercise` y `Block`.
 */
export type Equipment = {
  id: string;
  name: string;
  deletedAt: string | null;
};

/**
 * Grupos de equipo de un ejercicio (RF-017, RN-014): lista de grupos, cada
 * grupo una lista de `equipmentId` alternativos entre sí (O); entre grupos
 * la relación es Y. `[]` = sin equipo (peso corporal).
 */
export type EquipmentGroups = string[][];

export type Exercise = {
  id: string;
  name: string;
  equipmentGroups: EquipmentGroups;
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

/**
 * Grupos de equipo tal como quedaron congelados en un snapshot de
 * historial (RN-015): mismo shape de dos niveles, pero por **nombre**
 * (string), no por `equipmentId` — distinto del `EquipmentGroups` de
 * `Exercise`, que es por ID.
 */
export type WorkoutLogSnapshotEquipmentGroups = string[][];

export type WorkoutLogSnapshotExercise = {
  name: string;
  order: number;
  reps: number | null;
  duration: number | null;
  equipmentGroups: WorkoutLogSnapshotEquipmentGroups;
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
