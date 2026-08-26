import { z } from "zod";

/**
 * Validación de formularios con Zod (`docs/technical.md` §3): feedback
 * temprano en el frontend. La autoridad sigue siendo el backend
 * (`class-validator`); estas reglas espejan RN-005 y RN-006 nada más para
 * no dejar que el usuario mande un request que sabemos que va a fallar.
 */

export const exerciseNameSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
});

export const equipmentNameSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
});

const nameSchema = z.string().trim().min(1, "El nombre es obligatorio.");

const positiveInt = z
  .number({ error: "Ingresá un número." })
  .int("Tiene que ser un número entero.")
  .positive("Tiene que ser mayor a cero.");

export const advanceModeSchema = z.enum(["automatico", "manual"]);

export const fuerzaTimerConfigSchema = z
  .object({
    totalDurationSeconds: positiveInt,
    taskIntervalSeconds: positiveInt,
  })
  .refine((v) => v.taskIntervalSeconds <= v.totalDurationSeconds, {
    message: "El intervalo no puede ser mayor a la duración total.",
    path: ["taskIntervalSeconds"],
  });

export const metconTimerConfigSchema = z.object({
  totalDurationSeconds: positiveInt,
});

export const intervalosTimerConfigSchema = z.object({
  workSeconds: positiveInt,
  restSeconds: positiveInt,
  rounds: positiveInt,
});

export const cardioLibreTimerConfigSchema = z.object({});

const repsBasedExerciseSchema = z.object({
  exerciseId: z.string().min(1, "Elegí un ejercicio."),
  reps: positiveInt,
});

const bareExerciseSchema = z.object({
  exerciseId: z.string().min(1, "Elegí un ejercicio."),
});

const durationBasedExerciseSchema = z.object({
  exerciseId: z.string().min(1, "Elegí un ejercicio."),
  duration: positiveInt,
});

const NO_EXERCISES_MESSAGE = "Agregá al menos un ejercicio.";

export const blockFormSchema = z.discriminatedUnion("type", [
  z.object({
    name: nameSchema,
    type: z.literal("fuerza"),
    advanceMode: advanceModeSchema,
    timerConfig: fuerzaTimerConfigSchema,
    exercises: z.array(repsBasedExerciseSchema).min(1, NO_EXERCISES_MESSAGE),
  }),
  z.object({
    name: nameSchema,
    type: z.literal("metcon"),
    advanceMode: advanceModeSchema,
    timerConfig: metconTimerConfigSchema,
    exercises: z.array(repsBasedExerciseSchema).min(1, NO_EXERCISES_MESSAGE),
  }),
  z.object({
    name: nameSchema,
    type: z.literal("intervalos"),
    advanceMode: advanceModeSchema,
    timerConfig: intervalosTimerConfigSchema,
    exercises: z.array(bareExerciseSchema).min(1, NO_EXERCISES_MESSAGE),
  }),
  z.object({
    name: nameSchema,
    type: z.literal("cardio_libre"),
    advanceMode: advanceModeSchema,
    timerConfig: cardioLibreTimerConfigSchema,
    exercises: z.array(durationBasedExerciseSchema).min(1, NO_EXERCISES_MESSAGE),
  }),
]);

export type BlockFormValues = z.infer<typeof blockFormSchema>;

export const routineFormSchema = z.object({
  name: nameSchema,
  days: z
    .array(
      z.object({
        blocks: z.array(blockFormSchema).min(1, "Agregá al menos un bloque a este día."),
      }),
    )
    .min(1, "Agregá al menos un día."),
});

export type RoutineFormValues = z.infer<typeof routineFormSchema>;
