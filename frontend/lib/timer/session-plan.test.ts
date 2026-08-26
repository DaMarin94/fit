import { describe, expect, it } from "vitest";
import { buildSessionPlan } from "./session-plan";
import type { RoutineDay, RoutineDayBlock } from "@/types/domain";

function blockExercise(exerciseId: string, order: number, extra: Partial<{ reps: number | null; duration: number | null }> = {}) {
  return {
    id: `be-${exerciseId}-${order}`,
    exerciseId,
    order,
    reps: extra.reps ?? null,
    duration: extra.duration ?? null,
  };
}

function day(blocks: RoutineDayBlock[]): RoutineDay {
  return { id: "day-1", order: 0, blocks };
}

describe("buildSessionPlan — fuerza (EMOM)", () => {
  it("cicla los ejercicios cada taskIntervalSeconds hasta completar totalDurationSeconds", () => {
    const block: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Fuerza EMOM 12'",
      type: "fuerza",
      timerConfig: { totalDurationSeconds: 180, taskIntervalSeconds: 60 },
      advanceMode: "manual",
      exercises: [
        blockExercise("ex-a", 0, { reps: 12 }),
        blockExercise("ex-b", 1, { reps: 10 }),
        blockExercise("ex-c", 2, { reps: 12 }),
      ],
    };

    const plan = buildSessionPlan(day([block]));

    expect(plan).toHaveLength(1);
    const steps = plan[0].steps;
    // 180s / 60s = 3 intervalos, ciclando 3 ejercicios => 1 ronda completa
    expect(steps).toHaveLength(3);
    expect(steps.every((s) => s.phase === "work")).toBe(true);
    expect(steps.every((s) => s.durationSeconds === 60)).toBe(true);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.exerciseIndex : null))).toEqual([
      0, 1, 2,
    ]);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.round : null))).toEqual([1, 1, 1]);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.totalRounds : null))).toEqual([
      1, 1, 1,
    ]);
  });

  it("cuando hay más intervalos que ejercicios, cicla y arma rondas sucesivas", () => {
    const block: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Fuerza EMOM 12'",
      type: "fuerza",
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      advanceMode: "manual",
      exercises: [blockExercise("ex-a", 0), blockExercise("ex-b", 1), blockExercise("ex-c", 2)],
    };

    const plan = buildSessionPlan(day([block]));
    const steps = plan[0].steps;

    // 720/60 = 12 intervalos, 3 ejercicios => 4 rondas de 3 minutos
    expect(steps).toHaveLength(12);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.exerciseIndex : null))).toEqual([
      0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2,
    ]);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.round : null))).toEqual([
      1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4,
    ]);
    expect(steps[0].exerciseMode === "fixed" && steps[0].totalRounds).toBe(4);
  });
});

describe("buildSessionPlan — metcon (AMRAP)", () => {
  it("produce un único paso de ciclo manual con la duración total", () => {
    const block: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Metcon AMRAP 6'",
      type: "metcon",
      timerConfig: { totalDurationSeconds: 360 },
      advanceMode: "automatico",
      exercises: [blockExercise("ex-a", 0, { reps: 20 }), blockExercise("ex-b", 1, { reps: 10 })],
    };

    const plan = buildSessionPlan(day([block]));
    const steps = plan[0].steps;

    expect(steps).toHaveLength(1);
    expect(steps[0]).toEqual({
      exerciseMode: "manual-cycle",
      exerciseCount: 2,
      phase: "work",
      durationSeconds: 360,
    });
  });
});

describe("buildSessionPlan — intervalos (work/rest)", () => {
  it("alterna work/rest por ronda, ciclando la lista de ejercicios una vez por ronda", () => {
    const block: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Metcon intervalos 30/15",
      type: "intervalos",
      timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
      advanceMode: "manual",
      exercises: [
        blockExercise("ex-a", 0),
        blockExercise("ex-b", 1),
        blockExercise("ex-c", 2),
        blockExercise("ex-d", 3),
      ],
    };

    const plan = buildSessionPlan(day([block]));
    const steps = plan[0].steps;

    // 2 rondas * 4 ejercicios * (work + rest) = 16 pasos
    expect(steps).toHaveLength(16);
    expect(steps[0]).toMatchObject({
      exerciseMode: "fixed",
      exerciseIndex: 0,
      phase: "work",
      durationSeconds: 30,
      round: 1,
      totalRounds: 2,
    });
    expect(steps[1]).toMatchObject({
      exerciseMode: "fixed",
      exerciseIndex: 0,
      phase: "rest",
      durationSeconds: 15,
      round: 1,
      totalRounds: 2,
    });
    expect(steps[6]).toMatchObject({ exerciseIndex: 3, phase: "work", round: 1 });
    expect(steps[8]).toMatchObject({ exerciseIndex: 0, phase: "work", round: 2 });
    expect(steps[15]).toMatchObject({ exerciseIndex: 3, phase: "rest", round: 2 });
  });
});

describe("buildSessionPlan — cardio_libre", () => {
  it("arma fases secuenciales sin rondas, con la duración propia de cada ejercicio", () => {
    const block: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Trote",
      type: "cardio_libre",
      timerConfig: {},
      advanceMode: "automatico",
      exercises: [
        blockExercise("ex-suave", 0, { duration: 300 }),
        blockExercise("ex-ritmo", 1, { duration: 900 }),
        blockExercise("ex-suave-2", 2, { duration: 120 }),
      ],
    };

    const plan = buildSessionPlan(day([block]));
    const steps = plan[0].steps;

    expect(steps).toHaveLength(3);
    expect(steps.map((s) => s.durationSeconds)).toEqual([300, 900, 120]);
    expect(steps.every((s) => s.phase === "work")).toBe(true);
    expect(steps.map((s) => (s.exerciseMode === "fixed" ? s.round : "n/a"))).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe("buildSessionPlan — día con múltiples bloques", () => {
  it("arma un plan por bloque, en el orden del día", () => {
    const b1: RoutineDayBlock = {
      id: "b1",
      order: 0,
      name: "Fuerza EMOM",
      type: "fuerza",
      timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
      advanceMode: "manual",
      exercises: [blockExercise("ex-a", 0)],
    };
    const b2: RoutineDayBlock = {
      id: "b2",
      order: 1,
      name: "Metcon AMRAP",
      type: "metcon",
      timerConfig: { totalDurationSeconds: 60 },
      advanceMode: "automatico",
      exercises: [blockExercise("ex-b", 0)],
    };

    const plan = buildSessionPlan(day([b1, b2]));

    expect(plan).toHaveLength(2);
    expect(plan[0].blockIndex).toBe(0);
    expect(plan[0].block.id).toBe("b1");
    expect(plan[1].blockIndex).toBe(1);
    expect(plan[1].block.id).toBe("b2");
  });
});
