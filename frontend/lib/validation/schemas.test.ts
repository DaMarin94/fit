import { describe, expect, it } from "vitest";
import {
  blockFormSchema,
  exerciseNameSchema,
  routineFormSchema,
} from "./schemas";

describe("exerciseNameSchema", () => {
  it("acepta un nombre no vacío", () => {
    expect(exerciseNameSchema.safeParse({ name: "Sentadillas" }).success).toBe(true);
  });

  it("rechaza nombre vacío o solo espacios", () => {
    expect(exerciseNameSchema.safeParse({ name: "" }).success).toBe(false);
    expect(exerciseNameSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

describe("blockFormSchema — fuerza (EMOM)", () => {
  const valid = {
    name: "Fuerza EMOM 12'",
    type: "fuerza" as const,
    advanceMode: "manual" as const,
    timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
    exercises: [{ exerciseId: "ex-1", reps: 12 }],
  };

  it("acepta un bloque válido", () => {
    expect(blockFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza tiempos o reps en cero o negativos (RN-006)", () => {
    expect(
      blockFormSchema.safeParse({
        ...valid,
        timerConfig: { totalDurationSeconds: 0, taskIntervalSeconds: 60 },
      }).success,
    ).toBe(false);
    expect(
      blockFormSchema.safeParse({ ...valid, exercises: [{ exerciseId: "ex-1", reps: -1 }] })
        .success,
    ).toBe(false);
  });

  it("rechaza un bloque sin ejercicios", () => {
    expect(blockFormSchema.safeParse({ ...valid, exercises: [] }).success).toBe(false);
  });

  it("rechaza cuando el intervalo de tarea es mayor a la duración total", () => {
    expect(
      blockFormSchema.safeParse({
        ...valid,
        timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 120 },
      }).success,
    ).toBe(false);
  });
});

describe("blockFormSchema — intervalos", () => {
  const valid = {
    name: "Metcon intervalos 30/15",
    type: "intervalos" as const,
    advanceMode: "manual" as const,
    timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
    exercises: [{ exerciseId: "ex-1" }, { exerciseId: "ex-2" }],
  };

  it("acepta ejercicios sin reps ni duración (el tiempo sale del timerConfig)", () => {
    expect(blockFormSchema.safeParse(valid).success).toBe(true);
  });
});

describe("blockFormSchema — cardio_libre", () => {
  const valid = {
    name: "Trote",
    type: "cardio_libre" as const,
    advanceMode: "automatico" as const,
    timerConfig: {},
    exercises: [{ exerciseId: "ex-1", duration: 300 }],
  };

  it("acepta ejercicios con duración positiva", () => {
    expect(blockFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza ejercicios sin duración", () => {
    expect(
      blockFormSchema.safeParse({ ...valid, exercises: [{ exerciseId: "ex-1" }] }).success,
    ).toBe(false);
  });
});

describe("routineFormSchema", () => {
  const validBlock = {
    name: "Fuerza EMOM 12'",
    type: "fuerza" as const,
    advanceMode: "manual" as const,
    timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
    exercises: [{ exerciseId: "ex-1", reps: 12 }],
  };

  it("acepta una rutina con al menos un día y un bloque", () => {
    const result = routineFormSchema.safeParse({
      name: "Plan semanal",
      days: [{ blocks: [validBlock] }],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza una rutina sin días", () => {
    expect(routineFormSchema.safeParse({ name: "Plan", days: [] }).success).toBe(false);
  });

  it("rechaza un día sin bloques", () => {
    expect(
      routineFormSchema.safeParse({ name: "Plan", days: [{ blocks: [] }] }).success,
    ).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    expect(
      routineFormSchema.safeParse({ name: "", days: [{ blocks: [validBlock] }] }).success,
    ).toBe(false);
  });
});
